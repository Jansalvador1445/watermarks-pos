import { Table, Card, Skeleton, Empty, Grid, Pagination } from 'antd';
import type { TableProps, ColumnsType } from 'antd/es/table';
import type { TablePaginationConfig } from 'antd/es/table/interface';
import { MobileListCard } from './MobileListCard';

const { useBreakpoint } = Grid;

interface BaseTableProps<T extends object> extends Omit<TableProps<T>, 'title'> {
  cardTitle?: string;
  extra?: React.ReactNode;
  loading?: boolean;
  renderMobileItem?: (record: T, index: number) => React.ReactNode;
  mobileList?: boolean;
}

const getColumnValue = <T extends object>(
  record: T,
  column: ColumnsType<T>[number],
  index: number,
): React.ReactNode => {
  if (!('dataIndex' in column) || column.dataIndex === undefined) {
    return null;
  }

  const dataIndex = column.dataIndex;
  const rawValue = Array.isArray(dataIndex)
    ? dataIndex.reduce<unknown>((acc, key) => (acc as Record<string, unknown>)?.[key], record)
    : (record as Record<string, unknown>)[dataIndex as string];

  if (column.render) {
    const rendered = column.render(rawValue, record, index);
    if (rendered && typeof rendered === 'object' && 'children' in rendered) {
      return (rendered as { children?: React.ReactNode }).children ?? null;
    }
    return rendered as React.ReactNode;
  }

  return rawValue as React.ReactNode;
};

const getColumnTitle = <T extends object>(column: ColumnsType<T>[number]): React.ReactNode => {
  if (typeof column.title === 'function') {
    const dataIndex = 'dataIndex' in column ? column.dataIndex : undefined;
    return String(column.key ?? dataIndex ?? 'Field');
  }
  return column.title as React.ReactNode;
};

const buildAutoMobileItem = <T extends object>(record: T, columns: ColumnsType<T>, index: number) => {
  const dataColumns = columns.filter(
    (column) => 'dataIndex' in column && column.dataIndex && column.title !== 'Actions',
  );
  const actionsColumn = columns.find((column) => column.title === 'Actions' && column.render);

  const [titleColumn, ...detailColumns] = dataColumns;
  if (!titleColumn) {
    return null;
  }

  return (
    <MobileListCard
      title={getColumnValue(record, titleColumn, index)}
      fields={detailColumns.map((column) => ({
        label: getColumnTitle(column),
        value: getColumnValue(record, column, index),
      }))}
      actions={(() => {
        const rendered = actionsColumn?.render?.(undefined, record, index);
        if (rendered && typeof rendered === 'object' && 'children' in rendered) {
          return (rendered as { children?: React.ReactNode }).children ?? null;
        }
        return rendered as React.ReactNode;
      })()}
    />
  );
};

export function BaseTable<T extends object>({
  cardTitle,
  extra,
  loading,
  renderMobileItem,
  mobileList = true,
  columns = [],
  ...props
}: BaseTableProps<T>) {
  const screens = useBreakpoint();
  const isMobile = mobileList && !screens.md;
  const typedColumns = columns as ColumnsType<T>;
  const dataSource = props.dataSource ?? [];

  const paginationConfig: false | TablePaginationConfig =
    props.pagination !== false
      ? {
          showSizeChanger: !!screens.md,
          showTotal: screens.md ? (total: number) => `Total ${total} items` : undefined,
          simple: !screens.md,
          size: screens.md ? 'middle' : 'small',
          ...(typeof props.pagination === 'object' ? props.pagination : {}),
        }
      : false;

  if (loading && !dataSource.length) {
    return (
      <Card bordered={false} className="card-rounded" title={cardTitle} extra={extra}>
        <Skeleton active paragraph={{ rows: 5 }} />
      </Card>
    );
  }

  if (isMobile) {
    return (
      <Card bordered={false} className="card-rounded card-rounded--mobile-list" title={cardTitle} extra={extra}>
        {loading ? (
          <Skeleton active paragraph={{ rows: 4 }} />
        ) : dataSource.length === 0 ? (
          <Empty description="No data" />
        ) : (
          <div className="mobile-list">
            {dataSource.map((record, index) => (
              <div key={String((record as { _id?: string })._id ?? index)} className="mobile-list__item">
                {renderMobileItem?.(record, index) ?? buildAutoMobileItem(record, typedColumns, index)}
              </div>
            ))}
          </div>
        )}
        {paginationConfig !== false && (
          <div className="mobile-list__pagination">
            <Pagination
              current={(paginationConfig as TablePaginationConfig).current}
              pageSize={(paginationConfig as TablePaginationConfig).pageSize}
              total={(paginationConfig as TablePaginationConfig).total}
              onChange={(paginationConfig as TablePaginationConfig).onChange}
              simple={!screens.md}
              size="small"
              showSizeChanger={false}
            />
          </div>
        )}
      </Card>
    );
  }

  return (
    <Card bordered={false} className="card-rounded" title={cardTitle} extra={extra}>
      <div className="table-scroll-wrap">
        <Table<T>
          {...props}
          columns={typedColumns}
          loading={loading}
          pagination={paginationConfig}
          scroll={{ x: 'max-content' }}
        />
      </div>
    </Card>
  );
}
