import React, { useState, useEffect } from 'react';
import { Card, Button, Typography, Row, Col, message } from 'antd';
import axios from 'axios';
import ChartPanel from './ChartPanel';
import DataTable from './DataTable';
import ReportFormModal from './ReportFormModal';
import ReportModal from './ReportModal';

const { Title } = Typography;

const StatisticPage = ({ currentProject }) => {
  const [reports, setReports] = useState([]); // 每用户最后一次
  const [allReports, setAllReports] = useState([]); // 全量数据
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0
  });
  const [loading, setLoading] = useState(false);
  const [chartLoading, setChartLoading] = useState(false);

  // 详情弹窗相关
  const [selectedUser, setSelectedUser] = useState(null);
  const [userRecords, setUserRecords] = useState([]);
  const [userRecordsTotal, setUserRecordsTotal] = useState(0);
  const [userRecordsPage, setUserRecordsPage] = useState(1);
  const [userRecordsPageSize, setUserRecordsPageSize] = useState(10);
  const [userRecordsLoading, setUserRecordsLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isReportModalVisible, setIsReportModalVisible] = useState(false);

  // 监听项目变化
  useEffect(() => {
    if (currentProject) {
      fetchReportsPage();
      fetchReportsAll();
    } else {
      setReports([]);
      setAllReports([]);
    }
  }, [currentProject]);

  // 监听项目变化事件
  useEffect(() => {
    const handleProjectChange = () => {
      fetchReportsPage();
      fetchReportsAll();
    };

    window.addEventListener('projectChanged', handleProjectChange);
    return () => {
      window.removeEventListener('projectChanged', handleProjectChange);
    };
  }, []);

  // 聚合分页列表
  const fetchReportsPage = async (page = 1, pageSize = 20) => {
    if (!currentProject) return;

    setLoading(true);
    setReports([]);
    try {
      const response = await axios.post('/api/report/getReportData', {
        pageCurrent: page,
        pageSize,
        projectId: currentProject._id
      });
      if (response.data.success) {
        setReports(response.data.data);
        setPagination({
          current: page,
          pageSize: pageSize,
          total: response.data.total || response.data.data.length
        });
      } else {
        message.error('获取数据统计列表失败');
      }
    } catch (error) {
      console.error('获取数据统计列表错误:', error);
      message.error('获取数据统计列表失败');
    } finally {
      setLoading(false);
    }
  };

  // 全量数据（用于图表）
  const fetchReportsAll = async () => {
    if (!currentProject) return;

    setChartLoading(true);
    try {
      const response = await axios.post('/api/report/getReportData', {
        pageCurrent: 1,
        pageSize: 100000,
        projectId: currentProject._id
      });
      if (response.data.success) {
        setAllReports(response.data.data);
      } else {
        message.error('获取图表数据失败');
      }
    } catch (error) {
      console.error('获取图表数据错误:', error);
      message.error('获取图表数据失败');
    } finally {
      setChartLoading(false);
    }
  };

  // 删除记录
  const handleDelete = async (id) => {
    try {
      const response = await axios.delete(`/api/report/${id}`);
      if (response.data.success) {
        message.success('删除成功');
        fetchReportsPage(pagination.current, pagination.pageSize); // 重新加载数据
      } else {
        message.error('删除失败');
      }
    } catch (error) {
      console.error('删除错误:', error);
      message.error('删除失败');
    }
  };

  // 获取用户所有记录（分页）
  const fetchUserRecords = async (username, page = 1, pageSize = 10) => {
    if (!currentProject) return;

    setUserRecordsLoading(true);
    try {
      const response = await axios.get(`/api/report/user/${encodeURIComponent(username)}`, {
        params: {
          page,
          pageSize,
          projectId: currentProject._id
        }
      });
      if (response.data.success) {
        setUserRecords(response.data.data);
        setUserRecordsTotal(response.data.total);
        setUserRecordsPage(page);
        setUserRecordsPageSize(pageSize);
      } else {
        message.error('获取用户记录失败');
      }
    } catch (error) {
      console.error('获取用户记录错误:', error);
      message.error('获取用户记录失败');
    } finally {
      setUserRecordsLoading(false);
    }
  };

  // 查看用户详情
  const handleViewUser = (username) => {
    setSelectedUser(username);
    fetchUserRecords(username);
    setIsModalVisible(true);
  };

  // 处理表格分页变化
  const handleTableChange = (pagination) => {
    fetchReportsPage(pagination.current, pagination.pageSize);
  };

  // 处理用户记录分页变化
  const handleUserRecordsChange = (page, pageSize) => {
    fetchUserRecords(selectedUser, page, pageSize);
  };

  // 关闭用户详情弹窗
  const handleModalClose = () => {
    setIsModalVisible(false);
    setSelectedUser(null);
    setUserRecords([]);
  };

  // 打开自主上报弹窗
  const handleOpenReportModal = () => {
    setIsReportModalVisible(true);
  };

  // 关闭自主上报弹窗
  const handleCloseReportModal = () => {
    setIsReportModalVisible(false);
  };

  // 自主上报成功回调
  const handleReportSuccess = () => {
    setIsReportModalVisible(false);
    fetchReportsPage();
    fetchReportsAll();
    message.success('上报成功');
  };

  return (
    <div>

      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <Title level={4} style={{ margin: 0 }}>数据统计</Title>
          <Button type="primary" onClick={handleOpenReportModal}>自主上报</Button>
        </div>
        <Row gutter={[16, 16]} style={{ marginBottom: '20px' }}>
          <Col span={8}>
            <ChartPanel data={allReports} loading={chartLoading} />
          </Col>
          <Col span={16}>
            <Card title="数据记录">
              <DataTable
                data={reports}
                loading={loading}
                pagination={pagination}
                onTableChange={handleTableChange}
                onView={handleViewUser}
                onDelete={handleDelete}
              />
            </Card>
          </Col>
        </Row>
      </Card>

      <Row gutter={[16, 16]}>

      </Row>

      {/* 用户详情弹窗 */}
      <ReportModal
        visible={isModalVisible}
        username={selectedUser}
        data={userRecords}
        loading={userRecordsLoading}
        pagination={{
          current: userRecordsPage,
          pageSize: userRecordsPageSize,
          total: userRecordsTotal
        }}
        onPageChange={handleUserRecordsChange}
        onClose={handleModalClose}
        type="userRecords"
      />

      {/* 自主上报弹窗 */}
      <ReportFormModal
        visible={isReportModalVisible}
        onCancel={handleCloseReportModal}
        onSuccess={handleReportSuccess}
        projectId={currentProject?._id}
      />
    </div>
  );
};

export default StatisticPage;