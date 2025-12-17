import { Button } from 'antd'
import { usePlaidLinkHandler } from '../../hooks/usePlaidLinkHandler.ts'

const PlaidLinkButton = () => {
  const { open, ready } = usePlaidLinkHandler()

  return (
    <Button onClick={() => open()} disabled={!ready}>
      Launch Link
    </Button>
  )
}

PlaidLinkButton.displayName = 'Link'

export default PlaidLinkButton
