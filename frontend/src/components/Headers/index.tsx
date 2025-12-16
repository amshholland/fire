import React, { useContext } from 'react'

import Link from '../Link/index.tsx'
import Context from '../../context/index.tsx'

import styles from './index.css'

const Header = () => {
  const {
    itemId,
    accessToken,
    userToken,
    linkToken,
    linkSuccess,
    isItemAccess,
    backend,
    linkTokenError,
    isPaymentInitiation
  } = useContext(Context)

  return (
    <div className={styles.grid}>
      <h3 className={styles.title}>Plaid Quickstart</h3>

      {!linkSuccess ? (
        <>
          <h4 className={styles.subtitle}>
            A sample end-to-end integration with Plaid
          </h4>
          <p className={styles.introPar}>
            The Plaid flow begins when your user wants to connect their bank
            account to your app. Simulate this by clicking the button below to
            launch Link - the client-side component that your users will
            interact with in order to link their accounts to Plaid and allow you
            to access their accounts via the Plaid API.
          </p>
          {/* message if backend is not running and there is no link token */}
          {!backend ? (
            <div>
              Unable to fetch link_token: please make sure your backend server
              is running and that your .env file has been configured with your
              <code>PLAID_CLIENT_ID</code> and <code>PLAID_SECRET</code>.
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
        <>
          {isPaymentInitiation ? (
            <>
              <h4 className={styles.subtitle}>
                Congrats! Your payment is now confirmed.
                <p />
              </h4>
              <p className={styles.requests}>
                Now that the 'payment_id' stored in your server, you can use it
                to access the payment information:
              </p>
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
                  {userToken && 'a user_token'}, you can make all of the
                  following requests:
                </p>
              )}
            </>
          )}
        </>
      )}
    </div>
  )
}

Header.displayName = 'Header'

export default Header
