import { useState, useEffect, useCallback, useContext } from 'react'
import { STORAGE_KEYS } from '../config/storageConfig.ts'
import Context from '../context/plaidContext.tsx'

/**
 * Custom hook for managing user authentication with persistence
 */
export const useUserAuth = () => {
  const [user, setUser] = useState<any>(null)
  const [isInitialized, setIsInitialized] = useState(false)
  const { dispatch } = useContext(Context)

  /**
   * Load user from localStorage on component mount
   */
  useEffect(() => {
    const storedUser = localStorage.getItem(STORAGE_KEYS.GOOGLE_USER)
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser))
      } catch (error) {
        console.error('Failed to parse stored user:', error)
        localStorage.removeItem(STORAGE_KEYS.GOOGLE_USER)
      }
    }
    setIsInitialized(true)
  }, [])

  /**
   * Handle successful login and persist user
   */
  const handleLoginSuccess = useCallback((userData: any) => {
    console.log('Login successful:', userData)
    setUser(userData)
    localStorage.setItem(STORAGE_KEYS.GOOGLE_USER, JSON.stringify(userData))
  }, [])

  /**
   * Handle logout and clear user data
   * Resets both user state and Plaid link state
   */
  const handleLogout = useCallback(() => {
    setUser(null)
    localStorage.removeItem(STORAGE_KEYS.GOOGLE_USER)
    // Reset Plaid link state when logging out
    dispatch({
      type: 'SET_STATE',
      state: { linkSuccess: false }
    })
  }, [dispatch])

  return { user, handleLoginSuccess, handleLogout, isInitialized }
}