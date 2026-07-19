import React from 'react';
import { BrowserRouter, Routes, Route, Outlet } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import ScrollToTop from './components/ScrollToTop';
import AppHeader from './components/AppHeader';
import BottomNav from './components/BottomNav';

import Landing from './pages/Landing';
import StaffLogin from './pages/StaffLogin';
import FanChat from './components/FanChat';
import StaffBriefing from './components/StaffBriefing';
import CrowdIntel from './components/CrowdIntel';
import MatchSchedule from './pages/MatchSchedule';
import FoodOrder from './pages/FoodOrder';
import VenuesExplorer from './pages/VenuesExplorer';
import VenueDetail from './pages/VenueDetail';
import NotFound from './pages/NotFound';

const API = process.env.REACT_APP_API_URL || 'http://localhost:5000';

function AppLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-on-surface font-body-md antialiased pb-24 md:pb-0">
      <AppHeader />
      <Outlet />
      <BottomNav />
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <ScrollToTop />
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<StaffLogin />} />

          <Route path="/app" element={<AppLayout />}>
            <Route index element={<FanChat api={API} />} />
            <Route path="schedule" element={<MatchSchedule api={API} />} />
            <Route path="food" element={<FoodOrder api={API} />} />
            <Route path="venues" element={<VenuesExplorer />} />
            <Route path="venues/:venueId" element={<VenueDetail />} />

            <Route element={<ProtectedRoute />}>
              <Route path="briefing" element={<StaffBriefing api={API} />} />
              <Route path="intel" element={<CrowdIntel api={API} />} />
            </Route>
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;