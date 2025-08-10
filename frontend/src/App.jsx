import { useState } from 'react';
import { ConfigProvider } from 'antd';
import { antdTheme } from './theme/antdTheme';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Assets from './pages/Assets';
import Purchases from './pages/Purchases';
import Transfers from './pages/Transfers';
import Assignments from './pages/Assignments';

const AppContent = () => {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const { isAuthenticated } = useAuth();

  const pages = {
    dashboard: <Dashboard />,
    assets: <Assets />,
    purchases: <Purchases />,
    transfers: <Transfers />,
    assignments: <Assignments />,
  };

  if (!isAuthenticated) {
    return <Login />;
  }

  return (
    <ProtectedRoute>
      <Layout currentPage={currentPage} onPageChange={setCurrentPage}>
        {pages[currentPage]}
      </Layout>
    </ProtectedRoute>
  );
};

function App() {
  return (
    <ConfigProvider theme={antdTheme}>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ConfigProvider>
  );
}
export default App;