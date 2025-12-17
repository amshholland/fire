import { useContext, useState, useEffect } from 'react'
import { Button } from 'antd'
import { LogoutOutlined } from '@ant-design/icons'
import PlaidLinkButton from '../PlaidLinkButton/PlaidLinkButton.tsx'
import Context from '../../context/index.tsx'
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

  // Load user from localStorage on component mount
  useEffect(() => {
    const storedUser = localStorage.getItem('googleUser')
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser))
      } catch (error) {
        console.error('Failed to parse stored user:', error)
        localStorage.removeItem('googleUser')
      }
    }
  }, [])

  const handleLoginSuccess = (userData: any) => {
    console.log('Login successful:', userData)
    setUser(userData)
    // Persist user to localStorage
    localStorage.setItem('googleUser', JSON.stringify(userData))
  }

  const handleLogout = () => {
    setUser(null)
    // Remove user from localStorage
    localStorage.removeItem('googleUser')
  }

  return (
    <div>
      {!user && <GoogleAuth onLoginSuccess={handleLoginSuccess} />}
      {user && (
        <div className="header-user">
          <span>Welcome, {user.name || user.email}</span>
          {handleLogout && (
            <Button
              type="text"
              icon={<LogoutOutlined />}
              onClick={handleLogout}
            >
              Logout
            </Button>
          )}
        </div>
      )}
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
            <div>
              <button disabled>Loading...</button>
            </div>
          ) : (
            <div>
              <PlaidLinkButton />
            </div>
          )}
        </>
      ) : (
        /* If not using the payment_initiation product, show the item_id and access_token information */ <>
          {isItemAccess ? (
            <h4>Congrats! By linking an account, you have created an</h4>
          ) : userToken ? (
            <h4>Congrats! You have successfully linked data to a User.</h4>
          ) : (
            <h4>
              <div>
                Unable to create an item. Please check your backend server
              </div>
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
      )}
    </div>
  )
}

Header.displayName = 'Header'

export default Header
