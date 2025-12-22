import React, { ReactNode } from 'react'
import Header from './Header/Header.tsx'
import styles from '../App.css'

interface AppLayoutProps {
  user: any
  onLoginSuccess: (userData: any) => void
  onLogout: () => void
  children: ReactNode
}

/**
 * Main app layout wrapper - provides consistent header and container structure
 */
export const AppLayout: React.FC<AppLayoutProps> = ({
  user,
  onLoginSuccess,
  onLogout,
  children
}) => (
  <div className={styles.App}>
    <div className={styles.container}>
      <Header user={user} onLoginSuccess={onLoginSuccess} onLogout={onLogout} />
      {children}
    </div>
  </div>
)
