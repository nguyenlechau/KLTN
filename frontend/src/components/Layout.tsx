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
  { to: '/registrations', label: 'Registrations', emoji: '📝' },
  { to: '/master/content', label: 'Advertising Content', emoji: '🖼️' },
];

const masterLinks: MenuItem[] = [
  { to: '/master/items', label: 'Physical Items', emoji: '📋' },
  { to: '/master/channels', label: 'Channels', emoji: '📢' },
  { to: '/master/categories', label: 'Categories', emoji: '🏷️' },
  { to: '/master/locations', label: 'Locations', emoji: '📍' },
];

const adminLinks: MenuItem[] = [
  { to: '/admin/users', label: 'User Management', emoji: '👥' },
];

export function Layout() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const userRole = (localStorage.getItem('user_role') || '').toUpperCase();
  const menuSections: MenuSection[] = [
    { title: 'Operations', items: operationalLinks },
    { title: 'Master Data', items: masterLinks },
    { title: 'Admin', items: adminLinks, adminOnly: true },
  ];

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user_role');
    navigate('/login');
  };

  return (
    <div className="layout">
      <aside className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
        <div className="sidebar-header">
          <div>
            <h2>Marcom</h2>
            <p className="sidebar-brand-subtitle">Branding Portal</p>
          </div>
          <button
            className="sidebar-toggle"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? '«' : '»'}
          </button>
        </div>

        <nav className="sidebar-nav">
          {menuSections.map((section) => {
            if (section.adminOnly && userRole !== 'ADMIN') {
              return null;
            }

            return (
              <div className="nav-section" key={section.title}>
                <div className="nav-section-title">{section.title}</div>
                {section.items.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                  >
                    <span className="nav-emoji">{item.emoji}</span>
                    <span className="nav-text">{item.label}</span>
                  </NavLink>
                ))}
              </div>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <div style={{ fontSize: '0.75rem', color: 'var(--gray-300)', marginBottom: '0.5rem', textTransform: 'capitalize' }}>
            {userRole ? userRole.replace(/_/g, ' ') : 'user'}
          </div>
          <button
            onClick={handleLogout}
            className="sidebar-logout"
          >
            Logout
          </button>
        </div>
      </aside>

      <main className="main-content">
        <header className="header">
          <h1>Marcom Branding Portal</h1>
          <p style={{ color: 'var(--gray-500)', margin: 0 }}>Outdoor Advertising Management</p>
        </header>
        <div className="content">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
