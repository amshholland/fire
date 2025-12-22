import React, { useContext } from 'react'
import Context from '../../context/plaidContext.tsx'
import PlaidLink from '../../components/Header/PlaidLink.tsx'
import './SetupPage.css'

const SetupPage: React.FC = () => {
  const { backend, linkToken, linkTokenError } = useContext(Context)

  return (
    <div className="setup-page">
      <h2>Connect Your Bank Account</h2>
      <p>
        To get started, please link your bank account using Plaid. This will
        allow us to fetch your transaction data securely.
      </p>
      <PlaidLink
        backend={backend}
        linkToken={linkToken}
        linkTokenError={linkTokenError}
      />
    </div>
  )
}

export default SetupPage
