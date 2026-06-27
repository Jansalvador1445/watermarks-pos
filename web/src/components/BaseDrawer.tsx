import { Drawer, Grid } from 'antd';
import type { DrawerProps } from 'antd';

const { useBreakpoint } = Grid;

interface BaseDrawerProps extends DrawerProps {
  children: React.ReactNode;
}

export const BaseDrawer = ({ children, width = 480, ...props }: BaseDrawerProps) => {
  const screens = useBreakpoint();
  const drawerWidth = screens.md ? width : '100%';

  return (
    <Drawer destroyOnHidden width={drawerWidth} {...props}>
      {children}
    </Drawer>
  );
};
