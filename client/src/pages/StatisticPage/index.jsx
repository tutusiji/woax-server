import React, { useState, useEffect } from 'react';
import { Card, Button, Typography, Row, Col, message } from 'antd';
import axios from 'axios';
import ChartPanel from './ChartPanel';
import DataTable from './DataTable';
import ReportModal from './ReportModal';
import ReportFormModal from './ReportFormModal';

const { Title } = Typography;

const StatisticPage = () => {
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

  // 聚合分页列表
  const fetchReportsPage = async (page = 1, pageSize = 20) => {
    setLoading(true);
    setReports([]);
    try {
      const response = await axios.post('/api/report/getReportData', { pageCurrent: page, pageSize });
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
    setChartLoading(true);
    try {
      const response = await axios.post('/api/report/getReportData', { pageCurrent: 1, pageSize: 100000 });
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
    setUserRecordsLoading(true);
    try {
      const response = await axios.get(`/api/report/user/${encodeURIComponent(username)}`, {
        params: { page, pageSize }
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
      message.error('获取用户记录失败');
    } finally {
      setUserRecordsLoading(false);
    }
  };

  // 查看详情
  const handleViewDetails = (record) => {
    setSelectedUser(record.username);
    fetchUserRecords(record.username, 1, 10);
    setIsModalVisible(true);
  };

  
  // 显示上报弹窗
  const showReportModal = () => {
    setIsReportModalVisible(true);
  };

  // 关闭上报弹窗
  const handleReportCancel = () => {
    setIsReportModalVisible(false);
  };

  // 提交上报数据成功后的回调
  const handleReportSuccess = () => {
    setIsReportModalVisible(false);
    fetchReportsPage(1, pagination.pageSize); // 重新加载数据，重置到第一页
    fetchReportsAll(); // 上报后刷新图表
  };

  useEffect(() => {
    setLoading(true);
    fetchReportsPage(1, pagination.pageSize);
    fetchReportsAll();
    // eslint-disable-next-line
  }, []);

  return (
    <div>
      <Card className="shadow-xl mb-4">
        <div className="flex justify-between items-center mb-4">
          <Title level={2}>数据统计分析</Title>
          <Button type="primary" onClick={showReportModal}>自主上报数据</Button>
        </div>
        
        <Row gutter={[16, 16]}>
          {/* 左侧图表区域 */}
          <Col xs={24} lg={8}>
            <ChartPanel reports={allReports} loading={chartLoading} />
          </Col>
          
          {/* 右侧表格区域 */}
          <Col xs={24} lg={16}>
            <DataTable 
              reports={reports} 
              loading={loading} 
              onView={handleViewDetails} 
              onDelete={handleDelete}
              onPageChange={(page, pageSize) => {
                setLoading(true);
                fetchReportsPage(page, pageSize);
              }}
              total={pagination.total}
              current={pagination.current}
              pageSize={pagination.pageSize}
            />
          </Col>
        </Row>
      </Card>

      {/* 详情弹窗 */}
      <ReportModal 
        visible={isModalVisible}
        username={selectedUser}
        records={userRecords}
        total={userRecordsTotal}
        current={userRecordsPage}
        pageSize={userRecordsPageSize}
        loading={userRecordsLoading}
        onCancel={() => setIsModalVisible(false)}
        onPageChange={(page, pageSize) => fetchUserRecords(selectedUser, page, pageSize)}
        type="userRecords"
      />

      {/* 自主上报弹窗 */}
      <ReportFormModal 
        visible={isReportModalVisible} 
        onCancel={handleReportCancel} 
        onSuccess={handleReportSuccess}
        type="report"
      />
    </div>
  );
};

export default StatisticPage;