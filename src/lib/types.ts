export type PriceRow = {
  id: string
  duration: string
  price: string
}

export type ServiceItem = {
  id: string
  service: string
  prices: PriceRow[]
}

export type Section = {
  id: string
  subtitle: string
  items: ServiceItem[]
}

export type Layout = {
  startX: number
  startY: number
  titleFontSize: number
  subtitleFontSize: number
  serviceFontSize: number
  priceFontSize: number
  lineHeight: number
  sectionGap: number
  itemGap: number
  titleGap: number
  leftColumnWidth: number
  middleColumnWidth: number
  rightColumnWidth: number
  titleColor: string
  subtitleColor: string
  serviceColor: string
  priceColor: string
}

export type PriceListConfig = {
  title: string
  background: string
  font: {
    family: string
    file: string | null
    name?: string
  }
  layout: Layout
  sections: Section[]
}

export type PriceListInfo = {
  id: string
  name: string
}

export type RawPriceList = {
  title?: string
  background?: string
  font?: {
    family?: string
    file?: string | null
    name?: string
  }
  layout?: Partial<Layout>
  sections?: Array<{
    subtitle?: string
    items?: Array<{
      service?: string
      prices?: Array<{
        duration?: string
        price?: string
      }>
    }>
  }>
}
