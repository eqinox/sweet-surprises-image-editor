import { formatPrice } from "@/lib/format"
import { INK_COLOR } from "@/lib/ink"
import type { RawVoucher, VoucherConfig, VoucherLayout } from "@/lib/types"

export const VOUCHER_BACKGROUND_FILE = "шаблон - ваучер.jpg"

export const DEFAULT_VOUCHER_LAYOUT: VoucherLayout = {
  contentWidth: 500,
  titleFontSize: 56,
  subtitleFontSize: 36,
  serviceFontSize: 34,
  priceFontSize: 42,
  phoneFontSize: 26,
  titleX: 300,
  titleY: 86,
  subtitleX: 300,
  subtitleY: 148,
  serviceX: 58,
  serviceY: 250,
  priceX: 330,
  priceY: 244,
  phoneX: 58,
  phoneY: 334,
  dividerX: 278,
  dividerY: 236,
  dividerHeight: 58,
  titleColor: INK_COLOR,
  subtitleColor: INK_COLOR,
  serviceColor: INK_COLOR,
  priceColor: INK_COLOR,
  phoneColor: INK_COLOR,
  dividerColor: INK_COLOR,
}

function asNumber(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback
}

export function createDefaultVoucher(): VoucherConfig {
  return {
    title: "Ваучер",
    subtitle: "",
    service: "",
    price: "",
    phone: "За запазване на час:",
    background: VOUCHER_BACKGROUND_FILE,
    font: {
      family: "MarckScript, Georgia, serif",
      file: null,
    },
    layout: { ...DEFAULT_VOUCHER_LAYOUT },
  }
}

export function normalizeVoucher(raw: RawVoucher): VoucherConfig {
  const fallback = createDefaultVoucher()
  const layout = { ...(raw.layout ?? {}) } as Partial<VoucherLayout> & {
    startX?: number
    startY?: number
    leftColumnWidth?: number
    bottomMargin?: number
  }

  const hasNewPositions = typeof layout.titleX === "number"

  return {
    title: typeof raw.title === "string" ? raw.title : fallback.title,
    subtitle: typeof raw.subtitle === "string" ? raw.subtitle : fallback.subtitle,
    service: typeof raw.service === "string" ? raw.service : fallback.service,
    price: typeof raw.price === "string" ? raw.price : fallback.price,
    phone: typeof raw.phone === "string" ? raw.phone : fallback.phone,
    background:
      typeof raw.background === "string" ? raw.background : fallback.background,
    font: {
      family: raw.font?.family || fallback.font.family,
      file: raw.font?.file ?? null,
      name: raw.font?.name,
    },
    layout: {
      contentWidth: asNumber(layout.contentWidth, DEFAULT_VOUCHER_LAYOUT.contentWidth),
      titleFontSize: asNumber(
        layout.titleFontSize,
        DEFAULT_VOUCHER_LAYOUT.titleFontSize
      ),
      subtitleFontSize: asNumber(
        layout.subtitleFontSize,
        DEFAULT_VOUCHER_LAYOUT.subtitleFontSize
      ),
      serviceFontSize: asNumber(
        layout.serviceFontSize,
        DEFAULT_VOUCHER_LAYOUT.serviceFontSize
      ),
      priceFontSize: asNumber(
        layout.priceFontSize,
        DEFAULT_VOUCHER_LAYOUT.priceFontSize
      ),
      phoneFontSize: asNumber(
        layout.phoneFontSize,
        DEFAULT_VOUCHER_LAYOUT.phoneFontSize
      ),
      titleX: hasNewPositions
        ? asNumber(layout.titleX, DEFAULT_VOUCHER_LAYOUT.titleX)
        : DEFAULT_VOUCHER_LAYOUT.titleX,
      titleY: hasNewPositions
        ? asNumber(layout.titleY, DEFAULT_VOUCHER_LAYOUT.titleY)
        : DEFAULT_VOUCHER_LAYOUT.titleY,
      subtitleX: hasNewPositions
        ? asNumber(layout.subtitleX, DEFAULT_VOUCHER_LAYOUT.subtitleX)
        : DEFAULT_VOUCHER_LAYOUT.subtitleX,
      subtitleY: hasNewPositions
        ? asNumber(layout.subtitleY, DEFAULT_VOUCHER_LAYOUT.subtitleY)
        : DEFAULT_VOUCHER_LAYOUT.subtitleY,
      serviceX: hasNewPositions
        ? asNumber(layout.serviceX, DEFAULT_VOUCHER_LAYOUT.serviceX)
        : DEFAULT_VOUCHER_LAYOUT.serviceX,
      serviceY: hasNewPositions
        ? asNumber(layout.serviceY, DEFAULT_VOUCHER_LAYOUT.serviceY)
        : DEFAULT_VOUCHER_LAYOUT.serviceY,
      priceX: hasNewPositions
        ? asNumber(layout.priceX, DEFAULT_VOUCHER_LAYOUT.priceX)
        : DEFAULT_VOUCHER_LAYOUT.priceX,
      priceY: hasNewPositions
        ? asNumber(layout.priceY, DEFAULT_VOUCHER_LAYOUT.priceY)
        : DEFAULT_VOUCHER_LAYOUT.priceY,
      phoneX: hasNewPositions
        ? asNumber(layout.phoneX, DEFAULT_VOUCHER_LAYOUT.phoneX)
        : DEFAULT_VOUCHER_LAYOUT.phoneX,
      phoneY: hasNewPositions
        ? asNumber(layout.phoneY, DEFAULT_VOUCHER_LAYOUT.phoneY)
        : DEFAULT_VOUCHER_LAYOUT.phoneY,
      dividerX: hasNewPositions
        ? asNumber(layout.dividerX, DEFAULT_VOUCHER_LAYOUT.dividerX)
        : DEFAULT_VOUCHER_LAYOUT.dividerX,
      dividerY: hasNewPositions
        ? asNumber(layout.dividerY, DEFAULT_VOUCHER_LAYOUT.dividerY)
        : DEFAULT_VOUCHER_LAYOUT.dividerY,
      dividerHeight: hasNewPositions
        ? asNumber(layout.dividerHeight, DEFAULT_VOUCHER_LAYOUT.dividerHeight)
        : DEFAULT_VOUCHER_LAYOUT.dividerHeight,
      titleColor: INK_COLOR,
      subtitleColor: INK_COLOR,
      serviceColor: INK_COLOR,
      priceColor: INK_COLOR,
      phoneColor: INK_COLOR,
      dividerColor: INK_COLOR,
    },
  }
}

