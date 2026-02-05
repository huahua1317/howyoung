import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Layout } from './components/ui/Layout';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { StudentDashboard } from './pages/StudentDashboard';
import { CourseHub } from './pages/CourseHub';
import { StudentCheckIn } from './pages/StudentCheckIn';
import { AdminDashboard } from './pages/AdminDashboard';
import { AdminStudentView } from './pages/AdminStudentView';
import { UserRole } from './types';

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode, allowedRoles?: UserRole[] }> = ({ children, allowedRoles }) => {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <Navigate to={user.role === UserRole.SOCIAL_WORKER ? '/admin' : '/dashboard'} replace />;
  }

  return <Layout>{children}</Layout>;
};

const AppRoutes = () => {
  const { isAuthenticated, user } = useAuth();
  
  const defaultPath = user?.role === UserRole.SOCIAL_WORKER ? '/admin' : '/dashboard';

  return (
    <Routes>
      <Route path="/login" element={isAuthenticated ? <Navigate to={defaultPath} replace /> : <Login />} />
      <Route path="/register" element={isAuthenticated ? <Navigate to={defaultPath} replace /> : <Register />} />
      
      {/* Student Routes */}
      <Route path="/dashboard" element={<ProtectedRoute allowedRoles={[UserRole.STUDENT]}><StudentDashboard /></ProtectedRoute>} />
      <Route path="/courses" element={<ProtectedRoute allowedRoles={[UserRole.STUDENT]}><CourseHub /></ProtectedRoute>} />
      <Route path="/check-in" element={<ProtectedRoute allowedRoles={[UserRole.STUDENT]}><StudentCheckIn /></ProtectedRoute>} />

      {/* Admin Routes */}
      <Route path="/admin" element={<ProtectedRoute allowedRoles={[UserRole.SOCIAL_WORKER]}><AdminDashboard /></ProtectedRoute>} />
      <Route path="/admin/students" element={<ProtectedRoute allowedRoles={[UserRole.SOCIAL_WORKER]}><AdminStudentView /></ProtectedRoute>} />

      <Route path="*" element={<Navigate to={isAuthenticated ? defaultPath : "/login"} replace />} />
    </Routes>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
};

export default App;