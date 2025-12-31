import { GoogleLogin } from '@react-oauth/google'
import { jwtDecode } from 'jwt-decode'

interface CredentialResponse {
  credential?: string
}

interface GoogleAuthProps {
  onLoginSuccess: (user: any) => void
  isLoggedIn?: boolean
}

function GoogleAuth({ onLoginSuccess, isLoggedIn }: GoogleAuthProps) {
  const handleSuccess = async (credentialResponse: CredentialResponse) => {
    // Decode the JWT to get user information
    if (
      credentialResponse !== undefined &&
      credentialResponse.credential !== undefined
    ) {
      const userInfo: any = jwtDecode(credentialResponse.credential)
      console.log('Decoded User Info:', userInfo)

      // Create or update user in backend
      try {
        const response = await fetch('/api/auth/user', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            user_id: userInfo.sub,
            email: userInfo.email,
            name: userInfo.name
          })
        })

        if (!response.ok) {
          console.error(
            'Failed to create user in backend:',
            response.statusText
          )
        } else {
          console.log('✅ Google user logged in and saved to database:', {
            user_id: userInfo.sub,
            email: userInfo.email,
            name: userInfo.name
          })
        }
      } catch (error) {
        console.error('Error calling /api/auth/user:', error)
      }

      // Store user info in localStorage for persistence
      localStorage.setItem('userInfo', JSON.stringify(userInfo))

      onLoginSuccess(userInfo)
    }
  }

  const handleError = () => {
    console.log('Login Failed')
  }

  // Hide button if user is already logged in
  if (isLoggedIn) {
    return null
  }

  return (
    <div>
      <GoogleLogin onSuccess={handleSuccess} onError={handleError} />
    </div>
  )
}

export default GoogleAuth
