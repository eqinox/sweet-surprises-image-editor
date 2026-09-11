import { useEffect, useRef, useState, type RefObject } from "react"
import { GripVerticalIcon } from "lucide-react"
import { renderPriceList } from "@/lib/renderPriceList"
import type { PriceListConfig } from "@/lib/types"
import { cn } from "@/lib/utils"
import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"

type DraggableElement = {
  id: string
  type: "title" | "subtitle" | "service" | "price"
  x: number
  y: number
  width: number
  height: number
  fontSize: number
  sectionId?: string
  itemId?: string
  priceId?: string
}

type InteractivePriceListCanvasProps = {
  config: PriceListConfig | null
  background: HTMLImageElement | null
  fontFamily: string
  className?: string
  canvasRef?: RefObject<HTMLCanvasElement | null>
  onConfigChange?: (config: PriceListConfig) => void
}

export function InteractivePriceListCanvas({
  config,
  background,
  fontFamily,
  className,
  canvasRef,
  onConfigChange,
}: InteractivePriceListCanvasProps) {
  const localRef = useRef<HTMLCanvasElement>(null)
  const ref = canvasRef ?? localRef
  const containerRef = useRef<HTMLDivElement>(null)
  
  const [elements, setElements] = useState<DraggableElement[]>([])
  const [selectedElement, setSelectedElement] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null)
  const [longPressTimer, setLongPressTimer] = useState<number | null>(null)
  const [fontSize, setFontSize] = useState(22)
  const [showFontSlider, setShowFontSlider] = useState(false)
  const [canvasScale, setCanvasScale] = useState(1)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas || !config || !background) return
    renderPriceList(canvas, config, background, fontFamily)
    
    // Calculate positions of text elements
    const newElements: DraggableElement[] = []
    const layout = config.layout
    
    // Add title element
    if (config.title.trim()) {
      const titleWidth = layout.leftColumnWidth + layout.middleColumnWidth + layout.rightColumnWidth
      newElements.push({
        id: "title",
        type: "title",
        x: layout.startX,
        y: layout.startY,
        width: titleWidth,
        height: layout.titleFontSize * 1.3,
        fontSize: layout.titleFontSize,
      })
    }
    
    // Add section subtitles and items
    let y = layout.startY + (config.title.trim() ? layout.titleFontSize * 1.3 + layout.titleGap : 0)
    
    config.sections.forEach((section) => {
      if (section.subtitle.trim()) {
        newElements.push({
          id: `subtitle-${section.id}`,
          type: "subtitle",
          x: layout.startX,
          y: y,
          width: layout.leftColumnWidth + layout.middleColumnWidth,
          height: layout.subtitleFontSize * 1.2,
          fontSize: layout.subtitleFontSize,
          sectionId: section.id,
        })
        y += layout.subtitleFontSize * 1.2 + layout.itemGap
      }
      
      section.items.forEach((item) => {
        const serviceHeight = Math.max(1, Math.ceil(item.service.length / 30)) * layout.lineHeight
        const priceHeight = item.prices.length * layout.lineHeight
        const blockHeight = Math.max(serviceHeight, priceHeight)
        
        // Add service element
        newElements.push({
          id: `service-${section.id}-${item.id}`,
          type: "service",
          x: layout.startX,
          y: y,
          width: layout.leftColumnWidth,
          height: serviceHeight,
          fontSize: layout.serviceFontSize,
          sectionId: section.id,
          itemId: item.id,
        })
        
        // Add price elements (each price row is separate)
        item.prices.forEach((price, priceIndex) => {
          newElements.push({
            id: `price-${section.id}-${item.id}-${price.id}`,
            type: "price",
            x: layout.startX + layout.leftColumnWidth + layout.middleColumnWidth,
            y: y + priceIndex * layout.lineHeight,
            width: layout.rightColumnWidth,
            height: layout.lineHeight,
            fontSize: layout.priceFontSize,
            sectionId: section.id,
            itemId: item.id,
            priceId: price.id,
          })
        })
        
        y += blockHeight + layout.itemGap
      })
    })
    
    setElements(newElements)
  }, [background, config, fontFamily, ref])

  // Calculate canvas scale for touch coordinate mapping
  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    
    const updateScale = () => {
      const rect = canvas.getBoundingClientRect()
      setCanvasScale(canvas.width / rect.width)
    }
    
    updateScale()
    window.addEventListener("resize", updateScale)
    return () => window.removeEventListener("resize", updateScale)
  }, [ref, background])

  const getTouchPosition = (touch: React.Touch) => {
    const canvas = ref.current
    if (!canvas) return { x: 0, y: 0 }
    
    const rect = canvas.getBoundingClientRect()
    return {
      x: (touch.clientX - rect.left) * canvasScale,
      y: (touch.clientY - rect.top) * canvasScale,
    }
  }

  const findElementAtPosition = (x: number, y: number): DraggableElement | null => {
    // Check in reverse order so top elements are selected first
    for (let i = elements.length - 1; i >= 0; i--) {
      const el = elements[i]
      if (x >= el.x && x <= el.x + el.width && y >= el.y && y <= el.y + el.height) {
        return el
      }
    }
    return null
  }

  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (e.touches.length !== 1) return
    
    const touch = e.touches[0]
    const pos = getTouchPosition(touch)
    const element = findElementAtPosition(pos.x, pos.y)
    
    if (element) {
      e.preventDefault()
      setDragStart(pos)
      
      // Start long press timer
      const timer = window.setTimeout(() => {
        setSelectedElement(element.id)
        setFontSize(element.fontSize)
        setShowFontSlider(true)
        setIsDragging(false)
        
        // Haptic feedback if available
        if (navigator.vibrate) {
          navigator.vibrate(50)
        }
      }, 500) // 500ms long press
      
      setLongPressTimer(timer)
    }
  }

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (e.touches.length !== 1) return
    
    const touch = e.touches[0]
    const pos = getTouchPosition(touch)
    
    if (longPressTimer && dragStart) {
      const dx = Math.abs(pos.x - dragStart.x)
      const dy = Math.abs(pos.y - dragStart.y)
      
      // If moved more than 10px, cancel long press and start dragging
      if (dx > 10 || dy > 10) {
        window.clearTimeout(longPressTimer)
        setLongPressTimer(null)
        
        if (selectedElement) {
          e.preventDefault()
          setIsDragging(true)
          
          // Update element position
          const element = elements.find((el) => el.id === selectedElement)
          if (element && config && onConfigChange) {
            const newX = element.x + (pos.x - dragStart.x)
            const newY = element.y + (pos.y - dragStart.y)
            
            // Update config based on element type
            updateElementPosition(element, newX, newY)
          }
          
          setDragStart(pos)
        }
      }
    } else if (isDragging && selectedElement && dragStart) {
      e.preventDefault()
      
      const element = elements.find((el) => el.id === selectedElement)
      if (element && config && onConfigChange) {
        const newX = element.x + (pos.x - dragStart.x)
        const newY = element.y + (pos.y - dragStart.y)
        updateElementPosition(element, newX, newY)
      }
      
      setDragStart(pos)
    }
  }

  const handleTouchEnd = () => {
    if (longPressTimer) {
      window.clearTimeout(longPressTimer)
      setLongPressTimer(null)
    }
    
    if (isDragging) {
      setIsDragging(false)
      setDragStart(null)
    }
  }

  const updateElementPosition = (element: DraggableElement, newX: number, newY: number) => {
    if (!config || !onConfigChange) return
    
    const newLayout = { ...config.layout }
    
    switch (element.type) {
      case "title":
        newLayout.startX = Math.max(0, Math.round(newX))
        newLayout.startY = Math.max(0, Math.round(newY))
        break
      // For now, we'll keep it simple and just move startX/startY for title
      // More complex positioning would require restructuring the layout system
    }
    
    onConfigChange({ ...config, layout: newLayout })
  }

  const handleFontSizeChange = (value: number[]) => {
    const newSize = value[0]
    setFontSize(newSize)
    
    if (selectedElement && config && onConfigChange) {
      const element = elements.find((el) => el.id === selectedElement)
      if (!element) return
      
      const newLayout = { ...config.layout }
      
      switch (element.type) {
        case "title":
          newLayout.titleFontSize = newSize
          break
        case "subtitle":
          newLayout.subtitleFontSize = newSize
          break
        case "service":
          newLayout.serviceFontSize = newSize
          break
        case "price":
          newLayout.priceFontSize = newSize
          break
      }
      
      onConfigChange({ ...config, layout: newLayout })
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <canvas
        ref={ref}
        className={cn("max-h-full max-w-full h-auto w-auto shadow-2xl touch-none", className)}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      />
      
      {/* Visual feedback overlay */}
      {selectedElement && (
        <div className="absolute inset-0 pointer-events-none">
          {elements.map((el) => {
            if (el.id !== selectedElement) return null
            
            const canvas = ref.current
            if (!canvas) return null
            
            const rect = canvas.getBoundingClientRect()
            const scale = rect.width / canvas.width
            
            return (
              <div
                key={el.id}
                className={cn(
                  "absolute border-2 border-blue-500 bg-blue-500/10 rounded transition-all",
                  isDragging && "border-green-500 bg-green-500/10"
                )}
                style={{
                  left: `${el.x * scale}px`,
                  top: `${el.y * scale}px`,
                  width: `${el.width * scale}px`,
                  height: `${el.height * scale}px`,
                }}
              >
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 flex items-center gap-1 px-2 py-1 bg-blue-600 text-white text-xs rounded whitespace-nowrap pointer-events-none">
                  <GripVerticalIcon className="size-3" />
                  {isDragging ? "Мести се..." : "Задържи за да местиш"}
                </div>
              </div>
            )
          })}
        </div>
      )}
      
      {/* Font size slider */}
      {showFontSlider && selectedElement && (
        <div className="fixed bottom-[80px] left-0 right-0 z-50 bg-background/95 backdrop-blur border-t p-4 shadow-lg animate-in slide-in-from-bottom">
          <div className="mx-auto max-w-md space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-base font-medium">Размер на шрифта</Label>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-semibold text-primary">{fontSize}px</span>
                <button
                  type="button"
                  className="px-3 py-1 text-sm bg-destructive/10 text-destructive rounded hover:bg-destructive/20"
                  onClick={() => {
                    setShowFontSlider(false)
                    setSelectedElement(null)
                    setIsDragging(false)
                  }}
                >
                  Готово
                </button>
              </div>
            </div>
            <Slider
              value={[fontSize]}
              onValueChange={handleFontSizeChange}
              min={10}
              max={80}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>10px (малък)</span>
              <span>80px (голям)</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
