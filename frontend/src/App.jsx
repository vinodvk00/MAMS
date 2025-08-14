import { Routes, Route, Navigate } from 'react-router-dom';
import '@ant-design/v5-patch-for-react-19';
import { ConfigProvider, Spin } from 'antd';
import { antdTheme } from './theme/antdTheme';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import DashboardPage from './pages/Dashboard';
import Assets from './pages/Assets';
import Purchases from './pages/Purchases';
import Transfers from './pages/Transfers';
import Assignments from './pages/Assignments';
import Equipments from './pages/Equipments';
import Bases from './pages/Bases';
import Users from './pages/Users';
import Expenditures from './pages/Expenditures';

const AppLayout = () => (
  <Layout>
    <Routes>
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/assets" element={<Assets />} />
      <Route path="/purchases" element={<Purchases />} />
      <Route path="/transfers" element={<Transfers />} />
      <Route path="/assignments" element={<Assignments />} />
      <Route path="/equipments" element={<Equipments />} />
      <Route path="/bases" element={<Bases />} />
      <Route path="/users" element={<Users />} />
      <Route path="/expenditures" element={<Expenditures />} />

      {/* Default route for authenticated users */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  </Layout>
);

const AppContent = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <Routes>
      <Route
        path="/*"
        element={
          isAuthenticated ? <AppLayout /> : <Navigate to="/login" replace />
        }
      />
      <Route
        path="/login"
        element={
          !isAuthenticated ? <Login /> : <Navigate to="/dashboard" replace />
        }
      />
    </Routes>
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