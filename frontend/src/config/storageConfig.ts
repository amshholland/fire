export const STORAGE_KEYS = {
  LINK_TOKEN: 'link_token'
} as const

export type StorageKey = keyof typeof STORAGE_KEYS
