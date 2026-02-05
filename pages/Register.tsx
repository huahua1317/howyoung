import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../types';
import { User as UserIcon, Mail, KeyRound, ShieldAlert } from 'lucide-react';

export const Register: React.FC = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  
  const [role, setRole] = useState<UserRole>(UserRole.STUDENT);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    // Pass the selected role to the register function
    const result = await register(name, email, password, role);
    
    if (result.success) {
      // Direct redirect based on role
      if (role === UserRole.SOCIAL_WORKER) {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    } else {
      setError(result.message || '註冊失敗，請稍後再試。');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            建立新帳號
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            或{' '}
            <Link to="/login" className="font-medium text-primary-600 hover:text-primary-500">
              返回登入
            </Link>
          </p>
        </div>
        <div className="bg-white py-8 px-4 shadow-xl rounded-2xl sm:px-10">
          
          {/* Role Selector */}
          <div className="flex p-1 bg-gray-100 rounded-lg mb-6">
            <button 
              type="button"
              onClick={() => setRole(UserRole.STUDENT)}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${role === UserRole.STUDENT ? 'bg-white text-primary-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              我是學生
            </button>
            <button 
              type="button"
              onClick={() => setRole(UserRole.SOCIAL_WORKER)}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${role === UserRole.SOCIAL_WORKER ? 'bg-white text-primary-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              我是社工
            </button>
          </div>

          {role === UserRole.SOCIAL_WORKER && (
            <div className="mb-6 p-3 bg-amber-50 border border-amber-100 rounded-lg flex items-start gap-2">
               <ShieldAlert className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
               <p className="text-[11px] text-amber-700 leading-relaxed font-medium">
                  社工權限管制：社工帳號註冊需經由管理員授權 Email。若您的 Email 未在白名單內，將無法完成註冊。
               </p>
            </div>
          )}
          
          {role === UserRole.STUDENT && (
             <div className="mb-6 p-3 bg-blue-50 border border-blue-100 rounded-lg flex items-start gap-2">
               <UserIcon className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
               <p className="text-[11px] text-blue-700 leading-relaxed font-medium">
                  歡迎同學加入！註冊後即可開始紀錄你的學習歷程與生涯探索活動。
               </p>
            </div>
          )}

          <form className="space-y-6" onSubmit={handleRegister}>
            <div>
              <label className="text-sm font-medium text-gray-700">姓名</label>
              <div className="relative mt-1">
                 <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                 <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-lg focus:ring-primary-500 focus:border-primary-500 outline-none"
                  placeholder="您的真實姓名"
                />
              </div>
            </div>
             <div>
              <label className="text-sm font-medium text-gray-700">Email</label>
              <div className="relative mt-1">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-lg focus:ring-primary-500 focus:border-primary-500 outline-none"
                  placeholder="you@example.com"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">密碼</label>
              <div className="relative mt-1">
                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-lg focus:ring-primary-500 focus:border-primary-500 outline-none"
                  placeholder="至少 6 位數"
                />
              </div>
            </div>
            
            {error && (
              <div className="p-3 bg-red-50 border border-red-100 rounded-lg">
                <p className="text-xs text-red-600 text-center font-bold leading-relaxed">{error}</p>
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-bold text-white bg-primary-600 hover:bg-primary-700 disabled:bg-primary-300 transition-colors"
              >
                {isLoading ? '驗證權限與註冊中...' : `註冊${role === UserRole.STUDENT ? '學生' : '社工'}帳號`}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};