import { useState, useEffect } from 'react';
import { Modal, Form, Input, Select, message, InputNumber } from 'antd';
import { equipmentTypesAPI, basesAPI, assetsAPI, purchasesAPI } from '../../services/api';

const { Option } = Select;

const AssetFormModal = ({ visible, onOk, onCancel, editingAsset }) => {
    const [form] = Form.useForm();
    const [equipmentTypes, setEquipmentTypes] = useState([]);
    const [bases, setBases] = useState([]);
    const [purchases, setPurchases] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (visible) {
            const fetchDropdownData = async () => {
                setLoading(true);
                try {
                    const [equipmentTypesRes, basesRes, purchasesRes] = await Promise.all([
                        equipmentTypesAPI.getAll(),
                        basesAPI.getAll(),
                        purchasesAPI.getAll(),
                    ]);

                    if (Array.isArray(equipmentTypesRes.data)) {
                        setEquipmentTypes(equipmentTypesRes.data);
                    } else {
                        message.error('Failed to load equipment types: Invalid data format');
                    }

                    if (Array.isArray(basesRes.data)) {
                        setBases(basesRes.data);
                    } else {
                        message.error('Failed to load bases: Invalid data format');
                    }

                    if (Array.isArray(purchasesRes.data)) {
                        setPurchases(purchasesRes.data);
                    } else {
                        message.error('Failed to load purchases: Invalid data format');
                    }

                } catch (error) {
                    message.error('Failed to load required data for the form');
                } finally {
                    setLoading(false);
                }
            };
            fetchDropdownData();
            if (editingAsset) {
                form.setFieldsValue({
                    ...editingAsset,
                    equipmentType: editingAsset.equipmentType?._id,
                    currentBase: editingAsset.currentBase?._id,
                    purchaseId: editingAsset.purchaseId?._id || editingAsset.purchaseId,
                });
            } else {
                form.resetFields();
            }
        }
    }, [visible, editingAsset, form]);

    const handleOk = async () => {
        try {
            const values = await form.validateFields();
            if (editingAsset) {
                await assetsAPI.update(editingAsset._id, values);
                message.success('Asset updated successfully');
            } else {
                await assetsAPI.create(values);
                message.success('Asset created successfully');
            }
            onOk();
        } catch (error) {
            message.error(`Failed to ${editingAsset ? 'update' : 'create'} asset`);
        }
    };

    return (
        <Modal
            title={editingAsset ? 'Edit Asset' : 'Add New Asset'}
            visible={visible}
            onOk={handleOk}
            onCancel={onCancel}
            destroyOnClose
        >
            <Form form={form} layout="vertical" name="asset_form">
                <Form.Item
                    name="serialNumber"
                    label="Serial Number (Optional)"
                >
                    <Input />
                </Form.Item>
                <Form.Item
                    name="equipmentType"
                    label="Equipment Type"
                    rules={[{ required: true, message: 'Please select an equipment type' }]}
                >
                    <Select placeholder="Select an equipment type" loading={loading}>
                        {equipmentTypes.map(type => (
                            <Option key={type._id} value={type._id}>{type.name}</Option>
                        ))}
                    </Select>
                </Form.Item>
                <Form.Item
                    name="currentBase"
                    label="Base"
                    rules={[{ required: true, message: 'Please select a base' }]}
                >
                    <Select placeholder="Select a base" loading={loading}>
                        {bases.map(base => (
                            <Option key={base._id} value={base._id}>{base.name}</Option>
                        ))}
                    </Select>
                </Form.Item>
                <Form.Item
                    name="purchaseId"
                    label="Purchase ID (Optional)"
                >
                    <Select placeholder="Select a purchase ID" allowClear loading={loading}>
                        {purchases.map(purchase => (
                            <Option key={purchase._id} value={purchase._id}>{purchase._id}</Option>
                        ))}
                    </Select>
                </Form.Item>
                <Form.Item
                    name="quantity"
                    label="Quantity"
                    initialValue={1}
                    rules={[{ required: true, message: 'Please enter the quantity' }]}
                >
                    <InputNumber min={0} style={{ width: '100%' }} />
                </Form.Item>
                <Form.Item
                    name="status"
                    label="Status"
                    initialValue="AVAILABLE"
                    rules={[{ required: true, message: 'Please select a status' }]}
                >
                    <Select>
                        <Option value="AVAILABLE">Available</Option>
                        <Option value="ASSIGNED">Assigned</Option>
                        <Option value="IN_TRANSIT">In Transit</Option>
                        <Option value="MAINTENANCE">Maintenance</Option>
                        <Option value="EXPENDED">Expended</Option>
                    </Select>
                </Form.Item>
                <Form.Item
                    name="condition"
                    label="Condition"
                    initialValue="NEW"
                    rules={[{ required: true, message: 'Please select a condition' }]}
                >
                    <Select>
                        <Option value="NEW">New</Option>
                        <Option value="GOOD">Good</Option>
                        <Option value="FAIR">Fair</Option>
                        <Option value="POOR">Poor</Option>
                        <Option value="UNSERVICEABLE">Unserviceable</Option>
                    </Select>
                </Form.Item>
            </Form>
        </Modal>
    );
};

export default AssetFormModal;
