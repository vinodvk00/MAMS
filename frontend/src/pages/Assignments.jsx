import { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, message, Space, Tag, App, Select, Input, Popconfirm } from 'antd';
import {
    PlusOutlined,
    EyeOutlined,
    CheckSquareOutlined,
    EditOutlined,
    DeleteOutlined,
    WarningOutlined,
    QuestionCircleOutlined,
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
    const [editingAssignment, setEditingAssignment] = useState(null);
    const [viewingAssignment, setViewingAssignment] = useState(null);
    const [isReturnModalVisible, setIsReturnModalVisible] = useState(false);
    const [returningAssignment, setReturningAssignment] = useState(null);
    const [returnForm] = Form.useForm();
    const [form] = Form.useForm();
    const { user } = useAuth();
    const { message: messageApi, modal: modalApi } = App.useApp();
    const statusOrder = {
        'ACTIVE': 1,
        'RETURNED': 2,
        'DAMAGED': 3,
        'LOST': 4,
        'EXPENDED': 5,
    };

    const [isLostOrDamagedModalVisible, setIsLostOrDamagedModalVisible] = useState(false);
    const [editingAssignmentStatus, setEditingAssignmentStatus] = useState(null);
    const [lostOrDamagedForm] = Form.useForm();

    const showLostOrDamagedModal = (assignment) => {
        setEditingAssignmentStatus(assignment);
        setIsLostOrDamagedModalVisible(true);
    };

    const handleMarkAsLostOrDamaged = async () => {
        try {
            const values = await lostOrDamagedForm.validateFields();
            await assignmentsAPI.markAsLostOrDamaged(editingAssignmentStatus._id, values);
            messageApi.success(`Asset marked as ${values.status.toLowerCase()} successfully`);
            fetchData();
            handleCancel();
        } catch (error) {
            messageApi.error(error.message || 'Failed to update asset status');
        }
    };




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

    const showModal = (assignment = null) => {
        setEditingAssignment(assignment);
        if (assignment) {
            form.setFieldsValue({
                ...assignment,
                assetId: assignment.asset?._id,
                assignedToUserId: assignment.assignedTo?._id,
                assignmentDate: assignment.assignmentDate ? dayjs(assignment.assignmentDate) : null,
                expectedReturnDate: assignment.expectedReturnDate ? dayjs(assignment.expectedReturnDate) : null,
            });
        } else {
            form.resetFields();
        }
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
        setEditingAssignment(null);
        setReturningAssignment(null);
        setIsLostOrDamagedModalVisible(false);
        returnForm.resetFields();
        form.resetFields();
    };

    const handleFormSubmit = async () => {
        try {
            const values = await form.validateFields();
            if (editingAssignment) {
                await assignmentsAPI.update(editingAssignment._id, values);
                messageApi.success('Assignment updated successfully');
            } else {
                await assignmentsAPI.create(values);
                messageApi.success('Assignment created successfully');
            }
            fetchData();
            handleCancel();
        } catch (error) {
            messageApi.error(error.message || `Failed to ${editingAssignment ? 'update' : 'create'} assignment`);
        }
    };

    // const handleDelete = async (id) => {
    //     try {
    //         await assignmentsAPI.delete(id);
    //         messageApi.success('Assignment deleted successfully');
    //         fetchData();
    //     } catch (error) {
    //         messageApi.error(error.message || 'Failed to delete assignment');
    //     }
    // };


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
        {
            title: 'ID'
            , dataIndex: '_id',
            key: '_id'
        },
        {
            title: 'Asset',
            dataIndex: ['asset', 'serialNumber'],
            key: 'asset'
        },
        {
            title: 'Assigned To',
            dataIndex: ['assignedTo', 'fullname'],
            key: 'assignedTo'
        },
        {
            title: 'Assignment Date',
            dataIndex: 'assignmentDate',
            key: 'assignmentDate', render: (date) => dayjs(date).format('YYYY-MM-DD')
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status', render: getStatusTag,
            sorter: (a, b) => statusOrder[a.status] - statusOrder[b.status],
        },
        {
            title: "Created At",
            dataIndex: 'createdAt',
            key: 'createdAt',
            sorter: (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
        },
        {
            title: 'Actions',
            key: 'actions',
            render: (_, record) => (
                <Space>
                    <Button icon={<EyeOutlined />} onClick={() => showViewModal(record)} />
                    {canManageAssignments && record.status === 'ACTIVE' && (
                        <>
                            <Button icon={<CheckSquareOutlined />} onClick={() => showReturnModal(record)}>
                                Return
                            </Button>
                            <Button icon={<WarningOutlined />} danger onClick={() => showLostOrDamagedModal(record)}>
                                Report Issue
                            </Button>
                        </>

                    )}
                    {/* {canManageAssignments && (
                        <>
                            <Button icon={<EditOutlined />} onClick={() => showModal(record)} />
                            <Popconfirm
                                title="Are you sure you want to delete this assignment?"
                                onConfirm={() => handleDelete(record._id)}
                                okText="Yes"
                                cancelText="No"
                            >
                                <Button icon={<DeleteOutlined />} danger />
                            </Popconfirm>
                        </>
                    )} */}
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
                    onClick={() => showModal()}
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
                title={editingAssignment ? 'Edit Assignment' : 'Create New Assignment'}
                open={isModalVisible}
                onOk={handleFormSubmit}
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
            <Modal
                title="Report Asset Issue"
                open={isLostOrDamagedModalVisible}
                onOk={handleMarkAsLostOrDamaged}
                onCancel={handleCancel}
            >
                <Form form={lostOrDamagedForm} layout="vertical">
                    <Form.Item
                        name="status"
                        label="Status"
                        rules={[{ required: true, message: 'Please select a status!' }]}
                    >
                        <Select placeholder="Select a status">
                            <Select.Option value="LOST">Lost</Select.Option>
                            <Select.Option value="DAMAGED">Damaged</Select.Option>
                        </Select>
                    </Form.Item>
                    <Form.Item name="notes" label="Notes">
                        <Input.TextArea rows={2} placeholder="Provide details about the issue..." />
                    </Form.Item>
                </Form>
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