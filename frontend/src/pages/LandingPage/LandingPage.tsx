import React, { useContext } from 'react'
import { Alert, Spin } from 'antd'
import GoogleAuth from '../../components/GoogleAuth/GoogleAuth.tsx'
import PlaidLink from '../../components/Header/PlaidLink.tsx'
import Context from '../../context/plaidContext.tsx'
import './LandingPage.css'

interface LandingPageProps {
  onLoginSuccess: (user: any) => void
  user?: any
}

const LandingPage: React.FC<LandingPageProps> = ({ onLoginSuccess, user }) => {
  const { backend, linkToken, linkTokenError } = useContext(Context)

  return (
    <div className="landing-page">
      <h1>Welcome to Fire</h1>
      <p>Your personal finance dashboard. Please sign in to continue.</p>

      {/* Step 1: Google Authentication */}
      {!user && (
        <>
          <GoogleAuth onLoginSuccess={onLoginSuccess} isLoggedIn={!!user} />
        </>
      )}

      {/* Step 2: Plaid Bank Connection (shown after Google auth) */}
      {user && (
        <>
          <h2>Connect Your Bank Account</h2>
          <p>
            To get started, please link your bank account using Plaid. This will
            allow us to fetch your transaction data securely.
          </p>

          {!backend && (
            <Alert
              message="Backend Unavailable"
              description="Unable to connect to the backend server. Please check your connection and try again."
              type="error"
              showIcon
              closable
              style={{ marginBottom: '1rem' }}
            />
          )}

          {linkTokenError?.error_message && (
            <Alert
              message="Link Token Error"
              description={linkTokenError.error_message}
              type="error"
              showIcon
              closable
              style={{ marginBottom: '1rem' }}
            />
          )}

          {!linkToken && !linkTokenError?.error_message && (
            <Spin tip="Loading..." style={{ marginBottom: '1rem' }} />
          )}

          {linkToken && (
            <>
              <PlaidLink
                backend={backend}
                linkToken={linkToken}
                linkTokenError={linkTokenError}
              />
              <p
                style={{ fontSize: '0.9rem', color: '#666', marginTop: '1rem' }}
              >
                Your data is secure and encrypted. We will never store your
                login credentials.
              </p>
            </>
          )}
        </>
      )}
    </div>
  )
}

export default LandingPage
