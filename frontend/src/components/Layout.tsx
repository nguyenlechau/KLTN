import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import './layout.css';

type MenuItem = {
  to: string;
  label: string;
  emoji: string;
};

type MenuSection = {
  title: string;
  items: MenuItem[];
  adminOnly?: boolean;
};

const operationalLinks: MenuItem[] = [
  { to: '/registrations',   label: 'Registrations',       emoji: '📝' },
  { to: '/master/content',  label: 'Advertising Content', emoji: '🖼️' },
];

const masterLinks: MenuItem[] = [
  { to: '/master/items',      label: 'Physical Items', emoji: '📋' },
  { to: '/master/channels',   label: 'Channels',       emoji: '📢' },
  { to: '/master/categories', label: 'Categories',     emoji: '🏷️' },
  { to: '/master/locations',  label: 'Locations',      emoji: '📍' },
  { to: '/master/menus',      label: 'Menus',           emoji: '📑' },
];

const adminLinks: MenuItem[] = [
  { to: '/admin/users', label: 'User Management', emoji: '👥' },
];

export function Layout() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const userRole = (localStorage.getItem('user_role') || '').toUpperCase();
  const userEmail = localStorage.getItem('user_email') || '';

  const menuSections: MenuSection[] = [
    { title: 'Operations',   items: operationalLinks },
    { title: 'Master Data',  items: masterLinks },
    { title: 'Admin',        items: adminLinks, adminOnly: true },
  ];

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user_role');
    localStorage.removeItem('user_email');
    navigate('/login');
  };

  const initials = userEmail
    ? userEmail.slice(0, 2).toUpperCase()
    : (userRole ? userRole.slice(0, 2) : 'U');

  const roleLabel = userRole ? userRole.replace(/_/g, ' ').toLowerCase() : 'user';

  return (
    <div className="layout">
      {/* ── Sidebar ── */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
        <div className="sidebar-header">
          <div className="sidebar-brand">
            <div className="sidebar-logo">📊</div>
            <div className="sidebar-brand-text">
              <h2>POSM SYSTEM</h2>
              <p className="sidebar-brand-subtitle">Advertising Assets</p>
            </div>
          </div>
          <button
            className="sidebar-toggle"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
          >
            {sidebarOpen ? '‹' : '›'}
          </button>
        </div>

        <nav className="sidebar-nav" aria-label="Main navigation">
          {menuSections.map((section) => {
            if (section.adminOnly && userRole !== 'ADMIN') return null;
            return (
              <div className="nav-section" key={section.title}>
                <div className="nav-section-title">{section.title}</div>
                {section.items.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                    title={!sidebarOpen ? item.label : undefined}
                  >
                    <span className="nav-emoji" aria-hidden="true">{item.emoji}</span>
                    <span className="nav-text">{item.label}</span>
                  </NavLink>
                ))}
              </div>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user-info">
            <div className="sidebar-avatar" aria-hidden="true">{initials}</div>
            <span className="sidebar-user-role">{roleLabel}</span>
          </div>
          <button onClick={handleLogout} className="sidebar-logout">
            Sign out
          </button>
        </div>
      </aside>

      {/* ── Main Content ── */}
      <main className="main-content">
        <header className="header">
          <div className="header-left">
            <span className="header-app-title">Outdoor Advertising Assets Management</span>
          </div>
          <div className="header-right">
            {userEmail && (
              <>
                <div className="header-user">
                  <div className="header-user-avatar" aria-hidden="true">{initials}</div>
                  <div className="header-user-info">
                    <span className="header-user-email">{userEmail}</span>
                    <span className="header-user-role">{roleLabel}</span>
                  </div>
                </div>
                <div className="header-divider" aria-hidden="true" />
              </>
            )}
            <button onClick={handleLogout} className="header-logout">
              Sign out
            </button>
          </div>
        </header>
        <div className="content">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
