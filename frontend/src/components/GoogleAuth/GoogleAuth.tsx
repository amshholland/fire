import { GoogleLogin } from '@react-oauth/google'
import { jwtDecode } from 'jwt-decode'

interface CredentialResponse {
  credential?: string
}

interface GoogleAuthProps {
  onLoginSuccess: (user: any) => void
}

interface DecodedGoogleToken {
  sub: string // Google user ID
  email: string
  name?: string
  picture?: string
}

function GoogleAuth({ onLoginSuccess }: GoogleAuthProps) {
  const handleSuccess = async (credentialResponse: CredentialResponse) => {
    // Decode the JWT to get user information
    if (
      credentialResponse !== undefined &&
      credentialResponse.credential !== undefined
    ) {
      const userInfo = jwtDecode<DecodedGoogleToken>(
        credentialResponse.credential
      )
      console.log('Decoded User Info:', userInfo)

      try {
        // Call backend to create/login user in database
        const response = await fetch(
          'http://localhost:3030/api/users/google-auth',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              googleId: userInfo.sub,
              email: userInfo.email
            })
          }
        )

        if (!response.ok) {
          const error = await response.json()
          console.error('Backend authentication failed:', error)
          alert(`Login failed: ${error.error}`)
          return
        }

        const { user, isNewUser } = await response.json()
        console.log(
          'User authenticated:',
          user,
          isNewUser ? '(new user)' : '(existing user)'
        )

        // Store both Google info and our user record
        const userSession = {
          ...userInfo,
          userId: user.id, // Our database user ID
          isNewUser
        }
        localStorage.setItem('googleUser', JSON.stringify(userSession))

        onLoginSuccess(userSession)
      } catch (error) {
        console.error('Error authenticating with backend:', error)
        alert('Failed to connect to server. Please try again.')
      }
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
