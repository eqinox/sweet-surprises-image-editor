export async function savePicture(
  canvas: HTMLCanvasElement,
  filename: string
): Promise<"downloaded"> {
  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, "image/png")
  })

  if (!blob) {
    throw new Error("Не може да се направи снимката")
  }

  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  link.rel = "noopener"
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 2000)
  return "downloaded"
}

export function safeFileName(name: string): string {
  const cleaned = name
    .trim()
    .replace(/[<>:"/\\|?*]+/g, "")
    .replace(/\s+/g, "-")
  return `${cleaned || "snimka"}.png`
}
