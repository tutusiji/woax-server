import React from 'react';
import { Modal, Table } from 'antd';

const ReportModal = ({
  visible,
  username,
  records = [],
  total = 0,
  current = 1,
  pageSize = 10,
  loading = false,
  onCancel,
  onPageChange,
  type,
}) => {
  if (type === 'userRecords') {
    const columns = [
      { title: '时间', dataIndex: 'timestamp', key: 'timestamp', render: t => new Date(t).toLocaleString() },
      { title: '版本号', dataIndex: 'version', key: 'version' },
      { title: '备注', dataIndex: 'remark', key: 'remark', ellipsis: true },
      { title: '设备信息', dataIndex: 'deviceInfo', key: 'deviceInfo', ellipsis: true },
      // ...可根据需要添加更多字段
    ];
    return (
      <Modal
        open={visible}
        title={`用户 ${username} 的所有上报记录`}
        onCancel={onCancel}
        footer={null}
        width={800}
      >
        <Table
          columns={columns}
          dataSource={records}
          rowKey="_id"
          loading={loading}
          pagination={{
            current,
            pageSize,
            total,
            showSizeChanger: true,
            pageSizeOptions: [10, 20, 50, 100],
            showTotal: t => `共 ${t} 条记录`,
            onChange: onPageChange,
            onShowSizeChange: onPageChange,
          }}
          size="small"
        />
      </Modal>
    );
  }
  return null;
};

export default ReportModal;