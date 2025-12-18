import React from 'react'
import PlaidLinkButton from '../PlaidLinkButton/PlaidLinkButton.tsx'

interface LinkSectionProps {
  backend: boolean
  linkToken: string | null
  linkTokenError: {
    error_message: string
    error_code: string
    error_type: string
  }
}

/**
 * Link token section - displays status and Plaid Link button or errors
 */
const PlaidLink: React.FC<LinkSectionProps> = ({
  backend,
  linkToken,
  linkTokenError
}) => {
  if (!backend) {
    return (
      <div>
        Unable to fetch link_token: please make sure your backend server is
        running and that your .env file has been configured with your
        PLAID_CLIENT_ID and PLAID_SECRET.
      </div>
    )
  }

  if (linkToken === null) {
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
      </div>
    )
  }

  if (linkToken === '') {
    return <button disabled>Loading...</button>
  }

  return <PlaidLinkButton />
}

export default PlaidLink
