import { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, message, Space, Tag, App, Select, Input } from 'antd';
import {
    PlusOutlined,
    EyeOutlined,
    CheckSquareOutlined,
} from '@ant-design/icons';
import { assignmentsAPI, assetsAPI, userAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import AssignmentForm from '../components/assignment/AssignmentForm';
import dayjs from 'dayjs';

const AssignmentsContent = () => {
    const [assignments, setAssignments] = useState([]);
    const [assets, setAssets] = useState([]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [viewingAssignment, setViewingAssignment] = useState(null);
    const [isReturnModalVisible, setIsReturnModalVisible] = useState(false);
    const [returningAssignment, setReturningAssignment] = useState(null);
    const [returnForm] = Form.useForm();
    const [form] = Form.useForm();
    const { user } = useAuth();
    const { message: messageApi, modal: modalApi } = App.useApp();

    const canManageAssignments = user?.role === 'admin' || user?.role === 'base_commander';

    const fetchData = async () => {
        setLoading(true);
        try {
            const assignmentsRes = await assignmentsAPI.getAll();
            setAssignments(assignmentsRes.data);

            let assetsRes;
            if (user?.role === 'admin') {
                assetsRes = await assetsAPI.getAll();
            } else {
                assetsRes = await assetsAPI.getByBase();
            }
            setAssets(assetsRes.data.filter(asset => asset.status === 'AVAILABLE'));

            const usersRes = await userAPI.getAll();
            if (user?.role === 'admin') {
                setUsers(usersRes.data);
            } else {
                setUsers(usersRes.data.filter(u => u.assignedBase === user.assignedBase));
            }

        } catch (error) {
            messageApi.error(error.message || 'Failed to fetch data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (canManageAssignments) {
            fetchData();
        }
    }, [user]);

    const showModal = () => {
        form.resetFields();
        setIsModalVisible(true);
    };

    const showViewModal = (assignment) => {
        setViewingAssignment(assignment);
    };

    const showReturnModal = (assignment) => {
        setReturningAssignment(assignment);
        setIsReturnModalVisible(true);
    };

    const handleCancel = () => {
        setIsModalVisible(false);
        setIsReturnModalVisible(false);
        setReturningAssignment(null);
        returnForm.resetFields();
    };

    const handleCreateAssignment = async () => {
        try {
            const values = await form.validateFields();
            await assignmentsAPI.create(values);
            messageApi.success('Assignment created successfully');
            fetchData();
            handleCancel();
        } catch (error) {
            messageApi.error(error.message || 'Failed to create assignment');
        }
    };

    const handleReturnAsset = async () => {
        try {
            const values = await returnForm.validateFields();
            await assignmentsAPI.return(returningAssignment._id, values);
            messageApi.success('Asset returned successfully');
            fetchData();
            handleCancel();
        } catch (error) {
            messageApi.error(error.message || 'Failed to return asset');
        }
    };

    const getStatusTag = (status) => {
        switch (status) {
            case 'ACTIVE':
                return <Tag color="blue">{status}</Tag>;
            case 'RETURNED':
                return <Tag color="green">{status}</Tag>;
            case 'LOST':
            case 'DAMAGED':
            case 'EXPENDED':
                return <Tag color="red">{status}</Tag>;
            default:
                return <Tag>{status}</Tag>;
        }
    };

    const columns = [
        { title: 'Asset', dataIndex: ['asset', 'serialNumber'], key: 'asset' },
        { title: 'Assigned To', dataIndex: ['assignedTo', 'fullname'], key: 'assignedTo' },
        { title: 'Assignment Date', dataIndex: 'assignmentDate', key: 'assignmentDate', render: (date) => dayjs(date).format('YYYY-MM-DD') },
        { title: 'Status', dataIndex: 'status', key: 'status', render: getStatusTag },
        {
            title: 'Actions',
            key: 'actions',
            render: (_, record) => (
                <Space>
                    <Button icon={<EyeOutlined />} onClick={() => showViewModal(record)} />
                    {canManageAssignments && record.status === 'ACTIVE' && (
                        <Button icon={<CheckSquareOutlined />} onClick={() => showReturnModal(record)}>
                            Return
                        </Button>
                    )}
                </Space>
            ),
        },
    ];

    return (
        <div>
            {canManageAssignments && (
                <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={showModal}
                    style={{ marginBottom: 16, float: 'right' }}
                >
                    Create Assignment
                </Button>
            )}
            <Table
                columns={columns}
                dataSource={assignments}
                loading={loading}
                rowKey="_id"
                scroll={{ x: true }}
            />
            <Modal
                title="Create New Assignment"
                open={isModalVisible}
                onOk={handleCreateAssignment}
                onCancel={handleCancel}
                width={600}
            >
                <AssignmentForm form={form} assets={assets} users={users} />
            </Modal>
            <Modal
                title="Return Asset"
                open={isReturnModalVisible}
                onOk={handleReturnAsset}
                onCancel={handleCancel}
            >
                <Form form={returnForm} layout="vertical">
                    <Form.Item name="returnCondition" label="Return Condition" initialValue="GOOD">
                        <Select>
                            <Select.Option value="NEW">New</Select.Option>
                            <Select.Option value="GOOD">Good</Select.Option>
                            <Select.Option value="FAIR">Fair</Select.Option>
                            <Select.Option value="POOR">Poor</Select.Option>
                            <Select.Option value="UNSERVICEABLE">Unserviceable</Select.Option>
                        </Select>
                    </Form.Item>
                    <Form.Item name="notes" label="Notes">
                        <Input.TextArea rows={2} />
                    </Form.Item>
                </Form>
            </Modal>
            <Modal
                title="Assignment Details"
                open={!!viewingAssignment}
                onCancel={() => setViewingAssignment(null)}
                footer={null}
            >
                {viewingAssignment && (
                    <div>
                        <p><strong>Asset Serial:</strong> {viewingAssignment.asset?.serialNumber}</p>
                        <p><strong>Equipment:</strong> {viewingAssignment.asset?.equipmentType?.name}</p>
                        <p><strong>Assigned To:</strong> {viewingAssignment.assignedTo?.fullname}</p>
                        <p><strong>Assigned By:</strong> {viewingAssignment.assignedBy?.fullname}</p>
                        <p><strong>Base:</strong> {viewingAssignment.base?.name}</p>
                        <p><strong>Status:</strong> {getStatusTag(viewingAssignment.status)}</p>
                        <p><strong>Assignment Date:</strong> {dayjs(viewingAssignment.assignmentDate).format('YYYY-MM-DD')}</p>
                        <p><strong>Expected Return:</strong> {viewingAssignment.expectedReturnDate ? dayjs(viewingAssignment.expectedReturnDate).format('YYYY-MM-DD') : 'N/A'}</p>
                        <p><strong>Actual Return:</strong> {viewingAssignment.actualReturnDate ? dayjs(viewingAssignment.actualReturnDate).format('YYYY-MM-DD') : 'N/A'}</p>
                        <p><strong>Purpose:</strong> {viewingAssignment.purpose}</p>
                        <p><strong>Notes:</strong> {viewingAssignment.notes}</p>
                    </div>
                )}
            </Modal>
        </div>
    );
};

const Assignments = () => (
    <App>
        <AssignmentsContent />
    </App>
);

export default Assignments;