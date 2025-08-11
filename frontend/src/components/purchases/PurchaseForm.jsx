import { Form, Input, DatePicker, Select, InputNumber } from "antd";

const { Option } = Select;

const PurchaseForm = ({ form, bases, equipmentTypes, isEditing }) => {
    return (
        <Form form={form} layout="vertical" name="purchaseForm">
            <Form.Item
                name="equipmentType"
                label="Equipment Type"
                rules={[{ required: true, message: "Please select an equipment type!" }]}
            >
                <Select placeholder="Select equipment type">
                    {equipmentTypes.map((type) => (
                        <Option key={type._id} value={type._id}>
                            {type.name}
                        </Option>
                    ))}
                </Select>
            </Form.Item>
            <Form.Item name="base" label="Base" rules={[{ required: true, message: "Please select a base!" }]}>
                <Select placeholder="Select a base">
                    {bases.map((base) => (
                        <Option key={base._id} value={base._id}>
                            {base.name}
                        </Option>
                    ))}
                </Select>
            </Form.Item>
            <Form.Item
                name="quantity"
                label="Quantity"
                rules={[{ required: true, message: "Please input the quantity!" }]}
            >
                <InputNumber min={1} style={{ width: "100%" }} />
            </Form.Item>
            <Form.Item
                name="unitPrice"
                label="Unit Price"
                rules={[{ required: true, message: "Please input the unit price!" }]}
            >
                <InputNumber
                    min={0}
                    style={{ width: "100%" }}
                    formatter={(value) => `$ ${value}`}
                    parser={(value) => value.replace(/\$\s?|(,*)/g, "")}
                />
            </Form.Item>
            <Form.Item name="purchaseDate" label="Purchase Date">
                <DatePicker style={{ width: "100%" }} />
            </Form.Item>
            <Form.Item name="deliveryDate" label="Delivery Date">
                <DatePicker style={{ width: "100%" }} />
            </Form.Item>
            <Form.Item name="status" label="Status" initialValue="ORDERED">
                <Select>
                    <Option value="ORDERED">Ordered</Option>
                    <Option value="DELIVERED">Delivered</Option>
                    <Option value="CANCELLED">Cancelled</Option>
                </Select>
            </Form.Item>
            <Form.Item name={["supplier", "name"]} label="Supplier Name">
                <Input />
            </Form.Item>
            <Form.Item name={["supplier", "contact"]} label="Supplier Contact">
                <Input />
            </Form.Item>
            <Form.Item name={["supplier", "address"]} label="Supplier Address">
                <Input.TextArea />
            </Form.Item>
            <Form.Item name="notes" label="Notes">
                <Input.TextArea />
            </Form.Item>
        </Form>
    );
};

export default PurchaseForm;