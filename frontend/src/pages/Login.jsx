import { Form, Input, Button, Card, message, Spin, Alert } from 'antd';
import { UserOutlined, LockOutlined, SafetyOutlined } from '@ant-design/icons';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';

const Login = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (values) => {
        setLoading(true);
        setError('');

        try {
            const response = await authAPI.login(values);

            if (response.status === 'success' && response.accessToken) {
                message.success('Authentication successful!');
                login(response.user, response.accessToken);
            } else {
                const errorMsg = response.message || 'Authentication failed';
                setError(errorMsg);
                message.error(errorMsg);
            }
        } catch (error) {
            console.error('Login error:', error);

            let errorMessage = 'Authentication failed';

            if (error.message) {
                errorMessage = error.message;
            } else if (error.response?.data?.message) {
                errorMessage = error.response.data.message;
            }

            setError(errorMessage);
            message.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100vh',
            background: '#0f0f0f',
            position: 'relative',
            overflow: 'hidden'
        }}>
            {/* Background Pattern */}
            <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundImage: `
                    radial-gradient(circle at 20% 50%, rgba(255, 107, 53, 0.1) 0%, transparent 50%),
                    radial-gradient(circle at 80% 80%, rgba(255, 140, 66, 0.05) 0%, transparent 50%),
                    radial-gradient(circle at 40% 20%, rgba(255, 107, 53, 0.05) 0%, transparent 50%)
                `,
                pointerEvents: 'none'
            }} />

            {/* Grid Pattern Overlay */}
            <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundImage: `
                    linear-gradient(rgba(255, 107, 53, 0.03) 1px, transparent 1px),
                    linear-gradient(90deg, rgba(255, 107, 53, 0.03) 1px, transparent 1px)
                `,
                backgroundSize: '50px 50px',
                pointerEvents: 'none'
            }} />

            <Card
                style={{
                    width: 440,
                    background: '#1a1a1a',
                    border: '1px solid #3a3a3a',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.8), 0 0 80px rgba(255, 107, 53, 0.1)',
                    borderRadius: '12px',
                    zIndex: 1
                }}
                styles={{
                    padding: '40px 32px'
                }}
            >
                {/* Header Section */}
                <div style={{
                    textAlign: 'center',
                    marginBottom: '32px',
                    position: 'relative'
                }}>
                    {/* Logo/Icon */}
                    <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '80px',
                        height: '80px',
                        background: 'linear-gradient(135deg, #ff6b35, #ff8c42)',
                        borderRadius: '50%',
                        marginBottom: '16px',
                        boxShadow: '0 4px 20px rgba(255, 107, 53, 0.4)'
                    }}>
                        <SafetyOutlined style={{
                            fontSize: '40px',
                            color: '#fff'
                        }} />
                    </div>

                    <h1 style={{
                        margin: '0 0 8px 0',
                        color: '#ff6b35',
                        fontSize: '28px',
                        fontWeight: '700',
                        letterSpacing: '2px'
                    }}>
                        MAMS
                    </h1>
                    <p style={{
                        margin: 0,
                        color: '#b0b0b0',
                        fontSize: '14px',
                        letterSpacing: '0.5px',
                        textTransform: 'uppercase'
                    }}>
                        Military Asset Management System
                    </p>
                    <div style={{
                        width: '60px',
                        height: '2px',
                        background: 'linear-gradient(90deg, transparent, #ff6b35, transparent)',
                        margin: '16px auto 0'
                    }} />
                </div>

                <Spin spinning={loading}>
                    {error && (
                        <Alert
                            message={error}
                            type="error"
                            showIcon
                            style={{
                                marginBottom: '24px',
                                background: 'rgba(255, 77, 79, 0.1)',
                                border: '1px solid rgba(255, 77, 79, 0.3)',
                                borderRadius: '8px'
                            }}
                            closable
                            onClose={() => setError('')}
                        />
                    )}

                    <Form
                        name="login"
                        onFinish={handleSubmit}
                        autoComplete="off"
                        size="large"
                    >
                        <Form.Item
                            name="username"
                            rules={[
                                { required: true, message: 'Username required' },
                            ]}
                        >
                            <Input
                                prefix={<UserOutlined style={{ color: '#ff6b35' }} />}
                                placeholder="Username"
                                style={{
                                    background: '#242424',
                                    border: '1px solid #3a3a3a',
                                    borderRadius: '8px',
                                    color: '#e0e0e0'
                                }}
                                className="custom-input"
                            />
                        </Form.Item>

                        <Form.Item
                            name="password"
                            rules={[
                                { required: true, message: 'Password required' },
                            ]}
                        >
                            <Input.Password
                                prefix={<LockOutlined style={{ color: '#ff6b35' }} />}
                                placeholder="Password"
                                style={{
                                    background: '#242424',
                                    border: '1px solid #3a3a3a',
                                    borderRadius: '8px',
                                    color: '#e0e0e0'
                                }}
                                className="custom-input"
                            />
                        </Form.Item>

                        <Form.Item style={{ marginBottom: '16px' }}>
                            <Button
                                type="primary"
                                htmlType="submit"
                                block
                                loading={loading}
                                style={{
                                    height: '48px',
                                    background: 'linear-gradient(135deg, #ff6b35, #ff8c42)',
                                    border: 'none',
                                    borderRadius: '8px',
                                    fontSize: '16px',
                                    fontWeight: '600',
                                    letterSpacing: '1px',
                                    textTransform: 'uppercase',
                                    boxShadow: '0 4px 20px rgba(255, 107, 53, 0.3)',
                                    transition: 'all 0.3s'
                                }}
                                className="login-button"
                            >
                                Authenticate
                            </Button>
                        </Form.Item>
                    </Form>
                </Spin>

                {/* Security Notice */}
                <div style={{
                    textAlign: 'center',
                    marginTop: '24px',
                    padding: '16px',
                    background: 'linear-gradient(135deg, rgba(255, 107, 53, 0.05), rgba(255, 140, 66, 0.05))',
                    border: '1px solid rgba(255, 107, 53, 0.2)',
                    borderRadius: '8px'
                }}>
                    <div style={{
                        color: '#ff8c42',
                        fontSize: '11px',
                        textTransform: 'uppercase',
                        letterSpacing: '1px',
                        marginBottom: '8px',
                        fontWeight: '600'
                    }}>
                        🔒 Authorized Personnel Only
                    </div>
                    <div style={{
                        color: '#6a6a6a',
                        fontSize: '12px',
                        lineHeight: '1.6'
                    }}>
                        <strong style={{ color: '#b0b0b0' }}>Demo Access for admin:</strong><br />
                        <span style={{ fontFamily: 'monospace' }}>
                            Admin: admin / admin<br />
                        </span>
                    </div>
                </div>

                {/* Footer */}
                <div style={{
                    textAlign: 'center',
                    marginTop: '24px',
                    color: '#6a6a6a',
                    fontSize: '11px',
                    letterSpacing: '0.5px'
                }}>
                    SECURE CONNECTION • MIL-STD COMPLIANT
                </div>
            </Card>

            {/* Add custom styles */}
            <style>{`
                .custom-input:hover {
                    border-color: #ff6b35 !important;
                }
                .custom-input:focus, .custom-input:focus-within {
                    border-color: #ff6b35 !important;
                    box-shadow: 0 0 0 2px rgba(255, 107, 53, 0.2) !important;
                }
                .ant-input-password-icon {
                    color: #6a6a6a;
                }
                .ant-input-password-icon:hover {
                    color: #ff6b35;
                }
                .login-button:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 6px 30px rgba(255, 107, 53, 0.4) !important;
                }
                .ant-input {
                    background: #242424 !important;
                    color: #e0e0e0 !important;
                }
                .ant-input::placeholder {
                    color: #6a6a6a !important;
                }
                .ant-alert-error {
                    background: rgba(255, 77, 79, 0.1) !important;
                    border: 1px solid rgba(255, 77, 79, 0.3) !important;
                }
                .ant-alert-error .ant-alert-icon {
                    color: #ff4d4f;
                }
                .ant-alert-error .ant-alert-message {
                    color: #ff4d4f;
                }
            `}</style>
        </div>
    );
};

export default Login;