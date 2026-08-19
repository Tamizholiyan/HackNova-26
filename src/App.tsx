import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { EmergencyProvider } from './context/EmergencyContext';
import { PublicPortal } from './components/portals/PublicPortal';
import { StaffLogin } from './components/auth/StaffLogin';
import { DispatchCenter } from './components/portals/DispatchCenter';
import { ResponderPortal } from './components/portals/ResponderPortal';
import { HospitalBoard } from './components/portals/HospitalBoard';
import type { UserRole } from './types';

// Protected Route Component for Staff Portals
const ProtectedRoute: React.FC<{ 
  requiredRole: UserRole; 
  children: React.ReactNode; 
}> = ({ requiredRole, children }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-slate-950 text-white font-mono text-sm">
        Authenticating access...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== requiredRole) {
    // If role doesn't match, redirect to user's assigned portal
    if (user.role === 'dispatcher') return <Navigate to="/dispatch" replace />;
    if (user.role === 'responder') return <Navigate to="/responder" replace />;
    if (user.role === 'hospital') return <Navigate to="/hospital" replace />;
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <EmergencyProvider>
          <BrowserRouter>
            <Routes>
              {/* 1. Citizen SOS Landing Page */}
              <Route path="/" element={<PublicPortal />} />

              {/* 2. Staff Authentication Portal */}
              <Route path="/login" element={<StaffLogin />} />

              {/* 3. Dispatch Command Center (Protected: Dispatcher only) */}
              <Route 
                path="/dispatch" 
                element={
                  <ProtectedRoute requiredRole="dispatcher">
                    <DispatchCenter />
                  </ProtectedRoute>
                } 
              />

              {/* 4. Field Responder Mobile MDT (Protected: Responder only) */}
              <Route 
                path="/responder" 
                element={
                  <ProtectedRoute requiredRole="responder">
                    <ResponderPortal />
                  </ProtectedRoute>
                } 
              />

              {/* 5. Hospital ER Operations Board (Protected: Hospital staff only) */}
              <Route 
                path="/hospital" 
                element={
                  <ProtectedRoute requiredRole="hospital">
                    <HospitalBoard />
                  </ProtectedRoute>
                } 
              />

              {/* Catch-all redirect to Citizen SOS */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </EmergencyProvider>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
