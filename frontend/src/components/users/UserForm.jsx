import React, { useEffect, useState } from "react";
import { Modal, Form, Input, Button, Select, Switch, Space } from "antd";

const { Option } = Select;

const UserForm = ({
    visible,
    onCancel,
    onFinish,
    initialData,
    bases,
    user,
}) => {
    const [form] = Form.useForm();
    const isEditing = !!initialData;

    const [selectedRole, setSelectedRole] = useState(
        initialData?.role || "user"
    );

    useEffect(() => {
        if (initialData) {
            form.setFieldsValue({
                ...initialData,
                assignedBase: initialData.assignedBase?._id,
            });
            setSelectedRole(initialData.role);
        } else {
            form.setFieldsValue({
                isActive: true,
                role: "user",
            });
            setSelectedRole("user");
        }
    }, [initialData, form]);

    const handleFinish = values => {
        const finalValues = { ...values };

        if (user?.role === "base_commander") {
            if (isEditing) {
                finalValues.role = initialData.role;
                finalValues.assignedBase = initialData.assignedBase?._id;
            } else {
                finalValues.role = "user";
                finalValues.assignedBase = user.assignedBase;
            }
        }

        onFinish(finalValues);
        form.resetFields();
    };

    const handleValuesChange = changedValues => {
        if (changedValues.role) {
            setSelectedRole(changedValues.role);
            if (changedValues.role !== "base_commander") {
                form.setFieldsValue({ assignedBase: undefined });
            }
        }
    };

    return (
        <Modal
            title={isEditing ? "Edit User" : "Add User"}
            open={visible}
            onCancel={onCancel}
            footer={null}
            destroyOnClose
        >
            <Form
                form={form}
                layout='vertical'
                onFinish={handleFinish}
                onValuesChange={
                    user?.role === "admin" ? handleValuesChange : undefined
                }
                autoComplete='off'
            >
                {/* These fields are always visible */}
                <Form.Item
                    name='fullname'
                    label='Full Name'
                    rules={[
                        {
                            required: true,
                            message: "Please enter the full name",
                        },
                    ]}
                >
                    <Input />
                </Form.Item>
                <Form.Item
                    name='username'
                    label='Username'
                    rules={[
                        { required: true, message: "Please enter a username" },
                    ]}
                >
                    <Input />
                </Form.Item>
                <Form.Item
                    name='password'
                    label='Password'
                    rules={
                        isEditing
                            ? []
                            : [
                                  {
                                      required: true,
                                      message: "Please enter a password",
                                  },
                              ]
                    }
                    help={
                        isEditing
                            ? "Leave blank to keep the current password"
                            : ""
                    }
                >
                    <Input.Password />
                </Form.Item>

                {user?.role === "admin" && (
                    <>
                        <Form.Item
                            name='role'
                            label='Role'
                            rules={[
                                {
                                    required: true,
                                    message: "Please select a role",
                                },
                            ]}
                        >
                            <Select>
                                <Option value='admin'>Admin</Option>
                                <Option value='base_commander'>
                                    Base Commander
                                </Option>
                                <Option value='logistics_officer'>
                                    Logistics Officer
                                </Option>
                                <Option value='user'>User</Option>
                            </Select>
                        </Form.Item>

                        {selectedRole === "base_commander" && (
                            <Form.Item
                                name='assignedBase'
                                label='Assigned Base'
                                rules={[
                                    {
                                        required: true,
                                        message:
                                            "Please assign a base for the commander",
                                    },
                                ]}
                            >
                                <Select placeholder='Select a base'>
                                    {bases.map(base => (
                                        <Option key={base._id} value={base._id}>
                                            {base.name}
                                        </Option>
                                    ))}
                                </Select>
                            </Form.Item>
                        )}
                    </>
                )}

                <Form.Item
                    name='isActive'
                    label='Status'
                    valuePropName='checked'
                >
                    <Switch
                        checkedChildren='Active'
                        unCheckedChildren='Inactive'
                    />
                </Form.Item>

                <div
                    style={{
                        display: "flex",
                        justifyContent: "flex-end",
                        alignItems: "center",
                    }}
                >
                    <Space>
                        <Button onClick={onCancel}>Cancel</Button>
                        <Button type='primary' htmlType='submit'>
                            {isEditing ? "Update" : "Create"}
                        </Button>
                    </Space>
                </div>
            </Form>
        </Modal>
    );
};

export default UserForm;
