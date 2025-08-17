import { useState } from "react";
import {
    Table,
    Button,
    Modal,
    Form,
    Space,
    Tag,
    App,
    Select,
    Input,
} from "antd";
import {
    PlusOutlined,
    EyeOutlined,
    CheckSquareOutlined,
    WarningOutlined,
} from "@ant-design/icons";
import { useAssignments } from "../hooks/useAssignments.hook";
import AssignmentForm from "../components/assignment/AssignmentForm";
import dayjs from "dayjs";

const AssignmentsContent = () => {
    const {
        assignments,
        assets,
        users,
        loading,
        canManageAssignments,
        createAssignment,
        returnAsset,
        markAsLostOrDamaged,
    } = useAssignments();

    const [isModalVisible, setIsModalVisible] = useState(false);
    const [viewingAssignment, setViewingAssignment] = useState(null);
    const [isReturnModalVisible, setIsReturnModalVisible] = useState(false);
    const [returningAssignment, setReturningAssignment] = useState(null);
    const [isLostOrDamagedModalVisible, setIsLostOrDamagedModalVisible] =
        useState(false);
    const [editingAssignmentStatus, setEditingAssignmentStatus] =
        useState(null);

    const [form] = Form.useForm();
    const [returnForm] = Form.useForm();
    const [lostOrDamagedForm] = Form.useForm();

    const statusOrder = {
        ACTIVE: 1,
        RETURNED: 2,
        DAMAGED: 3,
        LOST: 4,
        EXPENDED: 5,
    };

    const handleCancel = () => {
        setIsModalVisible(false);
        setIsReturnModalVisible(false);
        setIsLostOrDamagedModalVisible(false);
        form.resetFields();
        returnForm.resetFields();
        lostOrDamagedForm.resetFields();
    };

    const handleFormSubmit = async () => {
        const values = await form.validateFields();
        const success = await createAssignment(values);
        if (success) handleCancel();
    };

    const handleReturnAsset = async () => {
        const values = await returnForm.validateFields();
        const success = await returnAsset(returningAssignment._id, values);
        if (success) handleCancel();
    };

    const handleMarkAsLostOrDamaged = async () => {
        const values = await lostOrDamagedForm.validateFields();
        const success = await markAsLostOrDamaged(
            editingAssignmentStatus._id,
            values
        );
        if (success) handleCancel();
    };

    const showModal = () => setIsModalVisible(true);
    const showViewModal = record => setViewingAssignment(record);

    const showReturnModal = record => {
        setReturningAssignment(record);
        setIsReturnModalVisible(true);
    };

    const showLostOrDamagedModal = record => {
        setEditingAssignmentStatus(record);
        setIsLostOrDamagedModalVisible(true);
    };

    const getStatusTag = status => {
        const color = {
            ACTIVE: "blue",
            RETURNED: "green",
            LOST: "red",
            DAMAGED: "red",
            EXPENDED: "red",
        }[status];
        return <Tag color={color}>{status}</Tag>;
    };

    const columns = [
        {
            title: "Asset",
            dataIndex: ["asset", "serialNumber"],
            key: "asset",
        },
        {
            title: "Assigned To",
            dataIndex: ["assignedTo", "fullname"],
            key: "assignedTo",
        },
        {
            title: "Assignment Date",
            dataIndex: "assignmentDate",
            key: "assignmentDate",
            render: date => dayjs(date).format("YYYY-MM-DD"),
        },
        {
            title: "Status",
            dataIndex: "status",
            key: "status",
            render: getStatusTag,
            sorter: (a, b) => statusOrder[a.status] - statusOrder[b.status],
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
                    {canManageAssignments && record.status === "ACTIVE" && (
                        <>
                            <Button
                                icon={<CheckSquareOutlined />}
                                onClick={() => showReturnModal(record)}
                            >
                                Return
                            </Button>
                            <Button
                                icon={<WarningOutlined />}
                                danger
                                onClick={() => showLostOrDamagedModal(record)}
                            >
                                Report Issue
                            </Button>
                        </>
                    )}
                </Space>
            ),
        },
    ];

    return (
        <div>
            {canManageAssignments && (
                <Button
                    type='primary'
                    icon={<PlusOutlined />}
                    onClick={showModal}
                    style={{ marginBottom: 16, float: "right" }}
                >
                    Create Assignment
                </Button>
            )}
            <Table
                columns={columns}
                dataSource={assignments}
                loading={loading}
                rowKey='_id'
                scroll={{ x: true }}
            />
            <Modal
                title='Create New Assignment'
                open={isModalVisible}
                onOk={handleFormSubmit}
                onCancel={handleCancel}
                width={600}
            >
                <AssignmentForm form={form} assets={assets} users={users} />
            </Modal>
            <Modal
                title='Return Asset'
                open={isReturnModalVisible}
                onOk={handleReturnAsset}
                onCancel={handleCancel}
            >
                <Form form={returnForm} layout='vertical'>
                    <Form.Item
                        name='returnCondition'
                        label='Return Condition'
                        initialValue='GOOD'
                    >
                        <Select>
                            <Select.Option value='NEW'>New</Select.Option>
                            <Select.Option value='GOOD'>Good</Select.Option>
                            <Select.Option value='FAIR'>Fair</Select.Option>
                            <Select.Option value='POOR'>Poor</Select.Option>
                            <Select.Option value='UNSERVICEABLE'>
                                Unserviceable
                            </Select.Option>
                        </Select>
                    </Form.Item>
                    <Form.Item name='notes' label='Notes'>
                        <Input.TextArea rows={2} />
                    </Form.Item>
                </Form>
            </Modal>
            <Modal
                title='Report Asset Issue'
                open={isLostOrDamagedModalVisible}
                onOk={handleMarkAsLostOrDamaged}
                onCancel={handleCancel}
            >
                <Form form={lostOrDamagedForm} layout='vertical'>
                    <Form.Item
                        name='status'
                        label='Status'
                        rules={[
                            {
                                required: true,
                                message: "Please select a status!",
                            },
                        ]}
                    >
                        <Select placeholder='Select a status'>
                            <Select.Option value='LOST'>Lost</Select.Option>
                            <Select.Option value='DAMAGED'>
                                Damaged
                            </Select.Option>
                        </Select>
                    </Form.Item>
                    <Form.Item name='notes' label='Notes'>
                        <Input.TextArea
                            rows={2}
                            placeholder='Provide details about the issue...'
                        />
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
