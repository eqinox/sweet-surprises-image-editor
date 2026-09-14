import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type OffsetFieldsProps = {
  idPrefix: string
  x: number
  y: number
  onChange: (patch: { x?: number; y?: number }) => void
}

export function OffsetFields({ idPrefix, x, y, onChange }: OffsetFieldsProps) {
  return (
    <div className="grid grid-cols-2 gap-2">
      <div className="space-y-1">
        <Label htmlFor={`${idPrefix}-x`}>Наляво / надясно</Label>
        <Input
          id={`${idPrefix}-x`}
          className="h-11 text-base"
          type="number"
          step={1}
          inputMode="numeric"
          value={x}
          onChange={(event) => onChange({ x: Number(event.target.value) })}
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor={`${idPrefix}-y`}>Нагоре / надолу</Label>
        <Input
          id={`${idPrefix}-y`}
          className="h-11 text-base"
          type="number"
          step={1}
          inputMode="numeric"
          value={y}
          onChange={(event) => onChange({ y: Number(event.target.value) })}
        />
      </div>
    </div>
  )
}
