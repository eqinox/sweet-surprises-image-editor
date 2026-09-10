export function parseMinutes(duration: string): number {
  const match = duration.replace(",", ".").match(/(\d+(?:\.\d+)?)/)
  return match ? Number(match[1]) : 0
}

export function parseEuros(price: string): number {
  const match = price.replace(",", ".").replace("€", "").trim().match(/-?\d+(?:\.\d+)?/)
  return match ? Number(match[0]) : 0
}

export function formatDuration(minutes: number): string {
  const value = Number.isFinite(minutes) ? minutes : 0
  const text = Number.isInteger(value) ? String(value) : String(value)
  return `${text} мин`
}

export function formatPrice(euros: number): string {
  const value = Number.isFinite(euros) ? euros : 0
  const text = Number.isInteger(value) ? String(value) : value.toFixed(2)
  return `${text}€`
}

export function newId(): string {
  return crypto.randomUUID()
}
