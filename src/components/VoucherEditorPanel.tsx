import { useRef, useState } from "react"
import { GiftIcon, ImageIcon, TypeIcon } from "lucide-react"
import { toast } from "sonner"
import { FontSizeField } from "@/components/FontSizeField"
import { OffsetFields } from "@/components/OffsetFields"
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
import { Textarea } from "@/components/ui/textarea"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { parseEuros } from "@/lib/format"
import type { VoucherConfig, VoucherLayout } from "@/lib/types"
import {
  setVoucherAllFontSizes,
  setVoucherAllOffset,
  setVoucherLayout,
  setVoucherPhone,
  setVoucherPrice,
  setVoucherService,
  setVoucherSubtitle,
  setVoucherTextColor,
  setVoucherTitle,
} from "@/lib/voucher"

type VoucherEditorPanelProps = {
  config: VoucherConfig
  onChange: (config: VoucherConfig) => void
  backgroundLabel: string
  fontLabel: string
  onPickBackground: (file: File) => void
  onResetBackground: () => void
  onPickFont: (file: File) => void
  onResetFont: () => void
  onReloadOriginal: () => void
}

const LAYOUT_FIELDS: Array<{
  key: keyof VoucherLayout
  label: string
  min: number
  step: number
}> = [
  { key: "titleX", label: "Ваучер — наляво / надясно", min: 0, step: 1 },
  { key: "titleY", label: "Ваучер — нагоре / надолу", min: 0, step: 1 },
  { key: "subtitleX", label: "Подзаглавие — наляво / надясно", min: 0, step: 1 },
  { key: "subtitleY", label: "Подзаглавие — нагоре / надолу", min: 0, step: 1 },
  { key: "serviceX", label: "Услуга — наляво / надясно", min: 0, step: 1 },
  { key: "serviceY", label: "Услуга — нагоре / надолу", min: 0, step: 1 },
  { key: "priceX", label: "Цена — наляво / надясно", min: 0, step: 1 },
  { key: "priceY", label: "Цена — нагоре / надолу", min: 0, step: 1 },
  { key: "phoneX", label: "Контакти — наляво / надясно", min: 0, step: 1 },
  { key: "phoneY", label: "Контакти — нагоре / надолу", min: 0, step: 1 },
  { key: "dividerX", label: "Вертикална линия — наляво / надясно", min: 0, step: 1 },
  { key: "dividerY", label: "Вертикална линия — нагоре / надолу", min: 0, step: 1 },
  { key: "dividerHeight", label: "Височина на линията", min: 10, step: 1 },
  { key: "titleFontSize", label: "Големина на „Ваучер“", min: 16, step: 1 },
  { key: "subtitleFontSize", label: "Големина на подзаглавието", min: 12, step: 1 },
  { key: "serviceFontSize", label: "Големина на услугата", min: 12, step: 1 },
  { key: "priceFontSize", label: "Големина на цената", min: 12, step: 1 },
  { key: "phoneFontSize", label: "Големина на контактите", min: 10, step: 1 },
]

