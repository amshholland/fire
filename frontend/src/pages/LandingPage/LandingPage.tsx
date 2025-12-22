import React from 'react'
import GoogleAuth from '../../components/GoogleAuth/GoogleAuth.tsx'
import './LandingPage.css'

interface LandingPageProps {
  onLoginSuccess: (user: any) => void
}

const LandingPage: React.FC<LandingPageProps> = ({ onLoginSuccess }) => {
  return (
    <div className="landing-page">
      <h1>Welcome to Fire</h1>
      <p>Your personal finance dashboard. Please sign in to continue.</p>
      <GoogleAuth onLoginSuccess={onLoginSuccess} />
    </div>
  )
}

export default LandingPage
