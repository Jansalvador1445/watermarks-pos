import { useState } from 'react';
import { Button, Tag, Space, Form, Input, Select, message, Popconfirm, Tabs, Typography, Modal } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, CopyOutlined, SearchOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userApi } from '@/services/api';
import { BaseTable } from '@/components/BaseTable';
import { BaseModal } from '@/components/BaseModal';
import { PageHeader } from '@/components/PageHeader';
import { usePagination } from '@/hooks/usePagination';
import { useSearchFromUrl } from '@/hooks/useSearchFromUrl';
import { USER_ROLES, ROLE_PERMISSIONS, APP_NAME } from '@/utils/constants';
import { getStatusColor } from '@/utils/formatters';
import {
  buildPermissionsFromState,
  buildStateFromPermissions,
  countEnabledPermissions,
} from '@/utils/permissions';
import {
  UserPermissionsEditor,
  type PermissionModuleState,
} from '@/features/users/UserPermissionsEditor';

const { Text } = Typography;

const ROLE_HINTS: Record<string, string> = {
  admin: 'Full access to everything — users, settings, backups, and all pages.',
  cashier: 'Best for front desk: sales, orders, customers, and daily collection.',
  delivery_staff: 'Best for riders: deliveries, gallon tracking, and delivery history.',
  custom: 'Pick exactly which pages this person can view or manage.',
};

const PRESET_ROLES = [
  { label: 'Copy from Cashier', value: 'cashier' },
  { label: 'Copy from Delivery Staff', value: 'delivery_staff' },
];

const emptyPermissionState = buildStateFromPermissions([]);

interface TempCredentials {
  name: string;
  email: string;
  tempPassword: string;
}

