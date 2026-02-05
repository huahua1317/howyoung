import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { apiLogin, apiLogout, apiRegister, saveUser, getSystemSettings } from '../services/storageService';
import { DEFAULT_SYSTEM_SETTINGS } from '../constants';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string, requiredRole?: UserRole) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  register: (name: string, email: string, password: string, role: UserRole) => Promise<{ success: boolean; message?: string }>;
  updateUserProfile: (updatedUser: User) => void;
  resetPassword: (email: string) => Promise<boolean>;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const login = async (email: string, password: string, requiredRole?: UserRole): Promise<{ success: boolean; message?: string }> => {
    setIsLoading(true);
    try {
      const result = await apiLogin(email, password);
      
      if (result.success && result.user) {
        // Role Check
        if (requiredRole && result.user.role !== requiredRole) {
          apiLogout();
          return { success: false, message: `此帳號不是${requiredRole === UserRole.STUDENT ? '學生' : '社工'}帳號。` };
        }
        
        setUser(result.user);
        return { success: true };
      } else {
        return { success: false, message: result.message || "登入失敗" };
      }
    } catch (e) {
      return { success: false, message: "連線錯誤" };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    apiLogout();
    setUser(null);
  };

  const register = async (name: string, email: string, password: string, role: UserRole): Promise<{ success: boolean; message?: string }> => {
    setIsLoading(true);
    
    // --- 權限檢查邏輯 ---
    // 只有「社工」角色需要檢查白名單
    // 學生 (UserRole.STUDENT) 可以自由註冊
    if (role === UserRole.SOCIAL_WORKER) {
      const settings = getSystemSettings();
      
      // 我們結合「當前設定」與「系統預設值」來建立白名單
      // 這確保了即使在系統剛初始化(沒有快取)的情況下，預設的管理員 (lemon70431) 也能註冊/登入
      const safeAllowList = [
          ...new Set([
              ...(settings.authorizedWorkerEmails || []),
              ...(DEFAULT_SYSTEM_SETTINGS.authorizedWorkerEmails || [])
          ])
      ];

      const isAuthorized = safeAllowList.some(authEmail => authEmail.toLowerCase() === email.toLowerCase());
      
      if (!isAuthorized) {
        setIsLoading(false);
        return { 
            success: false, 
            message: '此 Email 尚未獲得社工權限授權。請聯繫管理員 (lemon70431@gfm.org.tw) 將您的 Email 加入授權名單後再試。' 
        };
      }
    }

    // 2. 建立新使用者物件
    const newUser: User = {
        id: `u_${Date.now()}`,
        name,
        email: email.toLowerCase(),
        role,
        isProfileCompleted: false,
        avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`
    };

    try {
        // 3. 呼叫 API 進行註冊
        const result = await apiRegister(newUser, password);
        
        if (result.success) {
            setUser(newUser);
            return { success: true };
        } else {
             return { success: false, message: result.message };
        }
    } catch (e) {
        return { success: false, message: "註冊發生錯誤" };
    } finally {
        setIsLoading(false);
    }
  };

  const updateUserProfile = async (updatedUser: User) => {
    setUser(updatedUser);
    await saveUser(updatedUser);
  };

  const resetPassword = async (email: string) => {
    return false;
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, register, updateUserProfile, resetPassword, isAuthenticated: !!user, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};