import { useEffect, useContext } from 'react'

import Header from './components/Header/Header.tsx'
import { LoadingView } from './components/LoadingView.tsx'
import Context from './context/plaidContext.tsx'
import { useAppInitialization } from './hooks/useAppInitialization.ts'
import { useUserAuth } from './hooks/useUserAuth.ts'
import AuthGuard from './guards/AuthGuard.tsx'
import PlaidGuard from './guards/PlaidGuard.tsx'
import Dashboard from './pages/Dashboard/Dashboard.tsx'

import styles from './App.css'

const App = () => {
  const { user, handleLoginSuccess, handleLogout, isInitialized } =
    useUserAuth()
  const initializeApp = useAppInitialization()

  useEffect(() => {
    if (isInitialized) {
      initializeApp()
    }
  }, [initializeApp, isInitialized])

  // Wait for auth to load before rendering
  if (!isInitialized) {
    return <LoadingView />
  }

  return (
    <AuthGuard onLoginSuccess={handleLoginSuccess}>
      <div className={styles.App}>
        <div className={styles.container}>
          <Header
            user={user}
            onLoginSuccess={handleLoginSuccess}
            onLogout={handleLogout}
          />
          <PlaidGuard>
            <Dashboard />
          </PlaidGuard>
        </div>
      </div>
    </AuthGuard>
  )
}

export default App
