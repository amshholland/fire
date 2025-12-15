export type MemoryState = {
  ACCESS_TOKEN: string | null;
  USER_TOKEN: string | null;
  PUBLIC_TOKEN: string | null;
  ITEM_ID: string | null;
  ACCOUNT_ID: string | null;
  PAYMENT_ID: string | null;
  AUTHORIZATION_ID: string | null;
  TRANSFER_ID: string | null;
};

export const state: MemoryState = {
  ACCESS_TOKEN: null,
  USER_TOKEN: null,
  PUBLIC_TOKEN: null,
  ITEM_ID: null,
  ACCOUNT_ID: null,
  PAYMENT_ID: null,
  AUTHORIZATION_ID: null,
  TRANSFER_ID: null
};