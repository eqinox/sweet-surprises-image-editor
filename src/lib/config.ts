import { formatDuration, formatPrice, newId } from "@/lib/format"
import type {
  Layout,
  PriceListConfig,
  PriceRow,
  RawPriceList,
  Section,
  ServiceItem,
} from "@/lib/types"

export const DEFAULT_LAYOUT: Layout = {
  startX: 166,
  startY: 185,
  titleFontSize: 42,
  subtitleFontSize: 28,
  serviceFontSize: 22,
  priceFontSize: 22,
  lineHeight: 22,
  sectionGap: 36,
  itemGap: 12,
  titleGap: 50,
  leftColumnWidth: 380,
  middleColumnWidth: 180,
  rightColumnWidth: 260,
  titleColor: "#2c1810",
  subtitleColor: "#5c3d2e",
  serviceColor: "#3d2817",
  priceColor: "#3d2817",
}

function asNumber(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback
}

function asColor(value: unknown, fallback: string): string {
  return typeof value === "string" && /^#[0-9A-Fa-f]{6}$/.test(value)
    ? value
    : fallback
}

export function normalizeConfig(raw: RawPriceList): PriceListConfig {
  const layout = { ...DEFAULT_LAYOUT, ...(raw.layout ?? {}) }

  return {
    title: typeof raw.title === "string" ? raw.title : "",
    background:
      typeof raw.background === "string" ? raw.background : "background.jpg",
    font: {
      family: raw.font?.family || "MarckScript, Georgia, serif",
      file: raw.font?.file ?? null,
      name: raw.font?.name,
    },
    layout: {
      startX: asNumber(layout.startX, DEFAULT_LAYOUT.startX),
      startY: asNumber(layout.startY, DEFAULT_LAYOUT.startY),
      titleFontSize: asNumber(layout.titleFontSize, DEFAULT_LAYOUT.titleFontSize),
      subtitleFontSize: asNumber(
        layout.subtitleFontSize,
        DEFAULT_LAYOUT.subtitleFontSize
      ),
      serviceFontSize: asNumber(
        layout.serviceFontSize,
        DEFAULT_LAYOUT.serviceFontSize
      ),
      priceFontSize: asNumber(layout.priceFontSize, DEFAULT_LAYOUT.priceFontSize),
      lineHeight: asNumber(layout.lineHeight, DEFAULT_LAYOUT.lineHeight),
      sectionGap: asNumber(layout.sectionGap, DEFAULT_LAYOUT.sectionGap),
      itemGap: asNumber(layout.itemGap, DEFAULT_LAYOUT.itemGap),
      titleGap: asNumber(layout.titleGap, DEFAULT_LAYOUT.titleGap),
      leftColumnWidth: asNumber(
        layout.leftColumnWidth,
        DEFAULT_LAYOUT.leftColumnWidth
      ),
      middleColumnWidth: asNumber(
        layout.middleColumnWidth,
        DEFAULT_LAYOUT.middleColumnWidth
      ),
      rightColumnWidth: asNumber(
        layout.rightColumnWidth,
        DEFAULT_LAYOUT.rightColumnWidth
      ),
      titleColor: asColor(layout.titleColor, DEFAULT_LAYOUT.titleColor),
      subtitleColor: asColor(layout.subtitleColor, DEFAULT_LAYOUT.subtitleColor),
      serviceColor: asColor(layout.serviceColor, DEFAULT_LAYOUT.serviceColor),
      priceColor: asColor(layout.priceColor, DEFAULT_LAYOUT.priceColor),
    },
    sections: (raw.sections ?? []).map((section) => ({
      id: newId(),
      subtitle: typeof section.subtitle === "string" ? section.subtitle : "",
      items: (section.items ?? []).map((item) => ({
        id: newId(),
        service: typeof item.service === "string" ? item.service : "",
        prices: (item.prices ?? []).map((price) => ({
          id: newId(),
          duration: typeof price.duration === "string" ? price.duration : "30 мин",
          price: typeof price.price === "string" ? price.price : "0€",
        })),
      })),
    })),
  }
}

export function setTitle(config: PriceListConfig, title: string): PriceListConfig {
  return { ...config, title }
}

