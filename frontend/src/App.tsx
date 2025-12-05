import React, { useState } from "react";
import Dashboard from "./Dashboard/Dashboard.tsx";
import GoogleAuth from "./components/GoogleAuth/GoogleAuth.tsx";
import theme from "./theme.ts";
import { ConfigProvider } from 'antd';

const App: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const handleLoginSuccess = () => {
    setIsLoggedIn(true);
  };

  return (
    <div>
      {isLoggedIn ? (
        <ConfigProvider theme={theme}>
          <Dashboard />
        </ConfigProvider>
      ) : (
        <GoogleAuth onLoginSuccess={handleLoginSuccess} />
      )}
    </div>
  );
};

export default App;