import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { UserRole } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { Compass, Mail, KeyRound, X, Loader2 } from 'lucide-react';

export const Login: React.FC = () => {
  const { login, isLoading } = useAuth(); // Get isLoading from context
  
  const [landingTitle] = useState("探索未來，\n從這裡開始。"); 
  const [landingSubtitle] = useState("CareerPassport 是一個專為青少年設計的生涯探索紀錄平台。累積你的學習歷程，發現你的無限可能。");
  const [landingImageUrl] = useState("https://images.unsplash.com/photo-1522202176988-66273c2fd55f?ixlib.rb-4.0.3&auto=format&fit=crop&w=1351&q=80");

  const [role, setRole] = useState<UserRole>(UserRole.STUDENT);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string>('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // isLoading is managed by AuthContext now, but we can also block here
    const result = await login(email, password, role);
    if (!result.success) {
      setError(result.message || '登入失敗');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full grid md:grid-cols-2 overflow-hidden">
        
        {/* Left Side - Display */}
        <div className="bg-primary-600 relative overflow-hidden flex flex-col justify-between p-8 md:p-12 text-white">
           <div className="absolute inset-0 z-0">
              <img src={landingImageUrl} className="w-full h-full object-cover opacity-20 mix-blend-overlay" alt="Cover" />
              <div className="absolute inset-0 bg-primary-900/40 mix-blend-multiply"></div>
           </div>
          <div className="relative z-10">
            <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-lg flex items-center justify-center mb-6">
              <Compass className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-4 whitespace-pre-line">{landingTitle}</h1>
            <p className="text-primary-100 leading-relaxed">{landingSubtitle}</p>
          </div>
          
          <div className="relative z-10 mt-8">
             <div className="text-[10px] text-white/50">
                Powered by Google Apps Script
             </div>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="p-8 md:p-12 flex flex-col justify-center">
          <div className="flex justify-between items-center mb-2">
             <h2 className="text-2xl font-bold text-gray-800">登入您的帳戶</h2>
          </div>
          
          <p className="text-gray-500 mb-6">請選擇身分並輸入憑證。</p>

          {/* Role Toggle */}
          <div className="flex p-1 bg-gray-100 rounded-lg mb-6">
            <button type="button" onClick={() => setRole(UserRole.STUDENT)} className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${role === UserRole.STUDENT ? 'bg-white text-primary-600 shadow-sm' : 'text-gray-500'}`}>學生登入</button>
            <button type="button" onClick={() => setRole(UserRole.SOCIAL_WORKER)} className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${role === UserRole.SOCIAL_WORKER ? 'bg-white text-primary-600 shadow-sm' : 'text-gray-500'}`}>社工登入</button>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Email</label>
              <div className="relative mt-1">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-lg focus:ring-primary-500 outline-none" placeholder="example@mail.com" />
              </div>
            </div>
            <div>
              <div className="flex justify-between items-center">
                <label className="text-sm font-medium text-gray-700">密碼</label>
              </div>
              <div className="relative mt-1">
                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-lg focus:ring-primary-500 outline-none" placeholder="••••••••" />
              </div>
            </div>
            {error && <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg border border-red-100">{error}</div>}
            
            <div className="pt-2">
              <button 
                type="submit" 
                disabled={isLoading} 
                className="w-full py-3 bg-primary-600 text-white rounded-lg font-bold hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                {isLoading ? '連線同步中...' : '登入'}
              </button>
            </div>
          </form>

          {/* Added Registration Link */}
          <div className="mt-6 text-center">
             <p className="text-gray-600 text-sm">
                還沒有帳號嗎？ 
                <Link to="/register" className="text-primary-600 font-bold hover:underline ml-1">
                   立即註冊
                </Link>
             </p>
          </div>

          <div className="mt-6 text-center text-sm">
             <p className="text-gray-400 text-xs">
                此系統資料儲存於雲端
             </p>
          </div>
        </div>
      </div>
    </div>
  );
};