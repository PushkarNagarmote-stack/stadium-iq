import React from 'react';
import { Link, useLocation } from 'react-router-dom';
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

function BottomNav() {
  const location = useLocation();
  const { isStaff } = useAuth();
  const navItems = isStaff ? STAFF_NAV_ITEMS : FAN_NAV_ITEMS;

  const isActive = (path) => {
    if (path === '/app') return location.pathname === '/app';
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="md:hidden fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 py-3 pb-safe bg-surface-container/40 backdrop-blur-xl border-t border-white/10 shadow-xl rounded-t-xl">
      {navItems.map((item) => (
        <Link
          key={item.key}
          to={item.path}
          className={
            isActive(item.path)
              ? 'flex flex-col items-center justify-center text-secondary-fixed bg-secondary-container/20 rounded-xl px-3 py-1 shadow-[0_0_15px_rgba(195,244,0,0.3)] scale-110 duration-300 ease-out'
              : 'flex flex-col items-center justify-center text-on-surface-variant opacity-70 hover:text-secondary-fixed-dim transition-colors'
          }
        >
          <span
            className="material-symbols-outlined text-headline-md"
            style={isActive(item.path) ? { fontVariationSettings: "'FILL' 1" } : undefined}
          >
            {item.icon}
          </span>
          <span className="font-label-sm text-label-sm mt-1">{item.label}</span>
        </Link>
      ))}
    </nav>
  );
}

export default BottomNav;