export type CheckoutIdempotencyEntry = {
  key: string
  fingerprint: string
}

const STORAGE_KEY = 'mobile-shop:checkout-idempotency'
const VALID_KEY = /^[A-Za-z0-9._:-]{8,128}$/
let memoryEntry: CheckoutIdempotencyEntry | null = null

const stableSerialize = (value: unknown): string => {
  if (Array.isArray(value)) {
    return `[${value.map(stableSerialize).join(',')}]`
  }

  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>
    return `{${Object.keys(record)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableSerialize(record[key])}`)
      .join(',')}}`
  }

  return JSON.stringify(value)
}

export const fingerprintCheckoutPayload = (payload: unknown) => stableSerialize(payload)

const createIdempotencyKey = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `checkout-${crypto.randomUUID()}`
  }
  return `checkout-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`
}

const getBrowserStorage = () => {
  if (typeof window === 'undefined') return undefined
  try {
    return window.localStorage
  } catch {
    return undefined
  }
}

export const getCheckoutIdempotencyKey = (
  payload: unknown,
  storage?: Storage,
) => {
  const fingerprint = fingerprintCheckoutPayload(payload)
  const targetStorage = storage ?? getBrowserStorage()

  if (memoryEntry?.fingerprint === fingerprint && VALID_KEY.test(memoryEntry.key)) {
    return memoryEntry.key
  }

  if (targetStorage) {
    try {
      const current = JSON.parse(targetStorage.getItem(STORAGE_KEY) || 'null') as CheckoutIdempotencyEntry | null
      if (current?.fingerprint === fingerprint && VALID_KEY.test(current.key)) {
        memoryEntry = current
        return current.key
      }
    } catch {
      // Fall back to the in-memory entry when storage is unavailable or malformed.
    }
  }

  const key = createIdempotencyKey()
  memoryEntry = { key, fingerprint }
  if (targetStorage) {
    try {
      targetStorage.setItem(STORAGE_KEY, JSON.stringify(memoryEntry))
    } catch {
      // The memory entry still guarantees retry reuse for this app session.
    }
  }
  return key
}

export const clearCheckoutIdempotencyKey = (storage?: Storage) => {
  memoryEntry = null
  const targetStorage = storage ?? getBrowserStorage()
  if (!targetStorage) return

  try {
    targetStorage.removeItem(STORAGE_KEY)
  } catch {
    // Storage can be unavailable in restricted browser modes.
  }
}
