import React from 'react';
import { Table, Button, Space } from 'antd';

const DataTable = ({ data, loading, pagination, onTableChange, onView, onDelete }) => {
  // 表格列定义
  const columns = [
    {
      title: '序号',
      key: 'index',
      render: (_text, _record, index) => ((pagination.current - 1) * pagination.pageSize) + index + 1,
      width: 70,
      align: 'center',
    },
    {
      title: '用户名',
      dataIndex: 'username',
      key: 'username',
      width: 120,
    },
    {
      title: 'IP地址',
      dataIndex: 'ip',
      key: 'ip',
      width: 120,
    },
    {
      title: '时间',
      dataIndex: 'timestamp',
      key: 'timestamp',
      render: (text) => new Date(text).toLocaleString(),
      width: 180,
    },
    {
      title: '版本号',
      dataIndex: 'version',
      key: 'version',
      width: 100,
    },
    {
      title: '备注',
      dataIndex: 'remark',
      key: 'remark',
      ellipsis: true,
      width: 150,
    },
    {
      title: '设备信息',
      dataIndex: 'deviceInfo',
      key: 'deviceInfo',
      ellipsis: true,
      width: 150,
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      render: (_, record) => (
        <Space size="middle">
          <Button type="primary" size="small" onClick={() => onView(record.username)}>查看</Button>
          <Button danger size="small" onClick={() => onDelete(record._id)}>删除</Button>
        </Space>
      ),
    },
  ];

  return (
    <div >
      <Table 
        columns={columns} 
        dataSource={data} 
        rowKey="_id" 
        loading={loading}
        pagination={pagination}
        onChange={onTableChange}
        size="small"
        scroll={{ x: 1010, y: 'calc(100vh - 360px)' }}
        className="statistic-table"
      />
      <style jsx="true">{`
        .statistic-table .ant-table { 
          width: 100%;
          overflow-x: hidden;
        }
        .statistic-table .ant-table-body {
          overflow-x: auto;
        }
        .statistic-table .ant-table-placeholder .ant-table-cell {
          max-width: 1010px !important;
        }
        .statistic-table .ant-table-expanded-row-fixed {
          max-width: 1010px !important;
          width: 100% !important;
        }
        .statistic-table colgroup col {
          width: auto !important;
        }
      `}</style>
    </div>
  );
};

export default DataTable;