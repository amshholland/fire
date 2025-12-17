/**
 * localStorage key constants
 */
export const STORAGE_KEYS = {
  LINK_TOKEN: 'link_token',
  GOOGLE_USER: 'googleUser',
  PLAID_ITEM_ID: 'plaidItemId',
  PLAID_ACCESS_TOKEN: 'plaidAccessToken',
  PLAID_LINK_SUCCESS: 'plaidLinkSuccess'
} as const

export type StorageKey = keyof typeof STORAGE_KEYS


