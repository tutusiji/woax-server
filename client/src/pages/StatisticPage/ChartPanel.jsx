import React from 'react';
import { Card, Spin } from 'antd';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';

// 颜色配置
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

const ChartPanel = ({ reports, loading }) => {
  // 准备图表数据
  const prepareChartData = () => {
    if (!reports || reports.length === 0) return { barData: [], lineData: [], pieData: [] };
    
    // 按版本号分组统计数量
    const versionCount = {};
    reports.forEach(report => {
      const version = report.version || '未知版本';
      versionCount[version] = (versionCount[version] || 0) + 1;
    });
    
    // 按日期分组统计数量
    const dateCount = {};
    reports.forEach(report => {
      const date = new Date(report.timestamp).toLocaleDateString();
      dateCount[date] = (dateCount[date] || 0) + 1;
    });
    
    // 按设备信息分组
    const deviceCount = {};
    reports.forEach(report => {
      const device = report.deviceInfo?.split(' - ')[0] || '未知设备';
      deviceCount[device] = (deviceCount[device] || 0) + 1;
    });
    
    // 转换为图表数据格式
    const barData = Object.keys(versionCount).map(version => ({
      name: version,
      数量: versionCount[version]
    }));
    
    const lineData = Object.keys(dateCount).sort().map(date => ({
      name: date,
      数量: dateCount[date]
    }));
    
    const pieData = Object.keys(deviceCount).map(device => ({
      name: device,
      value: deviceCount[device]
    }));
    
    return { barData, lineData, pieData };
  };
  
  const { barData, lineData, pieData } = prepareChartData();

  return (
    <div className="charts-container">
      {/* 版本分布柱状图 */}
      <Card className="mb-4" title="版本分布统计" size="small">
        {reports.length > 0 ? (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={barData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="数量" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex justify-center items-center h-48">
            <Spin tip="加载中" />
          </div>
        )}
      </Card>
      
      {/* 时间趋势折线图 */}
      <Card className="mb-4" title="时间趋势分析" size="small">
        {reports.length > 0 ? (
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={lineData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="数量" stroke="#82ca9d" activeDot={{ r: 8 }} />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex justify-center items-center h-48">
            <Spin tip="加载中" />
          </div>
        )}
      </Card>
      
      {/* 设备分布饼图 */}
      <Card title="设备分布统计" size="small">
        {reports.length > 0 ? (
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex justify-center items-center h-48">
            <Spin tip="加载中" />
          </div>
        )}
      </Card>
    </div>
  );
};

export default ChartPanel;