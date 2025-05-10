import React, { useState, useEffect } from "react";
import {
  Table,
  Button,
  Modal,
  Descriptions,
  message,
  Space,
  Card,
  Typography,
  Form,
  Input,
  Badge,
} from "antd";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import axios from "axios";

const { Title } = Typography;
const { TextArea } = Input;

const FeedbackPage = () => {
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isSubmitModalVisible, setIsSubmitModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [submitForm] = Form.useForm();
  const [detailFormValues, setDetailFormValues] = useState({
    status: "",
    replyInput: "",
  });

  // 分页参数状态
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0,
    showSizeChanger: true,
    pageSizeOptions: ["10", "20", "50", "100"],
  });

  // 获取意见反馈列表（带分页）
  const fetchFeedbacks = async (page = 1, pageSize = 20) => {
    setLoading(true);
    try {
      const response = await axios.get("/api/feedback", {
        params: {
          page,
          pageSize,
        },
      });
      if (response.data.success) {
        setFeedbacks(response.data.data);
        setPagination((prev) => ({
          ...prev,
          current: page,
          pageSize: pageSize,
          total: response.data.total || 0,
        }));
      } else {
        message.error("获取意见反馈列表失败");
      }
    } catch (error) {
      console.error("获取意见反馈列表错误:", error);
      message.error("获取意见反馈列表失败");
    } finally {
      setLoading(false);
    }
  };

  // 处理分页变化
  const handleTableChange = (pagination) => {
    fetchFeedbacks(pagination.current, pagination.pageSize);
  };

  // 查看详情
  const handleViewDetails = (record) => {
    setSelectedFeedback(record);
    setIsModalVisible(true);
    setDetailFormValues({
      status: record.status,
      replyInput: "",
    });
    form.setFieldsValue({
      status: record.status,
      replyInput: "",
    });
  };

  // 更新反馈状态
  const handleUpdateStatus = async (directStatus = null) => {
    try {
      let values = { ...detailFormValues };
      if (directStatus) {
        values.status = directStatus;
      }
      // 去除所有字符串字段的首尾空格
      Object.keys(values).forEach((key) => {
        if (typeof values[key] === "string") {
          values[key] = values[key].trim();
        }
      });
      const requestData = {};
      if (values.status) requestData.status = values.status;
      if (typeof values.replyInput === "string" && values.replyInput)
        requestData.replyInput = values.replyInput;

      const response = await axios.put(
        `/api/feedback/${selectedFeedback._id}`,
        { ...requestData }
      );

      if (response.data.success) {
        message.success("更新成功");
        // 清空回复输入区
        setDetailFormValues((prev) => ({
          ...prev,
          replyInput: "",
        }));
        form.setFieldsValue({ replyInput: "" });

        // 刷新数据
        fetchFeedbacks(pagination.current, pagination.pageSize);

        // 如果有新回复，追加到本地 replyHistory（前端即时体验，实际应后端返回最新 replyHistory）
        if (requestData.replyInput) {
          setSelectedFeedback((prev) => {
            const newHistory = Array.isArray(prev.replyHistory)
              ? [...prev.replyHistory]
              : [];
            newHistory.unshift({
              content: requestData.replyInput,
              time: Date.now(),
              admin: "管理员", // 可根据实际登录用户替换
            });
            return {
              ...prev,
              replyHistory: newHistory,
            };
          });
        }

        setIsModalVisible(false);
      } else {
        message.error("更新失败");
      }
    } catch (error) {
      console.error("更新错误:", error);
      message.error("更新失败");
    }
  };

  // 删除反馈
  const handleDelete = async (id) => {
    try {
      const response = await axios.delete(`/api/feedback/${id}`);
      if (response.data.success) {
        message.success("删除成功");
        fetchFeedbacks(); // 重新加载数据
      } else {
        message.error("删除失败");
      }
    } catch (error) {
      console.error("删除错误:", error);
      message.error("删除失败");
    }
  };

  // 提交新反馈
  const handleSubmitFeedback = async () => {
    try {
      const values = await submitForm.validateFields();
      // 去除所有字符串字段的首尾空格
      const trimmedValues = {};
      Object.keys(values).forEach((key) => {
        const val = values[key];
        trimmedValues[key] = typeof val === "string" ? val.trim() : val;
      });
      const response = await axios.post("/api/feedback", trimmedValues);

      if (response.data.success) {
        message.success("反馈提交成功");
        setIsSubmitModalVisible(false);
        submitForm.resetFields();
        fetchFeedbacks(); // 重新加载数据
      } else {
        message.error("反馈提交失败");
      }
    } catch (error) {
      console.error("提交错误:", error);
      message.error("反馈提交失败");
    }
  };

  // 初始加载数据
  useEffect(() => {
    fetchFeedbacks();
  }, []);

  // 获取状态标签
  const getStatusBadge = (status) => {
    switch (status) {
      case "pending":
        return <Badge status="warning" text="待处理" />;
      case "reviewed":
        return <Badge status="processing" text="已审阅" />;
      case "resolved":
        return <Badge status="success" text="已解决" />;
      default:
        return <Badge status="default" text="未知" />;
    }
  };

  // 表格列定义
  const columns = [
    {
      title: "用户名",
      dataIndex: "username",
      key: "username",
    },
    {
      title: "内容",
      dataIndex: "content",
      key: "content",
      ellipsis: true,
      render: (text) => {
        // 移除HTML标签以纯文本形式显示
        const plainText = text.replace(/<[^>]+>/g, "");
        return plainText.length > 50
          ? plainText.substring(0, 50) + "..."
          : plainText;
      },
    },
    {
      title: "时间",
      dataIndex: "timestamp",
      key: "timestamp",
      render: (text) => new Date(text).toLocaleString(),
    },
    {
      title: "状态",
      dataIndex: "status",
      key: "status",
      render: (status) => getStatusBadge(status),
    },
    {
      title: "操作",
      key: "action",
      render: (_, record) => (
        <Space size="middle">
          <Button type="primary" onClick={() => handleViewDetails(record)}>
            查看
          </Button>
          <Button danger onClick={() => handleDelete(record._id)}>
            删除
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="bg-red-500">
      <Card>
        <div className="flex justify-between items-center mb-4">
          <Title level={2}>意见反馈列表</Title>
          <Button type="primary" onClick={() => setIsSubmitModalVisible(true)}>
            提交新反馈
          </Button>
        </div>
        <Table
          columns={columns}
          dataSource={feedbacks}
          rowKey="_id"
          loading={loading}
          pagination={pagination}
          onChange={handleTableChange}
        />
      </Card>

      {/* 详情弹窗 */}
      <Modal
        title="意见反馈详情"
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setIsModalVisible(false)}>
            取消
          </Button>,
          <Button
            key="submit"
            type="primary"
            onClick={() => handleUpdateStatus()}
          >
            更新
          </Button>,
        ]}
        width={700}
      >
        {selectedFeedback && (
          <>
            <Descriptions bordered column={1} className="mb-5">
              <Descriptions.Item label="用户名">
                {selectedFeedback.username}
              </Descriptions.Item>
              <Descriptions.Item label="邮箱">
                {selectedFeedback.email || "未提供"}
              </Descriptions.Item>
              <Descriptions.Item label="IP地址">
                {selectedFeedback.ip}
              </Descriptions.Item>
              <Descriptions.Item label="提交时间">
                {new Date(selectedFeedback.timestamp).toLocaleString()}
              </Descriptions.Item>
              <Descriptions.Item label="反馈内容">
                <div
                  className="rich-text-content"
                  dangerouslySetInnerHTML={{ __html: selectedFeedback.content }}
                />
              </Descriptions.Item>
            </Descriptions>

            <Form
              form={form}
              layout="vertical"
              initialValues={detailFormValues}
              onValuesChange={(_, allValues) => setDetailFormValues(allValues)}
            >
              <Form.Item name="status" label="状态">
                <Space.Compact>
                  <Space>
                    <Button
                      type={
                        detailFormValues.status === "pending"
                          ? "primary"
                          : "default"
                      }
                      onClick={() => {
                        setDetailFormValues((prev) => ({
                          ...prev,
                          status: "pending",
                        }));
                        form.setFieldsValue({ status: "pending" });
                        handleUpdateStatus("pending");
                      }}
                    >
                      待处理
                    </Button>
                    <Button
                      type={
                        detailFormValues.status === "reviewed"
                          ? "primary"
                          : "default"
                      }
                      onClick={() => {
                        setDetailFormValues((prev) => ({
                          ...prev,
                          status: "reviewed",
                        }));
                        form.setFieldsValue({ status: "reviewed" });
                        handleUpdateStatus("reviewed");
                      }}
                    >
                      已审阅
                    </Button>
                    <Button
                      type={
                        detailFormValues.status === "resolved"
                          ? "primary"
                          : "default"
                      }
                      onClick={() => {
                        setDetailFormValues((prev) => ({
                          ...prev,
                          status: "resolved",
                        }));
                        form.setFieldsValue({ status: "resolved" });
                        handleUpdateStatus("resolved");
                      }}
                    >
                      已解决
                    </Button>
                  </Space>
                </Space.Compact>
              </Form.Item>

              {/* 新增：回复记录 */}
              <div className="mb-4">
                <div>回复记录：</div>
                <div className="max-h-36 overflow-y-auto bg-gray-100 p-2 border border-gray-200 rounded">
                  {Array.isArray(selectedFeedback.replyHistory) &&
                  selectedFeedback.replyHistory.length > 0 ? (
                    selectedFeedback.replyHistory.map((item, idx) => (
                      <div
                        key={idx}
                        className="mb-2 border-b border-dashed border-gray-200 pb-1"
                      >
                        <div>
                          <span className="text-gray-700">
                            {item.admin ? `${item.admin}：` : ""}
                            {item.content}
                          </span>
                        </div>
                        <div className="text-xs text-gray-400">
                          {item.time
                            ? new Date(item.time).toLocaleString()
                            : ""}
                        </div>
                      </div>
                    ))
                  ) : (
                    <span className="text-gray-400">暂无回复记录</span>
                  )}
                </div>
              </div>

              <Form.Item name="replyInput" label="回复输入区">
                <TextArea
                  rows={4}
                  placeholder="输入对此反馈的回复"
                  value={detailFormValues.replyInput}
                  onChange={(e) => {
                    setDetailFormValues((prev) => ({
                      ...prev,
                      replyInput: e.target.value,
                    }));
                    form.setFieldsValue({ replyInput: e.target.value });
                  }}
                  className="resize-none"
                />
              </Form.Item>
            </Form>
          </>
        )}
      </Modal>

      {/* 提交新反馈弹窗 */}
      <Modal
        title="提交新反馈"
        open={isSubmitModalVisible}
        onCancel={() => setIsSubmitModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setIsSubmitModalVisible(false)}>
            取消
          </Button>,
          <Button key="submit" type="primary" onClick={handleSubmitFeedback}>
            提交
          </Button>,
        ]}
        width={700}
      >
        <Form form={submitForm} layout="vertical">
          <Form.Item
            name="username"
            label="用户名"
            rules={[{ required: true, message: "请输入用户名" }]}
          >
            <Input placeholder="请输入您的用户名" />
          </Form.Item>
          <Form.Item
            name="email"
            label="邮箱"
            rules={[{ type: "email", message: "请输入有效的邮箱地址" }]}
          >
            <Input placeholder="请输入您的邮箱（选填）" />
          </Form.Item>
          <Form.Item
            name="content"
            label="反馈内容"
            rules={[{ required: true, message: "请输入反馈内容" }]}
          >
            <ReactQuill
              theme="snow"
              placeholder="请输入您的反馈内容..."
              className="h-52 mb-12"
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default FeedbackPage;
