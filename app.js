const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const listSelect = document.getElementById("listSelect");
const statusText = document.getElementById("statusText");
const canvasSize = document.getElementById("canvasSize");
const backgroundInput = document.getElementById("backgroundInput");
const backgroundName = document.getElementById("backgroundName");
const resetBackgroundBtn = document.getElementById("resetBackgroundBtn");
const fontInput = document.getElementById("fontInput");
const fontName = document.getElementById("fontName");
const resetFontBtn = document.getElementById("resetFontBtn");

const controls = {
  startX: document.getElementById("startX"),
  startY: document.getElementById("startY"),
  leftWidth: document.getElementById("leftWidth"),
  rightWidth: document.getElementById("rightWidth"),
  titleSize: document.getElementById("titleSize"),
  subtitleSize: document.getElementById("subtitleSize"),
  serviceSize: document.getElementById("serviceSize"),
  lineHeight: document.getElementById("lineHeight"),
  fontFamily: document.getElementById("fontFamily"),
  textColor: document.getElementById("textColor"),
};

let currentConfig = null;
let currentListId = null;
let backgroundImage = null;
let loadedFontFamily = null;
let customBackgroundUrl = null;
let usingCustomBackground = false;
let defaultBackgroundLabel = "—";
let customFontUrl = null;
let usingCustomFont = false;
let defaultFontLabel = "—";
let loadedServiceColor = "#3d2817";

