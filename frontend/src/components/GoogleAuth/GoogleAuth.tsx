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
      
      // Store user info in localStorage for persistence
      localStorage.setItem('userInfo', JSON.stringify(userInfo))
      
      onLoginSuccess(userInfo)
    }
  }

  const handleError = () => {
    console.log('Login Failed')
  }

  return (
    <div>
      <GoogleLogin onSuccess={handleSuccess} onError={handleError} />
    </div>
  )
}

export default GoogleAuth
