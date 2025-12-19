import React, { useContext, useEffect } from 'react'
import PlaidLinkButton from '../PlaidLinkButton/PlaidLinkButton.tsx'
import Context from '../../context/plaidContext.tsx'

/**
 * Link token section - displays status and Plaid Link button or errors
 */
const PlaidLink: React.FC = () => {
  const { backend, linkToken, linkTokenError, accessToken } =
    useContext(Context)

  useEffect(() => {
    console.log(
      'PlaidLink useEffect:' +
        JSON.stringify({
          backend,
          linkToken,
          linkTokenError,
          accessToken
        })
    )
  }, [backend, linkToken, linkTokenError, accessToken])

  console.log('PlaidLink render:', {
    backend,
    linkToken,
    linkTokenError,
    accessToken
  })
  if (!backend) {
    return (
      <div>
        Unable to fetch link_token: please make sure your backend server is
        running and that your .env file has been configured with your
        PLAID_CLIENT_ID and PLAID_SECRET.
      </div>
    )
  }

  if (
    linkToken === null ||
    linkToken === '' ||
    linkTokenError ||
    accessToken === null ||
    accessToken === ''
  ) {
    return (
      <div>
        <div>
          Unable to fetch link_token: please make sure your backend server is
          running and that your .env file has been configured correctly.
        </div>
        <div>
          Error Code: <code>{linkTokenError.error_code}</code>
        </div>
        <div>
          Error Type: <code>{linkTokenError.error_type}</code>
        </div>
        <div>Error Message: {linkTokenError.error_message}</div>
        <PlaidLinkButton />
      </div>
    )
  }

  if (linkToken === '') {
    return <button disabled>Loading...</button>
  }

  if (accessToken === '' || linkToken === null || accessToken === null) {
    return <PlaidLinkButton />
  }
  return <PlaidLinkButton />
}

export default PlaidLink
