import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Descriptions, message, Space, Card, Typography } from 'antd';
import axios from 'axios';

const { Title } = Typography;

const ReportPage = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);

  // 获取数据上报列表
  const fetchReports = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/report');
      if (response.data.success) {
        setReports(response.data.data);
      } else {
        message.error('获取数据上报列表失败');
      }
    } catch (error) {
      console.error('获取数据上报列表错误:', error);
      message.error('获取数据上报列表失败');
    } finally {
      setLoading(false);
    }
  };

  // 查看详情
  const handleViewDetails = (record) => {
    setSelectedReport(record);
    setIsModalVisible(true);
  };

  // 删除记录
  const handleDelete = async (id) => {
    try {
      const response = await axios.delete(`/api/report/${id}`);
      if (response.data.success) {
        message.success('删除成功');
        fetchReports(); // 重新加载数据
      } else {
        message.error('删除失败');
      }
    } catch (error) {
      console.error('删除错误:', error);
      message.error('删除失败');
    }
  };

  // 初始加载数据
  useEffect(() => {
    fetchReports();
  }, []);

  // 表格列定义
  const columns = [
    {
      title: '用户名',
      dataIndex: 'username',
      key: 'username',
    },
    {
      title: 'IP地址',
      dataIndex: 'ip',
      key: 'ip',
    },
    {
      title: '时间',
      dataIndex: 'timestamp',
      key: 'timestamp',
      render: (text) => new Date(text).toLocaleString(),
    },
    {
      title: '设备信息',
      dataIndex: 'deviceInfo',
      key: 'deviceInfo',
      ellipsis: true,
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space size="middle">
          <Button type="primary" onClick={() => handleViewDetails(record)}>查看</Button>
          <Button danger onClick={() => handleDelete(record._id)}>删除</Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Card>
        <Title level={2}>数据上报记录</Title>
        <Table 
          columns={columns} 
          dataSource={reports} 
          rowKey="_id" 
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      {/* 详情弹窗 */}
      <Modal
        title="数据上报详情"
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setIsModalVisible(false)}>关闭</Button>
        ]}
        width={700}
      >
        {selectedReport && (
          <Descriptions bordered column={1}>
            <Descriptions.Item label="用户名">{selectedReport.username}</Descriptions.Item>
            <Descriptions.Item label="IP地址">{selectedReport.ip}</Descriptions.Item>
            <Descriptions.Item label="时间">{new Date(selectedReport.timestamp).toLocaleString()}</Descriptions.Item>
            <Descriptions.Item label="用户代理">{selectedReport.userAgent}</Descriptions.Item>
            <Descriptions.Item label="设备信息">{selectedReport.deviceInfo}</Descriptions.Item>
            <Descriptions.Item label="位置信息">{selectedReport.location}</Descriptions.Item>
            <Descriptions.Item label="附加数据">
              <pre>{JSON.stringify(selectedReport.additionalData, null, 2)}</pre>
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </div>
  );
};

export default ReportPage;