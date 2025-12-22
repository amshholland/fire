import { useContext } from 'react'
import Context from '../../context/index.tsx'
import UserSection from './UserSection.tsx'
import TokensDisplay from './TokensDisplay.tsx'
import styles from './Header.module.css'

interface HeaderProps {
  user: any
  onLoginSuccess: (userData: any) => void
  onLogout: () => void
}

const Header = ({ user, onLoginSuccess, onLogout }: HeaderProps) => {
  const { itemId, accessToken, userToken, linkSuccess, isItemAccess } =
    useContext(Context)

  return (
    <div className={styles.header}>
      <div className={styles.headerTop}>
        <div className={styles.logo}>Fire</div>
        <UserSection
          user={user}
          onLoginSuccess={onLoginSuccess}
          onLogout={onLogout}
        />
      </div>

      {linkSuccess && (
        <TokensDisplay
          itemId={itemId}
          accessToken={accessToken}
          userToken={userToken}
          isItemAccess={isItemAccess}
        />
      )}
    </div>
  )
}

Header.displayName = 'Header'

export default Header
