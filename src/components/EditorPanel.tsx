import { useRef, useState } from "react"
import {
  ClockIcon,
  ImageIcon,
  PlusIcon,
  Trash2Icon,
  TypeIcon,
} from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import {
  addPriceRow,
  addSection,
  addService,
  removePriceRow,
  removeSection,
  removeService,
  setLayout,
  setPriceRow,
  setServiceName,
  setSubtitle,
  setTextColor,
  setTitle,
} from "@/lib/config"
import { parseEuros, parseMinutes } from "@/lib/format"
import type { Layout, PriceListConfig } from "@/lib/types"

type EditorPanelProps = {
  config: PriceListConfig
  onChange: (config: PriceListConfig) => void
  backgroundLabel: string
  fontLabel: string
  onPickBackground: (file: File) => void
  onResetBackground: () => void
  onPickFont: (file: File) => void
  onResetFont: () => void
  onReloadOriginal: () => void
  onCreateNew: () => void
}

type DialogMode =
  | { type: "title" }
  | { type: "section" }
  | { type: "service"; sectionId: string }
  | { type: "price"; sectionId: string; itemId: string }
  | null

const LAYOUT_FIELDS: Array<{
  key: keyof Layout
  label: string
  min: number
  step: number
}> = [
  { key: "startX", label: "Отместване отляво", min: 0, step: 1 },
  { key: "startY", label: "Отместване отгоре", min: 0, step: 1 },
  { key: "leftColumnWidth", label: "Ширина на услугите", min: 80, step: 10 },
  { key: "middleColumnWidth", label: "Ширина в средата", min: 0, step: 10 },
  { key: "rightColumnWidth", label: "Ширина на цените", min: 80, step: 10 },
  { key: "titleFontSize", label: "Големина на заглавието", min: 12, step: 1 },
  { key: "subtitleFontSize", label: "Големина на подзаглавието", min: 10, step: 1 },
  { key: "serviceFontSize", label: "Големина на услугите", min: 10, step: 1 },
  { key: "lineHeight", label: "Разстояние между редовете", min: 12, step: 1 },
]

