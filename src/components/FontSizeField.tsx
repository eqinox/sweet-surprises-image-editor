import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type FontSizeFieldProps = {
  id: string
  label: string
  value: number
  min?: number
  onChange: (value: number) => void
}

export function FontSizeField({
  id,
  label,
  value,
  min = 10,
  onChange,
}: FontSizeFieldProps) {
  return (
    <div className="space-y-1">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        className="h-11 text-base"
        type="number"
        min={min}
        step={1}
        inputMode="numeric"
        value={Number.isFinite(value) ? value : min}
        onChange={(event) => {
          const next = Number(event.target.value)
          if (!Number.isFinite(next)) return
          onChange(next)
        }}
      />
    </div>
  )
}
