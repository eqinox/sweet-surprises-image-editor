import { useEffect, useState } from "react"
import { XIcon } from "lucide-react"
import { PriceListCanvas } from "@/components/PriceListCanvas"
import { Button } from "@/components/ui/button"
import type { PriceListConfig } from "@/lib/types"

type FullscreenStageProps = {
  open: boolean
  config: PriceListConfig | null
  background: HTMLImageElement | null
  fontFamily: string
  onClose: () => void
}

export function FullscreenStage({
  open,
  config,
  background,
  fontFamily,
  onClose,
}: FullscreenStageProps) {
  const [showHint, setShowHint] = useState(true)

  useEffect(() => {
    if (!open) return

    setShowHint(true)
    const hide = window.setTimeout(() => setShowHint(false), 2500)

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose()
    }
    window.addEventListener("keydown", onKey)
    document.body.style.overflow = "hidden"

    return () => {
      window.clearTimeout(hide)
      window.removeEventListener("keydown", onKey)
      document.body.style.overflow = ""
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black"
      onClick={() => setShowHint((value) => !value)}
    >
      <PriceListCanvas
        config={config}
        background={background}
        fontFamily={fontFamily}
        className="max-h-dvh max-w-full object-contain"
      />

      <div
        className={`pointer-events-none absolute inset-x-0 top-0 flex justify-end p-3 pt-[max(0.75rem,env(safe-area-inset-top))] transition-opacity ${
          showHint ? "opacity-100" : "opacity-0"
        }`}
      >
        <Button
          type="button"
          variant="secondary"
          className="pointer-events-auto h-11 rounded-full px-4 text-base shadow-lg"
          onClick={(event) => {
            event.stopPropagation()
            onClose()
          }}
        >
          <XIcon />
          Готово
        </Button>
      </div>
    </div>
  )
}
