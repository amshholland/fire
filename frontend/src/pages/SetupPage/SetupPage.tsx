import { Alert, Spin } from 'antd'
import Context from '../../context/plaidContext.tsx'
import PlaidLink from '../../components/Header/PlaidLink.tsx'
import './SetupPage.css'
import { useContext } from 'react'

const SetupPage: React.FC = () => {
  const { backend, linkToken, linkTokenError } = useContext(Context)

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
        <>
          <Spin tip="Loading..." style={{ marginBottom: '1rem' }} />
          <PlaidLink
            backend={backend}
            linkToken={linkToken || ''}
            linkTokenError={linkTokenError}
          />
        </>
      )}

      {linkToken && (
        <>
          <PlaidLink
            backend={backend}
            linkToken={linkToken}
            linkTokenError={linkTokenError}
          />
          <p>
            💡 Tip: If you exit the bank connection flow, you can restart it at
            any time.
          </p>
        </>
      )}
    </div>
  )
}

export default SetupPage
