import React from 'react'
import { Button } from 'antd'
import { LogoutOutlined } from '@ant-design/icons'

interface UserSectionProps {
  user: any
  onLogout: () => void
}

/**
 * User profile section - displays authenticated user info and logout button
 */
const UserSection: React.FC<UserSectionProps> = ({ user, onLogout }) => {
  return (
    <div className="header-user">
      <span>Welcome, {user.name || user.email}</span>
      <Button type="text" icon={<LogoutOutlined />} onClick={onLogout}>
        Logout
      </Button>
    </div>
  )
}

export default UserSection