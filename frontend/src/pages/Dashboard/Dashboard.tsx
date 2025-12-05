import React from 'react';
import './Dashboard.css';
import Transactions from '../Transactions/Transactions.tsx';

const Dashboard: React.FC = () => {
  return (
    <div className="dashboard">
      <Transactions/>
    </div>
  );
};

export default Dashboard;