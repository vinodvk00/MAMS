import React, { useState, useMemo } from "react";
import {
    Modal,
    Form,
    Select,
    Input,
    InputNumber,
    DatePicker,
    Typography,
} from "antd";

const { Option } = Select;
const { Text } = Typography;

const ExpenditureForm = ({
    visible,
    onCancel,
    onFinish,
    bases,
    assets,
    user,
}) => {
    const [form] = Form.useForm();
    const [selectedAsset, setSelectedAsset] = useState(null);

    const isCommander = user?.role === "base_commander";
    const commanderBaseId = user?.assignedBase;

    const availableAssets = useMemo(() => {
        const baseId = isCommander
            ? commanderBaseId
            : form.getFieldValue("base");
        if (!baseId) return [];
        return assets.filter(
            asset =>
                asset.currentBase?._id === baseId &&
                asset.status === "AVAILABLE" &&
                asset.quantity > 0
        );
    }, [assets, isCommander, commanderBaseId, form.getFieldValue("base")]);

    const handleAssetChange = assetId => {
        const asset = assets.find(a => a._id === assetId);
        setSelectedAsset(asset);
        form.setFieldsValue({ quantity: 1 }); 
    };

    const handleBaseChange = () => {
        setSelectedAsset(null);
        form.setFieldsValue({ assetId: undefined, quantity: undefined });
    };

    const handleOk = () => {
        form.validateFields()
            .then(values => {
                const finalValues = { ...values };
                if (isCommander) {
                    finalValues.base = commanderBaseId;
                }
                onFinish(finalValues);
                form.resetFields();
            })
            .catch(info => {
                console.log("Validate Failed:", info);
            });
    };

    return (
        <Modal
            title='Create Expenditure'
            open={visible}
            onCancel={onCancel}
            onOk={handleOk}
            okText='Create'
            destroyOnClose
        >
            <Form form={form} layout='vertical' name='expenditureForm'>
                {!isCommander && (
                    <Form.Item
                        name='base'
                        label='Base'
                        rules={[
                            {
                                required: true,
                                message: "Please select a base!",
                            },
                        ]}
                    >
                        <Select
                            placeholder='Select a base'
                            onChange={handleBaseChange}
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
                    name='assetId'
                    label='Asset'
                    rules={[
                        { required: true, message: "Please select an asset!" },
                    ]}
                >
                    <Select
                        placeholder='Select an available asset'
                        onChange={handleAssetChange}
                        disabled={!form.getFieldValue("base") && !isCommander}
                    >
                        {availableAssets.map(asset => (
                            <Option key={asset._id} value={asset._id}>
                                {asset.serialNumber} -{" "}
                                {asset.equipmentType?.name} (Avail:{" "}
                                {asset.quantity})
                            </Option>
                        ))}
                    </Select>
                </Form.Item>

                {selectedAsset && (
                    <>
                        <Form.Item
                            name='quantity'
                            label='Quantity to Expend'
                            rules={[
                                {
                                    required: true,
                                    message: "Please input the quantity!",
                                },
                                {
                                    validator: (_, value) =>
                                        value <= selectedAsset.quantity
                                            ? Promise.resolve()
                                            : Promise.reject(
                                                  new Error(
                                                      `Cannot exceed available quantity of ${selectedAsset.quantity}`
                                                  )
                                              ),
                                },
                            ]}
                        >
                            <InputNumber
                                min={1}
                                max={selectedAsset.quantity}
                                style={{ width: "100%" }}
                            />
                        </Form.Item>
                    </>
                )}

                <Form.Item
                    name='reason'
                    label='Reason'
                    rules={[
                        { required: true, message: "Please select a reason!" },
                    ]}
                >
                    <Select placeholder='Select a reason'>
                        <Option value='TRAINING'>Training</Option>
                        <Option value='OPERATION'>Operation</Option>
                        <Option value='MAINTENANCE'>Maintenance</Option>
                        <Option value='DISPOSAL'>Disposal</Option>
                        <Option value='OTHER'>Other</Option>
                    </Select>
                </Form.Item>
                <Form.Item name='expenditureDate' label='Expenditure Date'>
                    <DatePicker style={{ width: "100%" }} />
                </Form.Item>
                <Form.Item name='notes' label='Notes'>
                    <Input.TextArea />
                </Form.Item>
            </Form>
        </Modal>
    );
};

export default ExpenditureForm;
