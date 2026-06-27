import { Checkbox, Table, Typography, Alert, Tag, Space } from 'antd';
import { CheckOutlined, CloseOutlined } from '@ant-design/icons';
import {
  PERMISSION_MODULES,
  buildStateFromPermissions,
  countEnabledPermissions,
  type PermissionModuleState,
} from '@/utils/permissions';

const { Text } = Typography;

interface UserPermissionsEditorProps {
  value: Record<string, PermissionModuleState>;
  onChange: (value: Record<string, PermissionModuleState>) => void;
  readOnly?: boolean;
  previewPermissions?: string[];
  isAdmin?: boolean;
}

export const UserPermissionsEditor = ({
  value,
  onChange,
  readOnly = false,
  previewPermissions,
  isAdmin = false,
}: UserPermissionsEditorProps) => {
  const moduleState = previewPermissions ? buildStateFromPermissions(previewPermissions) : value;
  const enabledCount = countEnabledPermissions(moduleState);

  const handleToggle = (moduleKey: string, field: 'view' | 'manage', checked: boolean) => {
    if (readOnly) return;
    const current = moduleState[moduleKey] || { view: false, manage: false };
    const next = { ...moduleState, [moduleKey]: { ...current, [field]: checked } };

    if (field === 'manage' && checked) {
      const mod = PERMISSION_MODULES.find((m) => m.key === moduleKey);
      if (mod?.viewPermission) next[moduleKey].view = true;
    }

    if (field === 'view' && !checked) {
      next[moduleKey].manage = false;
    }

    onChange(next);
  };

  if (isAdmin) {
    return (
      <Alert
        type="success"
        showIcon
        message="Administrator has full access"
        description="Admins can access every page and action in the system. Permissions cannot be changed for this role."
      />
    );
  }

  const columns = [
    { title: 'Page / Feature', dataIndex: 'label', key: 'label' },
    {
      title: 'View',
      key: 'view',
      width: 80,
      align: 'center' as const,
      render: (_: unknown, record: (typeof PERMISSION_MODULES)[0]) => {
        if (record.adminOnly) {
          return <Tag color="default">Admin only</Tag>;
        }
        if (record.manageOnly || !record.viewPermission) return '—';
        if (readOnly) {
          return moduleState[record.key]?.view ? (
            <CheckOutlined style={{ color: '#52c41a' }} />
          ) : (
            <CloseOutlined style={{ color: '#d9d9d9' }} />
          );
        }
        return (
          <Checkbox
            checked={moduleState[record.key]?.view}
            onChange={(e) => handleToggle(record.key, 'view', e.target.checked)}
          />
        );
      },
    },
    {
      title: 'Manage',
      key: 'manage',
      width: 90,
      align: 'center' as const,
      render: (_: unknown, record: (typeof PERMISSION_MODULES)[0]) => {
        if (record.adminOnly) return '—';
        if (record.viewOnly || !record.managePermission) return '—';
        if (readOnly) {
          return moduleState[record.key]?.manage ? (
            <CheckOutlined style={{ color: '#52c41a' }} />
          ) : (
            <CloseOutlined style={{ color: '#d9d9d9' }} />
          );
        }
        return (
          <Checkbox
            checked={moduleState[record.key]?.manage}
            onChange={(e) => handleToggle(record.key, 'manage', e.target.checked)}
          />
        );
      },
    },
  ];

  return (
    <div>
      {readOnly ? (
        <Alert
          type="info"
          showIcon
          className="mb-16"
          message="These permissions come from the selected role"
          description="Pick Cashier, Delivery Staff, or Custom Role above. Custom Role lets you choose access manually."
        />
      ) : (
        <Alert
          type="info"
          showIcon
          className="mb-16"
          message="Choose what this user can access"
          description="View = can open the page. Manage = can add, edit, and delete. Admin-only pages cannot be assigned."
        />
      )}

      <Space className="mb-12">
        <Text type="secondary">
          {readOnly ? 'Included access:' : 'Selected:'}{' '}
          <Text strong>{enabledCount}</Text> permission{enabledCount === 1 ? '' : 's'}
        </Text>
      </Space>

      <Table
        size="small"
        pagination={false}
        rowKey="key"
        dataSource={PERMISSION_MODULES}
        columns={columns}
        scroll={{ y: 360 }}
      />
    </div>
  );
};

export type { PermissionModuleState };
export { buildPermissionsFromState, buildStateFromPermissions } from '@/utils/permissions';
