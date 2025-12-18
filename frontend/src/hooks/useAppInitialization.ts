import { useContext, useCallback } from 'react'
import Context from '../context/index.tsx'
import { API_ENDPOINTS } from '../config/apiConfig.ts'
import { STORAGE_KEYS } from '../config/storageConfig.ts'
import { isOAuthRedirect } from '../utils/oauthUtils.ts'


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
      
      // Detect server restart: if frontend has accessToken but backend's state is empty, server restarted
      // if (accessToken && !data.access_token) {
      //   dispatch({ type: 'SET_STATE', state: { accessToken: null, linkSuccess: false, itemId: null } })
      // }
      
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
    console.log('Generating user token...')
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
      
      console.log('Generated user token:', data.user_token)
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
  console.log('useAppInitialization hook initialized')

  return useCallback(async () => {
    console.log('App Initialization started')
    const { paymentInitiation, isUserTokenFlow } = await fetchProductInfo()

    // Handle OAuth redirect - restore link token from storage
    if (isOAuthRedirect()) {
      dispatch({
        type: 'SET_STATE',
        state: {
          linkToken: localStorage.getItem(STORAGE_KEYS.LINK_TOKEN)
        }
      })
      return
    }
    console.log('App Initialization - isUserTokenFlow:', isUserTokenFlow)
    // Generate tokens based on product configuration
    if (isUserTokenFlow) {
      console.log('User token flow detected, generating user token...')
      await generateUserToken()
    }
    await generateLinkToken(paymentInitiation)
  }, [fetchProductInfo, generateUserToken, generateLinkToken, dispatch])
}