export function EditorPanel({
  config,
  onChange,
  backgroundLabel,
  fontLabel,
  onPickBackground,
  onResetBackground,
  onPickFont,
  onResetFont,
  onReloadOriginal,
  onCreateNew,
}: EditorPanelProps) {
  const backgroundInputRef = useRef<HTMLInputElement>(null)
  const fontInputRef = useRef<HTMLInputElement>(null)
  const configRef = useRef(config)
  configRef.current = config
  const [dialog, setDialog] = useState<DialogMode>(null)
  const [titleDraft, setTitleDraft] = useState("")
  const [sectionDraft, setSectionDraft] = useState("")
  const [serviceDraft, setServiceDraft] = useState("")
  const [minutesDraft, setMinutesDraft] = useState("30")
  const [eurosDraft, setEurosDraft] = useState("20")

  const openTitleDialog = () => {
    setTitleDraft(config.title)
    setDialog({ type: "title" })
  }

  const openSectionDialog = () => {
    setSectionDraft("")
    setDialog({ type: "section" })
  }

  const openServiceDialog = (sectionId: string) => {
    setServiceDraft("")
    setMinutesDraft("30")
    setEurosDraft("20")
    setDialog({ type: "service", sectionId })
  }

  const openPriceDialog = (sectionId: string, itemId: string) => {
    setMinutesDraft("30")
    setEurosDraft("20")
    setDialog({ type: "price", sectionId, itemId })
  }

  const saveDialog = () => {
    if (!dialog) return
    const current = configRef.current

    if (dialog.type === "title") {
      const next = titleDraft.trim()
      if (!next) {
        toast.error("Напиши заглавие")
        return
      }
      onChange(setTitle(current, next))
      toast.success("Заглавието е сложено")
    }

    if (dialog.type === "section") {
      const next = sectionDraft.trim()
      if (!next) {
        toast.error("Напиши подзаглавие")
        return
      }
      onChange(addSection(current, next))
      toast.success("Подзаглавието е добавено")
    }

    if (dialog.type === "service") {
      const name = serviceDraft.trim()
      const minutes = Number(minutesDraft)
      const euros = Number(eurosDraft)
      if (!name) {
        toast.error("Напиши име на услугата")
        return
      }
      if (!Number.isFinite(minutes) || !Number.isFinite(euros)) {
        toast.error("Провери минутите и еврото")
        return
      }
      onChange(addService(current, dialog.sectionId, name, minutes, euros))
      toast.success("Услугата е добавена")
    }

    if (dialog.type === "price") {
      const minutes = Number(minutesDraft)
      const euros = Number(eurosDraft)
      if (!Number.isFinite(minutes) || !Number.isFinite(euros)) {
        toast.error("Провери минутите и еврото")
        return
      }
      onChange(addPriceRow(current, dialog.sectionId, dialog.itemId, minutes, euros))
      toast.success("Цената е добавена")
    }

    setDialog(null)
  }

  return (
    <div className="flex flex-col gap-5 pb-6">
      <Card>
        <CardHeader>
          <CardTitle>Текст върху снимката</CardTitle>
          <CardDescription>
            Натисни бутон, напиши и готово. После можеш да поправиш всяко поле.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <Button
            type="button"
            className="h-14 w-full text-lg font-semibold"
            onClick={onCreateNew}
            variant="default"
          >
            <PlusIcon className="size-6" />
            Създай ново
          </Button>
          <Button
            type="button"
            className="h-12 w-full text-base"
            onClick={openTitleDialog}
          >
            <TypeIcon />
            Добави заглавие
          </Button>
          <Button
            type="button"
            variant="secondary"
            className="h-12 w-full text-base"
            onClick={openSectionDialog}
          >
            <PlusIcon />
            Добави подзаглавие
          </Button>
          <Button
            type="button"
            variant="outline"
            className="h-12 w-full text-base"
            onClick={() => {
              const lastSection = config.sections[config.sections.length - 1]
              if (lastSection) {
                openServiceDialog(lastSection.id)
                return
              }
              const withSection = addSection(config, "")
              const created = withSection.sections[withSection.sections.length - 1]
              onChange(withSection)
              if (created) openServiceDialog(created.id)
            }}
          >
            <PlusIcon />
            Добави услуга
          </Button>

          <div className="space-y-2">
            <Label htmlFor="title-field">Заглавие</Label>
            <Input
              id="title-field"
              className="h-12 text-base"
              value={config.title}
              onChange={(event) => onChange(setTitle(config, event.target.value))}
              placeholder="Например: Фризьорство"
            />
          </div>
        </CardContent>
      </Card>

      {config.sections.map((section, index) => (
        <Card key={section.id}>
          <CardHeader className="gap-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <CardTitle className="text-lg">
                  {section.subtitle.trim() || `Група ${index + 1}`}
                </CardTitle>
                <CardDescription>Подзаглавие и услуги към него</CardDescription>
              </div>
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="size-10"
                onClick={() => {
                  onChange(removeSection(config, section.id))
                  toast.success("Групата е изтрита")
                }}
                aria-label="Изтрий подзаглавието"
              >
                <Trash2Icon />
              </Button>
            </div>
            <div className="space-y-2">
              <Label>Подзаглавие</Label>
              <Input
                className="h-12 text-base"
                value={section.subtitle}
                onChange={(event) =>
                  onChange(setSubtitle(config, section.id, event.target.value))
                }
                placeholder="Например: Боядисване"
              />
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {section.items.map((item) => (
              <div
                key={item.id}
                className="rounded-xl border bg-background/80 p-3 shadow-sm"
              >
                <div className="mb-2 flex items-center justify-between gap-2">
                  <Label className="text-base">Услуга</Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-10 text-destructive"
                    onClick={() => onChange(removeService(config, section.id, item.id))}
                    aria-label="Изтрий услугата"
                  >
                    <Trash2Icon />
                  </Button>
                </div>
                <Textarea
                  className="mb-3 min-h-16 text-base"
                  value={item.service}
                  onChange={(event) =>
                    onChange(
                      setServiceName(config, section.id, item.id, event.target.value)
                    )
                  }
                  placeholder="Име на услугата"
                />

                <div className="space-y-2">
                  {item.prices.map((price) => (
                    <div key={price.id} className="grid grid-cols-[1fr_1fr_auto] gap-2">
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Минути</Label>
                        <Input
                          className="h-11 text-base"
                          inputMode="decimal"
                          value={parseMinutes(price.duration)}
                          onChange={(event) =>
                            onChange(
                              setPriceRow(
                                config,
                                section.id,
                                item.id,
                                price.id,
                                Number(event.target.value),
                                parseEuros(price.price)
                              )
                            )
                          }
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Евро</Label>
                        <Input
                          className="h-11 text-base"
                          inputMode="decimal"
                          value={parseEuros(price.price)}
                          onChange={(event) =>
                            onChange(
                              setPriceRow(
                                config,
                                section.id,
                                item.id,
                                price.id,
                                parseMinutes(price.duration),
                                Number(event.target.value)
                              )
                            )
                          }
                        />
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="mt-6 size-11 text-destructive"
                        onClick={() =>
                          onChange(
                            removePriceRow(config, section.id, item.id, price.id)
                          )
                        }
                        aria-label="Изтрий цената"
                      >
                        <Trash2Icon />
                      </Button>
                    </div>
                  ))}
                </div>

                <Button
                  type="button"
                  variant="outline"
                  className="mt-3 h-11 w-full text-base"
                  onClick={() => openPriceDialog(section.id, item.id)}
                >
                  <ClockIcon />
                  Добави време и цена
                </Button>
              </div>
            ))}

            <Button
              type="button"
              className="h-12 w-full text-base"
              onClick={() => openServiceDialog(section.id)}
            >
              <PlusIcon />
              Добави услуга
            </Button>
          </CardContent>
        </Card>
      ))}

      <Button
        type="button"
        variant="secondary"
        className="h-12 w-full text-base"
        onClick={openSectionDialog}
      >
        <PlusIcon />
        Добави още едно подзаглавие
      </Button>

      <Separator />

      <Accordion type="multiple" defaultValue={["media"]}>
        <AccordionItem value="media">
          <AccordionTrigger className="py-4 text-base">
            Фонова снимка и шрифт
          </AccordionTrigger>
          <AccordionContent className="space-y-4 pb-4">
            <input
              ref={backgroundInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0]
                if (file) onPickBackground(file)
                event.target.value = ""
              }}
            />
            <input
              ref={fontInputRef}
              type="file"
              accept=".ttf,.otf,.woff,.woff2"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0]
                if (file) onPickFont(file)
                event.target.value = ""
              }}
            />

            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">{backgroundLabel}</p>
              <Button
                type="button"
                variant="secondary"
                className="h-12 w-full text-base"
                onClick={() => backgroundInputRef.current?.click()}
              >
                <ImageIcon />
                Избери друга снимка
              </Button>
              <Button
                type="button"
                variant="outline"
                className="h-11 w-full text-base"
                onClick={onResetBackground}
              >
                Върни снимката по подразбиране
              </Button>
            </div>

            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">{fontLabel}</p>
              <Button
                type="button"
                variant="secondary"
                className="h-12 w-full text-base"
                onClick={() => fontInputRef.current?.click()}
              >
                Избери друг шрифт
              </Button>
              <Button
                type="button"
                variant="outline"
                className="h-11 w-full text-base"
                onClick={onResetFont}
              >
                Върни шрифта по подразбиране
              </Button>
            </div>

            <div className="space-y-2">
              <Label htmlFor="text-color">Цвят на текста</Label>
              <Input
                id="text-color"
                type="color"
                className="h-12 cursor-pointer p-1"
                value={config.layout.serviceColor}
                onChange={(event) => onChange(setTextColor(config, event.target.value))}
              />
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="layout">
          <AccordionTrigger className="py-4 text-base">
            Настройки на разположението
          </AccordionTrigger>
          <AccordionContent className="space-y-3 pb-4">
            <p className="text-sm text-muted-foreground">
              Това мести текста върху снимката. Ако нещо излиза навън, промени числата.
            </p>
            {LAYOUT_FIELDS.map((field) => (
              <div key={field.key} className="space-y-1">
                <Label>{field.label}</Label>
                <Input
                  className="h-11 text-base"
                  type="number"
                  min={field.min}
                  step={field.step}
                  value={config.layout[field.key]}
                  onChange={(event) =>
                    onChange(
                      setLayout(config, {
                        [field.key]: Number(event.target.value),
                        ...(field.key === "serviceFontSize"
                          ? { priceFontSize: Number(event.target.value) }
                          : {}),
                      })
                    )
                  }
                />
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              className="h-11 w-full text-base"
              onClick={onReloadOriginal}
            >
              Върни оригиналния ценоразпис
            </Button>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <Dialog open={dialog !== null} onOpenChange={(open) => !open && setDialog(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {dialog?.type === "title" && "Заглавие"}
              {dialog?.type === "section" && "Ново подзаглавие"}
              {dialog?.type === "service" && "Нова услуга"}
              {dialog?.type === "price" && "Време и цена"}
            </DialogTitle>
            <DialogDescription>
              {dialog?.type === "title" && "Това се вижда най-отгоре на снимката."}
              {dialog?.type === "section" && "Група услуги, например „Сешоар“."}
              {dialog?.type === "service" && "Напиши услугата, минутите и еврото."}
              {dialog?.type === "price" && "Колко минути трае и колко евро струва."}
            </DialogDescription>
          </DialogHeader>

          {dialog?.type === "title" && (
            <div className="space-y-2">
              <Label htmlFor="dialog-title">Заглавие</Label>
              <Input
                id="dialog-title"
                className="h-12 text-base"
                value={titleDraft}
                onChange={(event) => setTitleDraft(event.target.value)}
                placeholder="Фризьорство"
                autoFocus
              />
            </div>
          )}

          {dialog?.type === "section" && (
            <div className="space-y-2">
              <Label htmlFor="dialog-section">Подзаглавие</Label>
              <Input
                id="dialog-section"
                className="h-12 text-base"
                value={sectionDraft}
                onChange={(event) => setSectionDraft(event.target.value)}
                placeholder="Боядисване"
                autoFocus
              />
            </div>
          )}

          {dialog?.type === "service" && (
            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="dialog-service">Име на услугата</Label>
                <Textarea
                  id="dialog-service"
                  className="text-base"
                  value={serviceDraft}
                  onChange={(event) => setServiceDraft(event.target.value)}
                  placeholder="Подстригване"
                  autoFocus
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="dialog-minutes">Минути</Label>
                  <Input
                    id="dialog-minutes"
                    className="h-12 text-base"
                    inputMode="decimal"
                    value={minutesDraft}
                    onChange={(event) => setMinutesDraft(event.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dialog-euros">Евро</Label>
                  <Input
                    id="dialog-euros"
                    className="h-12 text-base"
                    inputMode="decimal"
                    value={eurosDraft}
                    onChange={(event) => setEurosDraft(event.target.value)}
                  />
                </div>
              </div>
            </div>
          )}

          {dialog?.type === "price" && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="price-minutes">Минути</Label>
                <Input
                  id="price-minutes"
                  className="h-12 text-base"
                  inputMode="decimal"
                  value={minutesDraft}
                  onChange={(event) => setMinutesDraft(event.target.value)}
                  autoFocus
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="price-euros">Евро</Label>
                <Input
                  id="price-euros"
                  className="h-12 text-base"
                  inputMode="decimal"
                  value={eurosDraft}
                  onChange={(event) => setEurosDraft(event.target.value)}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              className="h-11 text-base"
              onClick={() => setDialog(null)}
            >
              Отказ
            </Button>
            <Button type="button" className="h-11 text-base" onClick={saveDialog}>
              Готово
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