export function VoucherEditorPanel({
  config,
  onChange,
  backgroundLabel,
  fontLabel,
  onPickBackground,
  onResetBackground,
  onPickFont,
  onResetFont,
  onReloadOriginal,
}: VoucherEditorPanelProps) {
  const backgroundInputRef = useRef<HTMLInputElement>(null)
  const fontInputRef = useRef<HTMLInputElement>(null)
  const [titleOpen, setTitleOpen] = useState(false)
  const [titleDraft, setTitleDraft] = useState(config.title)

  const eurosValue = config.price ? String(parseEuros(config.price)) : ""

  return (
    <div className="flex flex-col gap-5 pb-6">
      <Card>
        <CardHeader>
          <CardTitle>Текст върху ваучера</CardTitle>
          <CardDescription>
            Най-горе е „Ваучер“, после подзаглавие, услуга с цена и телефон за час.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <Button
            type="button"
            className="h-12 w-full text-base"
            onClick={() => {
              setTitleDraft(config.title)
              setTitleOpen(true)
            }}
          >
            <TypeIcon />
            Промени надписа Ваучер
          </Button>

          <FontSizeField
            id="voucher-all-size"
            label="Големина на целия текст"
            value={config.layout.titleFontSize}
            onChange={(value) => onChange(setVoucherAllFontSizes(config, value))}
          />

          <div className="space-y-2 rounded-xl border bg-background/80 p-3">
            <Label>Мести всичко наведнъж</Label>
            <p className="text-sm text-muted-foreground">
              Мести всички надписи заедно. После пак можеш да мърдаш всеки поотделно.
            </p>
            <OffsetFields
              idPrefix="voucher-all"
              x={config.layout.titleX}
              y={config.layout.titleY}
              onChange={(patch) => onChange(setVoucherAllOffset(config, patch))}
            />
          </div>

          <div className="grid grid-cols-[1fr_5.5rem] items-start gap-2">
            <div className="space-y-2">
              <Label htmlFor="voucher-title">Надпис най-горе</Label>
              <Textarea
                id="voucher-title"
                className="min-h-16 text-base"
                value={config.title}
                onChange={(event) => onChange(setVoucherTitle(config, event.target.value))}
                placeholder="Ваучер"
              />
            </div>
            <FontSizeField
              id="voucher-title-size"
              label="Големина"
              value={config.layout.titleFontSize}
              onChange={(value) =>
                onChange(setVoucherLayout(config, { titleFontSize: value }))
              }
            />
          </div>
          <OffsetFields
            idPrefix="voucher-title"
            x={config.layout.titleX}
            y={config.layout.titleY}
            onChange={(patch) =>
              onChange(
                setVoucherLayout(config, {
                  ...(patch.x !== undefined ? { titleX: patch.x } : {}),
                  ...(patch.y !== undefined ? { titleY: patch.y } : {}),
                })
              )
            }
          />

          <div className="grid grid-cols-[1fr_5.5rem] items-start gap-2">
            <div className="space-y-2">
              <Label htmlFor="voucher-subtitle">Подзаглавие</Label>
              <Textarea
                id="voucher-subtitle"
                className="min-h-16 text-base"
                value={config.subtitle}
                onChange={(event) =>
                  onChange(setVoucherSubtitle(config, event.target.value))
                }
                placeholder="Например: Подарък за нея"
              />
            </div>
            <FontSizeField
              id="voucher-subtitle-size"
              label="Големина"
              value={config.layout.subtitleFontSize}
              onChange={(value) =>
                onChange(setVoucherLayout(config, { subtitleFontSize: value }))
              }
            />
          </div>
          <OffsetFields
            idPrefix="voucher-subtitle"
            x={config.layout.subtitleX}
            y={config.layout.subtitleY}
            onChange={(patch) =>
              onChange(
                setVoucherLayout(config, {
                  ...(patch.x !== undefined ? { subtitleX: patch.x } : {}),
                  ...(patch.y !== undefined ? { subtitleY: patch.y } : {}),
                })
              )
            }
          />

          <div className="grid grid-cols-[1fr_5.5rem] items-start gap-2">
            <div className="space-y-2">
              <Label htmlFor="voucher-service">Услуга</Label>
              <Textarea
                id="voucher-service"
                className="min-h-16 text-base"
                value={config.service}
                onChange={(event) =>
                  onChange(setVoucherService(config, event.target.value))
                }
                placeholder="Например: Релаксиращ масаж"
              />
            </div>
            <FontSizeField
              id="voucher-service-size"
              label="Големина"
              value={config.layout.serviceFontSize}
              onChange={(value) =>
                onChange(
                  setVoucherLayout(config, {
                    serviceFontSize: value,
                    priceFontSize: value,
                  })
                )
              }
            />
          </div>
          <OffsetFields
            idPrefix="voucher-service"
            x={config.layout.serviceX}
            y={config.layout.serviceY}
            onChange={(patch) =>
              onChange(
                setVoucherLayout(config, {
                  ...(patch.x !== undefined ? { serviceX: patch.x } : {}),
                  ...(patch.y !== undefined ? { serviceY: patch.y } : {}),
                })
              )
            }
          />

          <div className="space-y-2">
            <Label htmlFor="voucher-price">Цена в евро</Label>
            <Input
              id="voucher-price"
              className="h-12 text-base"
              inputMode="decimal"
              value={eurosValue}
              onChange={(event) => {
                const next = event.target.value.trim()
                if (next === "") {
                  onChange(setVoucherPrice(config, ""))
                  return
                }
                onChange(setVoucherPrice(config, Number(next)))
              }}
              placeholder="50"
            />
          </div>
          <OffsetFields
            idPrefix="voucher-price"
            x={config.layout.priceX}
            y={config.layout.priceY}
            onChange={(patch) =>
              onChange(
                setVoucherLayout(config, {
                  ...(patch.x !== undefined ? { priceX: patch.x } : {}),
                  ...(patch.y !== undefined ? { priceY: patch.y } : {}),
                })
              )
            }
          />

          <div className="space-y-2">
            <Label>Вертикална линия</Label>
            <p className="text-sm text-muted-foreground">
              Мести линията между услугата и цената. Текстът вляво се събира до
              линията — колкото по-надясно е, толкова повече събира.
            </p>
          </div>
          <OffsetFields
            idPrefix="voucher-divider"
            x={config.layout.dividerX}
            y={config.layout.dividerY}
            onChange={(patch) =>
              onChange(
                setVoucherLayout(config, {
                  ...(patch.x !== undefined ? { dividerX: patch.x } : {}),
                  ...(patch.y !== undefined ? { dividerY: patch.y } : {}),
                })
              )
            }
          />
          <div className="space-y-1">
            <Label htmlFor="voucher-divider-height">Височина на линията</Label>
            <Input
              id="voucher-divider-height"
              className="h-11 text-base"
              type="number"
              min={10}
              step={1}
              value={config.layout.dividerHeight}
              onChange={(event) =>
                onChange(
                  setVoucherLayout(config, {
                    dividerHeight: Number(event.target.value),
                  })
                )
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="voucher-phone">Контакти за запазване на час</Label>
            <Textarea
              id="voucher-phone"
              className="min-h-16 text-base"
              value={config.phone}
              onChange={(event) => onChange(setVoucherPhone(config, event.target.value))}
              placeholder="За запазване на час: 08XX XXX XXX"
            />
          </div>
          <OffsetFields
            idPrefix="voucher-phone"
            x={config.layout.phoneX}
            y={config.layout.phoneY}
            onChange={(patch) =>
              onChange(
                setVoucherLayout(config, {
                  ...(patch.x !== undefined ? { phoneX: patch.x } : {}),
                  ...(patch.y !== undefined ? { phoneY: patch.y } : {}),
                })
              )
            }
          />
        </CardContent>
      </Card>

      <Accordion type="multiple" defaultValue={["media", "layout"]}>
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
              <Label htmlFor="voucher-text-color">Цвят на текста</Label>
              <Input
                id="voucher-text-color"
                type="color"
                className="h-12 cursor-pointer p-1"
                value={config.layout.titleColor}
                onChange={(event) =>
                  onChange(setVoucherTextColor(config, event.target.value))
                }
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
                      setVoucherLayout(config, {
                        [field.key]: Number(event.target.value),
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
              <GiftIcon />
              Върни оригиналния ваучер
            </Button>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <Dialog open={titleOpen} onOpenChange={setTitleOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Надпис най-горе</DialogTitle>
            <DialogDescription>
              Това е най-големият текст и стои в средата, обикновено „Ваучер“.
            </DialogDescription>
          </DialogHeader>
            <div className="space-y-2">
              <Label htmlFor="dialog-voucher-title">Надпис</Label>
              <Textarea
                id="dialog-voucher-title"
                className="min-h-16 text-base"
                value={titleDraft}
                onChange={(event) => setTitleDraft(event.target.value)}
                placeholder="Ваучер"
                autoFocus
              />
            </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              className="h-11 text-base"
              onClick={() => setTitleOpen(false)}
            >
              Отказ
            </Button>
            <Button
              type="button"
              className="h-11 text-base"
              onClick={() => {
                const next = titleDraft.trim()
                if (!next) {
                  toast.error("Напиши надпис")
                  return
                }
                onChange(setVoucherTitle(config, next))
                setTitleOpen(false)
                toast.success("Надписът е сложен")
              }}
            >
              Готово
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
