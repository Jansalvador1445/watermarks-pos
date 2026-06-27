import { theme as antTheme } from 'antd';
import type { ThemeConfig } from 'antd';
import { PRIMARY_COLOR, BG_COLOR, CARD_RADIUS } from '@/utils/constants';

export const lightTheme: ThemeConfig = {
  token: {
    colorPrimary: PRIMARY_COLOR,
    borderRadius: CARD_RADIUS,
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    colorBgLayout: BG_COLOR,
    colorBgContainer: '#ffffff',
    boxShadow: '0 1px 4px rgba(0, 0, 0, 0.06)',
    controlHeight: 40,
  },
  components: {
    Layout: {
      siderBg: '#ffffff',
      headerBg: '#ffffff',
      bodyBg: BG_COLOR,
    },
    Menu: {
      itemBorderRadius: 8,
      itemSelectedBg: `${PRIMARY_COLOR}14`,
      itemSelectedColor: PRIMARY_COLOR,
      itemHoverBg: '#f5f5f5',
    },
    Card: {
      borderRadiusLG: CARD_RADIUS,
    },
    Table: {
      borderRadius: CARD_RADIUS,
    },
  },
};

export const darkTheme: ThemeConfig = {
  algorithm: antTheme.darkAlgorithm,
  token: {
    colorPrimary: PRIMARY_COLOR,
    borderRadius: CARD_RADIUS,
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    controlHeight: 40,
  },
};
