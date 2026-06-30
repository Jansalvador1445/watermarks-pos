import { Modal } from 'antd';
import type { ModalProps } from 'antd';

interface BaseModalProps extends ModalProps {
  children: React.ReactNode;
  scrollable?: boolean;
}

export const BaseModal = ({ children, scrollable = false, styles, ...props }: BaseModalProps) => {
  const scrollBodyStyles = scrollable
    ? { maxHeight: '70vh', overflowY: 'auto' as const }
    : {};

  const mergedStyles: ModalProps['styles'] =
    typeof styles === 'function'
      ? (info) => {
          const resolved = styles(info);
          return {
            ...resolved,
            body: { paddingTop: 16, ...scrollBodyStyles, ...resolved?.body },
          };
        }
      : {
          ...styles,
          body: { paddingTop: 16, ...scrollBodyStyles, ...styles?.body },
        };

  return (
    <Modal destroyOnHidden centered styles={mergedStyles} {...props}>
      {children}
    </Modal>
  );
};