function wrapText(text, maxWidth, fontSize, fontFamily) {
  ctx.font = `${fontSize}px ${fontFamily}`;
  const words = text.split(/\s+/);
  const lines = [];
  let current = "";

  for (const word of words) {
    const test = current ? `${current} ${word}` : word;
    if (ctx.measureText(test).width <= maxWidth) {
      current = test;
    } else {
      if (current) lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines.length ? lines : [""];
}

function drawMultilineText(lines, x, y, fontSize, color, fontFamily, align = "left") {
  ctx.font = `${fontSize}px ${fontFamily}`;
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.textBaseline = "top";

  lines.forEach((line, i) => {
    ctx.fillText(line, x, y + i * fontSize * 1.15);
  });

  return lines.length * fontSize * 1.15;
}

function getEffectiveLayout(config) {
  const layout = { ...config.layout };

  if (controls.startX.value !== "") layout.startX = Number(controls.startX.value);
  if (controls.startY.value !== "") layout.startY = Number(controls.startY.value);
  if (controls.leftWidth.value !== "") layout.leftColumnWidth = Number(controls.leftWidth.value);
  if (controls.rightWidth.value !== "") layout.rightColumnWidth = Number(controls.rightWidth.value);
  if (controls.titleSize.value !== "") layout.titleFontSize = Number(controls.titleSize.value);
  if (controls.subtitleSize.value !== "") layout.subtitleFontSize = Number(controls.subtitleSize.value);
  if (controls.serviceSize.value !== "") {
    layout.serviceFontSize = Number(controls.serviceSize.value);
    layout.priceFontSize = Number(controls.serviceSize.value);
  }
  if (controls.lineHeight.value !== "") layout.lineHeight = Number(controls.lineHeight.value);
  if (controls.textColor.value) {
    layout.titleColor = controls.textColor.value;
    layout.subtitleColor = controls.textColor.value;
    layout.serviceColor = controls.textColor.value;
    layout.priceColor = controls.textColor.value;
  }

  return layout;
}

function getLayoutForSave(config) {
  const layout = { ...config.layout };

  if (controls.startX.value !== "") layout.startX = Number(controls.startX.value);
  if (controls.startY.value !== "") layout.startY = Number(controls.startY.value);
  if (controls.leftWidth.value !== "") layout.leftColumnWidth = Number(controls.leftWidth.value);
  if (controls.rightWidth.value !== "") layout.rightColumnWidth = Number(controls.rightWidth.value);
  if (controls.titleSize.value !== "") layout.titleFontSize = Number(controls.titleSize.value);
  if (controls.subtitleSize.value !== "") layout.subtitleFontSize = Number(controls.subtitleSize.value);
  if (controls.serviceSize.value !== "") {
    layout.serviceFontSize = Number(controls.serviceSize.value);
    layout.priceFontSize = Number(controls.serviceSize.value);
  }
  if (controls.lineHeight.value !== "") layout.lineHeight = Number(controls.lineHeight.value);

  const picked = controls.textColor.value;
  if (picked && picked.toLowerCase() !== loadedServiceColor.toLowerCase()) {
    layout.titleColor = picked;
    layout.subtitleColor = picked;
    layout.serviceColor = picked;
    layout.priceColor = picked;
  }

  for (const [key, value] of Object.entries(layout)) {
    if (typeof value === "number" && Number.isNaN(value)) {
      throw new Error(`Невалидна стойност за ${key}`);
    }
  }

  return layout;
}

async function saveLayoutToConfig() {
  if (!currentConfig || !currentListId) {
    statusText.textContent = "Няма зареден ценоразпис за запис.";
    return;
  }

  const saveBtn = document.getElementById("saveLayoutBtn");
  saveBtn.disabled = true;
  statusText.textContent = "Записване в config.json...";

  try {
    const layout = getLayoutForSave(currentConfig);
    const res = await fetch("/api/save-layout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ listId: currentListId, layout }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.ok) {
      const fallback =
        res.status === 404 || res.status === 501
          ? "Записът изисква сървъра от start.bat (python server.py)."
          : data.error || `Грешка ${res.status}`;
      throw new Error(fallback);
    }

    currentConfig.layout = data.layout || layout;
    loadedServiceColor = currentConfig.layout.serviceColor || loadedServiceColor;
    populateControlsFromConfig(currentConfig);
    renderPriceList(currentConfig);
    statusText.textContent = `Layout е записан в price-lists/${currentListId}/config.json`;
  } catch (err) {
    statusText.textContent = `Грешка при запис: ${err.message}`;
  } finally {
    saveBtn.disabled = false;
  }
}

function getFontFamily(config) {
  if (usingCustomFont && loadedFontFamily) {
    return loadedFontFamily;
  }
  if (controls.fontFamily.value.trim()) {
    return controls.fontFamily.value.trim();
  }
  return loadedFontFamily || config.font?.family || "Georgia, serif";
}

function fontNameFromFile(file) {
  const base = file.name.replace(/\.[^.]+$/, "");
  const cleaned = base.replace(/[^\w\s-]/g, "").trim();
  return cleaned || "UploadedFont";
}

function clearCustomFont() {
  if (customFontUrl) {
    URL.revokeObjectURL(customFontUrl);
    customFontUrl = null;
  }
  usingCustomFont = false;
  delete fontName.dataset.customName;
  fontInput.value = "";
}

function updateFontLabel() {
  fontName.textContent = usingCustomFont
    ? `Текущ: ${fontName.dataset.customName || loadedFontFamily || "custom шрифт"}`
    : `Текущ: ${defaultFontLabel}`;
}

async function loadFontFaceFromUrl(url, fontFaceName) {
  const face = new FontFace(fontFaceName, `url(${url})`);
  await face.load();
  document.fonts.add(face);
  loadedFontFamily = fontFaceName;
  return fontFaceName;
}

async function loadGlobalFontConfig() {
  try {
    const res = await fetch(`fonts/fonts.json?t=${Date.now()}`);
    if (res.ok) return await res.json();
  } catch {
    // ignore
  }

  return {
    file: "MarckScript-Regular.ttf",
    name: "MarckScript",
  };
}

async function tryLoadFontFromPath(url, fontFaceName) {
  try {
    await loadFontFaceFromUrl(`${url}?t=${Date.now()}`, fontFaceName);
    return fontFaceName;
  } catch {
    return null;
  }
}

async function loadDefaultFont(config, listId) {
  loadedFontFamily = null;
  const fallbackFamily = config.font?.family || "Georgia, serif";

  const globalFont = await loadGlobalFontConfig();
  const globalLoaded = await tryLoadFontFromPath(
    `fonts/${globalFont.file}`,
    globalFont.name || "MarckScript"
  );
  if (globalLoaded) {
    defaultFontLabel = `fonts/${globalFont.file}`;
    return globalLoaded;
  }

  const fontFile = config.font?.file;
  if (fontFile) {
    const fontFaceName = config.font?.name || "CustomPriceListFont";
    const listLoaded = await tryLoadFontFromPath(
      `price-lists/${listId}/${fontFile}`,
      fontFaceName
    );
    if (listLoaded) {
      defaultFontLabel = `от папката (${fontFile})`;
      return listLoaded;
    }
  }

  defaultFontLabel = `${fallbackFamily} (fallback)`;
  return fallbackFamily;
}

async function applyCustomFont(file) {
  clearCustomFont();

  const url = URL.createObjectURL(file);
  customFontUrl = url;
  usingCustomFont = true;

  const fontFaceName = fontNameFromFile(file);
  fontName.dataset.customName = file.name;

  await loadFontFaceFromUrl(url, fontFaceName);
  controls.fontFamily.value = fontFaceName;
  updateFontLabel();

  if (currentConfig) {
    renderPriceList(currentConfig);
  }
}

async function resetToDefaultFont() {
  if (!currentConfig || !currentListId) return;

  clearCustomFont();
  const family = await loadDefaultFont(currentConfig, currentListId);
  controls.fontFamily.value = loadedFontFamily || currentConfig.font?.family || family;
  updateFontLabel();

  if (currentConfig) {
    renderPriceList(currentConfig);
  }
}

function getSectionSubtitle(section) {
  return typeof section?.subtitle === "string" ? section.subtitle.trim() : "";
}

function measureItemBlock(item, layout, fontFamily) {
  const serviceLines = wrapText(
    item.service,
    layout.leftColumnWidth,
    layout.serviceFontSize,
    fontFamily
  );
  const serviceHeight = serviceLines.length * layout.lineHeight;
  const priceCount = item.prices.length;
  const priceHeight = priceCount * layout.lineHeight;
  const blockHeight = Math.max(serviceHeight, priceHeight);

  return { serviceLines, blockHeight, priceCount };
}

function renderPriceList(config) {
  if (!backgroundImage) return;

  const layout = getEffectiveLayout(config);
  const fontFamily = getFontFamily(config);

  canvas.width = backgroundImage.naturalWidth;
  canvas.height = backgroundImage.naturalHeight;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(backgroundImage, 0, 0);

  let y = layout.startY;
  const leftX = layout.startX;
  const middleX = layout.startX + layout.leftColumnWidth;
  const rightX = middleX + (layout.middleColumnWidth || 0);
  const rightColumnRight = rightX + layout.rightColumnWidth;

  const blockWidth =
    layout.leftColumnWidth + (layout.middleColumnWidth || 0) + layout.rightColumnWidth;
  const titleX = leftX + blockWidth / 2;

  ctx.font = `bold ${layout.titleFontSize}px ${fontFamily}`;
  ctx.fillStyle = layout.titleColor;
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.fillText(config.title, titleX, y);
  y += layout.titleFontSize * 1.3;
  y += getSectionSubtitle(config.sections[0]) ? layout.titleGap : layout.itemGap;

  for (let s = 0; s < config.sections.length; s++) {
    const section = config.sections[s];
    const subtitle = getSectionSubtitle(section);
    if (subtitle) {
      if (s > 0) {
        y += layout.sectionGap;
      }

      ctx.font = `bold ${layout.subtitleFontSize}px ${fontFamily}`;
      ctx.fillStyle = layout.subtitleColor;
      ctx.textBaseline = "top";

      const middleWidth = layout.middleColumnWidth || 0;
      const subtitleX =
        middleWidth > 0 ? middleX + middleWidth / 2 : leftX + layout.leftColumnWidth * 0.55;
      ctx.textAlign = middleWidth > 0 ? "center" : "left";
      ctx.fillText(subtitle, subtitleX, y);
      y += layout.subtitleFontSize * 1.2 + layout.itemGap;
    }

    for (const item of section.items) {
      const { serviceLines, blockHeight } = measureItemBlock(item, layout, fontFamily);
      const priceCount = item.prices.length;
      const priceBlockHeight = priceCount * layout.lineHeight;

      // Vertically center service text when multiple prices
      const serviceBlockHeight = serviceLines.length * layout.lineHeight;
      const serviceY =
        priceCount > 1
          ? y + (priceBlockHeight - serviceBlockHeight) / 2
          : y;

      drawMultilineText(
        serviceLines,
        leftX,
        serviceY,
        layout.serviceFontSize,
        layout.serviceColor,
        fontFamily,
        "left"
      );

      // Prices on the right
      item.prices.forEach((priceRow, i) => {
        const priceY = y + i * layout.lineHeight;
        const priceText = `${priceRow.duration} — ${priceRow.price}`;

        ctx.font = `${layout.priceFontSize}px ${fontFamily}`;
        ctx.fillStyle = layout.priceColor;
        ctx.textAlign = "right";
        ctx.textBaseline = "top";
        ctx.fillText(priceText, rightColumnRight, priceY);
      });

      y += blockHeight + layout.itemGap;
    }
  }

  canvasSize.textContent = `${canvas.width} × ${canvas.height} px`;
  const bgNote = usingCustomBackground ? " (custom снимка)" : "";
  const fontNote = usingCustomFont ? " (custom шрифт)" : "";
  statusText.textContent = `${config.title} — готов за експорт${bgNote}${fontNote}`;
}

function updateBackgroundLabel() {
  backgroundName.textContent = usingCustomBackground
    ? `Текуща: ${backgroundName.dataset.customName || "custom снимка"}`
    : `Текуща: ${defaultBackgroundLabel}`;
}

function clearCustomBackground() {
  if (customBackgroundUrl) {
    URL.revokeObjectURL(customBackgroundUrl);
    customBackgroundUrl = null;
  }
  usingCustomBackground = false;
  delete backgroundName.dataset.customName;
  backgroundInput.value = "";
}

function loadImageFromSrc(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Снимката не може да се зареди"));
    img.src = src;
  });
}

