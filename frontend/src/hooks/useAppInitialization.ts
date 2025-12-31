import { useContext, useCallback } from 'react'
import { Dispatch } from 'react'
import Context from '../context/plaidContext.tsx'
import { API_ENDPOINTS } from '../config/apiConfig.ts'
import { STORAGE_KEYS } from '../config/storageConfig.ts'
import { isOAuthRedirect } from '../utils/oauthUtils.ts'

interface QuickstartAction {
  type: 'SET_STATE'
  state: Record<string, any>
}

/**
 * Fetch product information from backend and update state
 */
export const useFetchProductInfo = () => {
  const { dispatch } = useContext(Context)

  return useCallback(async () => {
    try {
      const response = await fetch(API_ENDPOINTS.INFO, { method: 'POST' })

      if (!response.ok) {
        dispatch({ type: 'SET_STATE', state: { backend: false } })
        return { paymentInitiation: false, isUserTokenFlow: false }
      }

      const data = await response.json()
      const paymentInitiation = data.products.includes('payment_initiation')
      const craProducts = data.products.filter((product: string) =>
        product.startsWith('cra_')
      )
      const isUserTokenFlow = craProducts.length > 0
      const isCraProductsExclusively =
        craProducts.length > 0 && craProducts.length === data.products.length

      dispatch({
        type: 'SET_STATE',
        state: {
          products: data.products,
          isPaymentInitiation: paymentInitiation,
          isCraProductsExclusively: isCraProductsExclusively,
          isUserTokenFlow: isUserTokenFlow
        }
      })

      return { paymentInitiation, isUserTokenFlow }
    } catch (error) {
      console.error('Failed to fetch product info:', error)
      dispatch({ type: 'SET_STATE', state: { backend: false } })
      return { paymentInitiation: false, isUserTokenFlow: false }
    }
  }, [dispatch])
}

/**
 * Generate and store user token
 */
export const useGenerateUserToken = () => {
  const { dispatch } = useContext(Context)

  return useCallback(async () => {
    try {
      const response = await fetch(API_ENDPOINTS.CREATE_USER_TOKEN, {
        method: 'POST'
      })

      if (!response.ok) {
        dispatch({ type: 'SET_STATE', state: { userToken: null } })
        return null
      }

      const data = await response.json()

      if (data.error) {
        dispatch({
          type: 'SET_STATE',
          state: {
            linkToken: null,
            linkTokenError: data.error
          }
        })
        return null
      }

      dispatch({ type: 'SET_STATE', state: { userToken: data.user_token } })
      return data.user_token
    } catch (error) {
      console.error('Failed to generate user token:', error)
      dispatch({ type: 'SET_STATE', state: { userToken: null } })
      return null
    }
  }, [dispatch])
}

/**
 * Generate link token for Plaid Link flow
 */
export const useGenerateLinkToken = () => {
  const { dispatch } = useContext(Context)

  return useCallback(
    async (isPaymentInitiation: boolean) => {
      try {
        const endpoint = isPaymentInitiation
          ? API_ENDPOINTS.CREATE_LINK_TOKEN_PAYMENT
          : API_ENDPOINTS.CREATE_LINK_TOKEN

        const response = await fetch(endpoint, { method: 'POST' })

        if (!response.ok) {
          dispatch({ type: 'SET_STATE', state: { linkToken: null } })
          return
        }

        const data = await response.json()

        if (data.error) {
          dispatch({
            type: 'SET_STATE',
            state: {
              linkToken: null,
              linkTokenError: data.error
            }
          })
          return
        }

        dispatch({ type: 'SET_STATE', state: { linkToken: data.link_token } })
        localStorage.setItem(STORAGE_KEYS.LINK_TOKEN, data.link_token)
      } catch (error) {
        console.error('Failed to generate link token:', error)
        dispatch({ type: 'SET_STATE', state: { linkToken: null } })
      }
    },
    [dispatch]
  )
}

/**
 * Initialize app tokens and handle OAuth redirects
 */
export const useAppInitialization = () => {
  const { dispatch } = useContext(Context)
  const fetchProductInfo = useFetchProductInfo()
  const generateUserToken = useGenerateUserToken()
  const generateLinkToken = useGenerateLinkToken()

  return useCallback(async () => {
    const { paymentInitiation, isUserTokenFlow } = await fetchProductInfo()

    // Handle OAuth redirect - restore link token from storage
    if (isOAuthRedirect()) {
      dispatch({
        type: 'SET_STATE',
        state: {
          linkToken: localStorage.getItem(STORAGE_KEYS.LINK_TOKEN)
        }
      })
      // Also try to restore Plaid access token if user is logged in
      const userInfo = localStorage.getItem(STORAGE_KEYS.GOOGLE_USER)
      if (userInfo) {
        try {
          const user = JSON.parse(userInfo)
          const response = await fetch(`/api/restore_access_token/${user.sub}`)
          const data = await response.json()
          if (data.restored) {
            console.log('✅ Plaid access token restored from database')
            localStorage.setItem(STORAGE_KEYS.PLAID_ACCESS_TOKEN, data.access_token)
            dispatch({ type: 'SET_STATE', state: { isItemAccess: true } })
          }
        } catch (error) {
          console.error('Failed to restore Plaid access token:', error)
        }
      }
      return
    }

    // Restore Plaid access token for logged-in users
    const userInfo = localStorage.getItem(STORAGE_KEYS.GOOGLE_USER)
    if (userInfo) {
      try {
        const user = JSON.parse(userInfo)
        const response = await fetch(`/api/restore_access_token/${user.sub}`)
        const data = await response.json()
        if (data.restored) {
          console.log('✅ Plaid access token restored from database')
          localStorage.setItem(STORAGE_KEYS.PLAID_ACCESS_TOKEN, data.access_token)
          dispatch({ type: 'SET_STATE', state: { isItemAccess: true } })
        }
      } catch (error) {
        console.error('Failed to restore Plaid access token:', error)
      }
    }

    // Generate tokens based on product configuration
    if (isUserTokenFlow) {
      await generateUserToken()
    }
    await generateLinkToken(paymentInitiation)
  }, [fetchProductInfo, generateUserToken, generateLinkToken, dispatch])
}
