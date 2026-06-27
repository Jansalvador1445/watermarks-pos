import { Modal } from 'antd';
import type { ModalProps } from 'antd';

interface BaseModalProps extends ModalProps {
  children: React.ReactNode;
}

export const BaseModal = ({ children, ...props }: BaseModalProps) => (
  <Modal
    destroyOnHidden
    centered
    styles={{ body: { paddingTop: 16 } }}
    {...props}
  >
    {children}
  </Modal>
);
