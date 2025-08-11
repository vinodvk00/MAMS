import React, { useState, useEffect } from 'react';
import {
    Card,
    Row,
    Col,
    Statistic,
    DatePicker,
    Select,
    Button,
    Spin,
    Alert,
    Space,
    Badge,
    Empty,
    Typography,
    Modal
} from 'antd';
import {
    TrophyOutlined,
    SwapOutlined,
    ShoppingCartOutlined,
    ArrowUpOutlined,
    ArrowDownOutlined,
    ReloadOutlined,
    FilterOutlined,
    ExportOutlined,
    DashboardOutlined,
    EyeOutlined
} from '@ant-design/icons';
import { Pie } from '@ant-design/charts';
import { dashboardAPI } from '../services/api';

const { RangePicker } = DatePicker;
const { Option } = Select;
const { Title, Text } = Typography;

const Dashboard = () => {
    const [loading, setLoading] = useState(true);
    const [metricsLoading, setMetricsLoading] = useState(false);
    const [error, setError] = useState(null);

    // Data states
    const [metrics, setMetrics] = useState(null);
    const [filters, setFilters] = useState({ bases: [], equipmentTypes: [], statusOptions: [] });
    const [netMovementData, setNetMovementData] = useState(null);
    const [netMovementModalVisible, setNetMovementModalVisible] = useState(false);

    // Filter states
    const [dateRange, setDateRange] = useState([null, null]);
    const [selectedBase, setSelectedBase] = useState(null);
    const [selectedEquipmentType, setSelectedEquipmentType] = useState(null);
    const [selectedStatus, setSelectedStatus] = useState([]);

    // Fetch dashboard data
    const fetchDashboardData = async (params = {}) => {
        setMetricsLoading(true);
        setError(null);

        try {
            const queryParams = {
                startDate: dateRange[0]?.format ? dateRange[0].format('YYYY-MM-DD') : undefined,
                endDate: dateRange[1]?.format ? dateRange[1].format('YYYY-MM-DD') : undefined,
                baseId: selectedBase,
                equipmentTypeId: selectedEquipmentType,
                statusFilter: selectedStatus.length > 0 ? selectedStatus.join(',') : undefined,
                ...params
            };

            // Remove undefined values
            Object.keys(queryParams).forEach(key =>
                queryParams[key] === undefined && delete queryParams[key]
            );

            const metricsResponse = await dashboardAPI.getMetrics(queryParams);
            setMetrics(metricsResponse.data);

            // Extract net movement data for charts
            if (metricsResponse.data.netMovementBreakdown) {
                const breakdown = metricsResponse.data.netMovementBreakdown;
                const chartData = [];
                if (breakdown.purchases > 0) {
                    chartData.push({ type: 'Purchases', value: breakdown.purchases, color: '#52c41a' });
                }
                if (breakdown.transfersIn > 0) {
                    chartData.push({ type: 'Transfers In', value: breakdown.transfersIn, color: '#1890ff' });
                }
                if (breakdown.transfersOut > 0) {
                    chartData.push({ type: 'Transfers Out', value: breakdown.transfersOut, color: '#ff4d4f' });
                }
                setNetMovementData(chartData);
            }

        } catch (err) {
            console.error('Dashboard data fetch error:', err);
            setError(err.message || 'Failed to fetch dashboard data');
        } finally {
            setMetricsLoading(false);
        }
    };

    // Fetch filter options
    const fetchFilters = async () => {
        try {
            const filtersResponse = await dashboardAPI.getFilters();
            setFilters(filtersResponse.data);
        } catch (err) {
            console.error('Filters fetch error:', err);
        }
    };

    // Initial data load
    useEffect(() => {
        const loadInitialData = async () => {
            setLoading(true);
            try {
                await Promise.all([fetchFilters(), fetchDashboardData()]);
            } catch (err) {
                console.error('Initial load error:', err);
            } finally {
                setLoading(false);
            }
        };
        loadInitialData();
    }, []);

    // Handle filter changes
    const handleFiltersChange = () => {
        fetchDashboardData();
    };

    const handleDateRangeChange = (dates) => {
        setDateRange(dates);
    };

    const handleRefresh = () => {
        fetchDashboardData();
    };

    // Format numbers
    const formatNumber = (num) => {
        if (!num) return '0';
        return num.toLocaleString();
    };

    // Get status color
    const getStatusColor = (status) => {
        const colors = {
            'AVAILABLE': 'green',
            'ASSIGNED': 'blue',
            'IN_TRANSIT': 'orange',
            'MAINTENANCE': 'red',
            'EXPENDED': 'default'
        };
        return colors[status] || 'default';
    };

    // Chart config
    const pieChartConfig = {
        appendPadding: 10,
        data: netMovementData || [],
        angleField: 'value',
        colorField: 'type',
        radius: 0.8,
        label: {
            type: 'outer',
            content: '{name}\n{percentage}',
            style: {
                fill: '#e0e0e0',
                fontSize: 12
            }
        },
        interactions: [{ type: 'element-active' }],
        color: ['#52c41a', '#1890ff', '#ff4d4f'],
        theme: 'dark'
    };

    if (loading) {
        return (
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: '400px',
                background: '#1a1a1a'
            }}>
                <Spin size="large" />
            </div>
        );
    }

    return (
        <div style={{ background: '#1a1a1a', minHeight: '100vh' }}>
            {/* Header Section */}
            <div style={{ marginBottom: '24px' }}>
                <Row justify="space-between" align="middle">
                    <Col>
                        <Title level={2} style={{ color: '#ff6b35', margin: 0, display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <DashboardOutlined />
                            Dashboard Overview
                        </Title>
                        <Text type="secondary">Real-time military asset management metrics</Text>
                    </Col>
                    <Col>
                        <Space>
                            <Button
                                icon={<ReloadOutlined />}
                                onClick={handleRefresh}
                                loading={metricsLoading}
                                style={{ background: '#2a2a2a', borderColor: '#3a3a3a', color: '#e0e0e0' }}
                            >
                                Refresh
                            </Button>
                            <Button
                                icon={<ExportOutlined />}
                                style={{ background: '#2a2a2a', borderColor: '#3a3a3a', color: '#e0e0e0' }}
                            >
                                Export
                            </Button>
                        </Space>
                    </Col>
                </Row>
            </div>

            {/* Filters Section */}
            <Card style={{ marginBottom: '24px', background: '#242424', borderColor: '#3a3a3a' }}>
                <Row gutter={[16, 16]} align="middle">
                    <Col>
                        <Text strong style={{ color: '#ff6b35', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <FilterOutlined />
                            Filters
                        </Text>
                    </Col>
                    <Col flex="auto">
                        <Space wrap>
                            <RangePicker
                                value={dateRange}
                                onChange={handleDateRangeChange}
                                onOk={handleFiltersChange}
                                style={{ background: '#2a2a2a', borderColor: '#3a3a3a' }}
                                placeholder={['Start Date', 'End Date']}
                            />

                            <Select
                                placeholder="Select Base"
                                value={selectedBase}
                                onChange={(value) => {
                                    setSelectedBase(value);
                                    setTimeout(handleFiltersChange, 100);
                                }}
                                allowClear
                                style={{ minWidth: '150px' }}
                            >
                                {filters.bases.map(base => (
                                    <Option key={base._id} value={base._id}>
                                        {base.name} ({base.code})
                                    </Option>
                                ))}
                            </Select>

                            <Select
                                placeholder="Equipment Type"
                                value={selectedEquipmentType}
                                onChange={(value) => {
                                    setSelectedEquipmentType(value);
                                    setTimeout(handleFiltersChange, 100);
                                }}
                                allowClear
                                style={{ minWidth: '150px' }}
                            >
                                {filters.equipmentTypes.map(type => (
                                    <Option key={type._id} value={type._id}>
                                        {type.name} ({type.code})
                                    </Option>
                                ))}
                            </Select>

                            <Select
                                placeholder="Status Filter"
                                value={selectedStatus}
                                onChange={(value) => {
                                    setSelectedStatus(value);
                                    setTimeout(handleFiltersChange, 100);
                                }}
                                mode="multiple"
                                allowClear
                                style={{ minWidth: '150px' }}
                            >
                                {filters.statusOptions.map(status => (
                                    <Option key={status} value={status}>
                                        <span style={{ color: getStatusColor(status) }}>{status}</span>
                                    </Option>
                                ))}
                            </Select>
                        </Space>
                    </Col>
                </Row>
            </Card>

            {error && (
                <Alert
                    message="Error loading dashboard data"
                    description={error}
                    type="error"
                    style={{ marginBottom: '24px' }}
                    action={
                        <Button size="small" onClick={handleRefresh}>
                            Retry
                        </Button>
                    }
                />
            )}

            {/* Metrics Cards */}
            <Row gutter={[24, 24]} style={{ marginBottom: '24px' }}>
                <Col xs={24} sm={12} lg={6}>
                    <Card style={{ background: '#242424', borderColor: '#3a3a3a' }}>
                        <Statistic
                            title={<span style={{ color: '#b0b0b0' }}>Opening Balance</span>}
                            value={metrics?.metrics?.openingBalance || 0}
                            prefix={<TrophyOutlined style={{ color: '#52c41a' }} />}
                            valueStyle={{ color: '#e0e0e0' }}
                            formatter={(val) => formatNumber(val)}
                        />
                    </Card>
                </Col>

                <Col xs={24} sm={12} lg={6}>
                    <Card style={{ background: '#242424', borderColor: '#3a3a3a' }}>
                        <Statistic
                            title={<span style={{ color: '#b0b0b0' }}>Closing Balance</span>}
                            value={metrics?.metrics?.closingBalance || 0}
                            prefix={<TrophyOutlined style={{ color: '#1890ff' }} />}
                            valueStyle={{ color: '#e0e0e0' }}
                            formatter={(val) => formatNumber(val)}
                        />
                    </Card>
                </Col>

                <Col xs={24} sm={12} lg={6}>
                    <Card
                        style={{ background: '#242424', borderColor: '#3a3a3a', cursor: 'pointer' }}
                        onClick={() => setNetMovementModalVisible(true)}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <Statistic
                                title={<span style={{ color: '#b0b0b0' }}>Net Movement</span>}
                                value={metrics?.metrics?.netMovement || 0}
                                prefix={
                                    (metrics?.metrics?.netMovement || 0) >= 0 ?
                                        <ArrowUpOutlined style={{ color: '#52c41a' }} /> :
                                        <ArrowDownOutlined style={{ color: '#ff4d4f' }} />
                                }
                                valueStyle={{
                                    color: (metrics?.metrics?.netMovement || 0) >= 0 ? '#52c41a' : '#ff4d4f'
                                }}
                                formatter={(val) => formatNumber(val)}
                            />
                            <EyeOutlined style={{ color: '#ff6b35', fontSize: '16px' }} />
                        </div>
                    </Card>
                </Col>

                <Col xs={24} sm={12} lg={6}>
                    <Card style={{ background: '#242424', borderColor: '#3a3a3a' }}>
                        <Statistic
                            title={<span style={{ color: '#b0b0b0' }}>Assigned Assets</span>}
                            value={metrics?.metrics?.assignedCount || 0}
                            prefix={<SwapOutlined style={{ color: '#ff6b35' }} />}
                            valueStyle={{ color: '#e0e0e0' }}
                            formatter={(val) => formatNumber(val)}
                        />
                    </Card>
                </Col>
            </Row>

            {/* Charts and Summary Section */}
            <Row gutter={[24, 24]} style={{ marginBottom: '24px' }}>
                <Col xs={24} lg={12}>
                    <Card
                        title={<span style={{ color: '#ff6b35' }}>Net Movement Breakdown</span>}
                        style={{ background: '#242424', borderColor: '#3a3a3a' }}
                    >
                        {metricsLoading ? (
                            <div style={{ textAlign: 'center', padding: '60px 0' }}>
                                <Spin size="large" />
                            </div>
                        ) : netMovementData && netMovementData.length > 0 ? (
                            <Pie {...pieChartConfig} height={250} />
                        ) : (
                            <Empty
                                description="No movement data available"
                                style={{ padding: '60px 0' }}
                                image={Empty.PRESENTED_IMAGE_SIMPLE}
                            />
                        )}
                    </Card>
                </Col>

                <Col xs={24} lg={12}>
                    <Space direction="vertical" size={16} style={{ width: '100%' }}>
                        {/* Purchases Card */}
                        <Card style={{ background: '#242424', borderColor: '#3a3a3a' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <div>
                                    <Text type="secondary">Total Purchases</Text>
                                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#52c41a' }}>
                                        {formatNumber(metrics?.netMovementBreakdown?.purchases || 0)}
                                    </div>
                                </div>
                                <ShoppingCartOutlined style={{ fontSize: '32px', color: '#52c41a' }} />
                            </div>
                        </Card>

                        {/* Transfers In Card */}
                        <Card style={{ background: '#242424', borderColor: '#3a3a3a' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <div>
                                    <Text type="secondary">Transfers In</Text>
                                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1890ff' }}>
                                        {formatNumber(metrics?.netMovementBreakdown?.transfersIn || 0)}
                                    </div>
                                </div>
                                <ArrowDownOutlined style={{ fontSize: '32px', color: '#1890ff' }} />
                            </div>
                        </Card>

                        {/* Transfers Out Card */}
                        <Card style={{ background: '#242424', borderColor: '#3a3a3a' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <div>
                                    <Text type="secondary">Transfers Out</Text>
                                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#ff4d4f' }}>
                                        {formatNumber(metrics?.netMovementBreakdown?.transfersOut || 0)}
                                    </div>
                                </div>
                                <ArrowUpOutlined style={{ fontSize: '32px', color: '#ff4d4f' }} />
                            </div>
                        </Card>
                    </Space>
                </Col>
            </Row>

            {/* Additional Metrics */}
            <Row gutter={[24, 24]} style={{ marginBottom: '24px' }}>
                <Col xs={24} md={12}>
                    <Card style={{ background: '#242424', borderColor: '#3a3a3a' }}>
                        <Statistic
                            title={<span style={{ color: '#b0b0b0' }}>Expended Assets</span>}
                            value={metrics?.metrics?.expendedCount || 0}
                            prefix={<TrophyOutlined style={{ color: '#ff8c42' }} />}
                            valueStyle={{ color: '#ff8c42' }}
                            formatter={(val) => formatNumber(val)}
                        />
                    </Card>
                </Col>

                <Col xs={24} md={12}>
                    <Card style={{ background: '#242424', borderColor: '#3a3a3a' }}>
                        <div>
                            <Text type="secondary">Asset Utilization Rate</Text>
                            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#ff6b35' }}>
                                {metrics?.metrics?.assignedCount && metrics?.metrics?.closingBalance ?
                                    `${((metrics.metrics.assignedCount / metrics.metrics.closingBalance) * 100).toFixed(1)}%` :
                                    '0%'
                                }
                            </div>
                            <Text type="secondary" style={{ fontSize: '12px' }}>
                                Assigned / Total Available
                            </Text>
                        </div>
                    </Card>
                </Col>
            </Row>

            {/* Period Information */}
            {metrics && (
                <Card style={{ background: '#242424', borderColor: '#3a3a3a' }}>
                    <Row justify="space-between" align="middle">
                        <Col>
                            <Text type="secondary">Reporting Period: </Text>
                            <Text strong style={{ color: '#ff6b35' }}>
                                {metrics.periodStart ? new Date(metrics.periodStart).toLocaleDateString() : 'N/A'} - {metrics.periodEnd ? new Date(metrics.periodEnd).toLocaleDateString() : 'N/A'}
                            </Text>
                        </Col>
                        <Col>
                            <Badge
                                color="#52c41a"
                                text={<Text style={{ color: '#52c41a' }}>Data Updated</Text>}
                            />
                        </Col>
                    </Row>
                </Card>
            )}

            {/* Net Movement Detail Modal */}
            <Modal
                title={
                    <span style={{ color: '#ff6b35', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <SwapOutlined />
                        Net Movement Breakdown Details
                    </span>
                }
                open={netMovementModalVisible}
                onCancel={() => setNetMovementModalVisible(false)}
                footer={[
                    <Button key="close" onClick={() => setNetMovementModalVisible(false)}>
                        Close
                    </Button>
                ]}
                style={{ top: 20 }}
                styles={{
                    content: { background: '#1a1a1a' },
                    header: { background: '#242424', borderBottom: '1px solid #3a3a3a' }
                }}
            >
                <div style={{ padding: '16px 0' }}>
                    <Row gutter={[16, 16]}>
                        <Col span={24}>
                            <Card style={{ background: '#242424', borderColor: '#52c41a', borderWidth: '2px' }}>
                                <div style={{ textAlign: 'center' }}>
                                    <ShoppingCartOutlined style={{ fontSize: '32px', color: '#52c41a', marginBottom: '8px' }} />
                                    <div>
                                        <Text strong style={{ color: '#52c41a', fontSize: '18px' }}>Purchases</Text>
                                        <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#52c41a', margin: '8px 0' }}>
                                            +{formatNumber(metrics?.netMovementBreakdown?.purchases || 0)}
                                        </div>
                                        <Text type="secondary">Assets acquired through procurement</Text>
                                    </div>
                                </div>
                            </Card>
                        </Col>

                        <Col span={12}>
                            <Card style={{ background: '#242424', borderColor: '#1890ff', borderWidth: '2px' }}>
                                <div style={{ textAlign: 'center' }}>
                                    <ArrowDownOutlined style={{ fontSize: '24px', color: '#1890ff', marginBottom: '8px' }} />
                                    <div>
                                        <Text strong style={{ color: '#1890ff' }}>Transfers In</Text>
                                        <div style={{ fontSize: '22px', fontWeight: 'bold', color: '#1890ff', margin: '8px 0' }}>
                                            +{formatNumber(metrics?.netMovementBreakdown?.transfersIn || 0)}
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        </Col>

                        <Col span={12}>
                            <Card style={{ background: '#242424', borderColor: '#ff4d4f', borderWidth: '2px' }}>
                                <div style={{ textAlign: 'center' }}>
                                    <ArrowUpOutlined style={{ fontSize: '24px', color: '#ff4d4f', marginBottom: '8px' }} />
                                    <div>
                                        <Text strong style={{ color: '#ff4d4f' }}>Transfers Out</Text>
                                        <div style={{ fontSize: '22px', fontWeight: 'bold', color: '#ff4d4f', margin: '8px 0' }}>
                                            -{formatNumber(metrics?.netMovementBreakdown?.transfersOut || 0)}
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        </Col>

                        <Col span={24}>
                            <div style={{
                                background: 'linear-gradient(135deg, rgba(255, 107, 53, 0.1), rgba(255, 140, 66, 0.05))',
                                border: '2px solid #ff6b35',
                                borderRadius: '8px',
                                padding: '20px',
                                textAlign: 'center'
                            }}>
                                <Text strong style={{ color: '#ff6b35', fontSize: '16px' }}>Net Movement Result</Text>
                                <div style={{
                                    fontSize: '32px',
                                    fontWeight: 'bold',
                                    color: (metrics?.metrics?.netMovement || 0) >= 0 ? '#52c41a' : '#ff4d4f',
                                    margin: '12px 0',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '8px'
                                }}>
                                    {(metrics?.metrics?.netMovement || 0) >= 0 ?
                                        <ArrowUpOutlined /> : <ArrowDownOutlined />}
                                    {formatNumber(Math.abs(metrics?.metrics?.netMovement || 0))}
                                </div>
                                <Text type="secondary">Total net change in asset inventory</Text>
                            </div>
                        </Col>
                    </Row>
                </div>
            </Modal>
        </div>
    );
};

export default Dashboard;