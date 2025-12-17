/**
 * OAuth utility functions
 */

const OAUTH_STATE_ID = 'oauth_state_id'

export const isOAuthRedirect = (): boolean => {
  return window.location.href.includes(`?${OAUTH_STATE_ID}=`)
}
