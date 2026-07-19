import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const FAN_NAV_ITEMS = [
  { key: 'assistant', label: 'Assistant', icon: 'smart_toy', path: '/app' },
  { key: 'schedule', label: 'Schedule', icon: 'calendar_month', path: '/app/schedule' },
  { key: 'food', label: 'Food', icon: 'restaurant', path: '/app/food' },
  { key: 'venues', label: 'Venues', icon: 'stadium', path: '/app/venues' },
];

const STAFF_NAV_ITEMS = [
  { key: 'assistant', label: 'Assistant', icon: 'smart_toy', path: '/app' },
  { key: 'briefing', label: 'Briefing', icon: 'assignment', path: '/app/briefing' },
  { key: 'intel', label: 'Intel', icon: 'analytics', path: '/app/intel' },
  { key: 'venues', label: 'Venues', icon: 'stadium', path: '/app/venues' },
];

function AppHeader() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isStaff, logout } = useAuth();

  const navItems = isStaff ? STAFF_NAV_ITEMS : FAN_NAV_ITEMS;

  const isActive = (path) => {
    if (path === '/app') return location.pathname === '/app';
    return location.pathname.startsWith(path);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <header className="flex flex-col justify-center px-container-margin w-full h-24 z-50 bg-surface/40 backdrop-blur-xl border-b border-white/15 sticky top-0">
      <div className="flex items-center justify-between w-full max-w-7xl mx-auto">
        <Link to="/app" className="flex items-center gap-xs">
          <span
            className="material-symbols-outlined text-secondary-fixed text-[28px]"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            sports_soccer
          </span>
          <h1 className="font-headline-lg-mobile text-headline-lg-mobile font-bold text-on-surface tracking-tight">
            StadiumIQ
          </h1>
          {isStaff && (
            <span className="ml-2 bg-secondary-fixed/10 border border-secondary-fixed/30 text-secondary-fixed font-label-sm text-label-sm px-2 py-0.5 rounded-full uppercase tracking-wider">
              Staff
            </span>
          )}
        </Link>

        <nav className="hidden md:flex items-center gap-md">
          {navItems.map((item) => (
            <Link
              key={item.key}
              to={item.path}
              className={
                isActive(item.path)
                  ? 'flex flex-col items-center justify-center text-secondary-fixed bg-secondary-container/20 rounded-xl px-3 py-1 shadow-[0_0_15px_rgba(195,244,0,0.3)] transition-opacity'
                  : 'flex flex-col items-center justify-center text-on-surface-variant opacity-70 hover:text-secondary-fixed-dim transition-colors'
              }
            >
              <span className="material-symbols-outlined text-[24px]">{item.icon}</span>
              <span className="font-label-sm text-label-sm mt-base">{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-sm">
          {isStaff ? (
            <button
              onClick={handleLogout}
              className="bg-surface-variant/40 text-on-surface-variant px-3 py-1 rounded-full font-label-sm text-label-sm border border-white/10 hover:bg-surface-variant/70 hover:text-on-surface transition-colors flex items-center gap-1"
              type="button"
            >
              <span className="material-symbols-outlined text-[16px]">logout</span>
              Sign Out
            </button>
          ) : (
            <button className="bg-secondary-container/20 text-secondary-fixed px-3 py-1 rounded-full font-label-sm text-label-sm border border-secondary-fixed/30 hover:bg-secondary-container/30 transition-colors flex items-center gap-1 shadow-[0_0_10px_rgba(195,244,0,0.15)]">
              <span className="w-2 h-2 rounded-full bg-secondary-fixed animate-pulse" />
              LIVE
            </button>
          )}
        </div>
      </div>
    </header>
  );
}

export default AppHeader;