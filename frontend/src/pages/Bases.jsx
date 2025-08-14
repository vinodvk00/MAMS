import React, { useState } from "react";
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
} from "antd";
import {
    EditOutlined,
    DeleteOutlined,
    PlusOutlined,
    HomeOutlined,
} from "@ant-design/icons";
import { useBases } from "../hooks/useBases.hook.js";
import BaseForm from "../components/bases/BaseForm.jsx";

const { Title } = Typography;

const Bases = () => {
    const { bases, loading, error, addBase, updateBase, deleteBase, users } =
        useBases();

    const [isModalVisible, setIsModalVisible] = useState(false);
    const [editingBase, setEditingBase] = useState(null);

    const handleShowModal = (base = null) => {
        setEditingBase(base);
        setIsModalVisible(true);
    };

    const handleCancelModal = () => {
        setIsModalVisible(false);
        setEditingBase(null);
    };

    const handleFormSubmit = async values => {
        let success = false;
        if (editingBase) {
            success = await updateBase(editingBase._id, values);
        } else {
            success = await addBase(values);
        }

        if (success) {
            handleCancelModal();
        }
    };

    const handleDelete = id => {
        deleteBase(id);
    };

    const columns = [
        {
            title: "Name",
            dataIndex: "name",
            key: "name",
            sorter: (a, b) => a.name.localeCompare(b.name),
        },
        {
            title: "Code",
            dataIndex: "code",
            key: "code",
        },
        {
            title: "Location",
            dataIndex: "location",
            key: "location",
        },
        {
            title: "Commander",
            dataIndex: "commander",
            key: "commander",
            render: commander => commander?.fullname || "N/A",
        },
        {
            title: "Contact Information",
            dataIndex: "contactInfo",
            key: "contactInfo",
        },
        {
            title: "Status",
            dataIndex: "isActive",
            key: "isActive",
            render: isActive => (
                <Tag color={isActive ? "green" : "grey"}>
                    {isActive ? "Active" : "Inactive"}
                </Tag>
            ),
        },
        {
            title: "Date Added",
            dataIndex: "createdAt",
            key: "createdAt",
            render: date => new Date(date).toLocaleDateString(),
            sorter: (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
        },
        {
            title: "Actions",
            key: "actions",
            align: "center",
            render: (_, record) => (
                <Space size='middle'>
                    <Tooltip title='Edit'>
                        <Button
                            type='text'
                            icon={<EditOutlined />}
                            onClick={() => handleShowModal(record)}
                        />
                    </Tooltip>
                    <Popconfirm
                        title='Delete Base?'
                        description='This action is permanent. Are you sure?'
                        onConfirm={() => handleDelete(record._id)}
                        okText='Yes, Delete'
                        cancelText='No'
                        okButtonProps={{ danger: true }}
                    >
                        <Tooltip title='Delete'>
                            <Button
                                type='text'
                                danger
                                icon={<DeleteOutlined />}
                            />
                        </Tooltip>
                    </Popconfirm>
                </Space>
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
                        Bases
                    </Title>
                </Col>
                <Col>
                    <Button
                        type='primary'
                        icon={<PlusOutlined />}
                        onClick={() => handleShowModal()}
                    >
                        Add Base
                    </Button>
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
                dataSource={bases}
                loading={loading}
                rowKey='_id'
            />

            {isModalVisible && (
                <BaseForm
                    visible={isModalVisible}
                    onFinish={handleFormSubmit}
                    onCancel={handleCancelModal}
                    initialData={editingBase}
                    users={users}
                />
            )}
        </>
    );
};

export default Bases;
