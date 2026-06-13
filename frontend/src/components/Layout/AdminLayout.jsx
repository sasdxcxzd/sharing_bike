import React, { useState, useEffect, createContext, useContext } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Layout, Menu, Button, Dropdown, Switch } from 'antd';
import {
  DashboardOutlined, CarOutlined, UserOutlined, ShoppingCartOutlined,
  ToolOutlined, EnvironmentOutlined, WarningOutlined, BellOutlined,
  MenuFoldOutlined, MenuUnfoldOutlined, LogoutOutlined, SunOutlined, MoonOutlined,
} from '@ant-design/icons';
import useAuthStore from '../../store/useAuthStore';
import { logout as logoutApi } from '../../api/auth';

const { Sider, Content } = Layout;

export const ThemeContext = createContext({ darkMode: false, toggleDarkMode: () => {} });
export const useTheme = () => useContext(ThemeContext);

const SIDER_WIDTH = 220;
const SIDER_COLLAPSED = 64;
const HEADER_H = 56;

const allMenuItems = [
  { key: '/', icon: <DashboardOutlined />, label: '统计看板', roles: ['super_admin', 'operator'] },
  { key: '/bikes', icon: <CarOutlined />, label: '单车管理', roles: ['super_admin', 'operator'] },
  { key: '/bikes/map', icon: <EnvironmentOutlined />, label: '单车地图', roles: ['super_admin', 'operator'] },
  { key: '/users', icon: <UserOutlined />, label: '用户管理', roles: ['super_admin'] },
  { key: '/orders', icon: <ShoppingCartOutlined />, label: '骑行订单', roles: ['super_admin', 'operator'] },
  { key: '/work-orders', icon: <ToolOutlined />, label: '运维工单', roles: ['super_admin', 'operator'] },
  { key: '/zones', icon: <EnvironmentOutlined />, label: '运营区域', roles: ['super_admin'] },
  { key: '/reports', icon: <WarningOutlined />, label: '举报处理', roles: ['super_admin'] },
  { key: '/notifications', icon: <BellOutlined />, label: '消息通知', roles: ['super_admin'] },
];

function getMenuItems(role) {
  return allMenuItems.filter(item => item.roles.includes(role));
}

/**
 * Responsive breakpoint hook.
 * Returns the current breakpoint key: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
 */
function useBreakpoint() {
  const [bp, setBp] = useState(() => getBreakpoint(window.innerWidth));

  useEffect(() => {
    const handle = () => setBp(getBreakpoint(window.innerWidth));
    window.addEventListener('resize', handle);
    return () => window.removeEventListener('resize', handle);
  }, []);

  return bp;
}

function getBreakpoint(w) {
  if (w < 576) return 'xs';
  if (w < 768) return 'sm';
  if (w < 992) return 'md';
  if (w < 1200) return 'lg';
  return 'xl';
}