export const UsersPage = () => {
  const queryClient = useQueryClient();
  const { page, limit, onPageChange } = usePagination();
  const { search, setSearch, debouncedSearch } = useSearchFromUrl();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [permissionState, setPermissionState] = useState<Record<string, PermissionModuleState>>(emptyPermissionState);
  const [activeTab, setActiveTab] = useState('details');
  const [tempCredentials, setTempCredentials] = useState<TempCredentials | null>(null);
  const [form] = Form.useForm();
  const selectedRole = Form.useWatch('role', form);

  const { data, isLoading } = useQuery({
    queryKey: ['users', page, limit, debouncedSearch],
    queryFn: () => userApi.list({ page, limit, search: debouncedSearch || undefined }).then((r) => r.data),
  });

  const saveMutation = useMutation({
    mutationFn: async (values: Record<string, unknown>) => {
      const payload: Record<string, unknown> = {
        name: values.name,
        email: values.email,
        role: values.role,
        status: values.status,
      };

      if (values.role === 'custom') {
        const customPermissions = buildPermissionsFromState(permissionState);
        if (customPermissions.length === 0) {
          throw new Error('Please select at least one permission on the Access tab.');
        }
        payload.customPermissions = customPermissions;
      }

      if (editingId) {
        return userApi.update(editingId, payload);
      }
      return userApi.create(payload);
    },
    onSuccess: (res, variables) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      if (editingId) {
        message.success('User saved successfully');
        closeModal();
        return;
      }
      const result = res?.data?.data as { user: { email: string }; tempPassword: string } | undefined;
      if (result?.tempPassword) {
        closeModal();
        setTempCredentials({
          name: String(variables.name),
          email: result.user?.email || String(variables.email),
          tempPassword: result.tempPassword,
        });
      } else {
        message.success('User created successfully');
        closeModal();
      }
    },
    onError: (err: Error) => {
      message.error(err.message || 'Failed to save user');
      if (err.message.includes('Access tab')) setActiveTab('permissions');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => userApi.delete(id),
    onSuccess: () => {
      message.success('User deleted');
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });

  const closeModal = () => {
    setModalOpen(false);
    setEditingId(null);
    setActiveTab('details');
    form.resetFields();
    setPermissionState(emptyPermissionState);
  };

  const openCreate = () => {
    setEditingId(null);
    form.resetFields();
    form.setFieldsValue({ status: 'active', role: 'cashier' });
    setPermissionState(buildStateFromPermissions(ROLE_PERMISSIONS.cashier));
    setActiveTab('details');
    setModalOpen(true);
  };

  const openEdit = async (user: { _id: string }) => {
    try {
      const { data: res } = await userApi.get(user._id);
      const fullUser = res.data as {
        _id: string;
        name: string;
        email: string;
        role: string;
        status: string;
        customPermissions?: string[];
      };

      setEditingId(fullUser._id);
      form.setFieldsValue({
        name: fullUser.name,
        email: fullUser.email,
        role: fullUser.role,
        status: fullUser.status,
      });

      if (fullUser.role === 'custom') {
        setPermissionState(buildStateFromPermissions(fullUser.customPermissions || []));
      } else {
        setPermissionState(buildStateFromPermissions(ROLE_PERMISSIONS[fullUser.role] || []));
      }

      setActiveTab('details');
      setModalOpen(true);
    } catch {
      message.error('Could not load user details');
    }
  };

  const handleRoleChange = (role: string) => {
    if (role === 'custom') {
      const currentDefault = ['admin', 'cashier', 'delivery_staff'].includes(selectedRole)
        ? selectedRole
        : 'cashier';
      setPermissionState(buildStateFromPermissions(ROLE_PERMISSIONS[currentDefault] || []));
      setActiveTab('permissions');
      return;
    }

    setPermissionState(buildStateFromPermissions(ROLE_PERMISSIONS[role] || []));
    if (role !== 'admin') setActiveTab('permissions');
  };

  const applyPreset = (presetRole: string) => {
    setPermissionState(buildStateFromPermissions(ROLE_PERMISSIONS[presetRole] || []));
    message.success(`Permissions copied from ${USER_ROLES.find((r) => r.value === presetRole)?.label}`);
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      if (values.role === 'custom' && countEnabledPermissions(permissionState) === 0) {
        message.warning('Please select at least one permission on the Access tab.');
        setActiveTab('permissions');
        return;
      }
      saveMutation.mutate(values);
    } catch {
      message.warning('Please fill in all required user details.');
    }
  };

  const copyCredentials = async () => {
    if (!tempCredentials) return;
    const text = `${APP_NAME} — Login Credentials\nName: ${tempCredentials.name}\nEmail: ${tempCredentials.email}\nTemporary Password: ${tempCredentials.tempPassword}\n\nSign in and you will be asked to set up your own username, email, and password.`;
    try {
      await navigator.clipboard.writeText(text);
      message.success('Credentials copied to clipboard');
    } catch {
      message.error('Could not copy — please copy manually');
    }
  };

  const roleLabel = (role: string) =>
    USER_ROLES.find((r) => r.value === role)?.label || role.replace('_', ' ');

  const isCustomRole = selectedRole === 'custom';
  const isAdminRole = selectedRole === 'admin';
  const readOnlyPermissions = selectedRole && !isCustomRole;

  const columns = [
    { title: 'Name', dataIndex: 'name' },
    { title: 'Email', dataIndex: 'email' },
    {
      title: 'Role',
      dataIndex: 'role',
      render: (r: string) => <Tag color={r === 'admin' ? 'blue' : r === 'custom' ? 'purple' : 'default'}>{roleLabel(r)}</Tag>,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      render: (s: string) => <Tag color={getStatusColor(s)}>{s.toUpperCase()}</Tag>,
    },
    {
      title: 'Setup',
      dataIndex: 'isOnboarded',
      render: (onboarded: boolean) =>
        onboarded ? (
          <Tag color="green">Completed</Tag>
        ) : (
          <Tag color="orange">Pending Setup</Tag>
        ),
    },
    {
      title: 'Actions',
      render: (_: unknown, r: { _id: string; role: string }) => (
        <Space>
          <Button type="text" icon={<EditOutlined />} onClick={() => openEdit(r)} />
          {r.role !== 'admin' && (
            <Popconfirm title="Delete this user?" onConfirm={() => deleteMutation.mutate(r._id)}>
              <Button type="text" danger icon={<DeleteOutlined />} />
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Users"
        subtitle="Add staff accounts and control what each person can see and do"
        refreshQueryKeys={['users']}
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
            Add User
          </Button>
        }
      />

      <div className="filter-toolbar mb-16">
        <Input
          placeholder="Search name, email, or username..."
          prefix={<SearchOutlined />}
          allowClear
          className="w-280"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <BaseTable
        dataSource={data?.data}
        columns={columns}
        rowKey="_id"
        loading={isLoading}
        pagination={{ current: page, pageSize: limit, total: data?.pagination?.total, onChange: onPageChange }}
      />

      <BaseModal
        title={editingId ? 'Edit User' : 'Add User'}
        open={modalOpen}
        onCancel={closeModal}
        onOk={handleSave}
        okText="Save User"
        confirmLoading={saveMutation.isPending}
        width={640}
        scrollable
      >
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            {
              key: 'details',
              label: 'Account',
              children: (
                <Form form={form} layout="vertical" initialValues={{ status: 'active', role: 'cashier' }}>
                  <Form.Item name="name" label="Full Name" rules={[{ required: true, message: 'Name is required' }]}>
                    <Input placeholder="e.g. Juan Dela Cruz" />
                  </Form.Item>
                  <Form.Item
                    name="email"
                    label="Email"
                    rules={[{ required: true, type: 'email', message: 'Valid email is required' }]}
                    extra={!editingId ? 'A temporary password will be generated after saving.' : undefined}
                  >
                    <Input placeholder="name@example.com" />
                  </Form.Item>
                  <Form.Item name="role" label="Role" rules={[{ required: true }]}>
                    <Select
                      options={USER_ROLES}
                      onChange={handleRoleChange}
                    />
                  </Form.Item>
                  {selectedRole && ROLE_HINTS[selectedRole] && (
                    <Text type="secondary" className="block mb-16 text-sm">
                      {ROLE_HINTS[selectedRole]}
                    </Text>
                  )}
                  <Form.Item name="status" label="Status">
                    <Select
                      options={[
                        { label: 'Active', value: 'active' },
                        { label: 'Inactive', value: 'inactive' },
                      ]}
                    />
                  </Form.Item>
                </Form>
              ),
            },
            {
              key: 'permissions',
              label: isCustomRole ? 'Access (Required)' : 'Access',
              children: (
                <>
                  {isCustomRole && (
                    <Space className="mb-16" wrap>
                      <Text type="secondary">Quick start:</Text>
                      <Select
                        placeholder="Copy permissions from..."
                        style={{ width: 220 }}
                        allowClear
                        options={PRESET_ROLES}
                        onChange={(v) => v && applyPreset(v)}
                      />
                    </Space>
                  )}
                  <UserPermissionsEditor
                    value={permissionState}
                    onChange={setPermissionState}
                    readOnly={!!readOnlyPermissions}
                    isAdmin={isAdminRole}
                    previewPermissions={
                      readOnlyPermissions && selectedRole
                        ? ROLE_PERMISSIONS[selectedRole] || []
                        : undefined
                    }
                  />
                </>
              ),
            },
          ]}
        />
      </BaseModal>

      <Modal
        title="Share Login Credentials"
        open={!!tempCredentials}
        onCancel={() => setTempCredentials(null)}
        footer={[
          <Button key="close" onClick={() => setTempCredentials(null)}>
            Done
          </Button>,
          <Button key="copy" type="primary" icon={<CopyOutlined />} onClick={copyCredentials}>
            Copy All
          </Button>,
        ]}
      >
        {tempCredentials && (
          <div>
            <Text className="block mb-16">
              Share these temporary credentials with <Text strong>{tempCredentials.name}</Text>. They will be
              asked to set their own username, email, and password on first login.
            </Text>
            <div className="mb-12">
              <Text type="secondary" className="text-xs block mb-4">
                Email
              </Text>
              <Input readOnly value={tempCredentials.email} />
            </div>
            <div>
              <Text type="secondary" className="text-xs block mb-4">
                Temporary Password
              </Text>
              <Input readOnly value={tempCredentials.tempPassword} />
            </div>
            <Text type="secondary" className="text-xs block mt-12">
              This password is shown once. Copy it now before closing.
            </Text>
          </div>
        )}
      </Modal>
    </div>
  );
};
