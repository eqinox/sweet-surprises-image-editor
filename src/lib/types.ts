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

export type EditorMode = "price-list" | "voucher"

export type VoucherLayout = {
  contentWidth: number
  titleFontSize: number
  subtitleFontSize: number
  serviceFontSize: number
  priceFontSize: number
  phoneFontSize: number
  titleX: number
  titleY: number
  subtitleX: number
  subtitleY: number
  serviceX: number
  serviceY: number
  priceX: number
  priceY: number
  phoneX: number
  phoneY: number
  dividerX: number
  dividerY: number
  dividerHeight: number
  titleColor: string
  subtitleColor: string
  serviceColor: string
  priceColor: string
  phoneColor: string
  dividerColor: string
}

export type VoucherConfig = {
  title: string
  subtitle: string
  service: string
  price: string
  phone: string
  background: string
  font: {
    family: string
    file: string | null
    name?: string
  }
  layout: VoucherLayout
}

export type RawVoucher = {
  title?: string
  subtitle?: string
  service?: string
  price?: string
  phone?: string
  background?: string
  font?: {
    family?: string
    file?: string | null
    name?: string
  }
  layout?: Partial<VoucherLayout>
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
