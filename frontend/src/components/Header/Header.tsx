import React, { useContext } from 'react'
import Context from '../../context/index.tsx'
import { useUserAuth } from '../../hooks/useUserAuth.ts'
import UserSection from './UserSection.tsx'
import LinkSection from './LinkSection.tsx'
import TokensDisplay from './TokensDisplay.tsx'

const Header = () => {
  const { user, handleLoginSuccess, handleLogout } = useUserAuth()

  const {
    itemId,
    accessToken,
    userToken,
    linkToken,
    linkSuccess,
    isItemAccess,
    backend,
    linkTokenError
  } = useContext(Context)

  return (
    <div>
      <UserSection
        user={user}
        onLoginSuccess={handleLoginSuccess}
        onLogout={handleLogout}
      />

      {!linkSuccess ? (
        <LinkSection
          backend={backend}
          linkToken={linkToken}
          linkTokenError={linkTokenError}
        />
      ) : (
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
