#!/usr/bin/env python3
"""Local editor server: static files + saving layout into config.json."""

from __future__ import annotations

import json
import os
import re
import sys
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

ROOT = Path(__file__).resolve().parent
LIST_ID_RE = re.compile(r"^[a-zA-Z0-9][a-zA-Z0-9_-]{0,63}$")
COLOR_RE = re.compile(r"^#[0-9A-Fa-f]{6}$")

NUMERIC_KEYS = {
    "startX",
    "startY",
    "titleFontSize",
    "subtitleFontSize",
    "serviceFontSize",
    "priceFontSize",
    "lineHeight",
    "sectionGap",
    "itemGap",
    "titleGap",
    "leftColumnWidth",
    "middleColumnWidth",
    "rightColumnWidth",
}
COLOR_KEYS = {
    "titleColor",
    "subtitleColor",
    "serviceColor",
    "priceColor",
}


def sanitize_layout(raw: object) -> dict:
    if not isinstance(raw, dict):
        raise ValueError("layout трябва да е обект")

    layout = {}
    for key, value in raw.items():
        if key in NUMERIC_KEYS:
            if isinstance(value, bool) or not isinstance(value, (int, float)):
                raise ValueError(f"layout.{key} трябва да е число")
            layout[key] = int(value) if float(value).is_integer() else float(value)
        elif key in COLOR_KEYS:
            if not isinstance(value, str) or not COLOR_RE.match(value):
                raise ValueError(f"layout.{key} трябва да е цвят #RRGGBB")
            layout[key] = value.lower()
        else:
            raise ValueError(f"Непознато layout поле: {key}")
    return layout


def find_matching_brace(text: str, open_index: int) -> int:
    depth = 0
    in_str = False
    escape = False
    for i in range(open_index, len(text)):
        ch = text[i]
        if in_str:
            if escape:
                escape = False
            elif ch == "\\":
                escape = True
            elif ch == '"':
                in_str = False
            continue
        if ch == '"':
            in_str = True
        elif ch == "{":
            depth += 1
        elif ch == "}":
            depth -= 1
            if depth == 0:
                return i
    raise ValueError("config.json има незатворен layout обект")


def replace_layout_block(original: str, layout: dict) -> str:
    key = original.find('"layout"')
    if key < 0:
        raise ValueError("config.json няма layout")
    colon = original.find(":", key + len('"layout"'))
    brace = original.find("{", colon)
    if colon < 0 or brace < 0:
        raise ValueError("config.json има невалиден layout")
    close = find_matching_brace(original, brace)
    dumped = json.dumps(layout, ensure_ascii=False, indent=2)
    key_line_start = original.rfind("\n", 0, key) + 1
    extra_indent = original[key_line_start:key]
    lines = dumped.splitlines()
    formatted = lines[0] + "\n" + "\n".join(extra_indent + line for line in lines[1:])
    return original[:brace] + formatted + original[close + 1 :]


class EditorHandler(SimpleHTTPRequestHandler):
    def do_POST(self) -> None:
        if self.path.rstrip("/") != "/api/save-layout":
            self.send_error(404, "Not found")
            return

        length = int(self.headers.get("Content-Length", "0") or 0)
        if length <= 0 or length > 64_000:
            self._json(400, {"ok": False, "error": "Невалидно тяло на заявката"})
            return

        try:
            payload = json.loads(self.rfile.read(length).decode("utf-8"))
        except (UnicodeDecodeError, json.JSONDecodeError):
            self._json(400, {"ok": False, "error": "Невалиден JSON"})
            return

        list_id = payload.get("listId") if isinstance(payload, dict) else None
        if not isinstance(list_id, str) or not LIST_ID_RE.match(list_id):
            self._json(400, {"ok": False, "error": "Невалиден listId"})
            return

        try:
            incoming = sanitize_layout(payload.get("layout"))
        except ValueError as err:
            self._json(400, {"ok": False, "error": str(err)})
            return

        config_path = (ROOT / "price-lists" / list_id / "config.json").resolve()
        lists_root = (ROOT / "price-lists").resolve()
        if lists_root not in config_path.parents or not config_path.is_file():
            self._json(404, {"ok": False, "error": "config.json не е намерен"})
            return

        try:
            original = config_path.read_text(encoding="utf-8")
            config = json.loads(original)
            if not isinstance(config, dict):
                raise ValueError("config.json не е обект")
            layout = config.get("layout")
            if not isinstance(layout, dict):
                layout = {}
            layout.update(incoming)
            text = replace_layout_block(original, layout)
            json.loads(text)
            tmp_path = config_path.with_suffix(".json.tmp")
            tmp_path.write_text(text, encoding="utf-8")
            tmp_path.replace(config_path)
        except OSError as err:
            self._json(500, {"ok": False, "error": f"Не може да се запише файлът: {err}"})
            return
        except (json.JSONDecodeError, ValueError) as err:
            self._json(500, {"ok": False, "error": str(err)})
            return

        self._json(200, {"ok": True, "path": f"price-lists/{list_id}/config.json", "layout": layout})

    def _json(self, status: int, body: dict) -> None:
        data = json.dumps(body, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def log_message(self, format: str, *args) -> None:
        sys.stderr.write("%s - %s\n" % (self.address_string(), format % args))


def main() -> None:
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8080
    os.chdir(ROOT)
    server = ThreadingHTTPServer(("0.0.0.0", port), EditorHandler)
    print(f"Sweet Surprises: http://localhost:{port}", flush=True)
    print("POST /api/save-layout writes layout into config.json", flush=True)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nStopped.")


if __name__ == "__main__":
    main()
