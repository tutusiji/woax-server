import React from 'react';
import { Modal, Table } from 'antd';

const ReportModal = ({
  visible,
  username,
  data = [], // 修改为data以匹配StatisticPage中传递的props
  pagination = {}, // 修改为接收完整的pagination对象
  loading = false,
  onClose, // 修改为onClose以匹配StatisticPage中传递的props
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
        onCancel={onClose} // 修改为onClose以匹配StatisticPage中传递的props
        footer={null}
        width={800}
      >
        <Table
          columns={columns}
          dataSource={data} // 修改为data以匹配StatisticPage中传递的props
          rowKey="_id"
          loading={loading}
          pagination={{
            ...pagination, // 使用传入的完整pagination对象
            showSizeChanger: true,
            pageSizeOptions: [10, 20, 50, 100],
            showTotal: t => `共 ${t} 条记录`,
            onChange: (page, pageSize) => onPageChange(page, pageSize), // 确保正确传递参数
            onShowSizeChange: (current, size) => onPageChange(current, size), // 确保正确传递参数
          }}
          size="small"
        />
      </Modal>
    );
  }
  return null;
};

export default ReportModal;