import { GoogleLogin } from '@react-oauth/google'
import { jwtDecode } from 'jwt-decode'

interface CredentialResponse {
  credential?: string
}

interface GoogleAuthProps {
  onLoginSuccess: (user: any) => void
}

function GoogleAuth({ onLoginSuccess }: GoogleAuthProps) {
  const handleSuccess = (credentialResponse: CredentialResponse) => {
    // Decode the JWT to get user information
    if (
      credentialResponse !== undefined &&
      credentialResponse.credential !== undefined
    ) {
      const userInfo = jwtDecode(credentialResponse.credential)
      console.log('Decoded User Info:', userInfo)
      onLoginSuccess(userInfo)
    }
  }

  const handleError = () => {
    console.log('Login Failed')
  }

  return (
    <div>
      <h1>Google Login Example</h1>
      <GoogleLogin onSuccess={handleSuccess} onError={handleError} />
    </div>
  )
}

export default GoogleAuth
