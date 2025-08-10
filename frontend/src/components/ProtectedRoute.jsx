import { Spin } from 'antd';
import { SafetyOutlined, LockOutlined } from '@ant-design/icons';
import { useAuth } from "../context/AuthContext";
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children }) => {
    const { isAuthenticated, loading } = useAuth();

    if (loading) {
        return (
            <div style={{
                height: '100vh',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                background: '#1a1a1a'
            }}>
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '24px'
                }}>
                    {/* Logo */}
                    <div style={{
                        width: '80px',
                        height: '80px',
                        background: 'linear-gradient(135deg, #ff6b35, #ff8c42)',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 4px 20px rgba(255, 107, 53, 0.4)',
                        animation: 'pulse 2s infinite'
                    }}>
                        <SafetyOutlined style={{ fontSize: '40px', color: '#fff' }} />
                    </div>

                    {/* Loading spinner */}
                    <Spin size="large" />

                    {/* Loading text */}
                    <div style={{ textAlign: 'center' }}>
                        <div style={{
                            color: '#ff6b35',
                            fontSize: '18px',
                            fontWeight: '600',
                            letterSpacing: '1px',
                            marginBottom: '8px'
                        }}>
                            AUTHENTICATING
                        </div>
                        <div style={{
                            color: '#6a6a6a',
                            fontSize: '12px',
                            letterSpacing: '0.5px'
                        }}>
                            Verifying security credentials...
                        </div>
                    </div>
                </div>

                <style>{`
                    @keyframes pulse {
                        0% { transform: scale(1); opacity: 1; }
                        50% { transform: scale(1.05); opacity: 0.8; }
                        100% { transform: scale(1); opacity: 1; }
                    }
                `}</style>
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    return children;
};

export default ProtectedRoute;