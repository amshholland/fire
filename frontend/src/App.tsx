import { useEffect, useContext } from 'react'

import Header from './components/Header/Header.tsx'
import Context from './context/index.tsx'
import { useAppInitialization } from './hooks/useAppInitialization.ts'
import { useUserAuth } from './hooks/useUserAuth.ts'
import LandingPage from './pages/LandingPage/LandingPage.tsx'
import SetupPage from './pages/SetupPage/SetupPage.tsx'
import Dashboard from './pages/Dashboard/Dashboard.tsx'

import styles from './App.css'

const App = () => {
  const { linkSuccess } = useContext(Context)
  const { user, handleLoginSuccess, handleLogout } = useUserAuth()
  const initializeApp = useAppInitialization()

  useEffect(() => {
    initializeApp()
  }, [initializeApp])

  if (!user) {
    return <LandingPage onLoginSuccess={handleLoginSuccess} />
  }

  return (
    <div className={styles.App}>
      <div className={styles.container}>
        <Header
          user={user}
          onLoginSuccess={handleLoginSuccess}
          onLogout={handleLogout}
        />
        {!linkSuccess ? <SetupPage /> : <Dashboard />}
      </div>
    </div>
  )
}

export default App
