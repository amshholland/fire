/**
 * API endpoint constants
 */
export const API_ENDPOINTS = {
  INFO: '/api/info',
  CREATE_USER_TOKEN: 'api/create_user_token',
  CREATE_LINK_TOKEN: '/api/create_link_token',
  CREATE_LINK_TOKEN_PAYMENT: '/api/create_link_token_for_payment'
} as const

export type ApiEndpointKey = keyof typeof API_ENDPOINTS
