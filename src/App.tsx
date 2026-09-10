import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { DownloadIcon, Maximize2Icon, SparklesIcon } from "lucide-react"
import { toast } from "sonner"
import { EditorPanel } from "@/components/EditorPanel"
import { FullscreenStage } from "@/components/FullscreenStage"
import { PriceListCanvas } from "@/components/PriceListCanvas"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { normalizeConfig } from "@/lib/config"
import { savePicture, safeFileName } from "@/lib/downloadImage"
import {
  createPlaceholderBackground,
  loadImageFromSrc,
} from "@/lib/renderPriceList"
import type { PriceListConfig, PriceListInfo, RawPriceList } from "@/lib/types"

const STORAGE_PREFIX = "ss-price-list:"

function storageKey(listId: string) {
  return `${STORAGE_PREFIX}${listId}`
}

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(`${url}?t=${Date.now()}`)
  if (!response.ok) {
    throw new Error(`Не може да се зареди ${url}`)
  }
  return response.json() as Promise<T>
}

function fontNameFromFile(file: File) {
  const base = file.name.replace(/\.[^.]+$/, "")
  const cleaned = base.replace(/[^\w\s-]/g, "").trim()
  return cleaned || "UploadedFont"
}

async function loadFontFace(url: string, fontFaceName: string) {
  const face = new FontFace(fontFaceName, `url(${url})`)
  await face.load()
  document.fonts.add(face)
  return fontFaceName
}

