import React, { useEffect, useContext } from 'react'
import { usePlaidLink } from 'react-plaid-link'
import Context from '../../context/plaidContext.tsx'
import { plaidApi } from '../../api/plaidApi.ts'

const Link = () => {
  const { linkToken, isPaymentInitiation, isCraProductsExclusively, dispatch } =
    useContext(Context)

  // Fetch link token on component mount
  useEffect(() => {
    const getLinkToken = async () => {
      try {
        const token = await plaidApi.createLinkToken()
        dispatch({
          type: 'SET_STATE',
          state: { linkToken: token }
        })
      } catch (error) {
        console.error('Error fetching link token:', error)
        dispatch({
          type: 'SET_STATE',
          state: {
            linkTokenError: {
              error_type: 'LINK_TOKEN',
              error_code: 'FETCH_ERROR',
              error_message:
                error instanceof Error
                  ? error.message
                  : 'Failed to fetch link token'
            },
            isError: true
          }
        })
      }
    }

    getLinkToken()
  }, [dispatch])

  const onSuccess = React.useCallback(
    async (public_token: string) => {
      // If the access_token is needed, send public_token to server
      const exchangePublicTokenForAccessToken = async () => {
        try {
          const data = await plaidApi.exchangePublicToken(public_token)
          dispatch({
            type: 'SET_STATE',
            state: {
              itemId: data.item_id,
              accessToken: data.access_token,
              isItemAccess: true
            }
          })
        } catch (error) {
          console.error('Error exchanging public token:', error)
          dispatch({
            type: 'SET_STATE',
            state: {
              itemId: 'no item_id retrieved',
              accessToken: 'no access_token retrieved',
              isItemAccess: false
            }
          })
        }
      }

      // 'payment_initiation' products do not require the public_token to be exchanged for an access_token.
      if (isPaymentInitiation) {
        dispatch({ type: 'SET_STATE', state: { isItemAccess: false } })
      } else if (isCraProductsExclusively) {
        // When only CRA products are enabled, only user_token is needed. access_token/public_token exchange is not needed.
        dispatch({ type: 'SET_STATE', state: { isItemAccess: false } })
      } else {
        await exchangePublicTokenForAccessToken()
      }

      dispatch({ type: 'SET_STATE', state: { linkSuccess: true } })
      window.history.pushState('', '', '/')
    },
    [dispatch, isPaymentInitiation, isCraProductsExclusively]
  )

  let isOauth = false
  const config: Parameters<typeof usePlaidLink>[0] = {
    token: linkToken!,
    onSuccess
  }

  if (window.location.href.includes('?oauth_state_id=')) {
    // @ts-ignore
    config.receivedRedirectUri = window.location.href
    isOauth = true
  }

  const { open, ready } = usePlaidLink(config)

  useEffect(() => {
    if (isOauth && ready) {
      open()
    }
  }, [ready, open, isOauth])

  return (
    <button type="button" onClick={() => open()} disabled={!ready}>
      {ready ? 'Connect Bank Account' : 'Loading...'}
    </button>
  )
}

Link.displayName = 'Link'

export default Link
