import { useEffect, useRef, type RefObject } from "react"
import { renderPriceList } from "@/lib/renderPriceList"
import { renderVoucher } from "@/lib/renderVoucher"
import type { EditorMode, PriceListConfig, VoucherConfig } from "@/lib/types"
import { cn } from "@/lib/utils"

type PriceListCanvasProps = {
  mode: EditorMode
  config: PriceListConfig | VoucherConfig | null
  background: HTMLImageElement | null
  fontFamily: string
  className?: string
  canvasRef?: RefObject<HTMLCanvasElement | null>
}

export function PriceListCanvas({
  mode,
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
    if (mode === "voucher") {
      renderVoucher(canvas, config as VoucherConfig, background, fontFamily)
      return
    }
    renderPriceList(canvas, config as PriceListConfig, background, fontFamily)
  }, [background, config, fontFamily, mode, ref])

  return (
    <canvas
      ref={ref}
      className={cn("max-h-full max-w-full h-auto w-auto shadow-2xl", className)}
    />
  )
}
