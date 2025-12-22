import React, { ReactNode, useContext } from 'react'
import Context from '../context/index.tsx'
import SetupPage from '../pages/SetupPage/SetupPage.tsx'

interface PlaidGuardProps {
  children: ReactNode
}

/**
 * Route guard that ensures Plaid Link has been completed
 * Renders SetupPage if Plaid link is not complete
 */
export const PlaidGuard: React.FC<PlaidGuardProps> = ({ children }) => {
  const { linkSuccess } = useContext(Context)

  if (!linkSuccess) {
    return <SetupPage />
  }

  return <>{children}</>
}
