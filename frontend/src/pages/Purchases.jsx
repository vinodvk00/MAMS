// frontend/src/pages/Purchases.jsx
import { useState } from "react";
import { Table, Button, Modal, Form, Space, Tag, App } from "antd";
import {
    PlusOutlined,
    EditOutlined,
    DeleteOutlined,
    EyeOutlined,
} from "@ant-design/icons";
import { useAuth } from "../context/AuthContext";
import { usePurchases } from "../hooks/usePurchases.hook";
import PurchaseForm from "../components/purchases/PurchaseForm";
import dayjs from "dayjs";

const PurchasesContent = () => {
    const {
        purchases,
        bases,
        equipmentTypes,
        loading,
        addPurchase,
        updatePurchase,
        deletePurchase,
    } = usePurchases();

    const [isModalVisible, setIsModalVisible] = useState(false);
    const [editingPurchase, setEditingPurchase] = useState(null);
    const [viewingPurchase, setViewingPurchase] = useState(null);
    const [form] = Form.useForm();
    const { user } = useAuth();
    const { message: messageApi } = App.useApp();

    const canManagePurchases =
        user?.role === "admin" || user?.role === "logistics_officer";

    const showModal = (purchase = null) => {
        setEditingPurchase(purchase);
        if (purchase) {
            form.setFieldsValue({
                ...purchase,
                base: purchase.base?._id,
                equipmentType: purchase.equipmentType?._id,
                purchaseDate: purchase.purchaseDate
                    ? dayjs(purchase.purchaseDate)
                    : null,
                deliveryDate: purchase.deliveryDate
                    ? dayjs(purchase.deliveryDate)
                    : null,
            });
        } else {
            form.resetFields();
        }
        setIsModalVisible(true);
    };

    const showViewModal = purchase => {
        setViewingPurchase(purchase);
    };

    const handleCancel = () => {
        setIsModalVisible(false);
        setEditingPurchase(null);
        form.resetFields();
    };

    const handleOk = async () => {
        try {
            const values = await form.validateFields();
            if (editingPurchase) {
                await updatePurchase(editingPurchase._id, values);
            } else {
                await addPurchase(values);
            }
            handleCancel();
        } catch (error) {
            messageApi.error(error.message || "Failed to save purchase");
        }
    };

    const handleDelete = async id => {
        Modal.confirm({
            title: "Are you sure you want to delete this purchase?",
            content: "This action cannot be undone.",
            okText: "Yes, delete it",
            okType: "danger",
            cancelText: "No",
            onOk: async () => {
                await deletePurchase(id);
            },
        });
    };

    const getStatusColor = status => {
        switch (status) {
            case "ORDERED":
                return "blue";
            case "DELIVERED":
                return "green";
            case "CANCELLED":
                return "red";
            default:
                return "default";
        }
    };

    const columns = [
        {
            title: "Equipment Type",
            dataIndex: ["equipmentType", "name"],
            key: "equipmentType",
        },
        {
            title: "Base",
            dataIndex: ["base", "name"],
            key: "base",
        },
        { title: "Quantity", dataIndex: "quantity", key: "quantity" },
        {
            title: "Total Amount",
            dataIndex: "totalAmount",
            key: "totalAmount",
            render: amount => `$${amount?.toFixed(2)}`,
        },
        {
            title: "Purchase Date",
            dataIndex: "purchaseDate",
            key: "purchaseDate",
            render: date =>
                date ? new Date(date).toLocaleDateString() : "N/A",
        },
        {
            title: "Status",
            dataIndex: "status",
            key: "status",
            render: status => (
                <Tag color={getStatusColor(status)}>{status}</Tag>
            ),
        },
        {
            title: "Actions",
            key: "actions",
            render: (_, record) => (
                <Space>
                    <Button
                        icon={<EyeOutlined />}
                        onClick={() => showViewModal(record)}
                    />
                    {canManagePurchases && (
                        <>
                            <Button
                                icon={<EditOutlined />}
                                onClick={() => showModal(record)}
                            />
                            <Button
                                icon={<DeleteOutlined />}
                                danger
                                onClick={() => handleDelete(record._id)}
                            />
                        </>
                    )}
                </Space>
            ),
        },
    ];

    return (
        <div>
            {canManagePurchases && (
                <Button
                    type='primary'
                    icon={<PlusOutlined />}
                    onClick={() => showModal()}
                    style={{ marginBottom: 16, float: "right" }}
                >
                    Add Purchase
                </Button>
            )}
            <Table
                columns={columns}
                dataSource={purchases}
                loading={loading}
                rowKey='_id'
                scroll={{ x: true }}
            />

            <Modal
                title={editingPurchase ? "Edit Purchase" : "Add Purchase"}
                open={isModalVisible}
                onOk={handleOk}
                onCancel={handleCancel}
                width={600}
            >
                <PurchaseForm
                    form={form}
                    bases={bases}
                    equipmentTypes={equipmentTypes}
                    isEditing={!!editingPurchase}
                />
            </Modal>

            <Modal
                title='Purchase Details'
                open={!!viewingPurchase}
                onCancel={() => setViewingPurchase(null)}
                footer={null}
            >
                {viewingPurchase && (
                    <div>
                        <p>
                            <strong>Equipment:</strong>{" "}
                            {viewingPurchase.equipmentType?.name}
                        </p>
                        <p>
                            <strong>Base:</strong> {viewingPurchase.base?.name}
                        </p>
                        <p>
                            <strong>Quantity:</strong>{" "}
                            {viewingPurchase.quantity}
                        </p>
                        <p>
                            <strong>Unit Price:</strong> $
                            {viewingPurchase.unitPrice?.toFixed(2)}
                        </p>
                        <p>
                            <strong>Total Amount:</strong> $
                            {viewingPurchase.totalAmount?.toFixed(2)}
                        </p>
                        <p>
                            <strong>Purchase Date:</strong>{" "}
                            {viewingPurchase.purchaseDate
                                ? new Date(
                                      viewingPurchase.purchaseDate
                                  ).toLocaleDateString()
                                : "N/A"}
                        </p>
                        <p>
                            <strong>Delivery Date:</strong>{" "}
                            {viewingPurchase.deliveryDate
                                ? new Date(
                                      viewingPurchase.deliveryDate
                                  ).toLocaleDateString()
                                : "N/A"}
                        </p>
                        <p>
                            <strong>Status:</strong>{" "}
                            <Tag color={getStatusColor(viewingPurchase.status)}>
                                {viewingPurchase.status}
                            </Tag>
                        </p>
                        <p>
                            <strong>Supplier:</strong>{" "}
                            {viewingPurchase.supplier?.name || "N/A"}
                        </p>
                        <p>
                            <strong>Notes:</strong>{" "}
                            {viewingPurchase.notes || "N/A"}
                        </p>
                    </div>
                )}
            </Modal>
        </div>
    );
};

const Purchases = () => (
    <App>
        <PurchasesContent />
    </App>
);

export default Purchases;
