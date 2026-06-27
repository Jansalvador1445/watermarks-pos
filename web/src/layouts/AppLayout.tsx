import { Layout } from 'antd';
import { Outlet } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AppSidebar } from './AppSidebar';
import { AppHeader } from './AppHeader';
import { NotificationListener } from '@/components/NotificationListener';
import { useUIStore } from '@/store/uiStore';

const { Content } = Layout;

export const AppLayout = () => {
  const { mobileSidebarOpen, setMobileSidebarOpen } = useUIStore();

  return (
    <Layout className="app-shell min-h-screen">
      <NotificationListener />
      <AppSidebar />
      {mobileSidebarOpen && (
        <button
          type="button"
          className="app-sidebar-overlay"
          aria-label="Close navigation"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}
      <Layout className="app-main">
        <AppHeader />
        <Content className="app-content">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}>
            <Outlet />
          </motion.div>
        </Content>
      </Layout>
    </Layout>
  );
};