function populateControlsFromConfig(config) {
  const layout = config.layout;
  controls.startX.value = layout.startX;
  controls.startY.value = layout.startY;
  controls.leftWidth.value = layout.leftColumnWidth;
  controls.rightWidth.value = layout.rightColumnWidth;
  controls.titleSize.value = layout.titleFontSize;
  controls.subtitleSize.value = layout.subtitleFontSize;
  controls.serviceSize.value = layout.serviceFontSize;
  controls.lineHeight.value = layout.lineHeight;
  controls.fontFamily.value = loadedFontFamily || config.font?.family || "";
  loadedServiceColor = layout.serviceColor || "#3d2817";
  controls.textColor.value = loadedServiceColor;
}

function loadBackgroundImageFromPath(path) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Не може да се зареди ${path}`));
    img.src = `${path}?t=${Date.now()}`;
  });
}

function loadBackgroundImage(listId, filename) {
  return loadBackgroundImageFromPath(`price-lists/${listId}/${encodeURIComponent(filename)}`);
}

async function loadGlobalImageConfig() {
  try {
    const res = await fetch(`images/images.json?t=${Date.now()}`);
    if (res.ok) return await res.json();
  } catch {
    // ignore
  }

  return { file: "шаблон.jpg" };
}

async function tryLoadBackgroundFromPath(path) {
  try {
    return await loadBackgroundImageFromPath(path);
  } catch {
    return null;
  }
}

async function loadDefaultBackground(listId, bgFile) {
  const globalImage = await loadGlobalImageConfig();
  const globalPath = `images/${encodeURIComponent(globalImage.file)}`;
  const globalLoaded = await tryLoadBackgroundFromPath(globalPath);
  if (globalLoaded) {
    backgroundImage = globalLoaded;
    defaultBackgroundLabel = globalPath.replace(/\?.*$/, "");
    return true;
  }

  const listLoaded = await tryLoadBackgroundFromPath(
    `price-lists/${listId}/${encodeURIComponent(bgFile)}`
  );
  if (listLoaded) {
    backgroundImage = listLoaded;
    defaultBackgroundLabel = `от папката (${bgFile})`;
    return true;
  }

  backgroundImage = await createPlaceholderBackground();
  defaultBackgroundLabel = `placeholder (липсва ${globalImage.file} и ${bgFile})`;
  return false;
}

async function applyCustomBackground(file) {
  clearCustomBackground();

  const url = URL.createObjectURL(file);
  customBackgroundUrl = url;
  usingCustomBackground = true;
  backgroundName.dataset.customName = file.name;

  backgroundImage = await loadImageFromSrc(url);
  updateBackgroundLabel();

  if (currentConfig) {
    renderPriceList(currentConfig);
  }
}

async function resetToFolderBackground() {
  if (!currentListId || !currentConfig) return;

  clearCustomBackground();

  const bgFile = currentConfig.background || "background.jpg";
  const found = await loadDefaultBackground(currentListId, bgFile);
  updateBackgroundLabel();

  if (!found) {
    statusText.textContent = `Липсва шаблон — показвам placeholder. Сложете images/шаблон.jpg или заредете файл.`;
  }

  renderPriceList(currentConfig);
}

async function loadPriceList(listId) {
  statusText.textContent = "Зареждане...";
  currentListId = listId;
  clearCustomBackground();
  clearCustomFont();

  try {
    const configRes = await fetch(`price-lists/${listId}/config.json?t=${Date.now()}`);
    if (!configRes.ok) throw new Error("config.json не е намерен");
    currentConfig = await configRes.json();

    await loadDefaultFont(currentConfig, listId);
    populateControlsFromConfig(currentConfig);
    updateFontLabel();

    const bgFile = currentConfig.background || "background.jpg";
    const found = await loadDefaultBackground(listId, bgFile);
    updateBackgroundLabel();

    if (!found) {
      statusText.textContent = `Липсва шаблон — показвам placeholder. Сложете images/шаблон.jpg или заредете файл.`;
    }

    renderPriceList(currentConfig);
  } catch (err) {
    statusText.textContent = `Грешка: ${err.message}`;
    console.error(err);
  }
}

function createPlaceholderBackground() {
  const w = 900;
  const h = 1400;
  const off = document.createElement("canvas");
  off.width = w;
  off.height = h;
  const octx = off.getContext("2d");

  const grad = octx.createLinearGradient(0, 0, w, h);
  grad.addColorStop(0, "#f5ebe0");
  grad.addColorStop(1, "#e8d5c4");
  octx.fillStyle = grad;
  octx.fillRect(0, 0, w, h);

  octx.fillStyle = "rgba(0,0,0,0.35)";
  octx.font = "22px Georgia, serif";
  octx.textAlign = "center";
  octx.fillText("Сложете images/шаблон.jpg или background.jpg в папката", w / 2, h / 2);

  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.src = off.toDataURL();
  });
}

async function loadListsManifest() {
  const res = await fetch("price-lists/lists.json");
  const data = await res.json();
  listSelect.innerHTML = "";

  for (const list of data.lists) {
    const opt = document.createElement("option");
    opt.value = list.id;
    opt.textContent = list.name;
    listSelect.appendChild(opt);
  }

  const params = new URLSearchParams(window.location.search);
  const fromUrl = params.get("list");
  const initial = fromUrl || data.lists[0]?.id;

  if (initial) {
    listSelect.value = initial;
    await loadPriceList(initial);
  }
}

function exportPng() {
  if (!currentConfig) return;

  const link = document.createElement("a");
  link.download = `${currentListId || "cenoraazpis"}.png`;
  link.href = canvas.toDataURL("image/png");
  link.click();
}

function bindEvents() {
  listSelect.addEventListener("change", () => loadPriceList(listSelect.value));

  Object.values(controls).forEach((el) => {
    el.addEventListener("input", () => {
      if (currentConfig) renderPriceList(currentConfig);
    });
  });

  document.getElementById("reloadBtn").addEventListener("click", () => {
    if ((usingCustomBackground || usingCustomFont) && currentConfig) {
      renderPriceList(currentConfig);
      return;
    }
    loadPriceList(listSelect.value);
  });

  document.getElementById("saveLayoutBtn").addEventListener("click", () => {
    saveLayoutToConfig();
  });

  document.getElementById("exportBtn").addEventListener("click", exportPng);

  backgroundInput.addEventListener("change", async () => {
    const file = backgroundInput.files?.[0];
    if (!file) return;

    try {
      await applyCustomBackground(file);
    } catch (err) {
      statusText.textContent = `Грешка при зареждане на снимка: ${err.message}`;
    }
  });

  resetBackgroundBtn.addEventListener("click", () => {
    resetToFolderBackground();
  });

  fontInput.addEventListener("change", async () => {
    const file = fontInput.files?.[0];
    if (!file) return;

    try {
      await applyCustomFont(file);
    } catch (err) {
      statusText.textContent = `Грешка при зареждане на шрифт: ${err.message}`;
    }
  });

  resetFontBtn.addEventListener("click", () => {
    resetToDefaultFont();
  });
}

bindEvents();
loadListsManifest();
