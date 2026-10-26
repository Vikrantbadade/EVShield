import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { EVShieldLogo } from '../ui/EVShieldLogo';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#11111F] flex flex-col items-center justify-center relative overflow-hidden">
        {/* Glow */}
        <div className="absolute w-72 h-72 rounded-full bg-[#8055F6]/15 blur-[100px] pointer-events-none" />
        
        <div className="relative z-10 flex flex-col items-center gap-4 animate-fade-in">
          <EVShieldLogo size="lg" />
          <div className="flex items-center gap-2 mt-4 text-xs font-mono text-[#C4C2D6]">
            <span className="w-2 h-2 rounded-full bg-[#4DD9F0] animate-ping" />
            <span>AUTHENTICATING SECURE SESSION...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};
