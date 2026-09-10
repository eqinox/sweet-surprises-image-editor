import { useEffect, useRef, type RefObject } from "react"
import { renderPriceList } from "@/lib/renderPriceList"
import type { PriceListConfig } from "@/lib/types"
import { cn } from "@/lib/utils"

type PriceListCanvasProps = {
  config: PriceListConfig | null
  background: HTMLImageElement | null
  fontFamily: string
  className?: string
  canvasRef?: RefObject<HTMLCanvasElement | null>
}

export function PriceListCanvas({
  config,
  background,
  fontFamily,
  className,
  canvasRef,
}: PriceListCanvasProps) {
  const localRef = useRef<HTMLCanvasElement>(null)
  const ref = canvasRef ?? localRef

  useEffect(() => {
    const canvas = ref.current
    if (!canvas || !config || !background) return
    renderPriceList(canvas, config, background, fontFamily)
  }, [background, config, fontFamily, ref])

  return (
    <canvas
      ref={ref}
      className={cn("max-h-full max-w-full h-auto w-auto shadow-2xl", className)}
    />
  )
}
