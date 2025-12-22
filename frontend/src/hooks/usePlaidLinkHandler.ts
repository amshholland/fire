import { useContext, useCallback, useEffect, useState } from 'react'
import { usePlaidLink } from 'react-plaid-link'
import Context from '../context/plaidContext.tsx'
import { STORAGE_KEYS } from '../config/storageConfig.ts'

/**
 * Custom hook for managing Plaid Link with persistence
 */
export const usePlaidLinkHandler = () => {
  const {
    linkToken,
    isPaymentInitiation,
    isCraProductsExclusively,
    dispatch
  } = useContext(Context)
  const [isOauth, setIsOauth] = useState(false)

  /**
   * Check if returning from OAuth redirect
   */
  useEffect(() => {
    setIsOauth(window.location.href.includes('?oauth_state_id='))
  }, [])

  /**
   * Exchange public token for access token
   */
  const exchangePublicTokenForAccessToken = useCallback(
    async (public_token: string) => {
      try {
        const response = await fetch('/api/set_access_token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8'
          },
          body: `public_token=${public_token}`
        })

        if (!response.ok) {
          dispatch({
            type: 'SET_STATE',
            state: {
              itemId: 'no item_id retrieved',
              accessToken: 'no access_token retrieved',
              isItemAccess: false
            }
          })
          return
        }

        const data = await response.json()
        dispatch({
          type: 'SET_STATE',
          state: {
            itemId: data.item_id,
            accessToken: data.access_token,
            isItemAccess: true
          }
        })

        // Persist Plaid credentials
        localStorage.setItem(STORAGE_KEYS.PLAID_ITEM_ID, data.item_id)
        localStorage.setItem(STORAGE_KEYS.PLAID_ACCESS_TOKEN, data.access_token)
        localStorage.setItem(STORAGE_KEYS.PLAID_LINK_SUCCESS, 'true')
        localStorage.setItem(STORAGE_KEYS.LINK_TOKEN, linkToken || '')
      } catch (error) {
        console.error('Failed to exchange public token:', error)
        dispatch({
          type: 'SET_STATE',
          state: {
            itemId: 'no item_id retrieved',
            accessToken: 'no access_token retrieved',
            isItemAccess: false
          }
        })
      }
    },
    [dispatch, linkToken]
  )

    /**
   * Handle successful Plaid Link
   */
  const onSuccess = useCallback(
    async (public_token: string) => {
      // Verify backend is still in sync before finalizing success state
      try {
        const infoResponse = await fetch('/api/info', { method: 'POST' })
        const infoData = await infoResponse.json()
        console.log('Backend /info data:', infoData)
        
        // If backend doesn't have access token after exchange, server likely restarted
        if (!infoData.access_token) {
          dispatch({
            type: 'SET_STATE',
            state: {
              linkSuccess: false,
              itemId: null,
              accessToken: null,
              userToken: null,
              linkToken: '',
              isItemAccess: true
            }
          })
          return
        }
      } catch (error) {
        console.error('Failed to verify backend state:', error)
      }

      // Handle different product types
      if (isPaymentInitiation) {
        dispatch({ type: 'SET_STATE', state: { isItemAccess: false } })
      } else if (isCraProductsExclusively) {
        // Only CRA products enabled, no token exchange needed
        dispatch({ type: 'SET_STATE', state: { isItemAccess: false } })
      } else {
        // Exchange token for access credentials
        exchangePublicTokenForAccessToken(public_token)
      }

      // Mark link as successful and persist
      dispatch({ type: 'SET_STATE', state: { linkSuccess: true } })
      localStorage.setItem(STORAGE_KEYS.PLAID_LINK_SUCCESS, 'true')
      window.history.pushState('', '', '/')
    },
    [dispatch, isPaymentInitiation, isCraProductsExclusively, exchangePublicTokenForAccessToken]
  )

  /**
   * Restore Plaid state from localStorage
   */
  useEffect(() => {
    const restorePlaidState = () => {
      const itemId = localStorage.getItem(STORAGE_KEYS.PLAID_ITEM_ID)
      const accessToken = localStorage.getItem(STORAGE_KEYS.PLAID_ACCESS_TOKEN)
      
      // Only restore linkSuccess if we have both itemId and accessToken
      if (itemId && accessToken) {
        dispatch({
          type: 'SET_STATE',
          state: {
            itemId,
            accessToken,
            linkSuccess: true,
            isItemAccess: !isPaymentInitiation && !isCraProductsExclusively
          }
        })
      } else {
        // Clear linkSuccess if tokens are missing
        dispatch({
          type: 'SET_STATE',
          state: {
            linkSuccess: false,
            itemId: null,
            accessToken: null,
            userToken: null,
            linkToken: '',
            isItemAccess: true
          }
        })
      }
    }

    restorePlaidState()
  }, [dispatch, isPaymentInitiation, isCraProductsExclusively])

  const config: Parameters<typeof usePlaidLink>[0] = {
    token: linkToken!,
    onSuccess
  }

  if (isOauth) {
    config.receivedRedirectUri = window.location.href
  }

  const { open, ready } = usePlaidLink(config)

  /**
   * Automatically open Plaid Link for OAuth redirect
   */
  useEffect(() => {
    if (isOauth && ready) {
      open()
    }
  }, [ready, open, isOauth])

  return { open, ready }
}
