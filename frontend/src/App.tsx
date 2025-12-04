import { GoogleOAuthProvider } from "@react-oauth/google";
import GoogleAuthComponent from "./components/GoogleAuth/GoogleAuthComponent.tsx";

export default function App() {
  const clientId = process.env.REACT_APP_GOOGLE_CLIENT_ID;

  if (!clientId) {
    console.error("Google Client ID is missing. Check your .env file.");
    return null;
  }

  return (
    <GoogleOAuthProvider clientId={clientId}>
      <GoogleAuthComponent />
    </GoogleOAuthProvider>
  );
}