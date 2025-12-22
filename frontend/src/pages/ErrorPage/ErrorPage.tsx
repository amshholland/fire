import React from 'react'
import { Button, Result } from 'antd'
import './ErrorPage.css'

interface ErrorPageProps {
  title: string
  message: string
  actionLabel?: string
  onAction?: () => void
  onLogout?: () => void
}

/**
 * Error page displayed when setup encounters issues
 * Provides user-friendly messaging and recovery options
 */
const ErrorPage: React.FC<ErrorPageProps> = ({
  title,
  message,
  actionLabel = 'Retry',
  onAction,
  onLogout
}) => {
  return (
    <div className="error-page">
      <Result
        status="error"
        title={title}
        subTitle={message}
        extra={[
          <Button type="primary" key="retry" onClick={onAction}>
            {actionLabel}
          </Button>,
          <Button key="logout" onClick={onLogout}>
            Sign Out
          </Button>
        ]}
      />
    </div>
  )
}

export default ErrorPage
