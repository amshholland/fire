import { GoogleLogin } from '@react-oauth/google';

const GoogleAuthComponent = () => {
    interface CredentialResponse {
      credential?: string;
    }

    const handleSuccess = (credentialResponse: CredentialResponse) => {
      const token = credentialResponse.credential;
      console.log('Token:', token);
    };

  const handleError = () => {
    console.log('Login Failed');
  };

  return (
    <div>
      <GoogleLogin
        onSuccess={handleSuccess}
        onError={handleError}
      />
    </div>
  );
};

export default GoogleAuthComponent;