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
    Alert,
    App,
    Input,
    Form,
} from "antd";
import {
    PlusOutlined,
    EyeOutlined,
    CheckCircleOutlined,
    CloseCircleOutlined,
} from "@ant-design/icons";
import { useExpenditures } from "../hooks/useExpenditures.hook.js";
import ExpenditureForm from "../components/expenditure/ExpenditureForm";
import { useAuth } from "../context/AuthContext";
import dayjs from "dayjs";
import { Modal } from "antd";

const { Title } = Typography;
const { TextArea } = Input;

const ExpendituresContent = () => {
    const {
        expenditures,
        loading,
        error,
        createExpenditure,
        approveExpenditure,
        completeExpenditure,
        cancelExpenditure,
        bases,
        equipmentTypes,
        assets,
    } = useExpenditures();

    const [isModalVisible, setIsModalVisible] = useState(false);
    const [viewingExpenditure, setViewingExpenditure] = useState(null);
    const [form] = Form.useForm();
    const { user } = useAuth();
    const { modal: modalApi } = App.useApp();

    const canManage =
        user?.role === "admin" ||
        user?.role === "base_commander" ||
        user?.role === "logistics_officer";

    const handleShowModal = () => {
        setIsModalVisible(true);
    };

    const handleCancelModal = () => {
        setIsModalVisible(false);
    };

    const handleFormSubmit = async values => {
        const success = await createExpenditure(values);
        if (success) {
            handleCancelModal();
        }
    };

    const handleApprove = id => {
        modalApi.confirm({
            title: "Approve this expenditure?",
            onOk: () => approveExpenditure(id),
        });
    };

    const handleComplete = id => {
        modalApi.confirm({
            title: "Complete this expenditure?",
            content:
                "This will mark the assets as expended and cannot be undone.",
            onOk: () => completeExpenditure(id),
        });
    };

    const handleCancel = id => {
        let reason = "";
        modalApi.confirm({
            title: "Cancel this expenditure?",
            content: (
                <TextArea
                    rows={4}
                    placeholder='Reason for cancellation'
                    onChange={e => (reason = e.target.value)}
                />
            ),
            onOk: () => cancelExpenditure(id, reason),
        });
    };

    const getStatusTag = status => {
        switch (status) {
            case "PENDING":
                return <Tag color='gold'>Pending</Tag>;
            case "APPROVED":
                return <Tag color='blue'>Approved</Tag>;
            case "COMPLETED":
                return <Tag color='green'>Completed</Tag>;
            case "CANCELLED":
                return <Tag color='red'>Cancelled</Tag>;
            default:
                return <Tag>{status}</Tag>;
        }
    };

    const columns = [
        {
            title: "Equipment",
            dataIndex: ["equipmentType", "name"],
            key: "equipmentType",
            sorter: (a, b) =>
                a.equipmentType.name.localeCompare(b.equipmentType.name),
        },
        {
            title: "Base",
            dataIndex: ["base", "name"],
            key: "base",
            sorter: (a, b) => a.base.name.localeCompare(b.base.name),
        },
        {
            title: "Quantity",
            dataIndex: "quantity",
            key: "quantity",
            sorter: (a, b) => a.quantity - b.quantity,
        },
        {
            title: "Reason",
            dataIndex: "reason",
            key: "reason",
            sorter: (a, b) => a.reason.localeCompare(b.reason),
        },
        {
            title: "Status",
            dataIndex: "status",
            key: "status",
            render: getStatusTag,
            sorter: (a, b) => a.status.localeCompare(b.status),
        },
        {
            title: "Date",
            dataIndex: "expenditureDate",
            key: "expenditureDate",
            render: date => dayjs(date).format("YYYY-MM-DD HH:mm:ss"),
            sorter: (a, b) =>
                dayjs(a.expenditureDate).unix() -
                dayjs(b.expenditureDate).unix(),
        },
        {
            title: "Actions",
            key: "actions",
            align: "center",
            render: (_, record) => (
                <Space size='middle'>
                    <Tooltip title='View Details'>
                        <Button
                            type='text'
                            icon={<EyeOutlined />}
                            onClick={() => setViewingExpenditure(record)}
                        />
                    </Tooltip>
                    {record.status === "PENDING" && canManage && (
                        <Tooltip title='Approve'>
                            <Button
                                type='text'
                                icon={<CheckCircleOutlined />}
                                onClick={() => handleApprove(record._id)}
                            />
                        </Tooltip>
                    )}
                    {record.status === "APPROVED" && canManage && (
                        <Tooltip title='Complete'>
                            <Button
                                type='text'
                                icon={<CheckCircleOutlined />}
                                onClick={() => handleComplete(record._id)}
                            />
                        </Tooltip>
                    )}
                    {(record.status === "PENDING" ||
                        record.status === "APPROVED") &&
                        canManage && (
                            <Tooltip title='Cancel'>
                                <Button
                                    type='text'
                                    danger
                                    icon={<CloseCircleOutlined />}
                                    onClick={() => handleCancel(record._id)}
                                />
                            </Tooltip>
                        )}
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
                        Expenditures
                    </Title>
                </Col>
                <Col>
                    {canManage && (
                        <Button
                            type='primary'
                            icon={<PlusOutlined />}
                            onClick={handleShowModal}
                        >
                            New Expenditure
                        </Button>
                    )}
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
                dataSource={expenditures}
                loading={loading}
                rowKey='_id'
                scroll={{ x: true }}
            />

            {isModalVisible && (
                <ExpenditureForm
                    visible={isModalVisible}
                    onCancel={handleCancelModal}
                    onFinish={handleFormSubmit}
                    bases={bases}
                    equipmentTypes={equipmentTypes}
                    assets={assets}
                    user={user}
                />
            )}

            {viewingExpenditure && (
                <Modal
                    title='Expenditure Details'
                    open={!!viewingExpenditure}
                    onCancel={() => setViewingExpenditure(null)}
                    footer={null}
                >
                    <p>
                        <strong>Equipment:</strong>{" "}
                        {viewingExpenditure.equipmentType?.name}
                    </p>
                    <p>
                        <strong>Base:</strong> {viewingExpenditure.base?.name}
                    </p>
                    <p>
                        <strong>Quantity:</strong> {viewingExpenditure.quantity}
                    </p>
                    <p>
                        <strong>Reason:</strong> {viewingExpenditure.reason}
                    </p>
                    <p>
                        <strong>Status:</strong>{" "}
                        {getStatusTag(viewingExpenditure.status)}
                    </p>
                    <p>
                        <strong>Date:</strong>{" "}
                        {dayjs(viewingExpenditure.expenditureDate).format(
                            "YYYY-MM-DD"
                        )}
                    </p>
                    <p>
                        <strong>Authorized By:</strong>{" "}
                        {viewingExpenditure.authorizedBy?.fullname}
                    </p>
                    {viewingExpenditure.approvedBy && (
                        <p>
                            <strong>Approved By:</strong>{" "}
                            {viewingExpenditure.approvedBy?.fullname}
                        </p>
                    )}
                    {viewingExpenditure.completedBy && (
                        <p>
                            <strong>Completed By:</strong>{" "}
                            {viewingExpenditure.completedBy?.fullname}
                        </p>
                    )}
                    {viewingExpenditure.completedDate && (
                        <p>
                            <strong>Completed At:</strong>{" "}
                            {dayjs(viewingExpenditure.completedDate).format(
                                "YYYY-MM-DD HH:mm:ss"
                            )}
                        </p>
                    )}
                    {viewingExpenditure.operationDetails?.operationName && (
                        <p>
                            <strong>Operation Name:</strong>{" "}
                            {viewingExpenditure.operationDetails.operationName}
                        </p>
                    )}
                    {viewingExpenditure.operationDetails?.operationId && (
                        <p>
                            <strong>Operation ID:</strong>{" "}
                            {viewingExpenditure.operationDetails.operationId}
                        </p>
                    )}
                    <p>
                        <strong>Notes:</strong>{" "}
                        {viewingExpenditure.notes || "N/A"}
                    </p>
                </Modal>
            )}
        </>
    );
};

const Expenditures = () => (
    <App>
        <ExpendituresContent />
    </App>
);

export default Expenditures;
