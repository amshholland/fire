import React from 'react';
import { Button } from 'antd'
import { LogoutOutlined } from '@ant-design/icons'
import './Header.css'

interface HeaderProps {
  userInfo?: any
  onLogout?: () => void
}

const Header: React.FC<HeaderProps> = ({ userInfo, onLogout }) => {
  return (
    <div className="Header">
      <div className="header-title">FIRE App</div>
      {userInfo && (
        <div className="header-user">
          <span>Welcome, {userInfo.name || userInfo.email}</span>
          {onLogout && (
            <Button type="text" icon={<LogoutOutlined />} onClick={onLogout}>
              Logout
            </Button>
          )}
        </div>
      )}
    </div>
  )
}

export default Header;