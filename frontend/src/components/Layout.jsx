import {
    Layout as AntLayout,
    Menu,
    Button,
    Avatar,
    Dropdown,
    Badge,
} from "antd";
import {
    DashboardOutlined,
    AppstoreOutlined,
    ShoppingCartOutlined,
    SwapOutlined,
    UserOutlined,
    LogoutOutlined,
    MenuFoldOutlined,
    MenuUnfoldOutlined,
    SafetyOutlined,
    TeamOutlined,
    ToolOutlined,
    MinusCircleOutlined,
    AuditOutlined,
} from "@ant-design/icons";
import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";

const { Header, Sider, Content } = AntLayout;

const Layout = ({ children }) => {
    const [collapsed, setCollapsed] = useState(false);
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const currentPage = location.pathname.substring(1) || "dashboard";

    const menuItems = [
        {
            key: "dashboard",
            icon: <DashboardOutlined />,
            label: "Dashboard",
        },
        {
            key: "assets",
            icon: <AppstoreOutlined />,
            label: "Assets",
        },
        {
            key: "purchases",
            icon: <ShoppingCartOutlined />,
            label: "Purchases",
        },
        {
            key: "transfers",
            icon: <SwapOutlined />,
            label: "Transfers",
        },
        {
            key: "assignments",
            icon: <TeamOutlined />,
            label: "Assignments",
        },
        {
            key: "equipments",
            icon: <ToolOutlined />,
            label: "Equipments",
        },
        {
            key: "bases",
            icon: <SafetyOutlined />,
            label: "Bases",
        },
        {
            key: "expenditures",
            icon: <MinusCircleOutlined />,
            label: "Expenditures",
        },
        (user?.role === "admin" || user?.role === "base_commander") && {
            key: "users",
            icon: <UserOutlined />,
            label: "Users",
        },
        user?.role === "admin" && {
            key: "audit-logs",
            icon: <AuditOutlined />,
            label: "Audit Logs",
        },
    ];

    const userMenuItems = [
        {
            key: "profile",
            icon: <UserOutlined />,
            label: <span style={{ color: "#e0e0e0" }}>{user?.fullname}</span>,
            disabled: true,
        },
        {
            key: "role",
            label: (
                <Badge
                    count={user?.role?.toUpperCase()}
                    style={{
                        backgroundColor: "#ff6b35",
                        fontSize: "10px",
                        height: "18px",
                        lineHeight: "18px",
                        padding: "0 8px",
                    }}
                />
            ),
            disabled: true,
        },
        {
            type: "divider",
        },
        {
            key: "logout",
            icon: <LogoutOutlined style={{ color: "#ff4d4f" }} />,
            label: <span style={{ color: "#ff4d4f" }}>Logout</span>,
            onClick: logout,
        },
    ];

    const getRoleColor = role => {
        const colors = {
            ADMIN: "#ff6b35",
            COMMANDER: "#1890ff",
            LOGISTICS: "#52c41a",
        };
        return colors[role?.toUpperCase()] || "#b0b0b0";
    };

    return (
        <AntLayout style={{ minHeight: "100vh", background: "#1a1a1a" }}>
            <Sider
                trigger={null}
                collapsible
                collapsed={collapsed}
                width={260}
                collapsedWidth={80}
                style={{
                    background: "#0f0f0f",
                    borderRight: "1px solid #3a3a3a",
                    position: "fixed",
                    height: "100vh",
                    left: 0,
                    top: 0,
                    zIndex: 100,
                    overflow: "auto",
                }}
            >
                <div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        height: "100%",
                    }}
                >
                    {/* Logo Section */}
                    <div
                        style={{
                            padding: collapsed ? "20px 8px" : "20px 16px",
                            borderBottom: "1px solid #3a3a3a",
                            background:
                                "linear-gradient(135deg, rgba(255, 107, 53, 0.1), rgba(255, 140, 66, 0.05))",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "12px",
                            minHeight: "60px",
                        }}
                    >
                        <div
                            style={{
                                width: collapsed ? "32px" : "40px",
                                height: collapsed ? "32px" : "40px",
                                background:
                                    "linear-gradient(135deg, #ff6b35, #ff8c42)",
                                borderRadius: "8px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                boxShadow: "0 2px 8px rgba(255, 107, 53, 0.3)",
                                flexShrink: 0,
                            }}
                        >
                            <SafetyOutlined
                                style={{
                                    fontSize: collapsed ? "18px" : "22px",
                                    color: "#fff",
                                }}
                            />
                        </div>
                        {!collapsed && (
                            <div style={{ minWidth: 0 }}>
                                <div
                                    style={{
                                        color: "#ff6b35",
                                        fontSize: "18px",
                                        fontWeight: "700",
                                        letterSpacing: "1px",
                                        lineHeight: "1",
                                        whiteSpace: "nowrap",
                                    }}
                                >
                                    MAMS
                                </div>
                                <div
                                    style={{
                                        color: "#6a6a6a",
                                        fontSize: "10px",
                                        letterSpacing: "0.5px",
                                        marginTop: "4px",
                                        whiteSpace: "nowrap",
                                    }}
                                >
                                    ASSET MANAGEMENT
                                </div>
                            </div>
                        )}
                    </div>
                    <div
                        style={{
                            flexGrow: 1,
                            overflowY: "auto",
                            overflowX: "hidden",
                        }}
                    >
                        {/* Menu Container */}

                        <Menu
                            theme='dark'
                            mode='inline'
                            selectedKeys={[currentPage]}
                            items={menuItems}
                            onClick={({ key }) => navigate(`/${key}`)}
                            style={{
                                marginTop: "8px",
                                background: "transparent",
                                borderRight: "none",
                            }}
                        />
                    </div>

                    {/* Collapse Button - Fixed at bottom */}
                    <div
                        style={{
                            borderTop: "1px solid #3a3a3a",
                            padding: "12px",
                            display: "flex",
                            justifyContent: "center",
                            background: "#0f0f0f",
                        }}
                    >
                        <Button
                            type='text'
                            icon={
                                collapsed ? (
                                    <MenuUnfoldOutlined />
                                ) : (
                                    <MenuFoldOutlined />
                                )
                            }
                            onClick={() => setCollapsed(!collapsed)}
                            style={{
                                fontSize: "16px",
                                width: collapsed ? "48px" : "100%",
                                height: "36px",
                                color: "#b0b0b0",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                background: "#1a1a1a",
                                border: "1px solid #3a3a3a",
                                borderRadius: "6px",
                                transition: "all 0.3s",
                            }}
                            onMouseEnter={e => {
                                e.currentTarget.style.borderColor = "#ff6b35";
                                e.currentTarget.style.color = "#ff6b35";
                                e.currentTarget.style.background = "#242424";
                            }}
                            onMouseLeave={e => {
                                e.currentTarget.style.borderColor = "#3a3a3a";
                                e.currentTarget.style.color = "#b0b0b0";
                                e.currentTarget.style.background = "#1a1a1a";
                            }}
                        >
                            {!collapsed && (
                                <span style={{ marginLeft: "8px" }}>
                                    Collapse Menu
                                </span>
                            )}
                        </Button>
                    </div>
                </div>
            </Sider>

            <AntLayout
                style={{
                    marginLeft: collapsed ? 80 : 260,
                    transition: "margin-left 0.2s",
                    background: "#1a1a1a",
                    minHeight: "100vh",
                }}
            >
                <Header
                    style={{
                        padding: "0 24px",
                        background: "#1a1a1a",
                        borderBottom: "1px solid #3a3a3a",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        height: "64px",
                        position: "sticky",
                        top: 0,
                        zIndex: 50,
                        width: "100%",
                    }}
                >
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "16px",
                            flex: "0 1 auto",
                        }}
                    >
                        <div>
                            <h2
                                style={{
                                    margin: 0,
                                    color: "#ff6b35",
                                    fontSize: "20px",
                                    fontWeight: "600",
                                    letterSpacing: "0.5px",
                                    lineHeight: "24px",
                                }}
                            >
                                {menuItems.find(
                                    item => item.key === currentPage
                                )?.label || "Dashboard"}
                            </h2>
                            <div
                                style={{
                                    color: "#6a6a6a",
                                    fontSize: "12px",
                                    marginTop: "2px",
                                    lineHeight: "16px",
                                }}
                            >
                                Military Asset Management System
                            </div>
                        </div>
                    </div>

                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "16px",
                            flex: "0 0 auto",
                        }}
                    >
                        {/* Status Indicator */}
                        <div
                            style={{
                                padding: "6px 12px",
                                background: "rgba(82, 196, 26, 0.1)",
                                border: "1px solid rgba(82, 196, 26, 0.3)",
                                borderRadius: "4px",
                                display: "flex",
                                alignItems: "center",
                                gap: "6px",
                                whiteSpace: "nowrap",
                                height: "32px",
                            }}
                        >
                            <div
                                style={{
                                    width: "6px",
                                    height: "6px",
                                    borderRadius: "50%",
                                    background: "#52c41a",
                                    animation: "pulse 2s infinite",
                                }}
                            />
                            <span
                                style={{
                                    color: "#52c41a",
                                    fontSize: "12px",
                                    lineHeight: "1",
                                }}
                            >
                                SYSTEM ONLINE
                            </span>
                        </div>

                        {/* User Menu */}
                        <Dropdown
                            menu={{ items: userMenuItems }}
                            placement='bottomRight'
                            overlayStyle={{ minWidth: "200px" }}
                        >
                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    cursor: "pointer",
                                    padding: "6px 12px",
                                    borderRadius: "8px",
                                    background: "#242424",
                                    border: "1px solid #3a3a3a",
                                    transition: "all 0.3s",
                                    gap: "10px",
                                    height: "40px",
                                }}
                                onMouseEnter={e => {
                                    e.currentTarget.style.borderColor =
                                        "#ff6b35";
                                    e.currentTarget.style.background =
                                        "#2a2a2a";
                                }}
                                onMouseLeave={e => {
                                    e.currentTarget.style.borderColor =
                                        "#3a3a3a";
                                    e.currentTarget.style.background =
                                        "#242424";
                                }}
                            >
                                <Avatar
                                    size={28}
                                    style={{
                                        backgroundColor: getRoleColor(
                                            user?.role
                                        ),
                                        fontSize: "14px",
                                        lineHeight: "28px",
                                    }}
                                >
                                    {user?.fullname?.charAt(0)?.toUpperCase()}
                                </Avatar>
                                <div
                                    style={{
                                        display: "flex",
                                        flexDirection: "column",
                                        alignItems: "flex-start",
                                        lineHeight: "1.2",
                                    }}
                                >
                                    <span
                                        style={{
                                            color: "#e0e0e0",
                                            fontSize: "13px",
                                            fontWeight: "500",
                                            lineHeight: "16px",
                                        }}
                                    >
                                        {user?.fullname || "User"}
                                    </span>
                                    <span
                                        style={{
                                            color: getRoleColor(user?.role),
                                            fontSize: "11px",
                                            textTransform: "uppercase",
                                            letterSpacing: "0.5px",
                                            lineHeight: "14px",
                                        }}
                                    >
                                        {user?.role || "Role"}
                                    </span>
                                </div>
                            </div>
                        </Dropdown>
                    </div>
                </Header>

                <Content
                    style={{
                        margin: "24px",
                        background: "transparent",
                        minHeight: "calc(100vh - 112px)",
                        overflow: "auto",
                    }}
                >
                    {children}
                </Content>
            </AntLayout>

            {/* Add pulse animation and scrollbar styles */}
            <style>{`
                @keyframes pulse {
                    0% { opacity: 1; }
                    50% { opacity: 0.5; }
                    100% { opacity: 1; }
                }
                
                /* Custom scrollbar for sidebar */
                .ant-layout-sider ::-webkit-scrollbar {
                    width: 6px;
                }
                
                .ant-layout-sider ::-webkit-scrollbar-track {
                    background: #1a1a1a;
                }
                
                .ant-layout-sider ::-webkit-scrollbar-thumb {
                    background: #3a3a3a;
                    border-radius: 3px;
                }
                
                .ant-layout-sider ::-webkit-scrollbar-thumb:hover {
                    background: #4a4a4a;
                }
            `}</style>
        </AntLayout>
    );
};

export default Layout;
