import { useContext } from 'react'
import Context from '../context/plaidContext.tsx'
import { useUserAuth } from './useUserAuth.ts'

type AppState = 'loading' | 'unauthenticated' | 'google_authenticated' | 'plaid_pending' | 'plaid_error' | 'authenticated'

interface AppAuthState {
  state: AppState
  user: any
  isInitialized: boolean
  linkSuccess: boolean
  linkTokenError?: {
    error_message: string
    error_code: string
    error_type: string
  }
}

/**
 * Determines the current application state based on auth and Plaid link status
 * 
 * States:
 * - loading: Initial state while auth is being initialized
 * - unauthenticated: No Google authentication
 * - google_authenticated: Google authenticated, Plaid not started
 * - plaid_pending: Plaid link token loaded, awaiting user action
 * - plaid_error: Plaid link token failed to load
 * - authenticated: Both Google authenticated and Plaid linked
 */
export const useAppAuthState = (): AppAuthState => {
  const { linkSuccess, linkToken, linkTokenError } = useContext(Context)
  const { user, isInitialized } = useUserAuth()

  let state: AppState = 'loading'

  if (isInitialized) {
    if (!user) {
      state = 'unauthenticated'
    } else if (linkSuccess) {
      state = 'authenticated'
    } else if (linkTokenError?.error_message) {
      state = 'plaid_error'
    } else if (linkToken) {
      state = 'plaid_pending'
    } else {
      state = 'google_authenticated'
    }
  }

  // DEBUG
  console.log('🔍 useAppAuthState:', { state, user: user?.email, isInitialized, linkSuccess, linkToken: !!linkToken, linkTokenError: !!linkTokenError })

  return {
    state,
    user,
    isInitialized,
    linkSuccess,
    linkTokenError
  }
}