export function addSection(
  config: PriceListConfig,
  subtitle = "Ново подзаглавие"
): PriceListConfig {
  const section: Section = {
    id: newId(),
    subtitle,
    items: [],
  }
  return { ...config, sections: [...config.sections, section] }
}

export function removeSection(
  config: PriceListConfig,
  sectionId: string
): PriceListConfig {
  return {
    ...config,
    sections: config.sections.filter((section) => section.id !== sectionId),
  }
}

export function setSubtitle(
  config: PriceListConfig,
  sectionId: string,
  subtitle: string
): PriceListConfig {
  return {
    ...config,
    sections: config.sections.map((section) =>
      section.id === sectionId ? { ...section, subtitle } : section
    ),
  }
}

export function addService(
  config: PriceListConfig,
  sectionId: string,
  service = "Нова услуга",
  minutes = 30,
  euros = 20
): PriceListConfig {
  const item: ServiceItem = {
    id: newId(),
    service,
    prices: [
      {
        id: newId(),
        duration: formatDuration(minutes),
        price: formatPrice(euros),
      },
    ],
  }

  return {
    ...config,
    sections: config.sections.map((section) =>
      section.id === sectionId
        ? { ...section, items: [...section.items, item] }
        : section
    ),
  }
}

export function removeService(
  config: PriceListConfig,
  sectionId: string,
  itemId: string
): PriceListConfig {
  return {
    ...config,
    sections: config.sections.map((section) =>
      section.id === sectionId
        ? {
            ...section,
            items: section.items.filter((item) => item.id !== itemId),
          }
        : section
    ),
  }
}

export function setServiceName(
  config: PriceListConfig,
  sectionId: string,
  itemId: string,
  service: string
): PriceListConfig {
  return {
    ...config,
    sections: config.sections.map((section) =>
      section.id === sectionId
        ? {
            ...section,
            items: section.items.map((item) =>
              item.id === itemId ? { ...item, service } : item
            ),
          }
        : section
    ),
  }
}

export function addPriceRow(
  config: PriceListConfig,
  sectionId: string,
  itemId: string,
  minutes = 30,
  euros = 20
): PriceListConfig {
  const row: PriceRow = {
    id: newId(),
    duration: formatDuration(minutes),
    price: formatPrice(euros),
  }

  return {
    ...config,
    sections: config.sections.map((section) =>
      section.id === sectionId
        ? {
            ...section,
            items: section.items.map((item) =>
              item.id === itemId
                ? { ...item, prices: [...item.prices, row] }
                : item
            ),
          }
        : section
    ),
  }
}

export function removePriceRow(
  config: PriceListConfig,
  sectionId: string,
  itemId: string,
  priceId: string
): PriceListConfig {
  return {
    ...config,
    sections: config.sections.map((section) =>
      section.id === sectionId
        ? {
            ...section,
            items: section.items.map((item) =>
              item.id === itemId
                ? {
                    ...item,
                    prices: item.prices.filter((price) => price.id !== priceId),
                  }
                : item
            ),
          }
        : section
    ),
  }
}

export function setPriceRow(
  config: PriceListConfig,
  sectionId: string,
  itemId: string,
  priceId: string,
  minutes: number,
  euros: number
): PriceListConfig {
  return {
    ...config,
    sections: config.sections.map((section) =>
      section.id === sectionId
        ? {
            ...section,
            items: section.items.map((item) =>
              item.id === itemId
                ? {
                    ...item,
                    prices: item.prices.map((price) =>
                      price.id === priceId
                        ? {
                            ...price,
                            duration: formatDuration(minutes),
                            price: formatPrice(euros),
                          }
                        : price
                    ),
                  }
                : item
            ),
          }
        : section
    ),
  }
}

export function setLayout(
  config: PriceListConfig,
  patch: Partial<Layout>
): PriceListConfig {
  return {
    ...config,
    layout: { ...config.layout, ...patch },
  }
}

export function setTextColor(
  config: PriceListConfig,
  color: string
): PriceListConfig {
  return setLayout(config, {
    titleColor: color,
    subtitleColor: color,
    serviceColor: color,
    priceColor: color,
  })
}
