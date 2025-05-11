import React from 'react';
import { Table, Button, Space, Tooltip } from 'antd';
import AuthButton from '../../components/AuthButton';
import { calc } from 'antd/es/theme/internal';

const DataTable = ({ data, loading, pagination, onTableChange, onView, onDelete }) => {
  // 表格列定义
  const columns = [
    {
      title: '序号',
      dataIndex: 'index',
      key: 'index',
      width: 80,
      render: (_, __, index) => index + 1 + (pagination.current - 1) * pagination.pageSize
    },
    {
      title: '用户名',
      dataIndex: 'username',
      key: 'username',
      width: 120,
      ellipsis: true,
    },
    {
      title: 'IP地址',
      dataIndex: 'ip',
      key: 'ip',
      width: 120,
      ellipsis: true,
    },
    {
      title: '时间',
      dataIndex: 'timestamp',
      key: 'timestamp',
      width: 170,
      render: (text) => new Date(text).toLocaleString()
    },
    {
      title: '版本号',
      dataIndex: 'version',
      key: 'version',
      width: 100,
      ellipsis: true,
    },
    {
      title: '备注',
      dataIndex: 'remark',
      key: 'remark',
      width: 150,
      ellipsis: true,
      render: (text) => (
        <Tooltip title={text}>
          <div style={{ maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {text || '-'}
          </div>
        </Tooltip>
      )
    },
    {
      title: '设备信息',
      dataIndex: 'deviceInfo',
      key: 'deviceInfo',
      width: 150,
      ellipsis: true,
      render: (text) => (
        <Tooltip title={text}>
          <div style={{ maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {text || '-'}
          </div>
        </Tooltip>
      )
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      render: (_, record) => (
        <Space size="small">
          <Button type="primary" size="small" onClick={() => onView(record.username)}>
            查看
          </Button>
          <AuthButton 
            type="primary" 
            danger 
            size="small" 
            onClick={() => onDelete(record._id)}
            tooltip="需要管理员权限才能删除记录"
          >
            删除
          </AuthButton>
        </Space>
      ),
    },
  ];

  return (
    <div  className="w-[100%] h-[775px] overflow-hidden">
      <Table
        className="statistic-table"
        columns={columns}
        dataSource={data}
        rowKey="_id"
        pagination={pagination}
        onChange={onTableChange}
        loading={loading}
        scroll={{ x: 1010, y: 673 }}
        size="middle"
      />
      <style jsx="true">{`
        .statistic-table .ant-table-placeholder .ant-table-cell {
          max-width: 1010px !important;
        }
        .statistic-table .ant-table-expanded-row-fixed {
          max-width: 1010px !important;
        }
        .statistic-table colgroup col {
          width: auto !important;
        }
       
      `}</style>
    </div>
  );
};

export default DataTable;