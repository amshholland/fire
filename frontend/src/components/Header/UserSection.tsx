import React from 'react'
import { Button } from 'antd'
import { LogoutOutlined } from '@ant-design/icons'
import GoogleAuth from '../GoogleAuth/GoogleAuth.tsx'

interface UserSectionProps {
  user: any
  onLoginSuccess: (userData: any) => void
  onLogout: () => void
}

/**
 * User authentication section - displays login or user profile
 */
const UserSection: React.FC<UserSectionProps> = ({
  user,
  onLoginSuccess,
  onLogout
}) => {
  return (
    <>
      <GoogleAuth onLoginSuccess={onLoginSuccess} isLoggedIn={!!user} />
      {user && (
        <div className="header-user">
          <span>Welcome, {user.name || user.email}</span>
          <Button type="text" icon={<LogoutOutlined />} onClick={onLogout}>
            Logout
          </Button>
        </div>
      )}
    </>
  )
}

export default UserSection
