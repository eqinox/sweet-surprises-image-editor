import { createWrap, drawMultilineText } from "@/lib/canvasText"
import { INK_COLOR } from "@/lib/ink"
import type { VoucherConfig } from "@/lib/types"

const DESIGN_WIDTH = 600
const DESIGN_HEIGHT = 424

export function renderVoucher(
  canvas: HTMLCanvasElement,
  config: VoucherConfig,
  background: HTMLImageElement,
  fontFamily: string
) {
  const ctx = canvas.getContext("2d")
  if (!ctx) return

  canvas.width = background.naturalWidth
  canvas.height = background.naturalHeight

  ctx.clearRect(0, 0, canvas.width, canvas.height)
  ctx.drawImage(background, 0, 0)

  const sx = canvas.width / DESIGN_WIDTH
  const sy = canvas.height / DESIGN_HEIGHT
  const layout = config.layout
  const wrap = createWrap(ctx)
  const color = INK_COLOR
  const contentWidth = layout.contentWidth * sx

  if (config.title.trim()) {
    const titleFontSize = layout.titleFontSize * sx
    const titleLines = wrap.wrapText(
      config.title.trim(),
      contentWidth,
      titleFontSize,
      fontFamily
    )
    drawMultilineText(
      ctx,
      titleLines,
      layout.titleX * sx,
      layout.titleY * sy,
      titleFontSize,
      color,
      fontFamily,
      "center"
    )
  }

  const subtitle = config.subtitle.trim()
  if (subtitle) {
    const subtitleFontSize = layout.subtitleFontSize * sx
    const subtitleLines = wrap.wrapText(
      subtitle,
      contentWidth,
      subtitleFontSize,
      fontFamily
    )
    drawMultilineText(
      ctx,
      subtitleLines,
      layout.subtitleX * sx,
      layout.subtitleY * sy,
      subtitleFontSize,
      color,
      fontFamily,
      "center"
    )
  }

  const phone = config.phone.trim()
  if (phone) {
    const phoneFontSize = layout.phoneFontSize * sx
    const phoneX = layout.phoneX * sx
    const phoneMaxWidth = Math.max(40, canvas.width - phoneX - 40 * sx)
    const phoneLines = wrap.wrapText(phone, phoneMaxWidth, phoneFontSize, fontFamily)
    drawMultilineText(
      ctx,
      phoneLines,
      phoneX,
      layout.phoneY * sy,
      phoneFontSize,
      color,
      fontFamily,
      "left"
    )
  }

  const dividerX = layout.dividerX * sx
  const dividerY = layout.dividerY * sy
  const dividerHeight = layout.dividerHeight * sy
  ctx.strokeStyle = color
  ctx.lineWidth = Math.max(2, 2.8 * sx)
  ctx.lineCap = "round"
  ctx.beginPath()
  ctx.moveTo(dividerX, dividerY)
  ctx.lineTo(dividerX, dividerY + dividerHeight)
  ctx.stroke()

  const service = config.service.trim()
  if (service) {
    const serviceFontSize = layout.serviceFontSize * sx
    const serviceX = layout.serviceX * sx
    const serviceGap = 12 * sx
    const serviceMaxWidth = Math.max(8, dividerX - serviceX - serviceGap)
    const serviceLines = wrap.wrapText(
      service,
      serviceMaxWidth,
      serviceFontSize,
      fontFamily
    )
    ctx.save()
    ctx.beginPath()
    ctx.rect(serviceX, 0, serviceMaxWidth, canvas.height)
    ctx.clip()
    drawMultilineText(
      ctx,
      serviceLines,
      serviceX,
      layout.serviceY * sy,
      serviceFontSize,
      color,
      fontFamily,
      "left"
    )
    ctx.restore()
  }

  const price = config.price.trim()
  if (price) {
    const priceFontSize = layout.priceFontSize * sx
    ctx.font = `${priceFontSize}px ${fontFamily}`
    ctx.fillStyle = color
    ctx.textAlign = "left"
    ctx.textBaseline = "top"
    ctx.fillText(price, layout.priceX * sx, layout.priceY * sy)
  }
}
