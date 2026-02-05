import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { UserRole } from '../../types';
import { 
  BookOpen, 
  LayoutDashboard, 
  LogOut, 
  Map, 
  UserCircle,
  Settings,
  PlusCircle,
  Navigation
} from 'lucide-react';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path ? 'bg-primary-100 text-primary-700' : 'text-gray-600 hover:bg-gray-100';

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row font-sans">
      {/* Sidebar / Mobile Header */}
      <aside className="bg-white border-b md:border-r border-gray-200 md:w-64 md:h-screen md:sticky md:top-0 flex-shrink-0 z-50">
        <div className="p-4 flex items-center justify-between md:block">
          <div className="flex items-center gap-2 mb-0 md:mb-6">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <Map className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-800 tracking-tight">CareerPassport</span>
          </div>
        </div>

        <div className="px-3 pb-4 md:block overflow-x-auto md:overflow-visible flex gap-2 md:flex-col no-scrollbar">
          {user?.role === UserRole.STUDENT && (
            <>
              <Link to="/dashboard" className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors whitespace-nowrap ${isActive('/dashboard')}`}>
                <UserCircle className="w-5 h-5" />
                <span>我的護照</span>
              </Link>
              <Link to="/courses" className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors whitespace-nowrap ${isActive('/courses')}`}>
                <BookOpen className="w-5 h-5" />
                <span>探索課程</span>
              </Link>
              <Link to="/check-in" className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors whitespace-nowrap ${isActive('/check-in')}`}>
                <Navigation className="w-5 h-5" />
                <span>簽到專區</span>
              </Link>
            </>
          )}

          {user?.role === UserRole.SOCIAL_WORKER && (
            <>
              <Link to="/admin" className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors whitespace-nowrap ${isActive('/admin')}`}>
                <LayoutDashboard className="w-5 h-5" />
                <span>課程管理後台</span>
              </Link>
              <Link to="/admin/students" className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors whitespace-nowrap ${isActive('/admin/students')}`}>
                <UserCircle className="w-5 h-5" />
                <span>學生護照閱覽</span>
              </Link>
            </>
          )}
        </div>

        <div className="md:absolute md:bottom-0 md:left-0 md:w-full p-4 border-t border-gray-100 bg-gray-50 md:bg-white">
          <div className="flex items-center gap-3 mb-3">
            <img src={user?.avatarUrl} alt="Avatar" className="w-10 h-10 rounded-full bg-gray-200" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{user?.name}</p>
              <p className="text-xs text-gray-500 truncate">{user?.email}</p>
            </div>
          </div>
          <button 
            onClick={logout}
            className="flex items-center gap-2 text-sm text-red-600 hover:text-red-700 w-full px-1"
          >
            <LogOut className="w-4 h-4" />
            <span>登出</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto">
        {children}
      </main>
    </div>
  );
};