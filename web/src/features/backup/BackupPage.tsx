import { Button, Table, message } from 'antd';
import { CloudUploadOutlined, DownloadOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { backupApi } from '@/services/api';
import { PageHeader } from '@/components/PageHeader';
import { formatDateTime } from '@/utils/formatters';

export const BackupPage = () => {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['backups'],
    queryFn: () => backupApi.list().then((r) => r.data.data),
  });

  const createMutation = useMutation({
    mutationFn: () => backupApi.create(),
    onSuccess: () => {
      message.success('Backup created');
      queryClient.invalidateQueries({ queryKey: ['backups'] });
    },
  });

  const downloadBackup = async (id: string, filename: string) => {
    const { data: blob } = await backupApi.download(id);
    const url = URL.createObjectURL(blob as Blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
  };

  const columns = [
    { title: 'Filename', dataIndex: 'filename' },
    { title: 'Size', dataIndex: 'size', render: (s: number) => `${(s / 1024).toFixed(2)} KB` },
    { title: 'Created By', dataIndex: ['createdBy', 'name'] },
    { title: 'Created At', dataIndex: 'createdAt', render: (d: string) => formatDateTime(d) },
    {
      title: 'Actions',
      render: (_: unknown, r: { _id: string; filename: string }) => (
        <Button type="link" icon={<DownloadOutlined />} onClick={() => downloadBackup(r._id, r.filename)}>
          Download
        </Button>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Backup & Restore"
        subtitle="Manage database backups"
        refreshQueryKeys={['backups']}
        extra={
          <Button type="primary" icon={<CloudUploadOutlined />} loading={createMutation.isPending} onClick={() => createMutation.mutate()}>
            Create Backup
          </Button>
        }
      />

      <Table dataSource={data} columns={columns} rowKey="_id" loading={isLoading} />
    </div>
  );
};
