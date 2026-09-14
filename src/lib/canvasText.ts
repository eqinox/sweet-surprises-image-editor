export type WrapContext = {
  wrapText: (text: string, maxWidth: number, fontSize: number, fontFamily: string) => string[]
}

function splitLongWord(
  ctx: CanvasRenderingContext2D,
  word: string,
  maxWidth: number
) {
  if (ctx.measureText(word).width <= maxWidth) return [word]

  const parts: string[] = []
  let current = ""
  for (const char of word) {
    const test = current + char
    if (current && ctx.measureText(test).width > maxWidth) {
      parts.push(current)
      current = char
    } else {
      current = test
    }
  }
  if (current) parts.push(current)
  return parts.length ? parts : [word]
}

export function createWrap(ctx: CanvasRenderingContext2D): WrapContext {
  return {
    wrapText(text, maxWidth, fontSize, fontFamily) {
      ctx.font = `${fontSize}px ${fontFamily}`
      const limit = Math.max(8, maxWidth)
      const paragraphs = String(text).replace(/\r\n/g, "\n").split("\n")
      const lines: string[] = []

      for (const paragraph of paragraphs) {
        const words = paragraph.split(/\s+/).filter((word) => word.length > 0)
        if (words.length === 0) {
          lines.push("")
          continue
        }

        let current = ""
        for (const word of words) {
          const pieces = splitLongWord(ctx, word, limit)
          for (const piece of pieces) {
            const test = current ? `${current} ${piece}` : piece
            if (ctx.measureText(test).width <= limit) {
              current = test
            } else {
              if (current) lines.push(current)
              current = piece
            }
          }
        }

        if (current) lines.push(current)
      }

      return lines.length ? lines : [""]
    },
  }
}

export function drawMultilineText(
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
