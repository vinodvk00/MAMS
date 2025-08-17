import { useEffect, useState } from "react";
import { Modal, Form, Input, Select, InputNumber } from "antd";

const { Option } = Select;

const AssetFormModal = ({
    visible,
    onOk,
    onCancel,
    editingAsset,
    bases,
    equipmentTypes,
    purchases,
    formLoading,
    user,
    addAsset,
    updateAsset,
}) => {
    const [form] = Form.useForm();
    const [purchaseLocked, setPurchaseLocked] = useState(false);

    const isCommander = user?.role === "base_commander";

    useEffect(() => {
        if (visible) {
            if (editingAsset) {
                form.setFieldsValue({
                    ...editingAsset,
                    equipmentType: editingAsset.equipmentType?._id,
                    currentBase: editingAsset.currentBase?._id,
                    purchaseId:
                        editingAsset.purchaseId?._id || editingAsset.purchaseId,
                });
                if (editingAsset.purchaseId) {
                    setPurchaseLocked(true);
                }
            } else {
                form.resetFields();
                setPurchaseLocked(false);
            }
        }
    }, [visible, editingAsset, form]);

    const handlePurchaseSelect = purchaseId => {
        if (purchaseId) {
            const selectedPurchase = purchases.find(p => p._id === purchaseId);
            if (selectedPurchase) {
                form.setFieldsValue({
                    equipmentType: selectedPurchase.equipmentType?._id,
                    currentBase: selectedPurchase.base?._id,
                    quantity: selectedPurchase.quantity,
                });
                setPurchaseLocked(true);
            }
        } else {
            form.resetFields(["equipmentType", "currentBase", "quantity"]);
            setPurchaseLocked(false);
        }
    };

    const handleOk = async () => {
        try {
            const values = await form.validateFields();

            if (isCommander) {
                values.currentBase = user.assignedBase;
            }

            let success = false;
            if (editingAsset) {
                success = await updateAsset(editingAsset._id, values);
            } else {
                success = await addAsset(values);
            }

            if (success) {
                onOk();
            }
        } catch (error) {
            console.error("Form submission error:", error);
        }
    };

    return (
        <Modal
            title={editingAsset ? "Edit Asset" : "Add New Asset"}
            open={visible}
            onOk={handleOk}
            onCancel={onCancel}
            destroyOnClose
            confirmLoading={formLoading}
        >
            <Form form={form} layout='vertical' name='asset_form'>
                <Form.Item
                    name='serialNumber'
                    label='Serial Number (Optional)'
                    help='If left blank, a serial number will be auto-generated.'
                >
                    <Input />
                </Form.Item>
                <Form.Item
                    name='purchaseId'
                    label='Purchase Reference (Optional)'
                >
                    <Select
                        placeholder='Link to a purchase record'
                        allowClear
                        loading={formLoading}
                        showSearch
                        optionFilterProp='children'
                        onChange={handlePurchaseSelect}
                    >
                        {purchases.map(purchase => (
                            <Option key={purchase._id} value={purchase._id}>
                                {`ID: ${purchase._id.slice(-6)} - ${
                                    purchase.equipmentType?.name
                                } (Qty: ${purchase.quantity})`}
                            </Option>
                        ))}
                    </Select>
                </Form.Item>
                <Form.Item
                    name='equipmentType'
                    label='Equipment Type'
                    rules={[
                        {
                            required: true,
                            message: "Please select an equipment type",
                        },
                    ]}
                >
                    <Select
                        placeholder='Select an equipment type'
                        loading={formLoading}
                        showSearch
                        optionFilterProp='children'
                        disabled={purchaseLocked}
                    >
                        {equipmentTypes.map(type => (
                            <Option key={type._id} value={type._id}>
                                {type.name}
                            </Option>
                        ))}
                    </Select>
                </Form.Item>

                {!isCommander && (
                    <Form.Item
                        name='currentBase'
                        label='Base'
                        rules={[
                            { required: true, message: "Please select a base" },
                        ]}
                    >
                        <Select
                            placeholder='Select a base'
                            loading={formLoading}
                            showSearch
                            optionFilterProp='children'
                            disabled={purchaseLocked}
                        >
                            {bases.map(base => (
                                <Option key={base._id} value={base._id}>
                                    {base.name}
                                </Option>
                            ))}
                        </Select>
                    </Form.Item>
                )}
                <Form.Item
                    name='quantity'
                    label='Quantity'
                    initialValue={1}
                    rules={[
                        {
                            required: true,
                            message: "Please enter the quantity",
                        },
                    ]}
                >
                    <InputNumber
                        min={0}
                        style={{ width: "100%" }}
                        disabled={purchaseLocked}
                    />
                </Form.Item>
                <Form.Item
                    name='status'
                    label='Status'
                    initialValue='AVAILABLE'
                    rules={[
                        { required: true, message: "Please select a status" },
                    ]}
                >
                    <Select>
                        <Option value='AVAILABLE'>Available</Option>
                        <Option value='ASSIGNED'>Assigned</Option>
                        <Option value='IN_TRANSIT'>In Transit</Option>
                        <Option value='MAINTENANCE'>Maintenance</Option>
                        <Option value='EXPENDED'>Expended</Option>
                    </Select>
                </Form.Item>
                <Form.Item
                    name='condition'
                    label='Condition'
                    initialValue='NEW'
                    rules={[
                        {
                            required: true,
                            message: "Please select a condition",
                        },
                    ]}
                >
                    <Select>
                        <Option value='NEW'>New</Option>
                        <Option value='GOOD'>Good</Option>
                        <Option value='FAIR'>Fair</Option>
                        <Option value='POOR'>Poor</Option>
                        <Option value='UNSERVICEABLE'>Unserviceable</Option>
                    </Select>
                </Form.Item>
            </Form>
        </Modal>
    );
};

export default AssetFormModal;
