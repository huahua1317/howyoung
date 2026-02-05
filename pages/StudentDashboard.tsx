import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { PassportEntry, Course, Announcement, User } from '../types';
import { getPassportEntries, savePassportEntry, getCourses, getAnnouncements } from '../services/storageService';
import { useAuth } from '../contexts/AuthContext';
import { Plus, X, Calendar, Tag, FileText, Megaphone, AlertCircle, Printer, Upload, Trash2, Loader2, ArrowRight, MapPin, Compass } from 'lucide-react';

export const StudentDashboard: React.FC = () => {
  const { user, updateUserProfile } = useAuth();
  const [entries, setEntries] = useState<PassportEntry[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Profile Modal State
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileForm, setProfileForm] = useState<Partial<User>>({});
  
  // New Entry Form State
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [entryImage, setEntryImage] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) {
      // Async Data Fetching
      const fetchData = async () => {
         const userEntries = await getPassportEntries(user.id);
         setEntries(userEntries);
         
         const allCourses = await getCourses();
         // Sort courses by date (nearest first) for recommendation
         const sortedCourses = [...allCourses].sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
         setCourses(sortedCourses);

         const allAnnouncements = await getAnnouncements();
         setAnnouncements(allAnnouncements);
      };
      
      fetchData();

      // Check if profile is incomplete
      if (!user.isProfileCompleted) {
        setProfileForm({ 
          name: user.name,
          schoolDetails: user.schoolDetails || '',
          phoneNumber: user.phoneNumber || ''
        });
        setShowProfileModal(true);
      }
    }
  }, [user]);

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    const updatedUser: User = {
      ...user,
      name: profileForm.name || user.name,
      schoolDetails: profileForm.schoolDetails || '',
      phoneNumber: profileForm.phoneNumber || '',
      isProfileCompleted: true
    };
    
    updateUserProfile(updatedUser);
    setShowProfileModal(false);
    alert('設定完成！歡迎開始使用生涯探索護照。');
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert("圖片檔案過大，請選擇小於 2MB 的照片。");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setEntryImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!title || !content) {
      alert("請填寫標題與心得內容。");
      return;
    }

    setIsSubmitting(true);

    try {
      const newEntry: PassportEntry = {
        id: Date.now().toString(),
        studentId: user.id,
        courseId: selectedCourseId || undefined,
        title,
        content,
        date: new Date().toISOString().split('T')[0],
        tags: ['學習紀錄'], 
        imageUrls: entryImage ? [entryImage] : [], 
        isPublic: true
      };

      await savePassportEntry(newEntry);
      
      const updatedEntries = await getPassportEntries(user.id);
      setEntries(updatedEntries);
      
      setIsModalOpen(false);
      setTitle('');
      setContent('');
      setSelectedCourseId('');
      setEntryImage('');
    } catch (error) {
      console.error(error);
      alert("儲存失敗，請檢查網路連線");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    let html = `
      <html>
      <head>
        <title>${user?.name} 的生涯探索護照</title>
        <style>
          body { font-family: "Noto Sans TC", sans-serif; padding: 40px; color: #333; line-height: 1.6; }
          h1 { text-align: center; border-bottom: 2px solid #3b82f6; padding-bottom: 20px; color: #1e3a8a; }
          .header-info { text-align: center; margin-bottom: 40px; color: #666; }
          .entry { margin-bottom: 40px; page-break-inside: avoid; border: 1px solid #eee; border-radius: 8px; padding: 20px; }
          .entry-header { display: flex; justify-content: space-between; margin-bottom: 15px; border-bottom: 1px dashed #ccc; padding-bottom: 10px; }
          .entry-date { color: #888; font-size: 0.9em; }
          .entry-course { font-weight: bold; color: #3b82f6; }
          .entry-title { font-size: 1.4em; font-weight: bold; margin-bottom: 10px; color: #1f2937; }
          .entry-content { white-space: pre-wrap; text-align: justify; }
          .entry-img { max-width: 100%; height: auto; max-height: 300px; margin-top: 15px; border-radius: 4px; display: block; margin-left: auto; margin-right: auto; }
          @media print {
            body { padding: 0; }
            .entry { border: none; border-bottom: 1px solid #ccc; padding: 20px 0; }
          }
        </style>
      </head>
      <body>
        <h1>生涯探索學習護照</h1>
        <div class="header-info">
          <p><strong>姓名：</strong> ${user?.name}</p>
          <p><strong>學校：</strong> ${user?.schoolDetails || '未填寫'}</p>
          <p><strong>累計篇數：</strong> ${entries.length} 篇</p>
        </div>
    `;

    entries.forEach(entry => {
      const courseTitle = courses.find(c => c.id === entry.courseId)?.title || '自主探索';
      const imgHtml = entry.imageUrls.length > 0 ? `<img src="${entry.imageUrls[0]}" class="entry-img" />` : '';
      
      html += `
        <div class="entry">
          <div class="entry-header">
            <span class="entry-date">${entry.date}</span>
            <span class="entry-course">${courseTitle}</span>
          </div>
          <div class="entry-title">${entry.title}</div>
          <div class="entry-content">${entry.content}</div>
          ${imgHtml}
        </div>
      `;
    });

    html += `</body></html>`;
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 500);
  };

  // Filter out courses that have already passed (optional logic, currently showing all sorted by date)
  const todayStr = new Date().toISOString().split('T')[0];
  const upcomingCourses = courses.filter(c => c.endDate >= todayStr).slice(0, 3);

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-end mb-8 gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-4">
           <div className="relative group cursor-pointer" onClick={() => setShowProfileModal(true)}>
             <img src={user?.avatarUrl} alt="Avatar" className="w-20 h-20 rounded-full border-4 border-white shadow-md bg-gray-200 object-cover" />
             <div className="absolute inset-0 bg-black/30 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
               <span className="text-white text-xs font-bold">編輯</span>
             </div>
           </div>
           <div>
             <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
               {user?.name} 的護照
               {!user?.isProfileCompleted && <AlertCircle className="w-5 h-5 text-orange-500" />}
             </h1>
             <p className="text-gray-500">{user?.schoolDetails || '點擊頭像設定學校資訊'}</p>
           </div>
        </div>
        <div className="flex gap-2">
           <button onClick={handlePrint} className="bg-white text-gray-700 border border-gray-200 px-4 py-2.5 rounded-xl font-bold hover:bg-gray-50 flex items-center gap-2 shadow-sm transition-all">
             <Printer className="w-4 h-4" /> 匯出
           </button>
           <button onClick={() => setIsModalOpen(true)} className="bg-primary-600 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-primary-700 flex items-center gap-2 shadow-lg transition-all hover:scale-105 active:scale-95">
             <Plus className="w-5 h-5" /> 新增紀錄
           </button>
        </div>
      </div>

      {/* Stats Cards - Compact Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
         <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center">
            <div className="text-gray-400 text-xs font-bold uppercase mb-1">累積篇數</div>
            <div className="text-3xl font-bold text-primary-600">{entries.length}</div>
         </div>
         <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center">
            <div className="text-gray-400 text-xs font-bold uppercase mb-1">探索領域</div>
            <div className="text-3xl font-bold text-primary-600">{new Set(entries.map(e => courses.find(c => c.id === e.courseId)?.category || '其他')).size}</div>
         </div>
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* Left Column: Passport Entries (Takes 2/3 width) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center gap-2 mb-2">
             <FileText className="w-5 h-5 text-gray-600" />
             <h2 className="text-xl font-bold text-gray-800">我的學習歷程</h2>
          </div>

          {entries.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-gray-100">
               <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                 <FileText className="w-8 h-8 text-gray-300" />
               </div>
               <h3 className="text-lg font-bold text-gray-800 mb-2">你的護照還是空白的</h3>
               <p className="text-gray-500 mb-6 max-w-sm mx-auto">參加課程或活動後，記得來這裡寫下你的心得與反思，累積屬於你的生涯資產。</p>
               <button onClick={() => setIsModalOpen(true)} className="text-primary-600 font-bold hover:underline">立即新增第一篇</button>
            </div>
          ) : (
            entries.map(entry => {
               const course = courses.find(c => c.id === entry.courseId);
               return (
                 <Card key={entry.id} className="p-6 md:p-8 hover:shadow-md transition-shadow group">
                   <div className="flex flex-col md:flex-row gap-6">
                      {/* Date & Meta */}
                      <div className="md:w-32 flex-shrink-0 flex flex-col gap-2">
                         <div className="flex items-center gap-2 text-sm font-bold text-gray-500 bg-gray-50 px-2 py-1 rounded w-fit">
                           <Calendar className="w-3 h-3" /> {entry.date}
                         </div>
                         <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded w-fit">
                            <Tag className="w-3 h-3" /> {course?.category || '自主探索'}
                         </div>
                      </div>

                      {/* Content */}
                      <div className="flex-1">
                         {course && (
                           <div className="text-xs font-bold text-primary-600 mb-1">
                              課程：{course.title}
                           </div>
                         )}
                         <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-primary-700 transition-colors">{entry.title}</h3>
                         <p className="text-gray-600 whitespace-pre-wrap leading-relaxed mb-4 text-sm">{entry.content}</p>
                         
                         {entry.imageUrls.length > 0 && (
                           <div className="mt-4">
                             <img src={entry.imageUrls[0]} alt="Entry attachment" className="rounded-lg max-h-64 object-cover border border-gray-100 shadow-sm" />
                           </div>
                         )}
                      </div>
                   </div>
                 </Card>
               );
            })
          )}
        </div>

        {/* Right Column: Sidebar (Announcements & Recommendations) */}
        <div className="space-y-6 lg:sticky lg:top-6">
           
           {/* 1. Announcements Widget */}
           <Card className="p-5 border-l-4 border-l-orange-400 bg-gradient-to-br from-white to-orange-50/30">
              <div className="flex items-center justify-between mb-4">
                 <h3 className="font-bold text-gray-800 flex items-center gap-2">
                    <Megaphone className="w-5 h-5 text-orange-500" /> 最新公告
                 </h3>
              </div>
              <div className="space-y-4">
                 {announcements.length === 0 ? (
                    <p className="text-sm text-gray-400 italic">目前沒有新公告</p>
                 ) : (
                    announcements.slice(0, 3).map(a => (
                       <div key={a.id} className="pb-3 border-b border-orange-100 last:border-0 last:pb-0">
                          <div className="flex justify-between items-start">
                             <h4 className="font-bold text-gray-800 text-sm line-clamp-1">{a.title}</h4>
                             <span className="text-[10px] text-gray-400 flex-shrink-0 ml-2">{a.date}</span>
                          </div>
                          <p className="text-xs text-gray-600 mt-1 line-clamp-2">{a.content}</p>
                          {a.link && (
                             <a href={a.link} target="_blank" rel="noreferrer" className="text-[10px] text-orange-600 font-bold hover:underline mt-1 inline-block">詳細內容 &rarr;</a>
                          )}
                       </div>
                    ))
                 )}
              </div>
           </Card>

           {/* 2. Recommended Courses Widget */}
           <Card className="p-5">
              <div className="flex items-center justify-between mb-4">
                 <h3 className="font-bold text-gray-800 flex items-center gap-2">
                    <Compass className="w-5 h-5 text-primary-600" /> 推薦課程
                 </h3>
                 <Link to="/courses" className="text-xs text-gray-400 hover:text-primary-600 flex items-center gap-1 transition-colors">
                    更多 <ArrowRight className="w-3 h-3"/>
                 </Link>
              </div>
              <div className="space-y-4">
                 {upcomingCourses.length === 0 ? (
                    <p className="text-sm text-gray-400 italic">目前沒有即將開始的課程</p>
                 ) : (
                    upcomingCourses.map(c => (
                       <Link to="/courses" key={c.id} className="group flex gap-3 items-start hover:bg-gray-50 p-2 -mx-2 rounded-lg transition-colors">
                          <div className="w-16 h-16 rounded-lg bg-gray-100 flex-shrink-0 overflow-hidden border border-gray-100">
                             <img src={c.imageUrl} alt={c.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                          </div>
                          <div className="flex-1 min-w-0">
                             <div className="text-[10px] font-bold text-primary-600 bg-primary-50 px-1.5 py-0.5 rounded w-fit mb-1">{c.category}</div>
                             <h4 className="font-bold text-gray-800 text-sm line-clamp-1 group-hover:text-primary-700">{c.title}</h4>
                             <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                                <Calendar className="w-3 h-3" /> {c.startDate}
                             </div>
                          </div>
                       </Link>
                    ))
                 )}
              </div>
              <div className="mt-4 pt-3 border-t border-gray-100">
                 <Link to="/courses" className="w-full py-2 bg-gray-50 text-gray-600 text-xs font-bold rounded-lg hover:bg-gray-100 flex items-center justify-center gap-2 transition-colors">
                    探索所有活動
                 </Link>
              </div>
           </Card>

           {/* 3. Check-in Helper */}
           <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-xl p-5 text-white shadow-lg relative overflow-hidden group">
              <div className="relative z-10">
                 <h3 className="font-bold text-lg mb-1">準備好上課了嗎？</h3>
                 <p className="text-primary-100 text-xs mb-3">抵達教室後，別忘了使用 GPS 進行簽到紀錄出席。</p>
                 <Link to="/check-in" className="inline-flex items-center gap-2 bg-white text-primary-700 px-4 py-2 rounded-lg text-xs font-bold hover:bg-gray-50 shadow-sm transition-transform active:scale-95">
                    <MapPin className="w-3 h-3" /> 前往簽到
                 </Link>
              </div>
              <MapPin className="absolute -right-4 -bottom-4 w-24 h-24 text-white opacity-10 rotate-12 group-hover:rotate-0 transition-transform duration-500" />
           </div>

        </div>
      </div>

      {/* New Entry Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
               <h2 className="text-xl font-bold text-gray-800">撰寫新紀錄</h2>
               <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-gray-200 rounded-full transition-colors"><X className="w-5 h-5" /></button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6">
               <div>
                 <label className="block text-sm font-bold text-gray-700 mb-2">關聯課程 (選填)</label>
                 <select 
                   value={selectedCourseId} 
                   onChange={(e) => setSelectedCourseId(e.target.value)} 
                   className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none bg-white"
                 >
                   <option value="">-- 自主探索 (不指定課程) --</option>
                   {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                 </select>
               </div>

               <div>
                 <label className="block text-sm font-bold text-gray-700 mb-2">標題</label>
                 <input 
                   type="text" 
                   required
                   value={title}
                   onChange={(e) => setTitle(e.target.value)}
                   className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none"
                   placeholder="例如：第一次體驗..."
                 />
               </div>

               <div>
                 <label className="block text-sm font-bold text-gray-700 mb-2">心得內容</label>
                 <textarea 
                   required
                   rows={6}
                   value={content}
                   onChange={(e) => setContent(e.target.value)}
                   className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none resize-none"
                   placeholder="你在活動中看見了什麼？有什麼感受？發現了自己什麼優點或缺點？"
                 />
               </div>

               <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">上傳活動照片</label>
                  <input type="file" accept="image/*" hidden ref={fileInputRef} onChange={handleImageUpload} />
                  
                  {!entryImage ? (
                    <div 
                        onClick={() => fileInputRef.current?.click()}
                        className="border-2 border-dashed border-gray-300 rounded-xl p-6 flex flex-col items-center justify-center text-gray-400 hover:border-primary-400 hover:bg-gray-50 cursor-pointer transition-all"
                    >
                        <Upload className="w-8 h-8 mb-2" />
                        <span className="text-sm font-medium">點擊上傳照片 (上課實拍)</span>
                        <span className="text-xs text-gray-300 mt-1">支援 jpg, png (最大 2MB)</span>
                    </div>
                  ) : (
                    <div className="relative rounded-xl overflow-hidden border border-gray-200 group">
                        <img src={entryImage} alt="Preview" className="w-full h-48 object-cover" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                             <button 
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="bg-white/20 backdrop-blur text-white p-2 rounded-full hover:bg-white/30"
                                title="更換照片"
                             >
                                <Upload className="w-5 h-5" />
                             </button>
                             <button 
                                type="button"
                                onClick={() => setEntryImage('')}
                                className="bg-red-500/80 backdrop-blur text-white p-2 rounded-full hover:bg-red-600"
                                title="移除照片"
                             >
                                <Trash2 className="w-5 h-5" />
                             </button>
                        </div>
                    </div>
                  )}
               </div>

               <div className="pt-2 flex justify-end gap-3">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-3 text-gray-500 font-bold hover:bg-gray-100 rounded-xl transition-colors">取消</button>
                  <button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="px-8 py-3 bg-primary-600 text-white font-bold rounded-xl shadow-lg hover:bg-primary-700 transition-all flex items-center gap-2 disabled:bg-primary-300 disabled:cursor-not-allowed"
                  >
                    {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                    {isSubmitting ? '儲存中...' : '儲存紀錄'}
                  </button>
               </div>
            </form>
          </div>
        </div>
      )}

      {/* Profile Edit Modal */}
      {showProfileModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
           <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">設定個人檔案</h2>
              <form onSubmit={handleProfileSubmit} className="space-y-4">
                 <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">姓名</label>
                    <input type="text" required value={profileForm.name || ''} onChange={e => setProfileForm({...profileForm, name: e.target.value})} className="w-full p-2.5 border rounded-lg" />
                 </div>
                 <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">學校 / 年級</label>
                    <input type="text" required value={profileForm.schoolDetails || ''} onChange={e => setProfileForm({...profileForm, schoolDetails: e.target.value})} className="w-full p-2.5 border rounded-lg" placeholder="例如：台北高中 二年級" />
                 </div>
                 <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">聯絡電話</label>
                    <input type="tel" value={profileForm.phoneNumber || ''} onChange={e => setProfileForm({...profileForm, phoneNumber: e.target.value})} className="w-full p-2.5 border rounded-lg" placeholder="0912345678" />
                 </div>
                 <div className="pt-4">
                    <button className="w-full py-3 bg-primary-600 text-white font-bold rounded-xl hover:bg-primary-700">確認儲存</button>
                 </div>
              </form>
           </div>
        </div>
      )}
    </div>
  );
};