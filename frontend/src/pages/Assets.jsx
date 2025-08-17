import { useState } from "react";
import { Table, Button, Tag, Space, Popconfirm } from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import { useAuth } from "../context/AuthContext";
import { useAssets } from "../hooks/useAssets.hook";
import AssetFormModal from "../components/assets/AssetForm";

const Assets = () => {
    const {
        assets,
        loading,
        deleteAsset,
        addAsset,
        updateAsset,
        bases,
        equipmentTypes,
        purchases,
        formLoading,
    } = useAssets();

    const { user } = useAuth();
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [editingAsset, setEditingAsset] = useState(null);

    const handleAdd = () => {
        setEditingAsset(null);
        setIsModalVisible(true);
    };

    const handleEdit = record => {
        setEditingAsset(record);
        setIsModalVisible(true);
    };

    const handleModalOk = () => {
        setIsModalVisible(false);
    };

    const handleModalCancel = () => {
        setIsModalVisible(false);
    };

    const columns = [
        {
            title: "Serial Number",
            dataIndex: "serialNumber",
            key: "serialNumber",
            sorter: (a, b) => a.serialNumber.localeCompare(b.serialNumber),
        },
        {
            title: "Equipment Type",
            dataIndex: ["equipmentType", "name"],
            key: "equipmentType",
            sorter: (a, b) =>
                a.equipmentType.name.localeCompare(b.equipmentType.name),
        },
        {
            title: "Quantity",
            dataIndex: "quantity",
            key: "quantity",
            sorter: (a, b) => a.quantity - b.quantity,
        },
        {
            title: "Base",
            dataIndex: ["currentBase", "name"],
            key: "base",
            sorter: (a, b) =>
                a.currentBase.name.localeCompare(b.currentBase.name),
        },
        {
            title: "Status",
            dataIndex: "status",
            key: "status",
            render: status => {
                let color;
                switch (status) {
                    case "AVAILABLE":
                        color = "green";
                        break;
                    case "ASSIGNED":
                        color = "blue";
                        break;
                    case "IN_TRANSIT":
                        color = "orange";
                        break;
                    case "MAINTENANCE":
                        color = "gold";
                        break;
                    case "EXPENDED":
                        color = "red";
                        break;
                    default:
                        color = "default";
                }
                return <Tag color={color}>{status}</Tag>;
            },
        },
        {
            title: "Condition",
            dataIndex: "condition",
            key: "condition",
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
            render: (_, record) => (
                <Space>
                    <Button
                        icon={<EditOutlined />}
                        onClick={() => handleEdit(record)}
                    />
                    {user.role === "admin" && (
                        <Popconfirm
                            title='Are you sure you want to delete this asset?'
                            onConfirm={() => deleteAsset(record._id)}
                            okText='Yes'
                            cancelText='No'
                        >
                            <Button icon={<DeleteOutlined />} danger />
                        </Popconfirm>
                    )}
                </Space>
            ),
        },
    ];

    return (
        <div>
            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: 16,
                }}
            >
                <h1>Assets</h1>
                <Button
                    type='primary'
                    icon={<PlusOutlined />}
                    onClick={handleAdd}
                >
                    Add Asset
                </Button>
            </div>
            <Table
                columns={columns}
                dataSource={assets}
                loading={loading}
                rowKey='_id'
                scroll={{ x: true }}
            />
            <AssetFormModal
                visible={isModalVisible}
                onOk={handleModalOk}
                onCancel={handleModalCancel}
                editingAsset={editingAsset}
                bases={bases}
                equipmentTypes={equipmentTypes}
                purchases={purchases}
                formLoading={formLoading}
                user={user}
                addAsset={addAsset}
                updateAsset={updateAsset}
            />
        </div>
    );
};

export default Assets;
