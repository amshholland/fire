import UserSection from './UserSection.tsx'
import styles from './Header.css'

interface HeaderProps {
  user: any
  onLoginSuccess: (userData: any) => void
  onLogout: () => void
}

const Header = ({ user, onLoginSuccess, onLogout }: HeaderProps) => {
  return (
    <div className={styles.header}>
      <div className={styles.logo}>Fire</div>
      <UserSection
        user={user}
        onLoginSuccess={onLoginSuccess}
        onLogout={onLogout}
      />
    </div>
  )
}

Header.displayName = 'Header'

export default Header
