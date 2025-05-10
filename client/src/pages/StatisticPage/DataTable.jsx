import React from 'react';
import { Table, Button, Card, Space } from 'antd';

const DataTable = ({ reports, loading, onView, onDelete, onPageChange, total = 0, current = 1, pageSize = 20 }) => {
  // 表格列定义
  const columns = [
    {
      title: '序号',
      key: 'index',
      render: (_text, _record, index) => ((current - 1) * pageSize) + index + 1,
      width: 70,
      align: 'center',
    },
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
      title: '版本号',
      dataIndex: 'version',
      key: 'version',
    },
    {
      title: '备注',
      dataIndex: 'remark',
      key: 'remark',
      ellipsis: true,
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
          <Button type="primary" onClick={() => onView(record)}>查看</Button>
          <Button danger onClick={() => onDelete(record._id)}>删除</Button>
        </Space>
      ),
    },
  ];

  return (
    <Card title="数据记录" size="small">
      <Table 
        columns={columns} 
        dataSource={reports} 
        rowKey="_id" 
        loading={loading}
        pagination={{
          current,
          pageSize,
          total, // 关键：传递总数
          showSizeChanger: true,
          pageSizeOptions: [10, 20, 50, 100],
          showTotal: (total) => `共 ${total} 条记录`,
          onChange: onPageChange,
          onShowSizeChange: (current, size) => {
            // 切换每页条数时，重置到第一页
            onPageChange(1, size);
          }
        }}
        size="small"
        scroll={{
          y: 'calc(100vh - 360px)'
        }}
        className="statistic-table"
      />
      <style jsx="true">{`
        .statistic-table .ant-table { 
          height: calc(100vh - 329px);
        }
        // .statistic-table .ant-table-body {
        //   height: calc(100vh - 64px);
        //   min-height: 300px;
        // }
      `}</style>
    </Card>
  );
};

export default DataTable;