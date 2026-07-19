import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function ProtectedRoute() {
  const { isStaff, checking } = useAuth();
  const location = useLocation();

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-sm text-on-surface-variant">
          <span className="material-symbols-outlined text-[32px] animate-spin">progress_activity</span>
          <p className="font-label-sm text-label-sm">Checking session...</p>
        </div>
      </div>
    );
  }

  if (!isStaff) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
}

export default ProtectedRoute;