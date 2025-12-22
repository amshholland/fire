import React, { ReactNode } from 'react'
import { useUserAuth } from '../hooks/useUserAuth.ts'
import LandingPage from '../pages/LandingPage/LandingPage.tsx'

interface AuthGuardProps {
  children: ReactNode
  onLoginSuccess: (userData: any) => void
}

/**
 * Route guard that ensures user is authenticated with Google Auth
 * Renders LandingPage if user is not authenticated
 */
export const AuthGuard: React.FC<AuthGuardProps> = ({
  children,
  onLoginSuccess
}) => {
  const { user } = useUserAuth()

  if (!user) {
    return <LandingPage onLoginSuccess={onLoginSuccess} />
  }

  return <>{children}</>
}
