import React, { useState, useEffect, useRef } from 'react';
import { Card } from '../components/ui/Card';
import { Course, Announcement, AttendanceRecord, AttendanceStatus, User, SystemSettings, CloudConfig } from '../types';
import { getCourses, saveCourse, deleteCourse, getAnnouncements, saveAnnouncement, deleteAnnouncement, getAttendanceRecords, saveAttendanceRecord, getCategories, saveCategories, getSystemSettings, saveSystemSettings, getUsers, getCloudConfig, saveCloudConfig } from '../services/storageService';
import { useAuth } from '../contexts/AuthContext';
import { 
  Plus, Trash2, Edit2, Link as LinkIcon, Megaphone, MapPin, X, 
  UserCheck, Layers, Settings, Image as ImageIcon, Save, 
  Navigation, Upload, Globe, Users, ShieldCheck, Mail, UserCircle, Calendar,
  Cloud, Copy, QrCode, Share2, ExternalLink, AlertTriangle, Link2
} from 'lucide-react';

type Tab = 'courses' | 'announcements' | 'attendance' | 'auth' | 'settings';

export const AdminDashboard: React.FC = () => {
  const { user, updateUserProfile } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('courses');
  
  // Personal Info State
  const [personalName, setPersonalName] = useState(user?.name || '');

  // Courses State
  const [courses, setCourses] = useState<Course[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [newCategory, setNewCategory] = useState('');
  const [isEditingCourse, setIsEditingCourse] = useState(false);
  const [currentCourse, setCurrentCourse] = useState<Partial<Course>>({});
  const [tempSessionDate, setTempSessionDate] = useState(''); // For adding dates

  // Announcements State
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isEditingAnnouncement, setIsEditingAnnouncement] = useState(false);
  const [currentAnnouncement, setCurrentAnnouncement] = useState<Partial<Announcement>>({});

  // Attendance State
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState(false);
  const [selectedCourseForAttendance, setSelectedCourseForAttendance] = useState<Course | null>(null);
  const [filterDate, setFilterDate] = useState<string>('all'); // 'all' or specific date string

  // System Settings State
  const [systemSettings, setSystemSettings] = useState<SystemSettings>(getSystemSettings());
  const [newAuthEmail, setNewAuthEmail] = useState('');
  
  // Cloud Config State
  const [cloudConfig, setCloudConfig] = useState<CloudConfig>(getCloudConfig());
  const [tempScriptUrl, setTempScriptUrl] = useState('');
  
  // Base URL State (for fixing blob/localhost issues)
  const [baseUrl, setBaseUrl] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const courseImageInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setCourses(getCourses());
    setCategories(getCategories());
    setAnnouncements(getAnnouncements());
    setAttendanceRecords(getAttendanceRecords());
    
    const settings = getSystemSettings();
    setSystemSettings(settings);
    
    const cfg = getCloudConfig();
    setCloudConfig(cfg);
    setTempScriptUrl(cfg.googleScriptUrl);
    
    // Initialize Base URL: prefer saved setting, otherwise try detection, but avoid 'blob:'
    if (settings.deployedUrl) {
      setBaseUrl(settings.deployedUrl);
    } else {
      const current = window.location.href.split('?')[0].split('#')[0];
      if (!current.startsWith('blob:')) {
         setBaseUrl(current);
      }
    }
    
    if (user) setPersonalName(user.name);
  }, [user]);

  // --- Profile Handlers ---
  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const updated = { ...user, name: personalName };
    updateUserProfile(updated);
    alert('個人資料已更新！');
  };

  // --- Image Helper ---
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, callback: (base64: string) => void) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert("圖片太大囉 (請小於 2MB)，建議使用壓縮過的圖檔。");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        callback(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // --- GPS Helper ---
  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("瀏覽器不支援地理位置獲取");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCurrentCourse(prev => ({
          ...prev,
          locationLat: Number(pos.coords.latitude.toFixed(6)),
          locationLng: Number(pos.coords.longitude.toFixed(6))
        }));
        alert(`成功獲取座標：${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`);
      },
      (err) => alert("無法獲取位置，請確認瀏覽器權限已開啟。")
    );
  };

  // --- Category Handlers ---
  const handleAddCategory = () => {
    if (newCategory && !categories.includes(newCategory)) {
      const updated = [...categories, newCategory];
      setCategories(updated);
      saveCategories(updated);
      setNewCategory('');
    }
  };

  const handleDeleteCategory = (cat: string) => {
    if (confirm(`確定要刪除「${cat}」類別嗎？`)) {
      const updated = categories.filter(c => c !== cat);
      setCategories(updated);
      saveCategories(updated);
    }
  };

  // --- Course Handlers ---
  const handleSaveCourse = (e: React.FormEvent) => {
    e.preventDefault();
    const newCourse: Course = {
      id: currentCourse.id || Date.now().toString(),
      title: currentCourse.title!,
      description: currentCourse.description!,
      startDate: currentCourse.startDate!,
      endDate: currentCourse.endDate || currentCourse.startDate!,
      sessionDates: currentCourse.sessionDates || [currentCourse.startDate!],
      startTime: currentCourse.startTime || '09:00',
      location: currentCourse.location!,
      locationLat: Number(currentCourse.locationLat) || undefined,
      locationLng: Number(currentCourse.locationLng) || undefined,
      checkInRadius: Number(currentCourse.checkInRadius) || 100,
      category: currentCourse.category || categories[0],
      instructor: currentCourse.instructor || '未設定',
      imageUrl: currentCourse.imageUrl || `https://picsum.photos/seed/${Date.now()}/800/600`,
      capacity: Number(currentCourse.capacity) || 20,
      enrolledCount: currentCourse.enrolledCount || 0,
      tags: currentCourse.tags || [],
      googleFormUrl: currentCourse.googleFormUrl || ''
    };
    saveCourse(newCourse);
    setCourses(getCourses());
    setIsEditingCourse(false);
    setCurrentCourse({});
  };

  const handleDeleteCourse = (id: string) => {
    if (confirm('確定要刪除這個課程嗎？')) {
      deleteCourse(id);
      setCourses(getCourses());
    }
  };

  const handleAddSessionDate = () => {
    if (!tempSessionDate) return;
    const currentDates = currentCourse.sessionDates || [];
    if (!currentDates.includes(tempSessionDate)) {
      const newDates = [...currentDates, tempSessionDate].sort();
      setCurrentCourse({ ...currentCourse, sessionDates: newDates });
    }
    setTempSessionDate('');
  };

  const handleRemoveSessionDate = (dateToRemove: string) => {
    const currentDates = currentCourse.sessionDates || [];
    setCurrentCourse({ ...currentCourse, sessionDates: currentDates.filter(d => d !== dateToRemove) });
  };

  // --- Announcement Handlers ---
  const handleSaveAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    const newAnnouncement: Announcement = {
      id: currentAnnouncement.id || Date.now().toString(),
      title: currentAnnouncement.title!,
      content: currentAnnouncement.content!,
      date: new Date().toISOString().split('T')[0],
      authorName: user?.name || '社工管理員',
      link: currentAnnouncement.link || ''
    };
    saveAnnouncement(newAnnouncement);
    setAnnouncements(getAnnouncements());
    setIsEditingAnnouncement(false);
    setCurrentAnnouncement({});
  };

  const handleDeleteAnnouncement = (id: string) => {
    if (confirm('確定要刪除此公告嗎？')) {
      deleteAnnouncement(id);
      setAnnouncements(getAnnouncements());
    }
  };

  // --- Attendance Handlers ---
  const openAttendanceModal = (course: Course) => {
    setSelectedCourseForAttendance(course);
    setFilterDate('all'); // Default to all dates when opening modal
    setIsAttendanceModalOpen(true);
  };

  const handleManualAttendance = (studentId: string, status: AttendanceStatus, date: string) => {
    if (!selectedCourseForAttendance) return;
    
    // Check if record exists for this student + course + date
    const existing = attendanceRecords.find(r => 
      r.courseId === selectedCourseForAttendance.id && 
      r.studentId === studentId &&
      r.sessionDate === date
    );
    
    const record: AttendanceRecord = {
      id: existing?.id || Date.now().toString(),
      courseId: selectedCourseForAttendance.id,
      studentId: studentId,
      checkInTime: existing?.checkInTime || new Date().toISOString(),
      sessionDate: date,
      status: status,
      isManual: true
    };
    
    saveAttendanceRecord(record);
    setAttendanceRecords(getAttendanceRecords());
  };

  // --- System Settings Handlers ---
  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    saveSystemSettings(systemSettings);
    alert('系統外觀已更新！');
  };

  const handleAddAuthEmail = () => {
    const email = newAuthEmail.trim().toLowerCase();
    if (email && !systemSettings.authorizedWorkerEmails.includes(email)) {
      const updated = {
        ...systemSettings,
        authorizedWorkerEmails: [...systemSettings.authorizedWorkerEmails, email]
      };
      setSystemSettings(updated);
      saveSystemSettings(updated);
      setNewAuthEmail('');
    }
  };

  const handleRemoveAuthEmail = (email: string) => {
    if (confirm(`確定要取消對 ${email} 的社工授權嗎？`)) {
      const updated = {
        ...systemSettings,
        authorizedWorkerEmails: systemSettings.authorizedWorkerEmails.filter(e => e !== email)
      };
      setSystemSettings(updated);
      saveSystemSettings(updated);
    }
  };

  // --- Cloud Config Handlers ---
  const handleSaveCloudConfig = () => {
    const cleanUrl = tempScriptUrl.trim();
    if (!cleanUrl) return;

    if (!cleanUrl.startsWith('https://script.google.com/') || !cleanUrl.endsWith('/exec')) {
      alert('錯誤：這看起來不像有效的 Google Apps Script 網址。\n請確認網址以 https://script.google.com 開頭，並以 /exec 結尾。');
      return;
    }

    const newConfig = { ...cloudConfig, googleScriptUrl: cleanUrl, enabled: true };
    setCloudConfig(newConfig);
    saveCloudConfig(newConfig);
    
    // Also save the custom Base URL to system settings if it was modified
    if (baseUrl) {
       const updatedSettings = { ...systemSettings, deployedUrl: baseUrl.trim() };
       setSystemSettings(updatedSettings);
       saveSystemSettings(updatedSettings);
    }
    
    alert('資料庫連結已更新！');
  }
  
  // New Share Link Generator
  const getShareableLink = () => {
     if (!cloudConfig.googleScriptUrl || !baseUrl) return '';
     
     // Remove trailing slash if exists to avoid double slash with hash
     const cleanBase = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
     
     // IMPORTANT: Use HashRouter syntax: /#/?classId=...
     return `${cleanBase}/#/?classId=${encodeURIComponent(cloudConfig.googleScriptUrl)}`;
  };
  
  const handleCopyShareLink = () => {
    const link = getShareableLink();
    if (!link) {
      alert("請先設定「網站正式網址」與「Apps Script 網址」");
      return;
    }
    navigator.clipboard.writeText(link);
    alert('已複製「班級登入連結」！\n\n請將此連結傳送給學生，他們點擊後即可直接登入，無需設定。');
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
        <div>
           <h1 className="text-2xl font-bold text-gray-800">社工管理後台</h1>
           <p className="text-gray-500">管理課程、發布公告與授權管理</p>
        </div>
        <div className="flex gap-2 mt-4 md:mt-0 bg-white p-1 rounded-lg border border-gray-200 overflow-x-auto no-scrollbar">
           <button onClick={() => setActiveTab('courses')} className={`px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${activeTab === 'courses' ? 'bg-primary-100 text-primary-700' : 'text-gray-600 hover:bg-gray-50'}`}>課程管理</button>
           <button onClick={() => setActiveTab('announcements')} className={`px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${activeTab === 'announcements' ? 'bg-primary-100 text-primary-700' : 'text-gray-600 hover:bg-gray-50'}`}>公告發布</button>
           <button onClick={() => setActiveTab('attendance')} className={`px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${activeTab === 'attendance' ? 'bg-primary-100 text-primary-700' : 'text-gray-600 hover:bg-gray-50'}`}>簽到統計</button>
           <button onClick={() => setActiveTab('auth')} className={`px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${activeTab === 'auth' ? 'bg-primary-100 text-primary-700' : 'text-gray-600 hover:bg-gray-50'}`}>授權管理</button>
           <button onClick={() => setActiveTab('settings')} className={`px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${activeTab === 'settings' ? 'bg-primary-100 text-primary-700' : 'text-gray-600 hover:bg-gray-50'}`}>系統設定</button>
        </div>
      </div>

      {activeTab === 'courses' && (
        <>
          <Card className="mb-6 p-4 bg-gray-50 border-gray-200">
             <div className="flex items-center gap-2 mb-3">
               <Layers className="w-4 h-4 text-gray-600" />
               <h3 className="font-bold text-sm text-gray-800">課程類別管理</h3>
             </div>
             <div className="flex flex-wrap gap-2 items-center">
               {categories.map(cat => (
                 <span key={cat} className="bg-white border border-gray-200 px-3 py-1 rounded-full text-xs text-gray-700 flex items-center gap-1 group">
                   {cat}
                   <button onClick={() => handleDeleteCategory(cat)} className="text-gray-400 hover:text-red-500 hidden group-hover:block"><X className="w-3 h-3"/></button>
                 </span>
               ))}
               <div className="flex items-center gap-1 ml-2">
                 <input 
                    type="text" 
                    placeholder="新增類別..." 
                    className="text-xs p-1.5 rounded border border-gray-300 w-32 focus:ring-1 focus:ring-primary-400 outline-none"
                    value={newCategory}
                    onChange={e => setNewCategory(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleAddCategory()}
                 />
                 <button onClick={handleAddCategory} className="bg-gray-800 text-white p-1.5 rounded hover:bg-gray-700"><Plus className="w-3 h-3"/></button>
               </div>
             </div>
          </Card>

          <div className="flex justify-end mb-4">
            <button 
              onClick={() => { setCurrentCourse({}); setIsEditingCourse(true); }}
              className="bg-primary-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-primary-700 transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              新增課程
            </button>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
             <div className="grid grid-cols-12 gap-4 p-4 border-b border-gray-100 bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wider">
               <div className="col-span-3">課程名稱</div>
               <div className="col-span-2 hidden md:block">講師</div>
               <div className="col-span-3">起訖時間</div>
               <div className="col-span-1 text-center">名額</div>
               <div className="col-span-1 text-center">GPS</div>
               <div className="col-span-2 text-right">操作</div>
             </div>
             <div className="divide-y divide-gray-100">
               {courses.map(course => (
                 <div key={course.id} className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-gray-50 transition-colors">
                   <div className="col-span-3">
                     <div className="font-medium text-gray-900">{course.title}</div>
                     <div className="text-xs text-gray-500">{course.category}</div>
                   </div>
                   <div className="col-span-2 hidden md:block text-sm text-gray-600">{course.instructor}</div>
                   <div className="col-span-3 text-sm text-gray-600">
                      <div>{course.startDate} ~ {course.endDate}</div>
                      <div className="text-xs text-gray-400 truncate">{course.startTime}</div>
                   </div>
                   <div className="col-span-1 text-center">
                      <div className="text-xs font-bold text-gray-700">{course.enrolledCount} / {course.capacity}</div>
                      <div className="w-full bg-gray-200 h-1 rounded-full mt-1 overflow-hidden">
                         <div className="bg-primary-500 h-full" style={{ width: `${Math.min(100, (course.enrolledCount / course.capacity) * 100)}%` }}></div>
                      </div>
                   </div>
                   <div className="col-span-1 text-center">
                      {course.locationLat ? <MapPin className="w-4 h-4 text-green-500 mx-auto" /> : <span className="text-gray-300">-</span>}
                   </div>
                   <div className="col-span-2 flex justify-end gap-2">
                     <button onClick={() => { setCurrentCourse(course); setIsEditingCourse(true); }} className="p-1.5 text-gray-500 hover:text-primary-600 rounded hover:bg-white"><Edit2 className="w-4 h-4" /></button>
                     <button onClick={() => handleDeleteCourse(course.id)} className="p-1.5 text-gray-500 hover:text-red-600 rounded hover:bg-white"><Trash2 className="w-4 h-4" /></button>
                   </div>
                 </div>
               ))}
             </div>
          </div>
        </>
      )}

      {/* Announcements and Attendance tabs omitted for brevity, no changes */}
      {activeTab === 'announcements' && (
        <>
           <div className="flex justify-end mb-4">
            <button 
              onClick={() => { setCurrentAnnouncement({}); setIsEditingAnnouncement(true); }}
              className="bg-orange-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-orange-600 transition-colors shadow-sm"
            >
              <Megaphone className="w-4 h-4" />
              發布公告
            </button>
          </div>
          <div className="grid gap-4">
            {announcements.length === 0 && <p className="text-center text-gray-500 py-12">目前沒有公告。</p>}
            {announcements.map(a => (
              <Card key={a.id} className="p-4 flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="font-bold text-lg text-gray-800">{a.title}</h3>
                  <p className="text-gray-600 mt-1 whitespace-pre-wrap text-sm leading-relaxed">{a.content}</p>
                  {a.link && (
                    <div className="mt-3 p-3 bg-blue-50 border border-blue-100 rounded-lg flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs text-blue-700 truncate max-w-[70%]">
                        <Globe className="w-3 h-3" />
                        <span className="truncate">{a.link}</span>
                      </div>
                      <a href={a.link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs font-bold text-blue-600 hover:underline">
                        點擊開啟連結 <LinkIcon className="w-3 h-3" />
                      </a>
                    </div>
                  )}
                  <p className="text-xs text-gray-400 mt-3">{a.date} · {a.authorName}</p>
                </div>
                <button onClick={() => handleDeleteAnnouncement(a.id)} className="p-2 text-gray-400 hover:text-red-500 transition-colors"><Trash2 className="w-5 h-5" /></button>
              </Card>
            ))}
          </div>
        </>
      )}

      {activeTab === 'attendance' && (
         <div className="space-y-6">
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
             {courses.map(course => {
               const records = attendanceRecords.filter(r => r.courseId === course.id);
               const onTime = records.filter(r => r.status === AttendanceStatus.ON_TIME).length;
               const late = records.filter(r => r.status === AttendanceStatus.LATE).length;
               const total = records.length > 0 ? records.length : 1; 
               const pOnTime = Math.round((onTime / total) * 100);
               const pLate = Math.round((late / total) * 100);
               const endOnTime = pOnTime;
               const endLate = pOnTime + pLate;
               const pieStyle = { background: `conic-gradient(#22c55e 0% ${endOnTime}%, #eab308 ${endOnTime}% ${endLate}%, #f87171 ${endLate}% 100%)` };
               
               return (
                 <Card key={course.id} className="p-5 border-t-4 border-t-primary-500 flex flex-col h-full hover:shadow-md transition-shadow">
                   <div className="flex justify-between items-start mb-4">
                     <div>
                       <h3 className="font-bold text-gray-800 truncate pr-2 w-40" title={course.title}>{course.title}</h3>
                       <p className="text-xs text-gray-500">{course.startDate} ~ {course.endDate}</p>
                     </div>
                     <button onClick={() => openAttendanceModal(course)} className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg text-sm flex items-center gap-1"><UserCheck className="w-4 h-4" />管理簽到</button>
                   </div>
                   <div className="flex items-center gap-6 mb-4">
                      <div className="w-20 h-20 rounded-full flex-shrink-0 relative shadow-inner" style={pieStyle}></div>
                      <div className="text-xs space-y-1 text-gray-600 flex-1">
                        <div className="flex items-center justify-between"><div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-green-500"></div>準時</div><span className="font-bold">{records.length > 0 ? pOnTime : 0}%</span></div>
                        <div className="flex items-center justify-between"><div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-yellow-500"></div>遲到</div><span className="font-bold">{records.length > 0 ? pLate : 0}%</span></div>
                        <div className="pt-1 mt-1 border-t border-gray-100 text-gray-400 text-center">總人次: {records.length}</div>
                      </div>
                   </div>
                   <div className="text-xs text-gray-400 text-center bg-gray-50 p-2 rounded">
                      含 {course.sessionDates.length} 天課程日期
                   </div>
                 </Card>
               );
             })}
           </div>
         </div>
      )}

      {activeTab === 'auth' && (
        <div className="max-w-3xl mx-auto">
          <Card className="p-8 border-primary-100 bg-primary-50/30">
             <div className="flex items-center gap-3 mb-6 border-b border-primary-100 pb-4">
               <ShieldCheck className="w-6 h-6 text-primary-600" />
               <h2 className="text-xl font-bold text-gray-800">社工權限授權管理</h2>
            </div>
            <div className="space-y-6">
               <p className="text-sm text-gray-600 leading-relaxed font-medium">
                  只有在下方清單中的 Email 才能註冊為「社工」角色。
                  這能防止學生惡意註冊社工帳號查看敏感資料。
               </p>
               
               <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input 
                      type="email" 
                      placeholder="輸入欲授權的夥伴 Email..." 
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                      value={newAuthEmail}
                      onChange={e => setNewAuthEmail(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleAddAuthEmail()}
                    />
                  </div>
                  <button 
                    onClick={handleAddAuthEmail}
                    className="bg-primary-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-primary-700 transition-all flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" /> 授權
                  </button>
               </div>

               <div className="bg-white rounded-xl border border-primary-100 overflow-hidden shadow-sm">
                  <div className="bg-primary-50 px-4 py-2 text-[10px] font-bold text-primary-700 uppercase tracking-widest border-b border-primary-100">
                     已授權社工名單
                  </div>
                  <div className="divide-y divide-gray-50">
                     {systemSettings.authorizedWorkerEmails.length === 0 ? (
                       <p className="p-4 text-center text-gray-400 text-xs">尚無授權名單</p>
                     ) : (
                       systemSettings.authorizedWorkerEmails.map(email => (
                         <div key={email} className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">
                            <div className="flex items-center gap-3">
                               <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center font-bold text-xs">
                                  {email.charAt(0).toUpperCase()}
                               </div>
                               <span className="text-sm font-medium text-gray-700">{email}</span>
                            </div>
                            <button 
                              onClick={() => handleRemoveAuthEmail(email)}
                              className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                              title="移除授權"
                            >
                               <Trash2 className="w-4 h-4" />
                            </button>
                         </div>
                       ))
                     )}
                  </div>
               </div>
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'settings' && (
        <div className="max-w-3xl mx-auto space-y-8">
           
           {/* CLOUD CONNECTION INFO CARD */}
           <Card className="p-8 border-green-200 bg-gradient-to-br from-green-50 to-emerald-50/30">
             <div className="flex items-center gap-3 mb-6 border-b border-green-200 pb-4">
               <Cloud className="w-6 h-6 text-green-600" />
               <h2 className="text-xl font-bold text-gray-800">雲端資料庫連線資訊 (Admin)</h2>
            </div>
            
            <div className="mb-6 space-y-6">
                <div>
                   <label className="block text-sm font-bold text-gray-700 mb-2">Google Apps Script 部署網址</label>
                   <div className="flex gap-2">
                      <input 
                         type="text" 
                         value={tempScriptUrl} 
                         onChange={(e) => setTempScriptUrl(e.target.value)} 
                         placeholder="https://script.google.com/macros/s/..../exec" 
                         className="flex-1 p-3 border border-gray-300 rounded-lg text-sm font-mono shadow-sm"
                      />
                   </div>
                   <p className="text-xs text-gray-500 mt-2">
                      注意：請務必使用 <code>/exec</code> 結尾的部署網址。
                   </p>
                </div>

                <div className="pt-4 border-t border-green-200">
                   <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                      <Link2 className="w-4 h-4 text-green-600" />
                      網站正式網址 (Base URL)
                   </label>
                   <p className="text-[11px] text-green-700 mb-2 font-medium">
                      {window.location.href.startsWith('blob:') 
                        ? '⚠️ 偵測到您目前使用預覽 (Blob) 網址，此網址無法分享給學生。請務必在下方填入發布後的真實網址。' 
                        : '系統自動偵測的網址，若有誤請手動修改。'}
                   </p>
                   <div className="flex gap-2">
                      <input 
                         type="text" 
                         value={baseUrl} 
                         onChange={(e) => setBaseUrl(e.target.value)} 
                         placeholder="例如：https://career-passport.vercel.app" 
                         className={`flex-1 p-3 border rounded-lg text-sm font-mono shadow-sm ${!baseUrl ? 'border-red-300 bg-red-50' : 'border-gray-300'}`}
                      />
                      <button 
                         onClick={handleSaveCloudConfig}
                         className="bg-green-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-green-700 shadow-sm whitespace-nowrap"
                      >
                         儲存設定
                      </button>
                   </div>
                </div>
            </div>

            {cloudConfig.enabled && cloudConfig.googleScriptUrl ? (
              <div className="flex flex-col md:flex-row gap-6 items-start border-t border-green-200 pt-6">
                 <div className="flex-1 space-y-6">
                    <div>
                      <h3 className="font-bold text-gray-800 text-sm mb-2 flex items-center gap-2">
                        <Share2 className="w-4 h-4 text-primary-600"/> 
                        學生登入連結 (請分享此連結)
                      </h3>
                      
                      {baseUrl ? (
                        <>
                          <div className="flex items-center gap-2">
                            <input 
                               type="text" 
                               readOnly 
                               value={getShareableLink()} 
                               className="flex-1 p-3 bg-white border border-primary-200 rounded-lg text-xs text-primary-700 font-bold font-mono truncate shadow-inner"
                            />
                            <button onClick={handleCopyShareLink} className="bg-primary-600 text-white px-4 py-3 rounded-lg text-xs font-bold hover:bg-primary-700 flex items-center gap-2 whitespace-nowrap shadow-md">
                               <Copy className="w-4 h-4" /> 複製
                            </button>
                            <a href={getShareableLink()} target="_blank" rel="noopener noreferrer" className="bg-gray-700 text-white px-4 py-3 rounded-lg text-xs font-bold hover:bg-gray-800 flex items-center gap-2 whitespace-nowrap shadow-md">
                               <ExternalLink className="w-4 h-4" /> 測試
                            </a>
                          </div>

                          <div className="grid grid-cols-2 gap-4 mt-4">
                             <div className="bg-white p-4 rounded-xl border border-gray-100 flex flex-col items-center justify-center text-center">
                                <img 
                                  src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(getShareableLink())}`} 
                                  alt="Connection QR Code" 
                                  className="w-32 h-32 mb-2"
                                />
                                <p className="text-xs font-bold text-gray-500">掃描 QR Code 直接登入</p>
                             </div>
                             <div className="bg-white/60 p-4 rounded-xl text-xs text-gray-600 border border-green-100 flex flex-col justify-center">
                                <p className="font-bold text-green-700 mb-2">使用說明：</p>
                                <ul className="list-disc pl-4 space-y-2">
                                  <li>學生掃碼後無需設定，可直接登入。</li>
                                  <li>若連結無效，請確認「網站正式網址」是否正確。</li>
                                </ul>
                             </div>
                          </div>
                        </>
                      ) : (
                        <div className="p-4 bg-red-50 text-red-600 rounded-lg text-sm border border-red-200">
                           <AlertTriangle className="w-5 h-5 inline mr-2" />
                           請先在上方的「網站正式網址」欄位輸入本網站的發布網址，才能產生有效的 QR Code。
                        </div>
                      )}
                    </div>
                 </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-xl">
                 <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-yellow-500" />
                 <p className="mb-2 font-bold">尚未設定資料庫連結</p>
                 <p className="text-sm">請在上方的欄位輸入 Apps Script 網址並儲存。</p>
              </div>
            )}
           </Card>

          {/* Personal Profile Settings */}
          <Card className="p-8 border-indigo-100 bg-indigo-50/20">
             <div className="flex items-center gap-3 mb-6 border-b border-indigo-100 pb-4">
               <UserCircle className="w-6 h-6 text-indigo-600" />
               <h2 className="text-xl font-bold text-gray-800">個人資料設定</h2>
            </div>
            <form onSubmit={handleUpdateProfile} className="space-y-6">
               <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">我的姓名</label>
                  <div className="relative">
                    <UserCircle className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input 
                      type="text" 
                      value={personalName} 
                      onChange={(e) => setPersonalName(e.target.value)} 
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" 
                      placeholder="請輸入您的真實姓名" 
                    />
                  </div>
               </div>
               <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Email (帳號)</label>
                  <p className="text-sm text-gray-500 bg-gray-50 p-2 rounded-lg border">{user?.email}</p>
                  <p className="text-[10px] text-gray-400 mt-1">* 登入 Email 無法自行修改，如需更換請連繫系統管理員。</p>
               </div>
               <div className="pt-2 flex justify-end">
                  <button type="submit" className="bg-indigo-600 text-white px-6 py-2.5 rounded-lg font-bold flex items-center gap-2 hover:bg-indigo-700 shadow-md">
                    <Save className="w-4 h-4" /> 儲存修改
                  </button>
               </div>
            </form>
          </Card>

          <Card className="p-8">
            <div className="flex items-center gap-3 mb-6 border-b border-gray-100 pb-4">
               <Settings className="w-6 h-6 text-gray-700" />
               <h2 className="text-xl font-bold text-gray-800">系統外觀設定</h2>
            </div>
            <form onSubmit={handleSaveSettings} className="space-y-6">
               <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">首頁主標題</label>
                  <input type="text" value={systemSettings.landingTitle} onChange={(e) => setSystemSettings({...systemSettings, landingTitle: e.target.value})} className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-primary-400 outline-none" />
                  <p className="text-xs text-gray-500 mt-1">支援換行符號 (\n)</p>
               </div>
               <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">首頁副標題</label>
                  <textarea rows={3} value={systemSettings.landingSubtitle} onChange={(e) => setSystemSettings({...systemSettings, landingSubtitle: e.target.value})} className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-primary-400 outline-none" />
               </div>
               <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">首頁封面圖片</label>
                  <input type="file" accept="image/*" hidden ref={fileInputRef} onChange={(e) => handleImageUpload(e, (base64) => setSystemSettings({...systemSettings, landingImageUrl: base64}))} />
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="mt-1 flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-xl p-6 bg-gray-50 cursor-pointer hover:border-primary-400 transition-colors"
                  >
                    {systemSettings.landingImageUrl ? (
                      <div className="w-full h-40 rounded-lg overflow-hidden relative group">
                        <img src={systemSettings.landingImageUrl} className="w-full h-full object-cover" alt="Preview" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                           <Upload className="text-white w-8 h-8" />
                        </div>
                      </div>
                    ) : (
                      <div className="text-center text-gray-400">
                        <ImageIcon className="w-10 h-10 mx-auto mb-2" />
                        <p className="text-sm">點擊上傳封面圖</p>
                      </div>
                    )}
                  </div>
               </div>
               <div className="pt-4 flex justify-end">
                  <button type="submit" className="bg-primary-600 text-white px-6 py-2.5 rounded-lg font-bold flex items-center gap-2 hover:bg-primary-700 shadow-lg"><Save className="w-4 h-4" />儲存視覺設定</button>
               </div>
            </form>
          </Card>
        </div>
      )}

      {/* --- MODALS --- */}
      {/* Attendance and Course Editing Modals omitted for brevity - they remain unchanged */}
      {isAttendanceModalOpen && selectedCourseForAttendance && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
           <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl max-h-[90vh] overflow-hidden flex flex-col">
             <div className="p-6 border-b border-gray-100 flex flex-col bg-gray-50">
               <div className="flex justify-between items-center mb-2">
                 <h2 className="text-xl font-bold">出席名單管理</h2>
                 <button onClick={() => setIsAttendanceModalOpen(false)} className="p-2 hover:bg-gray-200 rounded-full transition-colors"><X className="w-5 h-5"/></button>
               </div>
               <p className="text-sm text-gray-500 mb-3">{selectedCourseForAttendance.title}</p>
               
               {/* DATE SELECTOR */}
               <div className="flex items-center gap-2">
                 <Calendar className="w-4 h-4 text-gray-500" />
                 <select 
                   value={filterDate}
                   onChange={(e) => setFilterDate(e.target.value)}
                   className="flex-1 p-2 border rounded-lg text-sm bg-white focus:ring-2 focus:ring-primary-400 outline-none"
                 >
                   <option value="all">查看所有日期 (統計)</option>
                   {selectedCourseForAttendance.sessionDates.map(date => (
                     <option key={date} value={date}>{date}</option>
                   ))}
                 </select>
               </div>
             </div>
             
             <div className="p-6 overflow-y-auto">
                {filterDate === 'all' ? (
                  <div className="text-center text-gray-400 py-10">
                    <p>請選擇一個具體日期以進行點名</p>
                    <p className="text-xs mt-1">「查看所有日期」模式僅供檢視總覽數據(卡片頁)</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {getUsers().filter(u => u.role === 'STUDENT').map(student => {
                      // Filter for the SPECIFIC DATE
                      const record = attendanceRecords.find(r => 
                        r.courseId === selectedCourseForAttendance.id && 
                        r.studentId === student.id &&
                        r.sessionDate === filterDate
                      );
                      const currentStatus = record ? record.status : '未簽到';
                      return (
                        <div key={student.id} className="flex items-center justify-between p-3 border border-gray-100 rounded-xl bg-white shadow-sm">
                           <div className="flex items-center gap-3">
                              <img src={student.avatarUrl} className="w-8 h-8 rounded-full border bg-gray-100" alt=""/>
                              <div><div className="font-bold text-gray-800 text-sm">{student.name}</div><div className="text-[10px] text-gray-400">{student.schoolDetails || '學生'}</div></div>
                           </div>
                           <select 
                             value={currentStatus === '未簽到' ? '' : currentStatus} 
                             onChange={(e) => handleManualAttendance(student.id, e.target.value as AttendanceStatus, filterDate)} 
                             className={`text-xs p-1.5 border rounded-lg font-bold focus:ring-1 focus:ring-primary-400 outline-none ${currentStatus === '未簽到' ? 'text-gray-400' : 'text-primary-600 bg-primary-50 border-primary-100'}`}
                           >
                             <option value="" disabled>點擊標註狀態</option>
                             <option value={AttendanceStatus.ON_TIME}>{AttendanceStatus.ON_TIME}</option>
                             <option value={AttendanceStatus.LATE}>{AttendanceStatus.LATE}</option>
                             <option value={AttendanceStatus.LEAVE}>{AttendanceStatus.LEAVE}</option>
                             <option value={AttendanceStatus.ABSENT}>{AttendanceStatus.ABSENT}</option>
                           </select>
                        </div>
                      );
                    })}
                  </div>
                )}
             </div>
           </div>
        </div>
      )}
      
      {isEditingCourse && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-xl max-h-[90vh] overflow-hidden flex flex-col">
             <div className="p-6 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
               <h2 className="text-xl font-bold">{currentCourse.id ? '編輯課程' : '新增課程'}</h2>
               <button onClick={() => setIsEditingCourse(false)} className="p-1 hover:bg-gray-200 rounded-full"><X className="w-6 h-6"/></button>
             </div>
             <form onSubmit={handleSaveCourse} className="p-6 space-y-5 overflow-y-auto">
                <div className="grid grid-cols-2 gap-5">
                   <div className="col-span-2">
                     <label className="block text-sm font-bold text-gray-700 mb-1">課程名稱</label>
                     <input type="text" required value={currentCourse.title || ''} onChange={e => setCurrentCourse({...currentCourse, title: e.target.value})} className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-primary-400 outline-none" placeholder="例如：程式開發入門" />
                   </div>
                   <div className="col-span-2 md:col-span-1">
                     <label className="block text-sm font-bold text-gray-700 mb-1 text-primary-600">課程封面圖片</label>
                     <input type="file" accept="image/*" hidden ref={courseImageInputRef} onChange={(e) => handleImageUpload(e, (base64) => setCurrentCourse({...currentCourse, imageUrl: base64}))} />
                     <div 
                       onClick={() => courseImageInputRef.current?.click()}
                       className="border-2 border-dashed border-gray-300 rounded-xl p-4 bg-gray-50 cursor-pointer flex flex-col items-center justify-center h-32 hover:border-primary-400 transition-all"
                     >
                       {currentCourse.imageUrl ? (
                         <img src={currentCourse.imageUrl} className="w-full h-full object-cover rounded-lg" alt="" />
                       ) : (
                         <div className="text-center text-gray-400">
                           <Upload className="w-6 h-6 mx-auto mb-1" />
                           <p className="text-xs">點擊上傳課程照</p>
                         </div>
                       )}
                     </div>
                   </div>
                   <div className="col-span-2 md:col-span-1">
                     <label className="block text-sm font-bold text-gray-700 mb-1">描述 (摘要)</label>
                     <textarea required rows={4} value={currentCourse.description || ''} onChange={e => setCurrentCourse({...currentCourse, description: e.target.value})} className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-primary-400 outline-none text-sm" placeholder="簡單介紹課程目標..." />
                   </div>
                   <div>
                     <label className="block text-sm font-bold text-gray-700 mb-1">講師名稱</label>
                     <input type="text" required value={currentCourse.instructor || ''} onChange={e => setCurrentCourse({...currentCourse, instructor: e.target.value})} className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-primary-400 outline-none" placeholder="講師姓名" />
                   </div>
                   <div>
                     <label className="block text-sm font-bold text-gray-700 mb-1">類別</label>
                     <select value={currentCourse.category || categories[0]} onChange={e => setCurrentCourse({...currentCourse, category: e.target.value})} className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-primary-400 outline-none">{categories.map(c => <option key={c} value={c}>{c}</option>)}</select>
                   </div>
                   <div>
                     <label className="block text-sm font-bold text-gray-700 mb-1">課程名額 (Quota)</label>
                     <div className="relative">
                        <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input type="number" min="1" required value={currentCourse.capacity || ''} onChange={e => setCurrentCourse({...currentCourse, capacity: Number(e.target.value)})} className="w-full pl-10 pr-3 py-2.5 border rounded-lg focus:ring-2 focus:ring-primary-400 outline-none" placeholder="例如：20" />
                     </div>
                   </div>
                   
                   {/* Date Range & Time */}
                   <div>
                     <label className="block text-sm font-bold text-gray-700 mb-1">開始日期</label>
                     <input type="date" required value={currentCourse.startDate || ''} onChange={e => setCurrentCourse({...currentCourse, startDate: e.target.value})} className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-primary-400 outline-none" />
                   </div>
                   <div>
                     <label className="block text-sm font-bold text-gray-700 mb-1">結束日期</label>
                     <input type="date" required value={currentCourse.endDate || ''} onChange={e => setCurrentCourse({...currentCourse, endDate: e.target.value})} className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-primary-400 outline-none" />
                   </div>
                   <div>
                     <label className="block text-sm font-bold text-gray-700 mb-1">上課時間</label>
                     <input type="time" required value={currentCourse.startTime || '09:00'} onChange={e => setCurrentCourse({...currentCourse, startTime: e.target.value})} className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-primary-400 outline-none" />
                   </div>

                   {/* Session Dates Management */}
                   <div className="col-span-2 bg-blue-50 p-4 rounded-xl border border-blue-100">
                     <label className="block text-sm font-bold text-blue-800 mb-2">上課/簽到日期列表 (可自行新增)</label>
                     <div className="flex gap-2 mb-3">
                       <input 
                         type="date" 
                         value={tempSessionDate} 
                         onChange={e => setTempSessionDate(e.target.value)} 
                         className="p-2 border rounded-lg text-sm"
                       />
                       <button 
                         type="button" 
                         onClick={handleAddSessionDate}
                         className="bg-blue-600 text-white px-3 py-2 rounded-lg text-sm font-bold hover:bg-blue-700"
                       >
                         新增日期
                       </button>
                     </div>
                     <div className="flex flex-wrap gap-2">
                       {(currentCourse.sessionDates || []).length === 0 && <span className="text-gray-400 text-xs">尚未新增日期</span>}
                       {(currentCourse.sessionDates || []).map(date => (
                         <span key={date} className="bg-white px-3 py-1 rounded-full text-xs font-medium text-blue-700 shadow-sm flex items-center gap-1 border border-blue-100">
                           {date}
                           <button type="button" onClick={() => handleRemoveSessionDate(date)} className="text-blue-300 hover:text-red-500"><X className="w-3 h-3" /></button>
                         </span>
                       ))}
                     </div>
                   </div>

                   <div className="col-span-2"><hr className="border-gray-100" /></div>
                   <div className="col-span-2">
                      <div className="flex justify-between items-center mb-1">
                         <label className="block text-sm font-bold text-primary-700">GPS 簽到設定 (鎖定範圍)</label>
                         <button type="button" onClick={handleGetCurrentLocation} className="text-xs font-bold text-primary-600 bg-primary-50 px-3 py-1.5 rounded-full flex items-center gap-1 hover:bg-primary-100 transition-all"><Navigation className="w-3 h-3" /> 使用我目前位置作為簽到點</button>
                      </div>
                      <div className="grid grid-cols-3 gap-3 bg-gray-50 p-3 rounded-xl border">
                        <div><label className="block text-[10px] text-gray-400 font-bold uppercase">緯度 (Latitude)</label><input type="number" step="0.000001" value={currentCourse.locationLat || ''} onChange={e => setCurrentCourse({...currentCourse, locationLat: Number(e.target.value)})} className="w-full bg-white p-1.5 border rounded text-xs" /></div>
                        <div><label className="block text-[10px] text-gray-400 font-bold uppercase">經度 (Longitude)</label><input type="number" step="0.000001" value={currentCourse.locationLng || ''} onChange={e => setCurrentCourse({...currentCourse, locationLng: Number(e.target.value)})} className="w-full bg-white p-1.5 border rounded text-xs" /></div>
                        <div><label className="block text-[10px] text-primary-500 font-bold uppercase">簽到半徑 (公尺)</label><input type="number" required value={currentCourse.checkInRadius || 100} onChange={e => setCurrentCourse({...currentCourse, checkInRadius: Number(e.target.value)})} className="w-full bg-white p-1.5 border border-primary-200 rounded text-xs font-bold text-primary-700" /></div>
                      </div>
                   </div>
                   <div className="col-span-2">
                     <label className="block text-sm font-bold text-gray-700 mb-1">詳細地點 (地址或場地名)</label>
                     <input type="text" required value={currentCourse.location || ''} onChange={e => setCurrentCourse({...currentCourse, location: e.target.value})} className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-primary-400 outline-none" placeholder="例如：台北市青少年發展處 502 教室" />
                   </div>
                   <div className="col-span-2">
                     <label className="block text-sm font-bold text-gray-700 mb-1">外部連結 / 報名表單網址</label>
                     <input type="url" value={currentCourse.googleFormUrl || ''} onChange={e => setCurrentCourse({...currentCourse, googleFormUrl: e.target.value})} className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-primary-400 outline-none" placeholder="https://docs.google.com/forms/..." />
                   </div>
                </div>
                <div className="pt-6 flex justify-end gap-3"><button type="button" onClick={() => setIsEditingCourse(false)} className="px-6 py-2.5 text-gray-500 font-bold">取消</button><button type="submit" className="px-10 py-2.5 bg-primary-600 text-white rounded-xl font-bold shadow-lg hover:bg-primary-700 transition-all">儲存課程資料</button></div>
             </form>
          </div>
        </div>
      )}

      {isEditingAnnouncement && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl animate-in zoom-in duration-200">
             <div className="p-6 border-b border-gray-100 bg-gray-50 flex justify-between items-center"><h2 className="text-xl font-bold">發布新公告</h2><button onClick={() => setIsEditingAnnouncement(false)} className="p-1 hover:bg-gray-200 rounded-full"><X className="w-6 h-6"/></button></div>
             <form onSubmit={handleSaveAnnouncement} className="p-6 space-y-4">
                <div><label className="block text-sm font-bold text-gray-700 mb-1">公告標題</label><input type="text" required value={currentAnnouncement.title || ''} onChange={e => setCurrentAnnouncement({...currentAnnouncement, title: e.target.value})} className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-primary-400 outline-none" placeholder="標題..." /></div>
                <div><label className="block text-sm font-bold text-gray-700 mb-1">公告內容</label><textarea required rows={4} value={currentAnnouncement.content || ''} onChange={e => setCurrentAnnouncement({...currentAnnouncement, content: e.target.value})} className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-primary-400 outline-none text-sm" placeholder="請輸入詳細內容..." /></div>
                <div><label className="block text-sm font-bold text-gray-700 mb-1">外部表單或連結 (選填)</label><input type="url" value={currentAnnouncement.link || ''} onChange={e => setCurrentAnnouncement({...currentAnnouncement, link: e.target.value})} className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-primary-400 outline-none" placeholder="https://..." /></div>
                <div className="pt-4 flex justify-end gap-3"><button type="button" onClick={() => setIsEditingAnnouncement(false)} className="px-6 py-2.5 text-gray-500 font-bold">取消</button><button type="submit" className="px-10 py-2.5 bg-orange-500 text-white rounded-xl font-bold shadow-lg hover:bg-orange-600 transition-all">發布公告</button></div>
             </form>
          </div>
        </div>
      )}
    </div>
  );
};