import React, { useState, useEffect } from 'react'
import Dashboard from './pages/Dashboard/Dashboard.tsx'
import GoogleAuth from './components/GoogleAuth/GoogleAuth.tsx'
import theme from './theme.ts'
import { ConfigProvider } from 'antd'
import Header from './components/Header/Header.tsx'
import { GoogleOAuthProvider } from '@react-oauth/google'

const App: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [userInfo, setUserInfo] = useState<any>(null)

  const clientId = process.env.REACT_APP_GOOGLE_CLIENT_ID

  // Check localStorage for existing user session on mount
  useEffect(() => {
    const storedUserInfo = localStorage.getItem('userInfo')
    if (storedUserInfo) {
      try {
        const user = JSON.parse(storedUserInfo)
        setUserInfo(user)
        setIsLoggedIn(true)
      } catch (error) {
        console.error('Error parsing stored user info:', error)
        localStorage.removeItem('userInfo')
      }
    }
  }, [])

  const handleLoginSuccess = (user: any) => {
    setUserInfo(user)
    setIsLoggedIn(true)
  }

  const handleLogout = () => {
    localStorage.removeItem('userInfo')
    setUserInfo(null)
    setIsLoggedIn(false)
  }

  if (!clientId) {
    console.error('Google Client ID is missing. Check your .env file.')
    return null
  }

  return (
    <GoogleOAuthProvider clientId={clientId}>
      <ConfigProvider theme={theme}>
        <Header userInfo={userInfo} onLogout={handleLogout} />
        <Dashboard />
        {/* {isLoggedIn ? (
          <Dashboard />
        ) : (
          <GoogleAuth onLoginSuccess={handleLoginSuccess} />
        )} */}
      </ConfigProvider>
    </GoogleOAuthProvider>
  )
}

export default App
