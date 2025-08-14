import React, { useState, useEffect } from "react";
import {
    Table,
    Typography,
    Tag,
    Space,
    Tooltip,
    Alert,
    App,
    Row,
    Col,
    DatePicker,
    Select,
    Modal,
    Button,
    Input,
    Descriptions,
    Card,
} from "antd";
import {
    EyeOutlined,
    UserOutlined,
    ClockCircleOutlined,
    ApiOutlined,
    CheckCircleOutlined,
    ExclamationCircleOutlined,
    ThunderboltOutlined,
    DatabaseOutlined,
    CodeOutlined,
    GlobalOutlined,
} from "@ant-design/icons";
import { logsAPI, userAPI } from "../services/api";
import dayjs from "dayjs";

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

const operationColors = {
    CREATE: "green",
    UPDATE: "blue",
    DELETE: "red",
    LOGIN: "purple",
    LOGOUT: "geekblue",
    INITIATE: "cyan",
    APPROVE: "processing",
    COMPLETE: "success",
    CANCEL: "error",
};

const getOperationColor = type => {
    if (!type) return "default";
    const key = Object.keys(operationColors).find(k => type.includes(k));
    return operationColors[key] || "default";
};

const LogDetailView = ({ log }) => {
    if (!log) return null;

    const items = [
        {
            key: "1",
            label: "Timestamp",
            children: dayjs(log.createdAt).format("YYYY-MM-DD HH:mm:ss Z"),
            icon: <ClockCircleOutlined />,
        },
        {
            key: "2",
            label: "User",
            children: log.userId?.fullname || log.userId?.username || "System",
            icon: <UserOutlined />,
        },
        {
            key: "3",
            label: "User Role",
            children: <Tag>{log.userRole || "N/A"}</Tag>,
        },
        {
            key: "4",
            label: "Operation",
            children: (
                <Tag color={getOperationColor(log.operation?.type)}>
                    {log.operation?.type?.replace(/_/g, " ") || "UNKNOWN"}
                </Tag>
            ),
            icon: <ThunderboltOutlined />,
        },
        {
            key: "5",
            label: "Status Code",
            children: (
                <Tag color={log.statusCode >= 400 ? "red" : "green"}>
                    {log.statusCode}
                </Tag>
            ),
            icon:
                log.statusCode >= 400 ? (
                    <ExclamationCircleOutlined />
                ) : (
                    <CheckCircleOutlined />
                ),
        },
        {
            key: "6",
            label: "Response Time",
            children: `${log.responseTime} ms`,
        },
    ];

    return (
        <div
            style={{
                maxHeight: "70vh",
                overflowY: "auto",
                paddingRight: "16px",
            }}
        >
            <Descriptions bordered column={1} items={items} size='small' />

            <Card title='Request Details' style={{ marginTop: 16 }}>
                <Descriptions column={1} size='small'>
                    <Descriptions.Item
                        label={
                            <>
                                <ApiOutlined /> Method & Endpoint
                            </>
                        }
                    >
                        <Tag color='cyan'>{log.method}</Tag> {log.endpoint}
                    </Descriptions.Item>
                    <Descriptions.Item
                        label={
                            <>
                                <GlobalOutlined /> Client IP
                            </>
                        }
                    >
                        {log.ip}
                    </Descriptions.Item>
                    <Descriptions.Item label='User Agent'>
                        {log.userAgent}
                    </Descriptions.Item>
                </Descriptions>
            </Card>

            {log.operation?.affectedRecords?.length > 0 && (
                <Card title='Affected Records' style={{ marginTop: 16 }}>
                    {log.operation.affectedRecords.map((record, index) => (
                        <Descriptions
                            key={index}
                            column={1}
                            size='small'
                            style={{ marginBottom: 8 }}
                        >
                            <Descriptions.Item
                                label={
                                    <>
                                        <DatabaseOutlined /> Model
                                    </>
                                }
                            >
                                <Tag color='purple'>{record.model}</Tag>
                            </Descriptions.Item>
                            <Descriptions.Item label='Record ID'>
                                {record.id}
                            </Descriptions.Item>
                        </Descriptions>
                    ))}
                </Card>
            )}

            {log.body && Object.keys(log.body).length > 0 && (
                <Card title='Request Payload' style={{ marginTop: 16 }}>
                    <pre
                        style={{
                            background: "#2a2a2a",
                            color: "#e0e0e0",
                            padding: "16px",
                            borderRadius: "8px",
                            whiteSpace: "pre-wrap",
                            wordBreak: "break-all",
                        }}
                    >
                        {JSON.stringify(log.body, null, 2)}
                    </pre>
                </Card>
            )}
        </div>
    );
};

