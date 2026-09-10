export async function savePicture(
  canvas: HTMLCanvasElement,
  filename: string
): Promise<"shared" | "downloaded"> {
  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, "image/png")
  })

  if (!blob) {
    throw new Error("Не може да се направи снимката")
  }

  const file = new File([blob], filename, { type: "image/png" })
  const canShareFiles =
    typeof navigator.share === "function" &&
    typeof navigator.canShare === "function" &&
    navigator.canShare({ files: [file] })

  if (canShareFiles) {
    try {
      await navigator.share({
        files: [file],
        title: "Ценоразпис",
        text: "Запази снимката в Снимки / Галерия",
      })
      return "shared"
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        throw error
      }
    }
  }

  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 1500)
  return "downloaded"
}

export function safeFileName(name: string): string {
  const cleaned = name
    .trim()
    .replace(/[<>:"/\\|?*]+/g, "")
    .replace(/\s+/g, "-")
  return `${cleaned || "cenoraazpis"}.png`
}
