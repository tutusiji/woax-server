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
import AuthButton from "../components/AuthButton";

const { Title } = Typography;
const { TextArea } = Input;

const FeedbackPage = ({ currentProject }) => {
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

  // 监听项目变化
  useEffect(() => {
    if (currentProject) {
      fetchFeedbacks();
    } else {
      setFeedbacks([]);
    }
  }, [currentProject]);

  // 监听项目变化事件
  useEffect(() => {
    const handleProjectChange = () => {
      fetchFeedbacks();
    };

    window.addEventListener('projectChanged', handleProjectChange);
    return () => {
      window.removeEventListener('projectChanged', handleProjectChange);
    };
  }, []);

  // 获取意见反馈列表（带分页）
  const fetchFeedbacks = async (page = 1, pageSize = 20) => {
    if (!currentProject) return;
    
    setLoading(true);
    try {
      const response = await axios.get("/api/feedback", {
        params: {
          page,
          pageSize,
          projectId: currentProject._id
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
      if (typeof values.replyInput !== "string") {
        values.replyInput = "";
      }
      const requestData = {};
      if (values.status) requestData.status = values.status;
      if (typeof values.replyInput === "string" && values.replyInput.trim())
        requestData.replyInput = values.replyInput.trim();

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
    if (!currentProject) {
      message.error("未选择项目");
      return;
    }
    
    try {
      const values = await submitForm.validateFields();
      const response = await axios.post("/api/feedback", {
        ...values,
        projectId: currentProject._id
      });

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
        return <Badge status="default" text="未知状态" />;
    }
  };

  // 表格列定义
  const columns = [
    {
      title: "用户名",
      dataIndex: "username",
      key: "username",
      width: 150,
    },
    {
      title: "内容",
      dataIndex: "content",
      key: "content",
      ellipsis: true,
      render: (text) => (
        <div
          style={{
            maxWidth: "300px",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {text}
        </div>
      ),
    },
    {
      title: "提交时间",
      dataIndex: "timestamp",
      key: "timestamp",
      width: 180,
      render: (text) => new Date(text).toLocaleString(),
    },
    {
      title: "状态",
      dataIndex: "status",
      key: "status",
      width: 100,
      render: (status) => getStatusBadge(status),
    },
    {
      title: "操作",
      key: "action",
      width: 150,
      render: (_, record) => (
        <Space size="middle">
          <Button type="primary" size="small" onClick={() => handleViewDetails(record)}>
            查看
          </Button>
          <AuthButton
            type="primary"
            danger
            size="small"
            onClick={() => {
              Modal.confirm({
                title: "确认删除",
                content: "确定要删除这条反馈吗？",
                onOk: () => handleDelete(record._id),
              });
            }}
            tooltip="需要管理员权限才能删除反馈"
          >
            删除
          </AuthButton>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Card>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: "20px",
          }}
        >
          <Title level={4}>意见反馈</Title>
          <AuthButton
            type="primary"
            onClick={() => setIsSubmitModalVisible(true)}
            disabled={!currentProject}
            tooltip="需要管理员权限才能提交反馈"
          >
            提交反馈
          </AuthButton>
        </div>

        <Table
          columns={columns}
          dataSource={feedbacks}
          rowKey="_id"
          pagination={pagination}
          loading={loading}
          onChange={handleTableChange}
        />
      </Card>

      {/* 详情弹窗 */}
      <Modal
        title="反馈详情"
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
        width={700}
      >
        {selectedFeedback && (
          <div>
            <Descriptions bordered column={1}>
              <Descriptions.Item label="用户名">
                {selectedFeedback.username}
              </Descriptions.Item>
              <Descriptions.Item label="邮箱">
                {selectedFeedback.email || "未提供"}
              </Descriptions.Item>
              <Descriptions.Item label="IP地址">
                {selectedFeedback.ip || "未记录"}
              </Descriptions.Item>
              <Descriptions.Item label="提交时间">
                {new Date(selectedFeedback.timestamp).toLocaleString()}
              </Descriptions.Item>
              <Descriptions.Item label="反馈内容">
                <div style={{ whiteSpace: "pre-wrap" }}>
                  {selectedFeedback.content}
                </div>
              </Descriptions.Item>
              <Descriptions.Item label="状态">
                {getStatusBadge(selectedFeedback.status)}
              </Descriptions.Item>
            </Descriptions>

            <div style={{ marginTop: "20px" }}>
              <Form
                form={form}
                layout="vertical"
                initialValues={{
                  status: selectedFeedback.status,
                  replyInput: "",
                }}
                onValuesChange={(_, values) => {
                  setDetailFormValues(values);
                }}
              >
                <Form.Item name="status" label="更新状态">
                  <Space>
                    <AuthButton
                      type={detailFormValues.status === "pending" ? "primary" : "default"}
                      onClick={() => {
                        form.setFieldsValue({ status: "pending" });
                        setDetailFormValues((prev) => ({ ...prev, status: "pending" }));
                      }}
                      tooltip="需要管理员权限才能更新状态"
                    >
                      待处理
                    </AuthButton>
                    <AuthButton
                      type={detailFormValues.status === "reviewed" ? "primary" : "default"}
                      onClick={() => {
                        form.setFieldsValue({ status: "reviewed" });
                        setDetailFormValues((prev) => ({ ...prev, status: "reviewed" }));
                      }}
                      tooltip="需要管理员权限才能更新状态"
                    >
                      已审阅
                    </AuthButton>
                    <AuthButton
                      type={detailFormValues.status === "resolved" ? "primary" : "default"}
                      onClick={() => {
                        form.setFieldsValue({ status: "resolved" });
                        setDetailFormValues((prev) => ({ ...prev, status: "resolved" }));
                      }}
                      tooltip="需要管理员权限才能更新状态"
                    >
                      已解决
                    </AuthButton>
                  </Space>
                </Form.Item>

                <Form.Item name="replyInput" label="回复内容">
                  <ReactQuill theme="snow" style={{ height: "150px" }} />
                </Form.Item>

                <Form.Item>
                  <AuthButton type="primary" onClick={() => handleUpdateStatus()} tooltip="需要管理员权限才能提交回复">
                    提交回复
                  </AuthButton>
                </Form.Item>
              </Form>
            </div>

            {/* 回复历史 */}
            {selectedFeedback.replyHistory &&
              selectedFeedback.replyHistory.length > 0 && (
                <div style={{ marginTop: "20px" }}>
                  <Title level={5}>回复历史</Title>
                  {selectedFeedback.replyHistory.map((reply, index) => (
                    <Card
                      key={index}
                      style={{ marginBottom: "10px" }}
                      size="small"
                    >
                      <div>
                        <div
                          dangerouslySetInnerHTML={{ __html: reply.content }}
                        />
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            marginTop: "10px",
                            color: "#888",
                          }}
                        >
                          <span>{reply.admin}</span>
                          <span>
                            {new Date(reply.time).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
          </div>
        )}
      </Modal>

      {/* 提交反馈弹窗 */}
      <Modal
        title="提交反馈"
        open={isSubmitModalVisible}
        onOk={handleSubmitFeedback}
        onCancel={() => setIsSubmitModalVisible(false)}
      >
        <Form form={submitForm} layout="vertical">
          <Form.Item
            name="username"
            label="用户名"
            rules={[{ required: true, message: "请输入用户名" }]}
          >
            <Input />
          </Form.Item>
          <Form.Item name="email" label="邮箱">
            <Input />
          </Form.Item>
          <Form.Item
            name="content"
            label="反馈内容"
            rules={[{ required: true, message: "请输入反馈内容" }]}
          >
            <TextArea rows={4} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default FeedbackPage;
