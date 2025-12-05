const GoogleAuth: React.FC<{ onLoginSuccess: () => void }> = ({ onLoginSuccess }) => {
  const handleLogin = () => {
    onLoginSuccess();
  };

  return (
    <div>
      <button onClick={handleLogin}>Login with Google</button>
    </div>
  );
};

export default GoogleAuth;