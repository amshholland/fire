import React, { useContext, useCallback } from 'react'
import { Alert, Spin } from 'antd'
import Context from '../../context/plaidContext.tsx'
import PlaidLink from '../../components/Header/PlaidLink.tsx'
import './SetupPage.css'

const SetupPage: React.FC = () => {
  const { backend, linkToken, linkTokenError, dispatch } = useContext(Context)

  /**
   * Retry setup by regenerating link token
   */
  const handleRetrySetup = useCallback(() => {
    dispatch({
      type: 'SET_STATE',
      state: {
        linkToken: null,
        linkTokenError: {
          error_type: '',
          error_code: '',
          error_message: ''
        }
      }
    })
    // Force reload to reinitialize
    window.location.reload()
  }, [dispatch])

  return (
    <div className="setup-page">
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
          <p style={{ fontSize: '0.9rem', color: '#666', marginTop: '1rem' }}>
            💡 Tip: If you exit the bank connection flow, you can restart it at
            any time.
          </p>
        </>
      )}
    </div>
  )
}

export default SetupPage
