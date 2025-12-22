import { useContext } from 'react'
import Context from '../context/index.tsx'
import { useUserAuth } from './useUserAuth.ts'

type AppState = 'loading' | 'unauthenticated' | 'google_authenticated' | 'authenticated'

interface AppAuthState {
  state: AppState
  user: any
  isInitialized: boolean
  linkSuccess: boolean
}

/**
 * Determines the current application state based on auth and Plaid link status
 * 
 * States:
 * - loading: Initial state while auth is being initialized
 * - unauthenticated: No Google authentication
 * - google_authenticated: Google authenticated but Plaid not linked
 * - authenticated: Both Google authenticated and Plaid linked
 */
export const useAppAuthState = (): AppAuthState => {
  const { linkSuccess } = useContext(Context)
  const { user, isInitialized } = useUserAuth()

  let state: AppState = 'loading'

  if (isInitialized) {
    if (!user) {
      state = 'unauthenticated'
    } else if (!linkSuccess) {
      state = 'google_authenticated'
    } else {
      state = 'authenticated'
    }
  }

  return {
    state,
    user,
    isInitialized,
    linkSuccess
  }
}