export function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const customBackgroundUrl = useRef<string | null>(null)
  const customFontUrl = useRef<string | null>(null)

  const [lists, setLists] = useState<PriceListInfo[]>([])
  const [listId, setListId] = useState("")
  const [config, setConfig] = useState<PriceListConfig | null>(null)
  const [background, setBackground] = useState<HTMLImageElement | null>(null)
  const [fontFamily, setFontFamily] = useState("Georgia, serif")
  const [backgroundLabel, setBackgroundLabel] = useState("Зареждане на снимка...")
  const [fontLabel, setFontLabel] = useState("Зареждане на шрифт...")
  const [status, setStatus] = useState("Зареждане...")
  const [presentation, setPresentation] = useState(false)
  const [saving, setSaving] = useState(false)

  const canvasSize = useMemo(() => {
    if (!background) return ""
    return `${background.naturalWidth} × ${background.naturalHeight}`
  }, [background])

  const clearCustomBackground = useCallback(() => {
    if (customBackgroundUrl.current) {
      URL.revokeObjectURL(customBackgroundUrl.current)
      customBackgroundUrl.current = null
    }
  }, [])

  const clearCustomFont = useCallback(() => {
    if (customFontUrl.current) {
      URL.revokeObjectURL(customFontUrl.current)
      customFontUrl.current = null
    }
  }, [])

  const loadDefaultFont = useCallback(async (nextConfig: PriceListConfig, nextListId: string) => {
    try {
      const globalFont = await fetchJson<{ file?: string; name?: string }>(
        "/fonts/fonts.json"
      )
      const file = globalFont.file || "MarckScript-Regular.ttf"
      const name = globalFont.name || "MarckScript"
      await loadFontFace(`/fonts/${encodeURIComponent(file)}`, name)
      setFontFamily(name)
      setFontLabel(`Шрифт: ${file}`)
      return
    } catch {
      // try list font next
    }

    if (nextConfig.font.file) {
      try {
        const name = nextConfig.font.name || "CustomPriceListFont"
        await loadFontFace(
          `/price-lists/${encodeURIComponent(nextListId)}/${encodeURIComponent(nextConfig.font.file)}`,
          name
        )
        setFontFamily(name)
        setFontLabel(`Шрифт от папката: ${nextConfig.font.file}`)
        return
      } catch {
        // fallback
      }
    }

    const fallback = nextConfig.font.family || "Georgia, serif"
    setFontFamily(fallback)
    setFontLabel(`Шрифт: ${fallback}`)
  }, [])

  const loadDefaultBackground = useCallback(async (nextListId: string, bgFile: string) => {
    try {
      const globalImage = await fetchJson<{ file?: string }>("/images/images.json")
      const file = globalImage.file || "шаблон.jpg"
      const image = await loadImageFromSrc(`/images/${encodeURIComponent(file)}`)
      setBackground(image)
      setBackgroundLabel(`Снимка: ${file}`)
      return
    } catch {
      // try list background
    }

    try {
      const image = await loadImageFromSrc(
        `/price-lists/${encodeURIComponent(nextListId)}/${encodeURIComponent(bgFile)}`
      )
      setBackground(image)
      setBackgroundLabel(`Снимка от папката: ${bgFile}`)
      return
    } catch {
      const placeholder = await createPlaceholderBackground()
      setBackground(placeholder)
      setBackgroundLabel("Липсва шаблон — избери снимка")
    }
  }, [])

  const applyConfig = useCallback(
    async (nextListId: string, nextConfig: PriceListConfig, source: "saved" | "original") => {
      clearCustomBackground()
      clearCustomFont()
      setConfig(nextConfig)
      setStatus(
        source === "saved"
          ? `${nextConfig.title || nextListId} — твоите промени`
          : `${nextConfig.title || nextListId} — готов`
      )
      await Promise.all([
        loadDefaultFont(nextConfig, nextListId),
        loadDefaultBackground(nextListId, nextConfig.background),
      ])
    },
    [clearCustomBackground, clearCustomFont, loadDefaultBackground, loadDefaultFont]
  )

  const loadPriceList = useCallback(
    async (nextListId: string, forceOriginal = false) => {
      setStatus("Зареждане...")
      setListId(nextListId)

      try {
        const raw = await fetchJson<RawPriceList>(
          `/price-lists/${encodeURIComponent(nextListId)}/config.json`
        )
        const original = normalizeConfig(raw)

        if (!forceOriginal) {
          const saved = localStorage.getItem(storageKey(nextListId))
          if (saved) {
            try {
              const parsed = normalizeConfig(JSON.parse(saved) as RawPriceList)
              await applyConfig(nextListId, parsed, "saved")
              return
            } catch {
              localStorage.removeItem(storageKey(nextListId))
            }
          }
        } else {
          localStorage.removeItem(storageKey(nextListId))
        }

        await applyConfig(nextListId, original, "original")
      } catch (error) {
        const message = error instanceof Error ? error.message : "Грешка при зареждане"
        setStatus(message)
        toast.error(message)
      }
    },
    [applyConfig]
  )

  useEffect(() => {
    let cancelled = false

    async function boot() {
      try {
        const data = await fetchJson<{ lists: PriceListInfo[] }>("/price-lists/lists.json")
        if (cancelled) return
        setLists(data.lists)
        const params = new URLSearchParams(window.location.search)
        const initial = params.get("list") || data.lists[0]?.id
        if (initial) {
          await loadPriceList(initial)
        } else {
          setStatus("Няма ценоразписи")
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : "Грешка"
        setStatus(message)
        toast.error(message)
      }
    }

    void boot()
    return () => {
      cancelled = true
    }
  }, [loadPriceList])

  useEffect(() => {
    if (!listId || !config) return
    localStorage.setItem(storageKey(listId), JSON.stringify(config))
  }, [config, listId])

  const handlePickBackground = async (file: File) => {
    try {
      clearCustomBackground()
      const url = URL.createObjectURL(file)
      customBackgroundUrl.current = url
      const image = await loadImageFromSrc(url)
      setBackground(image)
      setBackgroundLabel(`Снимка: ${file.name}`)
      setStatus("Сложена е нова снимка")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Снимката не се зареди")
    }
  }

  const handlePickFont = async (file: File) => {
    try {
      clearCustomFont()
      const url = URL.createObjectURL(file)
      customFontUrl.current = url
      const name = fontNameFromFile(file)
      await loadFontFace(url, name)
      setFontFamily(name)
      setFontLabel(`Шрифт: ${file.name}`)
      setStatus("Сложен е нов шрифт")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Шрифтът не се зареди")
    }
  }

  const handleDownload = async () => {
    const canvas = canvasRef.current
    if (!canvas || !config) return
    setSaving(true)
    try {
      const result = await savePicture(
        canvas,
        safeFileName(config.title || listId || "cenoraazpis")
      )
      if (result === "shared") {
        toast.success("Избери „Запази изображение“ / Снимки")
      } else {
        toast.success("Снимката е свалена")
      }
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") return
      toast.error(error instanceof Error ? error.message : "Не може да се свали")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <div className="mx-auto grid min-h-dvh max-w-7xl lg:h-dvh lg:grid-cols-[minmax(22rem,26rem)_1fr] lg:overflow-hidden">
        <aside className="order-2 border-t bg-sidebar lg:order-1 lg:h-dvh lg:overflow-hidden lg:border-r lg:border-t-0">
          <div className="px-4 pb-28 pt-5 lg:h-full lg:overflow-y-auto lg:pb-8">
            <div className="mb-5 flex items-start gap-3">
              <div className="flex size-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
                <SparklesIcon className="size-5" />
              </div>
              <div>
                <h1 className="font-heading text-xl font-semibold tracking-tight">
                  Ценоразпис
                </h1>
                <p className="text-sm text-muted-foreground">
                  Sweet Surprises — лесно от телефона
                </p>
              </div>
            </div>

            <div className="mb-5 space-y-2">
              <Label className="text-base">Кой ценоразпис</Label>
              <Select
                value={listId}
                onValueChange={(value) => {
                  if (value) void loadPriceList(value)
                }}
              >
                <SelectTrigger className="h-12 w-full text-base">
                  <SelectValue placeholder="Избери ценоразпис" />
                </SelectTrigger>
                <SelectContent position="popper" className="w-[var(--radix-select-trigger-width)]">
                  {lists.map((list) => (
                    <SelectItem key={list.id} value={list.id} className="py-3 text-base">
                      {list.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {config ? (
              <EditorPanel
                config={config}
                onChange={setConfig}
                backgroundLabel={backgroundLabel}
                fontLabel={fontLabel}
                onPickBackground={(file) => void handlePickBackground(file)}
                onResetBackground={() => {
                  if (listId && config) {
                    clearCustomBackground()
                    void loadDefaultBackground(listId, config.background)
                  }
                }}
                onPickFont={(file) => void handlePickFont(file)}
                onResetFont={() => {
                  if (listId && config) {
                    clearCustomFont()
                    void loadDefaultFont(config, listId)
                  }
                }}
                onReloadOriginal={() => {
                  if (listId) void loadPriceList(listId, true)
                }}
              />
            ) : (
              <p className="text-muted-foreground">{status}</p>
            )}
          </div>
        </aside>

        <main className="order-1 flex min-h-[55dvh] flex-col bg-zinc-950 lg:order-2 lg:h-dvh lg:min-h-0">
          <div className="flex items-center justify-between gap-3 px-4 py-3 text-sm text-zinc-300">
            <span className="truncate">{status}</span>
            <span className="shrink-0 text-zinc-500">{canvasSize}</span>
          </div>

          <div className="flex min-h-0 flex-1 items-center justify-center overflow-auto p-3 pb-6 lg:p-4">
            <div className="flex h-full w-full max-w-3xl items-center justify-center rounded-2xl bg-black p-2 sm:p-3">
              <PriceListCanvas
                canvasRef={canvasRef}
                config={config}
                background={background}
                fontFamily={fontFamily}
                className="mx-auto max-h-full max-w-full object-contain"
              />
            </div>
          </div>

          <div className="hidden gap-3 border-t border-white/10 p-4 lg:flex">
            <Button
              type="button"
              className="h-12 flex-1 text-base"
              onClick={() => void handleDownload()}
              disabled={!config || saving}
            >
              <DownloadIcon />
              Свали снимката
            </Button>
            <Button
              type="button"
              variant="secondary"
              className="h-12 flex-1 text-base"
              onClick={() => setPresentation(true)}
              disabled={!config}
            >
              <Maximize2Icon />
              Цял екран
            </Button>
          </div>
        </main>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur lg:hidden">
        <div className="mx-auto flex max-w-xl gap-2">
          <Button
            type="button"
            className="h-12 flex-1 text-base"
            onClick={() => void handleDownload()}
            disabled={!config || saving}
          >
            <DownloadIcon />
            Свали снимката
          </Button>
          <Button
            type="button"
            variant="secondary"
            className="h-12 flex-1 text-base"
            onClick={() => setPresentation(true)}
            disabled={!config}
          >
            <Maximize2Icon />
            Цял екран
          </Button>
        </div>
      </div>

      <FullscreenStage
        open={presentation}
        config={config}
        background={background}
        fontFamily={fontFamily}
        onClose={() => setPresentation(false)}
      />
    </div>
  )
}

export default App
