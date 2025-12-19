import { useContext } from 'react'
import Context from '../../context/plaidContext.tsx'
import { useUserAuth } from '../../hooks/useUserAuth.ts'
import UserSection from './UserSection.tsx'
import PlaidLink from './PlaidLink.tsx'

const Header = () => {
  const { user, handleLoginSuccess, handleLogout } = useUserAuth()

  const { linkSuccess } = useContext(Context)

  return (
    <div>
      <UserSection
        user={user}
        onLoginSuccess={handleLoginSuccess}
        onLogout={handleLogout}
      />

      {!linkSuccess && <PlaidLink />}
    </div>
  )
}

Header.displayName = 'Header'

export default Header
