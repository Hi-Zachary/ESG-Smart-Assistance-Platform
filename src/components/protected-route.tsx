import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth-context';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    // 可以显示一个加载指示器
    return <div className="flex items-center justify-center h-screen text-lg">加载中...</div>;
  }

  if (!isAuthenticated) {
    // 用户未认证，重定向到登录页面
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}