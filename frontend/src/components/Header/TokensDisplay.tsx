import React from 'react'

interface TokensDisplayProps {
  itemId: string | null
  accessToken: string | null
  userToken: string | null
  isItemAccess: boolean
}

/**
 * Display tokens after successful account linking
 */
const TokensDisplay: React.FC<TokensDisplayProps> = ({
  itemId,
  accessToken,
  userToken,
  isItemAccess
}) => {
  return (
    <>
      {isItemAccess ? (
        <h4>Congrats! By linking an account, you have created an</h4>
      ) : userToken ? (
        <h4>Congrats! You have successfully linked data to a User.</h4>
      ) : (
        <h4>
          <div>Unable to create an item. Please check your backend server</div>
        </h4>
      )}
      <div>
        {itemId && (
          <p>
            <span>item_id</span>
            <span>{itemId}</span>
          </p>
        )}

        {accessToken && (
          <p>
            <span>access_token</span>
            <span>{accessToken}</span>
          </p>
        )}

        {userToken && (
          <p>
            <span>user_token</span>
            <span>{userToken}</span>
          </p>
        )}
      </div>
      {(isItemAccess || userToken) && (
        <p>
          Now that you have {accessToken && 'an access_token'}
          {accessToken && userToken && ' and '}
          {userToken && 'a user_token'}, you can make all of the following
          requests:
        </p>
      )}
    </>
  )
}

export default TokensDisplay
