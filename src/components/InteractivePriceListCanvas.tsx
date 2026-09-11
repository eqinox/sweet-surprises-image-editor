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
  const [zoom, setZoom] = useState(1)
  const [isPinching, setIsPinching] = useState(false)
  const [lastPinchDistance, setLastPinchDistance] = useState(0)
  const [isPanning, setIsPanning] = useState(false)
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 })
  const [lastTap, setLastTap] = useState(0)
  const [panStart, setPanStart] = useState<{ x: number; y: number } | null>(null)

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
      const titleOffsetX = layout.titleOffsetX || 0
      const titleOffsetY = layout.titleOffsetY || 0
      newElements.push({
        id: "title",
        type: "title",
        x: layout.startX + titleOffsetX,
        y: layout.startY + titleOffsetY,
        width: titleWidth,
        height: layout.titleFontSize * 1.3,
        fontSize: layout.titleFontSize,
      })
    }
    
    // Add section subtitles and items
    let y = layout.startY + (config.title.trim() ? layout.titleFontSize * 1.3 + layout.titleGap : 0)
    
    config.sections.forEach((section) => {
      if (section.subtitle.trim()) {
        const subtitleOffsetX = section.offsetX || 0
        const subtitleOffsetY = section.offsetY || 0
        newElements.push({
          id: `subtitle-${section.id}`,
          type: "subtitle",
          x: layout.startX + subtitleOffsetX,
          y: y + subtitleOffsetY,
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
        
        const serviceOffsetX = item.offsetX || 0
        const serviceOffsetY = item.offsetY || 0
        
        // Add service element
        newElements.push({
          id: `service-${section.id}-${item.id}`,
          type: "service",
          x: layout.startX + serviceOffsetX,
          y: y + serviceOffsetY,
          width: layout.leftColumnWidth,
          height: serviceHeight,
          fontSize: layout.serviceFontSize,
          sectionId: section.id,
          itemId: item.id,
        })
        
        // Add price elements (each price row is separate)
        item.prices.forEach((price, priceIndex) => {
          const priceOffsetX = price.offsetX || 0
          const priceOffsetY = price.offsetY || 0
          newElements.push({
            id: `price-${section.id}-${item.id}-${price.id}`,
            type: "price",
            x: layout.startX + layout.leftColumnWidth + layout.middleColumnWidth + priceOffsetX,
            y: y + priceIndex * layout.lineHeight + priceOffsetY,
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

  const getPinchDistance = (touch1: React.Touch, touch2: React.Touch) => {
    const dx = touch1.clientX - touch2.clientX
    const dy = touch1.clientY - touch2.clientY
    return Math.sqrt(dx * dx + dy * dy)
  }

  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    // Handle pinch-to-zoom
    if (e.touches.length === 2) {
      e.preventDefault()
      setIsPinching(true)
      const distance = getPinchDistance(e.touches[0], e.touches[1])
      setLastPinchDistance(distance)
      
      // Cancel any ongoing drag or long press
      if (longPressTimer) {
        window.clearTimeout(longPressTimer)
        setLongPressTimer(null)
      }
      setIsPanning(false)
      return
    }
    
    if (e.touches.length !== 1) return
    
    const touch = e.touches[0]
    const pos = getTouchPosition(touch)
    
    // Check for double tap
    const now = Date.now()
    const timeSinceLastTap = now - lastTap
    
    if (timeSinceLastTap < 300 && timeSinceLastTap > 0) {
      // Double tap detected
      e.preventDefault()
      const element = findElementAtPosition((pos.x - panOffset.x) / zoom, (pos.y - panOffset.y) / zoom)
      
      if (element) {
        setSelectedElement(element.id)
        setFontSize(element.fontSize)
        setShowFontSlider(false)
        setIsDragging(false)
        
        // Haptic feedback
        if (navigator.vibrate) {
          navigator.vibrate([30, 50, 30])
        }
      }
      setLastTap(0)
      return
    }
    
    setLastTap(now)
    
    // If element is already selected, prepare for dragging
    if (selectedElement) {
      const element = findElementAtPosition((pos.x - panOffset.x) / zoom, (pos.y - panOffset.y) / zoom)
      if (element && element.id === selectedElement) {
        e.preventDefault()
        setDragStart({ x: (pos.x - panOffset.x) / zoom, y: (pos.y - panOffset.y) / zoom })
        return
      }
    }
    
    // Otherwise, prepare for panning
    setPanStart({ x: pos.x, y: pos.y })
    
    // Start long press timer for font size slider
    const element = findElementAtPosition((pos.x - panOffset.x) / zoom, (pos.y - panOffset.y) / zoom)
    if (element) {
      const timer = window.setTimeout(() => {
        setFontSize(element.fontSize)
        setShowFontSlider(true)
        
        // Haptic feedback
        if (navigator.vibrate) {
          navigator.vibrate(50)
        }
      }, 800) // 800ms long press for font slider
      
      setLongPressTimer(timer)
    }
  }

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    // Handle pinch-to-zoom
    if (e.touches.length === 2 && isPinching) {
      e.preventDefault()
      const distance = getPinchDistance(e.touches[0], e.touches[1])
      const delta = distance - lastPinchDistance
      const zoomDelta = delta * 0.01
      
      setZoom((prev) => Math.max(0.5, Math.min(3, prev + zoomDelta)))
      setLastPinchDistance(distance)
      return
    }
    
    if (e.touches.length !== 1) return
    
    const touch = e.touches[0]
    const pos = getTouchPosition(touch)
    
    // Cancel long press if moved
    if (longPressTimer && panStart) {
      const dx = Math.abs(pos.x - panStart.x)
      const dy = Math.abs(pos.y - panStart.y)
      
      if (dx > 10 || dy > 10) {
        window.clearTimeout(longPressTimer)
        setLongPressTimer(null)
      }
    }
    
    // Handle element dragging if element is selected
    if (isDragging && selectedElement && dragStart) {
      e.preventDefault()
      
      const adjustedPos = { x: (pos.x - panOffset.x) / zoom, y: (pos.y - panOffset.y) / zoom }
      const element = elements.find((el) => el.id === selectedElement)
      if (element && config && onConfigChange) {
        const newX = element.x + (adjustedPos.x - dragStart.x)
        const newY = element.y + (adjustedPos.y - dragStart.y)
        updateElementPosition(element, newX, newY)
      }
      
      setDragStart(adjustedPos)
      return
    }
    
    // Handle element dragging when starting from selected state
    if (selectedElement && dragStart && !isDragging) {
      const adjustedPos = { x: (pos.x - panOffset.x) / zoom, y: (pos.y - panOffset.y) / zoom }
      const dx = Math.abs(adjustedPos.x - dragStart.x) * zoom
      const dy = Math.abs(adjustedPos.y - dragStart.y) * zoom
      
      if (dx > 10 || dy > 10) {
        e.preventDefault()
        setIsDragging(true)
        return
      }
    }
    
    // Handle panning
    if (panStart && !selectedElement && !isDragging) {
      e.preventDefault()
      setIsPanning(true)
      
      const dx = pos.x - panStart.x
      const dy = pos.y - panStart.y
      
      setPanOffset((prev) => ({
        x: prev.x + dx,
        y: prev.y + dy,
      }))
      
      setPanStart({ x: pos.x, y: pos.y })
    }
  }

  const handleTouchEnd = () => {
    if (isPinching) {
      setIsPinching(false)
      setLastPinchDistance(0)
    }
    
    if (isPanning) {
      setIsPanning(false)
    }
    
    if (longPressTimer) {
      window.clearTimeout(longPressTimer)
      setLongPressTimer(null)
    }
    
    if (isDragging) {
      setIsDragging(false)
      setDragStart(null)
    }
    
    setPanStart(null)
  }

  const updateElementPosition = (element: DraggableElement, newX: number, newY: number) => {
    if (!config || !onConfigChange) return
    
    const deltaX = Math.round(newX - element.x)
    const deltaY = Math.round(newY - element.y)
    
    // Update the elements array for smooth visual feedback
    setElements((prev) =>
      prev.map((el) => {
        if (el.id === element.id) {
          return { ...el, x: newX, y: newY }
        }
        return el
      })
    )
    
    switch (element.type) {
      case "title": {
        const newLayout = { ...config.layout }
        newLayout.titleOffsetX = (config.layout.titleOffsetX || 0) + deltaX
        newLayout.titleOffsetY = (config.layout.titleOffsetY || 0) + deltaY
        onConfigChange({ ...config, layout: newLayout })
        break
      }
      case "subtitle": {
        if (!element.sectionId) return
        const newSections = config.sections.map((section) => {
          if (section.id === element.sectionId) {
            return {
              ...section,
              offsetX: (section.offsetX || 0) + deltaX,
              offsetY: (section.offsetY || 0) + deltaY,
            }
          }
          return section
        })
        onConfigChange({ ...config, sections: newSections })
        break
      }
      case "service": {
        if (!element.sectionId || !element.itemId) return
        const newSections = config.sections.map((section) => {
          if (section.id === element.sectionId) {
            return {
              ...section,
              items: section.items.map((item) => {
                if (item.id === element.itemId) {
                  return {
                    ...item,
                    offsetX: (item.offsetX || 0) + deltaX,
                    offsetY: (item.offsetY || 0) + deltaY,
                  }
                }
                return item
              }),
            }
          }
          return section
        })
        onConfigChange({ ...config, sections: newSections })
        break
      }
      case "price": {
        if (!element.sectionId || !element.itemId || !element.priceId) return
        const newSections = config.sections.map((section) => {
          if (section.id === element.sectionId) {
            return {
              ...section,
              items: section.items.map((item) => {
                if (item.id === element.itemId) {
                  return {
                    ...item,
                    prices: item.prices.map((price) => {
                      if (price.id === element.priceId) {
                        return {
                          ...price,
                          offsetX: (price.offsetX || 0) + deltaX,
                          offsetY: (price.offsetY || 0) + deltaY,
                        }
                      }
                      return price
                    }),
                  }
                }
                return item
              }),
            }
          }
          return section
        })
        onConfigChange({ ...config, sections: newSections })
        break
      }
    }
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

  const handleOverlayTouchStart = (e: React.TouchEvent, elementId: string) => {
    if (e.touches.length !== 1) return
    
    e.stopPropagation()
    const touch = e.touches[0]
    const pos = getTouchPosition(touch)
    const element = elements.find((el) => el.id === elementId)
    
    if (element) {
      setDragStart({ x: (pos.x - panOffset.x) / zoom, y: (pos.y - panOffset.y) / zoom })
      setIsDragging(true)
      
      // Haptic feedback
      if (navigator.vibrate) {
        navigator.vibrate(30)
      }
    }
  }

  const handleOverlayTouchMove = (e: React.TouchEvent, elementId: string) => {
    if (e.touches.length !== 1 || !isDragging) return
    
    e.stopPropagation()
    e.preventDefault()
    
    const touch = e.touches[0]
    const pos = getTouchPosition(touch)
    const adjustedPos = { x: (pos.x - panOffset.x) / zoom, y: (pos.y - panOffset.y) / zoom }
    
    const element = elements.find((el) => el.id === elementId)
    if (element && config && onConfigChange && dragStart) {
      const newX = element.x + (adjustedPos.x - dragStart.x)
      const newY = element.y + (adjustedPos.y - dragStart.y)
      updateElementPosition(element, newX, newY)
      setDragStart(adjustedPos)
    }
  }

  const handleOverlayTouchEnd = () => {
    setIsDragging(false)
    setDragStart(null)
  }

  return (
    <div ref={containerRef} className="relative overflow-hidden">
      {/* Zoom controls */}
      <div className="absolute top-4 right-4 z-40 flex flex-col gap-2">
        <button
          type="button"
          className="size-12 flex items-center justify-center rounded-full bg-background/90 backdrop-blur border-2 shadow-lg text-xl font-bold hover:bg-background transition-colors active:scale-95"
          onClick={() => setZoom((prev) => Math.min(3, prev + 0.2))}
        >
          +
        </button>
        <div className="px-3 py-1.5 rounded-full bg-background/90 backdrop-blur border text-xs font-semibold text-center">
          {Math.round(zoom * 100)}%
        </div>
        <button
          type="button"
          className="size-12 flex items-center justify-center rounded-full bg-background/90 backdrop-blur border-2 shadow-lg text-xl font-bold hover:bg-background transition-colors active:scale-95"
          onClick={() => setZoom((prev) => Math.max(0.5, prev - 0.2))}
        >
          −
        </button>
        <button
          type="button"
          className="px-3 py-1.5 rounded-full bg-background/90 backdrop-blur border-2 shadow-lg text-xs font-semibold hover:bg-background transition-colors active:scale-95"
          onClick={() => {
            setZoom(1)
            setPanOffset({ x: 0, y: 0 })
          }}
        >
          Reset
        </button>
      </div>

      {/* Panning indicator */}
      {isPanning && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-40 px-4 py-2 rounded-full bg-blue-600 text-white text-sm font-medium shadow-lg animate-pulse">
          🤚 Мърдаш картината
        </div>
      )}

      {/* Instructions overlay when zoomed */}
      {zoom !== 1 && !selectedElement && !isPanning && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-40 px-4 py-2 rounded-full bg-background/90 backdrop-blur border text-xs font-medium shadow-lg">
          Плъзни с 1 пръст за мърдане • Тапни 2х за избор
        </div>
      )}

      <div 
        style={{ 
          transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoom})`, 
          transformOrigin: 'center center',
          transition: isPanning ? 'none' : 'transform 0.1s ease-out'
        }}
      >
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
              
              const elementType = el.type === "title" ? "Заглавие" :
                                 el.type === "subtitle" ? "Подзаглавие" :
                                 el.type === "service" ? "Услуга" : "Цена"
              
              return (
                <div
                  key={el.id}
                  className={cn(
                    "absolute border-2 rounded transition-all animate-pulse pointer-events-none",
                    isDragging ? "border-green-500 bg-green-500/20 shadow-lg" : "border-blue-500 bg-blue-500/10"
                  )}
                  style={{
                    left: `${el.x * scale}px`,
                    top: `${el.y * scale}px`,
                    width: `${el.width * scale}px`,
                    height: `${el.height * scale}px`,
                  }}
                >
                  <div 
                    className={cn(
                      "absolute -top-9 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-3 py-1.5 text-white text-xs font-medium rounded-full whitespace-nowrap shadow-lg cursor-grab active:cursor-grabbing pointer-events-auto",
                      isDragging ? "bg-green-600" : "bg-blue-600"
                    )}
                    onTouchStart={(e) => handleOverlayTouchStart(e, el.id)}
                    onTouchMove={(e) => handleOverlayTouchMove(e, el.id)}
                    onTouchEnd={handleOverlayTouchEnd}
                  >
                    <GripVerticalIcon className="size-3.5 animate-pulse" />
                    {isDragging ? `Местиш ${elementType}` : `${elementType} - Плъзни`}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
      
      {/* Font size slider */}
      {showFontSlider && selectedElement && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-gradient-to-t from-background via-background to-background/95 backdrop-blur-lg border-t-2 border-primary/20 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-2xl animate-in slide-in-from-bottom">
          <div className="mx-auto max-w-md space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="size-10 flex items-center justify-center rounded-full bg-primary/10">
                  <span className="text-xl">Aa</span>
                </div>
                <div>
                  <Label className="text-base font-semibold">Размер на шрифта</Label>
                  <p className="text-xs text-muted-foreground">Плъзни за промяна</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="px-4 py-2 bg-primary/10 rounded-lg">
                  <span className="text-2xl font-bold text-primary">{fontSize}</span>
                  <span className="text-sm text-muted-foreground ml-0.5">px</span>
                </div>
                <button
                  type="button"
                  className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors shadow-sm"
                  onClick={() => {
                    setShowFontSlider(false)
                    setSelectedElement(null)
                    setIsDragging(false)
                  }}
                >
                  ✓ Готово
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <Slider
                value={[fontSize]}
                onValueChange={handleFontSizeChange}
                min={10}
                max={80}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground px-1">
                <span>10 (малък)</span>
                <span className="text-primary font-medium">{fontSize}</span>
                <span>80 (голям)</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
