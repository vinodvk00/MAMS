import { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, message, Space, Tag, App } from 'antd';
import {
    PlusOutlined,
    EyeOutlined,
    CheckCircleOutlined,
    CloseCircleOutlined,
    SyncOutlined,
} from '@ant-design/icons';
import { transfersAPI, baseAPI, equipmentTypesAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import TransferForm from '../components/transfer/TransferForm';

const TransfersContent = () => {
    const [transfers, setTransfers] = useState([]);
    const [bases, setBases] = useState([]);
    const [equipmentTypes, setEquipmentTypes] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [viewingTransfer, setViewingTransfer] = useState(null);
    const [form] = Form.useForm();
    const { user } = useAuth();
    const { message: messageApi, modal: modalApi } = App.useApp();

    const canInitiateTransfer = user?.role === 'admin' || user?.role === 'base_commander' || user?.role === 'logistics_officer';
    const canApproveTransfer = user?.role === 'admin' || user?.role === 'logistics_officer';
    const canCompleteTransfer = user?.role === 'admin' || user?.role === 'base_commander' || user?.role === 'logistics_officer';
    const canCancelTransfer = user?.role === 'admin' || user?.role === 'base_commander' || user?.role === 'logistics_officer';

    const fetchData = async () => {
        setLoading(true);
        try {
            const [transfersRes, basesRes, equipmentTypesRes] = await Promise.all([
                transfersAPI.getAll(),
                baseAPI.getAll(),
                equipmentTypesAPI.getAll(),
            ]);
            setTransfers(transfersRes.data);
            setBases(basesRes.data);
            setEquipmentTypes(equipmentTypesRes.data);
        } catch (error) {
            messageApi.error(error.message || 'Failed to fetch data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const showModal = () => {
        form.resetFields();
        setIsModalVisible(true);
    };

    const showViewModal = (transfer) => {
        setViewingTransfer(transfer);
    };

    const handleCancel = () => {
        setIsModalVisible(false);
    };

    const handleInitiateTransfer = async () => {
        try {
            const values = await form.validateFields();
            await transfersAPI.initiate(values);
            messageApi.success('Transfer initiated successfully');
            fetchData();
            handleCancel();
        } catch (error) {
            messageApi.error(error.message || 'Failed to initiate transfer');
        }
    };

    const handleApprove = async (id) => {
        try {
            await transfersAPI.approve(id);
            messageApi.success('Transfer approved');
            fetchData();
        } catch (error) {
            messageApi.error(error.message || 'Failed to approve transfer');
        }
    };

    const handleComplete = async (id) => {
        try {
            await transfersAPI.complete(id);
            messageApi.success('Transfer completed');
            fetchData();
        } catch (error) {
            messageApi.error(error.message || 'Failed to complete transfer');
        }
    };

    const handleCancelTransfer = (id) => {
        modalApi.confirm({
            title: 'Are you sure you want to cancel this transfer?',
            content: 'This action cannot be undone.',
            okText: 'Yes, cancel it',
            okType: 'danger',
            onOk: async () => {
                try {
                    await transfersAPI.cancel(id);
                    messageApi.success('Transfer cancelled');
                    fetchData();
                } catch (error) {
                    messageApi.error(error.message || 'Failed to cancel transfer');
                }
            },
        });
    };

    const getStatusTag = (status) => {
        switch (status) {
            case 'INITIATED':
                return <Tag color="gold" icon={<SyncOutlined spin />}>{status}</Tag>;
            case 'IN_TRANSIT':
                return <Tag color="blue">{status}</Tag>;
            case 'COMPLETED':
                return <Tag color="green">{status}</Tag>;
            case 'CANCELLED':
                return <Tag color="red">{status}</Tag>;
            default:
                return <Tag>{status}</Tag>;
        }
    };

    const columns = [
        { title: 'From Base', dataIndex: ['fromBase', 'name'], key: 'fromBase' },
        { title: 'To Base', dataIndex: ['toBase', 'name'], key: 'toBase' },
        { title: 'Equipment', dataIndex: ['equipmentType', 'name'], key: 'equipmentType' },
        { title: 'Quantity', dataIndex: 'totalQuantity', key: 'totalQuantity' },
        { title: 'Status', dataIndex: 'status', key: 'status', render: getStatusTag },
        {
            title: 'Actions',
            key: 'actions',
            render: (_, record) => {
                const isInitiated = record.status === 'INITIATED';
                const isInTransit = record.status === 'IN_TRANSIT';
                const isToUserBase = record.toBase?._id === user?.assignedBase;

                return (
                    <Space>
                        <Button icon={<EyeOutlined />} onClick={() => showViewModal(record)} />
                        {canApproveTransfer && isInitiated && (
                            <Button icon={<CheckCircleOutlined />} onClick={() => handleApprove(record._id)}>
                                Approve
                            </Button>
                        )}
                        {canCompleteTransfer && isInTransit && (isToUserBase || user?.role === 'admin' || user?.role === 'logistics_officer') && (
                            <Button type="primary" onClick={() => handleComplete(record._id)}>
                                Complete
                            </Button>
                        )}
                        {canCancelTransfer && (isInitiated || isInTransit) && (
                            <Button danger icon={<CloseCircleOutlined />} onClick={() => handleCancelTransfer(record._id)}>
                                Cancel
                            </Button>
                        )}
                    </Space>
                );
            },
        },
    ];

    return (
        <div>
            {canInitiateTransfer && (
                <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={showModal}
                    style={{ marginBottom: 16, float: 'right' }}
                >
                    Initiate Transfer
                </Button>
            )}
            <Table
                columns={columns}
                dataSource={transfers}
                loading={loading}
                rowKey="_id"
                scroll={{ x: true }}
            />
            <Modal
                title="Initiate New Transfer"
                open={isModalVisible}
                onOk={handleInitiateTransfer}
                onCancel={handleCancel}
                width={600}
            >
                <TransferForm form={form} bases={bases} equipmentTypes={equipmentTypes} user={user} />
            </Modal>
            <Modal
                title="Transfer Details"
                open={!!viewingTransfer}
                onCancel={() => setViewingTransfer(null)}
                footer={null}
            >
                {viewingTransfer && (
                    <div>
                        <p><strong>From:</strong> {viewingTransfer.fromBase?.name}</p>
                        <p><strong>To:</strong> {viewingTransfer.toBase?.name}</p>
                        <p><strong>Equipment:</strong> {viewingTransfer.equipmentType?.name}</p>
                        <p><strong>Quantity:</strong> {viewingTransfer.totalQuantity}</p>
                        <p><strong>Status:</strong> {getStatusTag(viewingTransfer.status)}</p>
                        <p><strong>Initiated By:</strong> {viewingTransfer.initiatedBy?.fullname}</p>
                        <p><strong>Transport Details:</strong> {viewingTransfer.transportDetails}</p>
                        <p><strong>Notes:</strong> {viewingTransfer.notes}</p>
                    </div>
                )}
            </Modal>
        </div>
    );
};

const Transfers = () => (
    <App>
        <TransfersContent />
    </App>
);

export default Transfers;