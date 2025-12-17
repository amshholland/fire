import React, { useContext, useState } from 'react'

import Link from '../Link/Link.tsx'
import Context from '../../context/index.tsx'

import styles from './index.css'
import GoogleAuth from '../GoogleAuth/GoogleAuth.tsx'

const Header = () => {
  const [user, setUser] = useState<any>(null)
  const {
    itemId,
    accessToken,
    userToken,
    linkToken,
    linkSuccess,
    isItemAccess,
    backend,
    linkTokenError
  } = useContext(Context)

  const handleLoginSuccess = (userData: any) => {
    console.log('Login successful:', userData)
    setUser(userData)
  }

  return (
    <div className={styles.grid}>
      {!user && <GoogleAuth onLoginSuccess={handleLoginSuccess} />}
      {!linkSuccess ? (
        <>
          {/* message if backend is not running and there is no link token */}
          {!backend ? (
            <div>
              Unable to fetch link_token: please make sure your backend server
              is running and that your .env file has been configured with your
              PLAID_CLIENT_ID and PLAID_SECRET.
            </div>
          ) : /* message if backend is running and there is no link token */
          linkToken == null && backend ? (
            <div>
              <div>
                Unable to fetch link_token: please make sure your backend server
                is running and that your .env file has been configured
                correctly.
              </div>
              <div>
                Error Code: <code>{linkTokenError.error_code}</code>
              </div>
              <div>
                Error Type: <code>{linkTokenError.error_type}</code>{' '}
              </div>
              <div>Error Message: {linkTokenError.error_message}</div>
            </div>
          ) : linkToken === '' ? (
            <div className={styles.linkButton}>
              <button disabled>Loading...</button>
            </div>
          ) : (
            <div className={styles.linkButton}>
              <Link />
            </div>
          )}
        </>
      ) : (
        /* If not using the payment_initiation product, show the item_id and access_token information */ <>
          {isItemAccess ? (
            <h4 className={styles.subtitle}>
              Congrats! By linking an account, you have created an
            </h4>
          ) : userToken ? (
            <h4 className={styles.subtitle}>
              Congrats! You have successfully linked data to a User.
            </h4>
          ) : (
            <h4 className={styles.subtitle}>
              <div>
                Unable to create an item. Please check your backend server
              </div>
            </h4>
          )}
          <div className={styles.itemAccessContainer}>
            {itemId && (
              <p className={styles.itemAccessRow}>
                <span className={styles.idName}>item_id</span>
                <span className={styles.tokenText}>{itemId}</span>
              </p>
            )}

            {accessToken && (
              <p className={styles.itemAccessRow}>
                <span className={styles.idName}>access_token</span>
                <span className={styles.tokenText}>{accessToken}</span>
              </p>
            )}

            {userToken && (
              <p className={styles.itemAccessRow}>
                <span className={styles.idName}>user_token</span>
                <span className={styles.tokenText}>{userToken}</span>
              </p>
            )}
          </div>
          {(isItemAccess || userToken) && (
            <p className={styles.requests}>
              Now that you have {accessToken && 'an access_token'}
              {accessToken && userToken && ' and '}
              {userToken && 'a user_token'}, you can make all of the following
              requests:
            </p>
          )}
        </>
      )}
    </div>
  )
}

Header.displayName = 'Header'

export default Header
