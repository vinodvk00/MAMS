import React, { useState } from 'react';
import {
    Table,
    Typography,
    Button,
    Row,
    Col,
    Tag,
    Space,
    Tooltip,
    Popconfirm,
    Alert,
    Modal,
    Select
} from 'antd';
import { EditOutlined, DeleteOutlined, PlusOutlined, UserSwitchOutlined } from '@ant-design/icons';
import { useUsers } from '../hooks/useUsers.hook.js';
import UserForm from '../components/users/UserForm.jsx';

const { Title } = Typography;
const { Option } = Select;

const roleColors = {
    admin: 'red',
    base_commander: 'blue',
    logistics_officer: 'green',
    user: 'default',
};

const Users = () => {
    const {
        users,
        loading,
        error,
        addUser,
        updateUser,
        deleteUser,
        changeUserRole,
        bases,
    } = useUsers();

    const [isModalVisible, setIsModalVisible] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [isRoleModalVisible, setIsRoleModalVisible] = useState(false);
    const [roleChangeUser, setRoleChangeUser] = useState(null);
    const [newRole, setNewRole] = useState('');

    const handleShowModal = (user = null) => {
        setEditingUser(user);
        setIsModalVisible(true);
    };

    const handleCancelModal = () => {
        setIsModalVisible(false);
        setEditingUser(null);
    };

    const handleFormSubmit = async (values) => {
        let success = false;
        if (editingUser) {
            success = await updateUser(editingUser._id, values);
        } else {
            success = await addUser(values);
        }

        if (success) {
            handleCancelModal();
        }
    };

    const handleDelete = (id) => {
        deleteUser(id);
    };

    const handleShowRoleModal = (user) => {
        setRoleChangeUser(user);
        setNewRole(user.role);
        setIsRoleModalVisible(true);
    };

    const handleCancelRoleModal = () => {
        setIsRoleModalVisible(false);
        setRoleChangeUser(null);
        setNewRole('');
    };

    const handleRoleChange = async () => {
        if (roleChangeUser && newRole) {
            const success = await changeUserRole(roleChangeUser._id, newRole);
            if (success) {
                handleCancelRoleModal();
            }
        }
    };

    const columns = [
        {
            title: 'Full Name',
            dataIndex: 'fullname',
            key: 'fullname',
            sorter: (a, b) => a.fullname.localeCompare(b.fullname),
        },
        {
            title: 'Username',
            dataIndex: 'username',
            key: 'username',
        },
        {
            title: 'Role',
            dataIndex: 'role',
            key: 'role',
            render: (role) => (
                <Tag color={roleColors[role] || 'default'}>
                    {role.replace('_', ' ').toUpperCase()}
                </Tag>
            ),
        },
        {
            title: 'Assigned Base',
            dataIndex: 'assignedBase',
            key: 'assignedBase',
            render: (base) => base?.name || 'N/A',
        },
        {
            title: 'Status',
            dataIndex: 'isActive',
            key: 'isActive',
            render: (isActive) => (
                <Tag color={isActive ? 'green' : 'grey'}>
                    {isActive ? 'Active' : 'Inactive'}
                </Tag>
            ),
        },
        {
            title: 'Date Added',
            dataIndex: 'createdAt',
            key: 'createdAt',
            render: (date) => new Date(date).toLocaleDateString(),
            sorter: (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
        },
        {
            title: 'Actions',
            key: 'actions',
            align: 'center',
            render: (_, record) => (
                <Space size="middle">
                    <Tooltip title="Edit">
                        <Button
                            type="text"
                            icon={<EditOutlined />}
                            onClick={() => handleShowModal(record)}
                        />
                    </Tooltip>
                    <Tooltip title="Change Role">
                        <Button
                            type="text"
                            icon={<UserSwitchOutlined />}
                            onClick={() => handleShowRoleModal(record)}
                        />
                    </Tooltip>
                    <Popconfirm
                        title="Delete User?"
                        description="This action is permanent. Are you sure?"
                        onConfirm={() => handleDelete(record._id)}
                        okText="Yes, Delete"
                        cancelText="No"
                        okButtonProps={{ danger: true }}
                    >
                        <Tooltip title="Delete">
                            <Button type="text" danger icon={<DeleteOutlined />} />
                        </Tooltip>
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    return (
        <>
            <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
                <Col>
                    <Title level={3} style={{ margin: 0 }}>
                        User Management
                    </Title>
                </Col>
                <Col>
                    <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={() => handleShowModal()}
                    >
                        Add User
                    </Button>
                </Col>
            </Row>

            {error && (
                <Alert
                    message="Error"
                    description={error.message || 'Failed to load data. Please try again.'}
                    type="error"
                    showIcon
                    closable
                    style={{ marginBottom: 16 }}
                />
            )}

            <Table
                columns={columns}
                dataSource={users}
                loading={loading}
                rowKey="_id"
            />

            {isModalVisible && (
                <UserForm
                    visible={isModalVisible}
                    onFinish={handleFormSubmit}
                    onCancel={handleCancelModal}
                    initialData={editingUser}
                    bases={bases}
                />
            )}

            {isRoleModalVisible && (
                <Modal
                    title={`Change Role for ${roleChangeUser?.fullname}`}
                    open={isRoleModalVisible}
                    onOk={handleRoleChange}
                    onCancel={handleCancelRoleModal}
                >
                    <Select
                        value={newRole}
                        onChange={(value) => setNewRole(value)}
                        style={{ width: '100%' }}
                    >
                        <Option value="admin">Admin</Option>
                        <Option value="base_commander">Base Commander</Option>
                        <Option value="logistics_officer">Logistics Officer</Option>
                        <Option value="user">User</Option>
                    </Select>
                </Modal>
            )}
        </>
    );
};

export default Users;