export default function AdminLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('theme') === 'dark');
  const navigate = useNavigate();
  const location = useLocation();
  const { admin, logout: storeLogout } = useAuthStore();
  const breakpoint = useBreakpoint();

  // Auto-collapse sider on small screens
  const isSmallScreen = breakpoint === 'xs' || breakpoint === 'sm';
  const siderCollapsed = collapsed || isSmallScreen;
  const siderW = siderCollapsed ? SIDER_COLLAPSED : SIDER_WIDTH;

  const toggleDarkMode = () => {
    const next = !darkMode;
    setDarkMode(next);
    localStorage.setItem('theme', next ? 'dark' : 'light');
    window.dispatchEvent(new Event('themeChange'));
  };

  let selectedKey = location.pathname;
  if (location.pathname === '/') selectedKey = '/';
  const menuItems = getMenuItems(admin?.role);
  if (!menuItems.some(m => m.key === selectedKey)) {
    const segments = location.pathname.split('/');
    for (let i = segments.length - 1; i >= 1; i--) {
      const candidate = segments.slice(0, i + 1).join('/');
      if (menuItems.some(m => m.key === candidate)) { selectedKey = candidate; break; }
    }
  }

  const siderBg = darkMode ? '#141414' : '#001529';
  const headerBg = darkMode ? '#1f1f1f' : '#fff';
  const contentBg = darkMode ? '#141414' : '#f5f5f5';

  // Responsive content padding
  const contentPad = breakpoint === 'xs' ? '8px 10px'
    : breakpoint === 'sm' ? '10px 14px'
    : '16px 20px';

  const userMenuItems = [
    { key: 'role', label: `角色: ${admin?.role === 'super_admin' ? '超级管理员' : '运营人员'}`, disabled: true },
    { key: 'theme', label: (
      <span onClick={(e) => { e.stopPropagation(); toggleDarkMode(); }}>
        {darkMode ? <SunOutlined /> : <MoonOutlined />} {darkMode ? '亮色模式' : '暗色模式'}
      </span>
    )},
    { key: 'logout', icon: <LogoutOutlined />, label: '退出登录', danger: true,
      onClick: async () => { try { await logoutApi(); } catch {} storeLogout(); navigate('/login'); } },
  ];

  return (
    <ThemeContext.Provider value={{ darkMode, toggleDarkMode }}>
      <div style={{ minHeight: '100vh', background: contentBg, overflowX: 'hidden' }}>
        {/* Sider overlay mask for mobile */}
        {isSmallScreen && !collapsed && (
          <div
            onClick={() => setCollapsed(true)}
            style={{
              position: 'fixed', inset: 0, zIndex: 99,
              background: 'rgba(0,0,0,0.45)',
            }}
          />
        )}

        {/* Fixed Sider */}
        <div style={{
          position: 'fixed', top: 0, left: 0, bottom: 0, width: siderW, zIndex: 100,
          background: siderBg, overflow: 'hidden',
          transition: 'width 0.2s',
          display: 'flex', flexDirection: 'column',
        }}>
          {/* Logo area — centered, full sider width */}
          <div style={{
            height: HEADER_H, minHeight: HEADER_H,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontSize: siderCollapsed ? 16 : 17, fontWeight: 'bold',
            borderBottom: '1px solid rgba(255,255,255,0.08)',
            whiteSpace: 'nowrap', overflow: 'hidden',
            width: '100%',
          }}>
            {siderCollapsed ? '🚲' : '🚲 共享单车管理'}
          </div>

          {/* Scrollable menu area */}
          <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
            <Menu
              theme="dark"
              mode="inline"
              inlineCollapsed={siderCollapsed}
              selectedKeys={[selectedKey]}
              items={menuItems}
              onClick={({ key }) => {
                navigate(key);
                if (isSmallScreen) setCollapsed(true);
              }}
              style={{ background: siderBg, borderRight: 0 }}
            />
          </div>
        </div>

        {/* Fixed Header */}
        <div style={{
          position: 'fixed', top: 0, left: siderW, right: 0, height: HEADER_H, zIndex: 99,
          background: headerBg,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: isSmallScreen ? '0 10px' : '0 20px',
          boxShadow: darkMode
            ? '0 1px 4px rgba(0,0,0,0.3)'
            : '0 1px 4px rgba(0,0,0,0.06)',
          transition: 'left 0.2s',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: isSmallScreen ? 8 : 14 }}>
            <Button
              type="text"
              icon={siderCollapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)}
              style={{ fontSize: 16 }}
            />
            <Switch
              checkedChildren={<MoonOutlined />} unCheckedChildren={<SunOutlined />}
              checked={darkMode} onChange={toggleDarkMode}
            />
          </div>
          <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
            <Button type="text" icon={<UserOutlined />}
              style={{ color: darkMode ? '#fff' : '#333' }}>
              {isSmallScreen ? null : (admin?.real_name || admin?.username)}
            </Button>
          </Dropdown>
        </div>

        {/* Scrollable Content */}
        <div style={{
          marginLeft: siderW, paddingTop: HEADER_H,
          transition: 'margin-left 0.2s',
          minHeight: '100vh',
          overflowX: 'hidden',
        }}>
          <div style={{ padding: contentPad }}>
            <Outlet />
          </div>
        </div>
      </div>
    </ThemeContext.Provider>
  );
}
