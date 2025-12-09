import React, { useState } from "react";
import Dashboard from './pages/Dashboard/Dashboard.tsx'
import GoogleAuth from './components/GoogleAuth/GoogleAuth.tsx'
import theme from './theme.ts'
import { ConfigProvider } from 'antd'
import Header from './components/Header/Header.tsx'
import { GoogleOAuthProvider } from '@react-oauth/google'

const App: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const clientId = process.env.REACT_APP_GOOGLE_CLIENT_ID

  const handleLoginSuccess = () => {
    setIsLoggedIn(true)
  }

  if (!clientId) {
    console.error('Google Client ID is missing. Check your .env file.')
    return null
  }

  return (
    <GoogleOAuthProvider clientId={clientId}>
      <ConfigProvider theme={theme}>
        <Header />
        {isLoggedIn ? (
          <Dashboard />
        ) : (
          <GoogleAuth onLoginSuccess={handleLoginSuccess} />
        )}
      </ConfigProvider>
    </GoogleOAuthProvider>
  )
}

export default App;