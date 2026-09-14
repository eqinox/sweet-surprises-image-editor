import { normalizeConfig } from "@/lib/config"
import { loadImageFromSrc } from "@/lib/renderPriceList"
import type { PriceListConfig, RawPriceList, RawVoucher, VoucherConfig } from "@/lib/types"
import { normalizeVoucher } from "@/lib/voucher"

export const PROJECT_APP = "sweet-surprises"
export const PROJECT_VERSION = 1

export type SavedPriceListProject = {
  app: typeof PROJECT_APP
  version: number
  kind: "price-list"
  savedAt: string
  config: PriceListConfig
  backgroundDataUrl?: string
  fontDataUrl?: string
  fontFileName?: string
}

export type SavedVoucherProject = {
  app: typeof PROJECT_APP
  version: number
  kind: "voucher"
  savedAt: string
  config: VoucherConfig
  backgroundDataUrl?: string
  fontDataUrl?: string
  fontFileName?: string
}

export type SavedProject = SavedPriceListProject | SavedVoucherProject

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

function asOptionalString(value: unknown): string | undefined {
  return typeof value === "string" && value.length > 0 ? value : undefined
}

export function parseSavedProject(raw: unknown): SavedProject {
  if (!isRecord(raw)) {
    throw new Error("Файлът не е валиден")
  }

  const kind = raw.kind
  if (kind !== "price-list" && kind !== "voucher") {
    throw new Error("Този файл не е ценоразпис или ваучер")
  }

  if (raw.app && raw.app !== PROJECT_APP) {
    throw new Error("Този файл е от друго приложение")
  }

  if (!isRecord(raw.config)) {
    throw new Error("Във файла липсва съдържание")
  }

  if (kind === "voucher") {
    return {
      app: PROJECT_APP,
      version: typeof raw.version === "number" ? raw.version : PROJECT_VERSION,
      kind: "voucher",
      savedAt: typeof raw.savedAt === "string" ? raw.savedAt : "",
      config: normalizeVoucher(raw.config as RawVoucher),
      backgroundDataUrl: asOptionalString(raw.backgroundDataUrl),
      fontDataUrl: asOptionalString(raw.fontDataUrl),
      fontFileName: asOptionalString(raw.fontFileName),
    }
  }

  return {
    app: PROJECT_APP,
    version: typeof raw.version === "number" ? raw.version : PROJECT_VERSION,
    kind: "price-list",
    savedAt: typeof raw.savedAt === "string" ? raw.savedAt : "",
    config: normalizeConfig(raw.config as RawPriceList),
    backgroundDataUrl: asOptionalString(raw.backgroundDataUrl),
    fontDataUrl: asOptionalString(raw.fontDataUrl),
    fontFileName: asOptionalString(raw.fontFileName),
  }
}

export function readProjectFile(file: File): Promise<SavedProject> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      try {
        resolve(parseSavedProject(JSON.parse(String(reader.result))))
      } catch (error) {
        reject(error instanceof Error ? error : new Error("Файлът не се отвори"))
      }
    }
    reader.onerror = () => reject(new Error("Файлът не се отвори"))
    reader.readAsText(file)
  })
}

export function downloadJson(filename: string, data: unknown) {
  const blob = new Blob([`${JSON.stringify(data, null, 2)}\n`], {
    type: "application/json",
  })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  link.rel = "noopener"
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 2000)
}

export function jsonFileName(name: string): string {
  const cleaned = name
    .trim()
    .replace(/[<>:"/\\|?*]+/g, "")
    .replace(/\s+/g, "-")
  return `${cleaned || "sweet-surprises"}.json`
}

export function imageToDataUrl(
  image: HTMLImageElement,
  type = "image/jpeg",
  quality = 0.92
): string | undefined {
  try {
    const canvas = document.createElement("canvas")
    canvas.width = image.naturalWidth
    canvas.height = image.naturalHeight
    const ctx = canvas.getContext("2d")
    if (!ctx) return undefined
    ctx.drawImage(image, 0, 0)
    return canvas.toDataURL(type, quality)
  } catch {
    return undefined
  }
}

export async function urlToDataUrl(url: string): Promise<string> {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error("Файлът не се прочете")
  }
  const blob = await response.blob()
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(new Error("Файлът не се прочете"))
    reader.readAsDataURL(blob)
  })
}

export async function loadSavedBackground(
  dataUrl?: string
): Promise<HTMLImageElement | null> {
  if (!dataUrl) return null
  return loadImageFromSrc(dataUrl)
}
