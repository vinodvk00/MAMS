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
} from 'antd';
import { EditOutlined, DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { useEquipments } from '../hooks/useEquipments.hook.js';
import EquipmentForm from '../components/equipment/EquipmentForm.jsx';

const { Title } = Typography;

const categoryColors = {
    WEAPON: 'volcano',
    VEHICLE: 'blue',
    AMMUNITION: 'gold',
    EQUIPMENT: 'cyan',
    OTHER: 'geekblue',
};

const Equipments = () => {
    const {
        equipments,
        loading,
        error,
        addEquipment,
        updateEquipment,
        deleteEquipment,
    } = useEquipments();

    const [isModalVisible, setIsModalVisible] = useState(false);
    const [editingEquipment, setEditingEquipment] = useState(null);

    const handleShowModal = (equipment = null) => {
        setEditingEquipment(equipment);
        setIsModalVisible(true);
    };

    const handleCancelModal = () => {
        setIsModalVisible(false);
        setEditingEquipment(null);
    };

    const handleFormSubmit = async (values) => {
        let success = false;
        if (editingEquipment) {
            success = await updateEquipment(editingEquipment._id, values);
        } else {
            success = await addEquipment(values);
        }

        if (success) {
            handleCancelModal();
        }
    };

    const handleDelete = (id) => {
        deleteEquipment(id);
    };

    const columns = [
        {
            title: 'Name',
            dataIndex: 'name',
            key: 'name',
            sorter: (a, b) => a.name.localeCompare(b.name),
        },
        {
            title: 'Code',
            dataIndex: 'code',
            key: 'code',
        },
        {
            title: 'Category',
            dataIndex: 'category',
            key: 'category',
            filters: [
                { text: 'Weapon', value: 'WEAPON' },
                { text: 'Vehicle', value: 'VEHICLE' },
                { text: 'Ammunition', value: 'AMMUNITION' },
                { text: 'Equipment', value: 'EQUIPMENT' },
                { text: 'Other', value: 'OTHER' },
            ],
            onFilter: (value, record) => record.category.indexOf(value) === 0,
            render: (category) => (
                <Tag color={categoryColors[category] || 'default'} key={category}>
                    {category.toUpperCase()}
                </Tag>
            ),
        },
        {
            title: 'Description',
            dataIndex: 'description',
            key: 'description',
            ellipsis: true,
            render: (description) => (
                <Tooltip placement="topLeft" title={description}>
                    {description || '-'}
                </Tooltip>
            ),
        },
        {
            title: 'Status',
            dataIndex: 'isActive',
            key: 'isActive',
            filters: [
                { text: 'Active', value: true },
                { text: 'Inactive', value: false },
            ],
            onFilter: (value, record) => record.isActive === value,
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
                    <Popconfirm
                        title="Delete Equipment Type?"
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
                        Equipment Types
                    </Title>
                </Col>
                <Col>
                    <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={() => handleShowModal()}
                    >
                        Add Equipment Type
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
                dataSource={equipments}
                loading={loading}
                rowKey="_id"
            />

            {isModalVisible && (
                <EquipmentForm
                    visible={isModalVisible}
                    onFinish={handleFormSubmit}
                    onCancel={handleCancelModal}
                    initialData={editingEquipment}
                />
            )}
        </>
    );
};

export default Equipments;
