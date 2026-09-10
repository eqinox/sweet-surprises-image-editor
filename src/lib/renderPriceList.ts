import type { PriceListConfig, ServiceItem } from "@/lib/types"

type WrapContext = {
  wrapText: (text: string, maxWidth: number, fontSize: number, fontFamily: string) => string[]
}

function createWrap(ctx: CanvasRenderingContext2D): WrapContext {
  return {
    wrapText(text, maxWidth, fontSize, fontFamily) {
      ctx.font = `${fontSize}px ${fontFamily}`
      const words = text.split(/\s+/)
      const lines: string[] = []
      let current = ""

      for (const word of words) {
        const test = current ? `${current} ${word}` : word
        if (ctx.measureText(test).width <= maxWidth) {
          current = test
        } else {
          if (current) lines.push(current)
          current = word
        }
      }

      if (current) lines.push(current)
      return lines.length ? lines : [""]
    },
  }
}

function drawMultilineText(
  ctx: CanvasRenderingContext2D,
  lines: string[],
  x: number,
  y: number,
  fontSize: number,
  color: string,
  fontFamily: string,
  align: CanvasTextAlign = "left"
) {
  ctx.font = `${fontSize}px ${fontFamily}`
  ctx.fillStyle = color
  ctx.textAlign = align
  ctx.textBaseline = "top"

  lines.forEach((line, i) => {
    ctx.fillText(line, x, y + i * fontSize * 1.15)
  })

  return lines.length * fontSize * 1.15
}

function measureItemBlock(
  wrap: WrapContext,
  item: ServiceItem,
  layout: PriceListConfig["layout"],
  fontFamily: string
) {
  const serviceLines = wrap.wrapText(
    item.service,
    layout.leftColumnWidth,
    layout.serviceFontSize,
    fontFamily
  )
  const serviceHeight = serviceLines.length * layout.lineHeight
  const priceHeight = item.prices.length * layout.lineHeight
  return {
    serviceLines,
    blockHeight: Math.max(serviceHeight, priceHeight),
  }
}

function getSectionSubtitle(section?: PriceListConfig["sections"][number]) {
  return typeof section?.subtitle === "string" ? section.subtitle.trim() : ""
}

export function renderPriceList(
  canvas: HTMLCanvasElement,
  config: PriceListConfig,
  background: HTMLImageElement,
  fontFamily: string
) {
  const ctx = canvas.getContext("2d")
  if (!ctx) return

  const layout = config.layout
  const wrap = createWrap(ctx)

  canvas.width = background.naturalWidth
  canvas.height = background.naturalHeight

  ctx.clearRect(0, 0, canvas.width, canvas.height)
  ctx.drawImage(background, 0, 0)

  let y = layout.startY
  const leftX = layout.startX
  const middleX = layout.startX + layout.leftColumnWidth
  const rightX = middleX + (layout.middleColumnWidth || 0)
  const rightColumnRight = rightX + layout.rightColumnWidth
  const blockWidth =
    layout.leftColumnWidth + (layout.middleColumnWidth || 0) + layout.rightColumnWidth
  const titleX = leftX + blockWidth / 2

  if (config.title.trim()) {
    ctx.font = `bold ${layout.titleFontSize}px ${fontFamily}`
    ctx.fillStyle = layout.titleColor
    ctx.textAlign = "center"
    ctx.textBaseline = "top"
    ctx.fillText(config.title, titleX, y)
    y += layout.titleFontSize * 1.3
    y += getSectionSubtitle(config.sections[0])
      ? layout.titleGap
      : layout.itemGap
  }

  for (let s = 0; s < config.sections.length; s += 1) {
    const section = config.sections[s]
    const subtitle = getSectionSubtitle(section)

    if (subtitle) {
      if (s > 0) y += layout.sectionGap

      ctx.font = `bold ${layout.subtitleFontSize}px ${fontFamily}`
      ctx.fillStyle = layout.subtitleColor
      ctx.textBaseline = "top"

      const middleWidth = layout.middleColumnWidth || 0
      const subtitleX =
        middleWidth > 0 ? middleX + middleWidth / 2 : leftX + layout.leftColumnWidth * 0.55
      ctx.textAlign = middleWidth > 0 ? "center" : "left"
      ctx.fillText(subtitle, subtitleX, y)
      y += layout.subtitleFontSize * 1.2 + layout.itemGap
    }

    for (const item of section.items) {
      const { serviceLines, blockHeight } = measureItemBlock(
        wrap,
        item,
        layout,
        fontFamily
      )
      const priceCount = item.prices.length
      const priceBlockHeight = priceCount * layout.lineHeight
      const serviceBlockHeight = serviceLines.length * layout.lineHeight
      const serviceY =
        priceCount > 1 ? y + (priceBlockHeight - serviceBlockHeight) / 2 : y

      drawMultilineText(
        ctx,
        serviceLines,
        leftX,
        serviceY,
        layout.serviceFontSize,
        layout.serviceColor,
        fontFamily,
        "left"
      )

      item.prices.forEach((priceRow, i) => {
        const priceY = y + i * layout.lineHeight
        const priceText = `${priceRow.duration} — ${priceRow.price}`
        ctx.font = `${layout.priceFontSize}px ${fontFamily}`
        ctx.fillStyle = layout.priceColor
        ctx.textAlign = "right"
        ctx.textBaseline = "top"
        ctx.fillText(priceText, rightColumnRight, priceY)
      })

      y += blockHeight + layout.itemGap
    }
  }
}

export function createPlaceholderBackground(): Promise<HTMLImageElement> {
  const width = 900
  const height = 1400
  const off = document.createElement("canvas")
  off.width = width
  off.height = height
  const ctx = off.getContext("2d")
  if (!ctx) {
    return Promise.reject(new Error("Canvas не е наличен"))
  }

  const grad = ctx.createLinearGradient(0, 0, width, height)
  grad.addColorStop(0, "#f5ebe0")
  grad.addColorStop(1, "#e8d5c4")
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, width, height)
  ctx.fillStyle = "rgba(0,0,0,0.35)"
  ctx.font = "22px Georgia, serif"
  ctx.textAlign = "center"
  ctx.fillText("Сложете снимка за фон", width / 2, height / 2)

  return loadImageFromSrc(off.toDataURL())
}

export function loadImageFromSrc(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error("Снимката не може да се зареди"))
    img.src = src
  })
}
