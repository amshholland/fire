import { useState, useEffect, useCallback } from 'react'
import { STORAGE_KEYS } from '../config/storageConfig.ts'

/**
 * Custom hook for managing user authentication with persistence
 */
export const useUserAuth = () => {
  const [user, setUser] = useState<any>(null)

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
   */
  const handleLogout = useCallback(() => {
    setUser(null)
    localStorage.removeItem(STORAGE_KEYS.GOOGLE_USER)
  }, [])

  return { user, handleLoginSuccess, handleLogout }
}
