import { useEffect } from 'react'

import { AppLayout } from './components/AppLayout.tsx'
import { LoadingView } from './components/LoadingView.tsx'
import { useAppInitialization } from './hooks/useAppInitialization.ts'
import { useUserAuth } from './hooks/useUserAuth.ts'
import { useAppAuthState } from './hooks/useAppAuthState.ts'
import LandingPage from './pages/LandingPage/LandingPage.tsx'
import SetupPage from './pages/SetupPage/SetupPage.tsx'
import Dashboard from './pages/Dashboard/Dashboard.tsx'
import ErrorPage from './pages/ErrorPage/ErrorPage.tsx'

const App = () => {
  const { user, handleLoginSuccess, handleLogout, isInitialized } =
    useUserAuth()
  const initializeApp = useAppInitialization()
  const { state, linkTokenError } = useAppAuthState()

  useEffect(() => {
    if (isInitialized) {
      initializeApp()
    }
  }, [initializeApp, isInitialized])

  // State: loading - auth still initializing
  if (state === 'loading') {
    return <LoadingView />
  }

  // State: unauthenticated - show Google login
  if (state === 'unauthenticated') {
    return <LandingPage onLoginSuccess={handleLoginSuccess} />
  }

  // State: plaid_error - show error with retry option
  if (state === 'plaid_error') {
    return (
      <AppLayout
        user={user}
        onLoginSuccess={handleLoginSuccess}
        onLogout={handleLogout}
      >
        <ErrorPage
          title="Unable to Load Bank Connection"
          message={
            linkTokenError?.error_message || 'Failed to initialize Plaid Link'
          }
          actionLabel="Retry Setup"
          onAction={() => window.location.reload()}
          onLogout={handleLogout}
        />
      </AppLayout>
    )
  }

  // State: google_authenticated or plaid_pending - show Plaid setup
  if (state === 'google_authenticated' || state === 'plaid_pending') {
    return (
      <AppLayout
        user={user}
        onLoginSuccess={handleLoginSuccess}
        onLogout={handleLogout}
      >
        <SetupPage />
      </AppLayout>
    )
  }

  // State: authenticated - show dashboard
  if (state === 'authenticated') {
    return (
      <AppLayout
        user={user}
        onLoginSuccess={handleLoginSuccess}
        onLogout={handleLogout}
      >
        <Dashboard />
      </AppLayout>
    )
  }

  // Fallback for unexpected states
  return <LoadingView />
}

export default App
