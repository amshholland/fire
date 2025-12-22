import { useEffect } from 'react'

import { AppLayout } from './components/AppLayout.tsx'
import { LoadingView } from './components/LoadingView.tsx'
import { useAppInitialization } from './hooks/useAppInitialization.ts'
import { useUserAuth } from './hooks/useUserAuth.ts'
import { useAppAuthState } from './hooks/useAppAuthState.ts'
import LandingPage from './pages/LandingPage/LandingPage.tsx'
import SetupPage from './pages/SetupPage/SetupPage.tsx'
import Dashboard from './pages/Dashboard/Dashboard.tsx'

const App = () => {
  const { user, handleLoginSuccess, handleLogout, isInitialized } =
    useUserAuth()
  const initializeApp = useAppInitialization()
  const { state } = useAppAuthState()

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

  // State: google_authenticated - show Plaid setup
  if (state === 'google_authenticated') {
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

export default App