export function setVoucherTitle(config: VoucherConfig, title: string): VoucherConfig {
  return { ...config, title }
}

export function setVoucherSubtitle(
  config: VoucherConfig,
  subtitle: string
): VoucherConfig {
  return { ...config, subtitle }
}

export function setVoucherService(
  config: VoucherConfig,
  service: string
): VoucherConfig {
  return { ...config, service }
}

export function setVoucherPrice(
  config: VoucherConfig,
  euros: number | ""
): VoucherConfig {
  if (euros === "" || !Number.isFinite(euros)) {
    return { ...config, price: "" }
  }
  return { ...config, price: formatPrice(euros) }
}

export function setVoucherPhone(config: VoucherConfig, phone: string): VoucherConfig {
  return { ...config, phone }
}

export function setVoucherLayout(
  config: VoucherConfig,
  patch: Partial<VoucherLayout>
): VoucherConfig {
  return {
    ...config,
    layout: { ...config.layout, ...patch },
  }
}

const VOUCHER_FONT_SIZE_KEYS = [
  "titleFontSize",
  "subtitleFontSize",
  "serviceFontSize",
  "priceFontSize",
  "phoneFontSize",
] as const

const VOUCHER_X_KEYS = [
  "titleX",
  "subtitleX",
  "serviceX",
  "priceX",
  "phoneX",
  "dividerX",
] as const

const VOUCHER_Y_KEYS = [
  "titleY",
  "subtitleY",
  "serviceY",
  "priceY",
  "phoneY",
  "dividerY",
] as const

export function setVoucherAllFontSizes(
  config: VoucherConfig,
  nextTitleSize: number
): VoucherConfig {
  const size = Number.isFinite(nextTitleSize) ? nextTitleSize : config.layout.titleFontSize
  const delta = size - config.layout.titleFontSize
  if (delta === 0) return config

  const patch: Partial<VoucherLayout> = {}
  for (const key of VOUCHER_FONT_SIZE_KEYS) {
    patch[key] = Math.max(10, config.layout[key] + delta)
  }
  return setVoucherLayout(config, patch)
}

export function setVoucherAllOffset(
  config: VoucherConfig,
  patch: { x?: number; y?: number }
): VoucherConfig {
  const next: Partial<VoucherLayout> = {}

  if (patch.x !== undefined && Number.isFinite(patch.x)) {
    const delta = patch.x - config.layout.titleX
    if (delta !== 0) {
      for (const key of VOUCHER_X_KEYS) {
        next[key] = config.layout[key] + delta
      }
    }
  }

  if (patch.y !== undefined && Number.isFinite(patch.y)) {
    const delta = patch.y - config.layout.titleY
    if (delta !== 0) {
      for (const key of VOUCHER_Y_KEYS) {
        next[key] = config.layout[key] + delta
      }
    }
  }

  return Object.keys(next).length ? setVoucherLayout(config, next) : config
}

export function setVoucherTextColor(
  config: VoucherConfig,
  color: string
): VoucherConfig {
  return setVoucherLayout(config, {
    titleColor: color,
    subtitleColor: color,
    serviceColor: color,
    priceColor: color,
    phoneColor: color,
    dividerColor: color,
  })
}
