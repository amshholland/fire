/**
 * PlaidLink Component
 *
 * React component that initializes Plaid Link and handles bank account connection
 */

import React, { useEffect, useState, useCallback } from 'react'
import {
  usePlaidLink,
  PlaidLinkOnSuccess,
  PlaidLinkOptions
} from 'react-plaid-link'
import { Button } from 'antd'
import { BankOutlined } from '@ant-design/icons'
import {
  createLinkToken,
  exchangePublicToken
} from '../../services/plaidService/index.ts'

interface PlaidLinkProps {
  onSuccess?: (accessToken: string, itemId: string) => void
  onError?: (error: Error) => void
  buttonText?: string
}

const PlaidLink: React.FC<PlaidLinkProps> = ({
  onSuccess,
  onError,
  buttonText = 'Connect Bank Account'
}) => {
  const [linkToken, setLinkToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // Fetch link token on component mount
  useEffect(() => {
    const fetchLinkToken = async () => {
      try {
        const response = await createLinkToken()
        setLinkToken(response.link_token)
      } catch (error) {
        console.error('Error fetching link token:', error)
        if (onError && error instanceof Error) {
          onError(error)
        }
      }
    }

    fetchLinkToken()
  }, [onError])

  // Handle successful bank connection
  const handleOnSuccess: PlaidLinkOnSuccess = useCallback(
    async (publicToken: string, metadata) => {
      setLoading(true)
      try {
        // Exchange public token for access token
        const response = await exchangePublicToken(publicToken)
        console.log(
          'Successfully connected bank account:',
          metadata.institution?.name
        )

        if (onSuccess) {
          onSuccess(response.access_token, response.item_id)
        }
      } catch (error) {
        console.error('Error exchanging public token:', error)
        if (onError && error instanceof Error) {
          onError(error)
        }
      } finally {
        setLoading(false)
      }
    },
    [onSuccess, onError]
  )

  // Configure Plaid Link
  const config: PlaidLinkOptions = {
    token: linkToken,
    onSuccess: handleOnSuccess,
    onExit: (error, metadata) => {
      if (error) {
        console.error('Plaid Link error:', error)
        if (onError) {
          onError(new Error(error.error_message))
        }
      }
    }
  }

  const { open, ready } = usePlaidLink(config)

  return (
    <Button
      type="primary"
      icon={<BankOutlined />}
      onClick={() => open()}
      disabled={!ready || loading}
      loading={loading}
      size="large"
    >
      {buttonText}
    </Button>
  )
}

export default PlaidLink
