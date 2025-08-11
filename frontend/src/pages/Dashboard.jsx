import React, { useState, useMemo } from 'react';
import {
    Layout,
    Row,
    Col,
    Card,
    Statistic,
    Select,
    DatePicker,
    Spin,
    Alert,
    Modal,
    Table,
    Typography,
    Tag,
    Skeleton
} from 'antd';
import {
    ArrowUpOutlined,
    ArrowDownOutlined,
    HomeOutlined,
    DeploymentUnitOutlined,
    CheckCircleOutlined,
    ShoppingOutlined,
    WarningOutlined
} from '@ant-design/icons';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useDashboard } from '../hooks/useDashboard.hook';

const { Content } = Layout;
const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

const DashboardPage = () => {
    const {
        metrics,
        netMovementBreakdown,
        filterOptions,
        setFilters,
        isLoading,
        error,
        detailData,
        fetchDetailData,
    } = useDashboard();

    const [isModalVisible, setIsModalVisible] = useState(false);
    const [modalInfo, setModalInfo] = useState({ title: '', type: '' });

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const handleCardClick = (type, title) => {
        setModalInfo({ type, title });
        fetchDetailData(type, 1);
        setIsModalVisible(true);
    };

    const chartData = useMemo(() => [
        { type: 'Purchases', value: netMovementBreakdown.purchases || 0, color: '#52c41a' },
        { type: 'Transfers In', value: netMovementBreakdown.transfersIn || 0, color: '#1890ff' },
        { type: 'Transfers Out', value: netMovementBreakdown.transfersOut || 0, color: '#ff4d4f' },
    ], [netMovementBreakdown]);

    const modalColumns = useMemo(() => ({
        purchases: [
            { title: 'Date', dataIndex: 'purchaseDate', render: (date) => new Date(date).toLocaleDateString() },
            { title: 'Equipment', dataIndex: ['equipmentType', 'name'] },
            { title: 'Base', dataIndex: ['base', 'name'] },
            { title: 'Quantity', dataIndex: 'quantity', align: 'right' },
            { title: 'Total Amount', dataIndex: 'totalAmount', align: 'right', render: (val) => `$${val.toLocaleString()}` },
        ],
        transfersIn: [
            { title: 'Date', dataIndex: 'transferDate', render: (date) => new Date(date).toLocaleDateString() },
            { title: 'From Base', dataIndex: ['fromBase', 'name'] },
            { title: 'Equipment', dataIndex: ['equipmentType', 'name'] },
            { title: 'Quantity', dataIndex: 'totalQuantity', align: 'right' },
            { title: 'Status', dataIndex: 'status', render: (status) => <Tag color="green">{status}</Tag> },
        ],
        transfersOut: [
            { title: 'Date', dataIndex: 'transferDate', render: (date) => new Date(date).toLocaleDateString() },
            { title: 'To Base', dataIndex: ['toBase', 'name'] },
            { title: 'Equipment', dataIndex: ['equipmentType', 'name'] },
            { title: 'Quantity', dataIndex: 'totalQuantity', align: 'right' },
            { title: 'Status', dataIndex: 'status', render: (status) => <Tag color="blue">{status}</Tag> },
        ],
    }), []);

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="custom-tooltip" style={{ backgroundColor: '#2a2a2a', padding: '8px 12px', border: '1px solid #3a3a3a', borderRadius: '6px' }}>
                    <p className="label" style={{ color: '#e0e0e0', margin: 0 }}>{`${label} : ${payload[0].value}`}</p>
                </div>
            );
        }
        return null;
    };

    return (
        <Layout style={{ minHeight: '100vh' }}>
            <Content style={{ padding: '24px' }}>
                {error && <Alert message="Error" description={error} type="error" showIcon closable style={{ marginBottom: 24 }} />}

                <Card style={{ marginBottom: 24 }}>
                    <Row gutter={[16, 16]} align="bottom">
                        <Col xs={24} sm={12} md={8}>
                            <Text strong>Filter by Date Range</Text><br />
                            <RangePicker style={{ width: '100%' }} onChange={(dates) => handleFilterChange('dateRange', dates)} />
                        </Col>
                        <Col xs={24} sm={12} md={8}>
                            <Text strong>Filter by Base</Text><br />
                            <Select
                                style={{ width: '100%' }}
                                placeholder="All Bases"
                                allowClear
                                loading={isLoading}
                                onChange={(val) => handleFilterChange('baseId', val)}
                                options={(filterOptions?.bases || []).map(b => ({ value: b._id, label: b.name }))}
                            />
                        </Col>
                        <Col xs={24} sm={24} md={8}>
                            <Text strong>Filter by Equipment</Text><br />
                            <Select
                                style={{ width: '100%' }}
                                placeholder="All Equipment Types"
                                allowClear
                                loading={isLoading}
                                onChange={(val) => handleFilterChange('equipmentTypeId', val)}
                                options={(filterOptions?.equipmentTypes || []).map(e => ({ value: e._id, label: e.name }))}
                            />
                        </Col>
                    </Row>
                </Card>

                <Spin spinning={isLoading} tip="Loading Metrics...">
                    <Row gutter={[16, 16]}>
                        <Col xs={12} sm={12} md={8} lg={4}><Card><Statistic title="Opening Balance" value={metrics.openingBalance} prefix={<HomeOutlined />} /></Card></Col>
                        <Col xs={12} sm={12} md={8} lg={4}><Card><Statistic title="Assigned Assets" value={metrics.assignedCount} prefix={<DeploymentUnitOutlined />} /></Card></Col>
                        <Col xs={12} sm={12} md={8} lg={4}><Card><Statistic title="Expended Assets" value={metrics.expendedCount} prefix={<WarningOutlined />} /></Card></Col>
                        <Col xs={12} sm={12} md={12} lg={6}>
                            <Card>
                                <Statistic
                                    title="Net Asset Movement"
                                    value={metrics.netMovement}
                                    valueStyle={{ color: metrics.netMovement >= 0 ? '#52c41a' : '#ff4d4f' }}
                                    prefix={metrics.netMovement >= 0 ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
                                />
                            </Card>
                        </Col>
                        <Col xs={24} sm={24} md={12} lg={6}><Card><Statistic title="Closing Balance" value={metrics.closingBalance} prefix={<CheckCircleOutlined />} /></Card></Col>
                    </Row>

                    <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
                        <Col xs={24} lg={12}>
                            <Card title="Net Movement Breakdown">
                                {isLoading ? (
                                    <Skeleton.Node active style={{ height: 250, width: '100%' }}><div /></Skeleton.Node>
                                ) : (
                                    <ResponsiveContainer width="100%" height={250}>
                                        <BarChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                                            <XAxis dataKey="type" stroke="#8a8a8a" tick={{ fill: '#8a8a8a' }} />
                                            <YAxis stroke="#8a8a8a" tick={{ fill: '#8a8a8a' }} />
                                            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(138, 138, 138, 0.1)' }} />
                                            <Bar dataKey="value">
                                                {chartData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                )}
                            </Card>
                        </Col>
                        <Col xs={24} lg={12}>
                            <Card title="Movement Details">
                                <Row gutter={[16, 16]}>
                                    <Col xs={24} sm={8}>
                                        <Card hoverable onClick={() => handleCardClick('purchases', 'Purchase Details')}>
                                            <Statistic title="Purchases" value={netMovementBreakdown.purchases} prefix={<ShoppingOutlined style={{ color: '#52c41a' }} />} />
                                        </Card>
                                    </Col>
                                    <Col xs={24} sm={8}>
                                        <Card hoverable onClick={() => handleCardClick('transfersIn', 'Transfer In Details')}>
                                            <Statistic title="Transfers In" value={netMovementBreakdown.transfersIn} prefix={<ArrowDownOutlined style={{ color: '#1890ff' }} />} />
                                        </Card>
                                    </Col>
                                    <Col xs={24} sm={8}>
                                        <Card hoverable onClick={() => handleCardClick('transfersOut', 'Transfer Out Details')}>
                                            <Statistic title="Transfers Out" value={netMovementBreakdown.transfersOut} prefix={<ArrowUpOutlined style={{ color: '#ff4d4f' }} />} />
                                        </Card>
                                    </Col>
                                </Row>
                            </Card>
                        </Col>
                    </Row>
                </Spin>

                <Modal
                    title={modalInfo.title}
                    open={isModalVisible}
                    onCancel={() => setIsModalVisible(false)}
                    footer={null}
                    width="85%"
                    styles={{ body: { maxHeight: '70vh', overflowY: 'auto' } }}
                >
                    <Table
                        loading={detailData.isLoading}
                        dataSource={detailData.data}
                        columns={modalColumns[modalInfo.type] || []}
                        rowKey="_id"
                        pagination={{
                            current: detailData.pagination?.currentPage,
                            pageSize: 10,
                            total: detailData.pagination?.totalRecords,
                            onChange: (page) => fetchDetailData(modalInfo.type, page),
                        }}
                        scroll={{ x: 'max-content' }}
                    />
                    {detailData.error && <Alert message="Error fetching details" description={detailData.error} type="error" showIcon style={{ marginTop: 16 }} />}
                </Modal>
            </Content>
        </Layout>
    );
};

export default DashboardPage;