const AuditLogsContent = () => {
    const [logs, setLogs] = useState([]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: 15,
        total: 0,
    });
    const [filters, setFilters] = useState({});
    const [viewingLogDetail, setViewingLogDetail] = useState(null);
    const { message: messageApi } = App.useApp();

    const fetchLogs = async (page = 1, currentFilters = filters) => {
        setLoading(true);
        try {
            const params = {
                page,
                limit: pagination.pageSize,
                ...currentFilters,
                startDate: currentFilters.dateRange?.[0]?.format("YYYY-MM-DD"),
                endDate: currentFilters.dateRange?.[1]?.format("YYYY-MM-DD"),
            };
            delete params.dateRange;

            const response = await logsAPI.getAll(params);
            setLogs(response.data.docs);
            setPagination({
                current: response.data.page,
                pageSize: response.data.limit,
                total: response.data.totalDocs,
            });
        } catch (err) {
            setError(err);
            messageApi.error(err.message || "Failed to fetch audit logs");
        } finally {
            setLoading(false);
        }
    };

    const fetchUsers = async () => {
        try {
            const response = await userAPI.getAll();
            setUsers(response.data);
        } catch (err) {
            messageApi.error("Failed to fetch users for filtering");
        }
    };

    useEffect(() => {
        fetchLogs(1, filters);
    }, [filters]);

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleTableChange = pagination => {
        fetchLogs(pagination.current, filters);
    };

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const columns = [
        {
            title: "Timestamp",
            dataIndex: "createdAt",
            key: "createdAt",
            render: date => dayjs(date).format("YYYY-MM-DD HH:mm:ss"),
            sorter: (a, b) =>
                dayjs(a.createdAt).unix() - dayjs(b.createdAt).unix(),
        },
        {
            title: "User",
            dataIndex: ["userId", "fullname"],
            key: "user",
            render: (fullname, record) =>
                fullname || record.userId?.username || "System",
        },
        {
            title: "Operation",
            dataIndex: ["operation", "type"],
            key: "operation",
            render: type => (
                <Tag color={getOperationColor(type)}>
                    {type ? type.replace(/_/g, " ") : "UNKNOWN"}
                </Tag>
            ),
        },
        {
            title: "Endpoint",
            dataIndex: "endpoint",
            key: "endpoint",
            render: (endpoint, record) => (
                <Tag color='cyan'>{`${record.method} ${endpoint}`}</Tag>
            ),
        },
        {
            title: "IP Address",
            dataIndex: "ip",
            key: "ip",
        },
        {
            title: "Actions",
            key: "actions",
            align: "center",
            render: (_, record) => (
                <Tooltip title='View Details'>
                    <Button
                        type='text'
                        icon={<EyeOutlined />}
                        onClick={() => setViewingLogDetail(record)}
                    />
                </Tooltip>
            ),
        },
    ];

    return (
        <>
            <Row
                justify='space-between'
                align='middle'
                style={{ marginBottom: 24 }}
            >
                <Col>
                    <Title level={3} style={{ margin: 0 }}>
                        Audit Trail
                    </Title>
                </Col>
            </Row>

            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                <Col xs={24} md={8}>
                    <RangePicker
                        style={{ width: "100%" }}
                        onChange={dates =>
                            handleFilterChange("dateRange", dates)
                        }
                    />
                </Col>
                <Col xs={24} md={8}>
                    <Select
                        style={{ width: "100%" }}
                        placeholder='Filter by User'
                        allowClear
                        onChange={value => handleFilterChange("userId", value)}
                    >
                        {users.map(user => (
                            <Option key={user._id} value={user._id}>
                                {user.fullname}
                            </Option>
                        ))}
                    </Select>
                </Col>
                <Col xs={24} md={8}>
                    <Input
                        placeholder='Filter by Operation Type (e.g., PURCHASE_CREATE)'
                        onChange={e =>
                            handleFilterChange("operationType", e.target.value)
                        }
                    />
                </Col>
            </Row>

            {error && (
                <Alert
                    message='Error'
                    description={
                        error.message ||
                        "Failed to load data. Please try again."
                    }
                    type='error'
                    showIcon
                    closable
                    style={{ marginBottom: 16 }}
                />
            )}

            <Table
                columns={columns}
                dataSource={logs}
                loading={loading}
                rowKey='_id'
                pagination={pagination}
                onChange={handleTableChange}
                scroll={{ x: true }}
            />

            <Modal
                title='Log Record Details'
                open={!!viewingLogDetail}
                onCancel={() => setViewingLogDetail(null)}
                footer={null}
                width='70%'
            >
                <LogDetailView log={viewingLogDetail} />
            </Modal>
        </>
    );
};

const AuditLogs = () => (
    <App>
        <AuditLogsContent />
    </App>
);

export default AuditLogs;
