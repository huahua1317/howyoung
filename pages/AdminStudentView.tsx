import React, { useState, useEffect, useMemo } from 'react';
import { Card } from '../components/ui/Card';
import { User, UserRole, PassportEntry } from '../types';
import { getPassportEntries, getCourses, getUsers } from '../services/storageService';
import { Search, ChevronRight, ArrowLeft, Calendar, BookOpen, Download, User as UserIcon, Phone, LayoutGrid, Table as TableIcon, FileSpreadsheet, ArrowUpDown, Printer } from 'lucide-react';

type SortConfig = {
  key: keyof User | 'passportCount';
  direction: 'asc' | 'desc';
};

export const AdminStudentView: React.FC = () => {
  const [students, setStudents] = useState<User[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<User | null>(null);
  const [studentEntries, setStudentEntries] = useState<PassportEntry[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'passportCount', direction: 'desc' });

  const courses = getCourses();

  useEffect(() => {
    const allUsers = getUsers();
    setStudents(allUsers.filter(u => u.role === UserRole.STUDENT));
  }, []);

  useEffect(() => {
    if (selectedStudent) {
      setStudentEntries(getPassportEntries(selectedStudent.id));
    }
  }, [selectedStudent]);

  const processedStudents = useMemo(() => {
    let result = [...students];

    // Minimal Search
    result = result.filter(s => 
      s.name.includes(searchTerm) || 
      s.email.includes(searchTerm) || 
      (s.schoolDetails && s.schoolDetails.includes(searchTerm))
    );

    // Sorting
    result.sort((a, b) => {
      let aValue: any = '';
      let bValue: any = '';

      if (sortConfig.key === 'passportCount') {
        aValue = getPassportEntries(a.id).length;
        bValue = getPassportEntries(b.id).length;
      } else {
        aValue = a[sortConfig.key] || '';
        bValue = b[sortConfig.key] || '';
      }

      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [students, searchTerm, sortConfig]);

  const handleSort = (key: keyof User | 'passportCount') => {
    setSortConfig(current => ({
      key,
      direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const handleExportCSV = () => {
    if (processedStudents.length === 0) return;
    const headers = ["姓名", "Email", "學校/年級", "聯絡電話", "護照篇數"];
    const csvRows = processedStudents.map(s => {
      const count = getPassportEntries(s.id).length;
      return [s.name, s.email, s.schoolDetails || '', s.phoneNumber || '', count]
        .map(field => `"${String(field).replace(/"/g, '""')}"`).join(',');
    });
    const csvContent = "\uFEFF" + [headers.join(','), ...csvRows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `學生簡表_${new Date().toISOString().split('T')[0]}.csv`);
    link.click();
  };

  const handlePrintStudent = () => {
    if (!selectedStudent) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    let html = `
      <html>
      <head>
        <title>${selectedStudent.name} 的生涯探索護照</title>
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
          <p><strong>姓名：</strong> ${selectedStudent.name}</p>
          <p><strong>學校：</strong> ${selectedStudent.schoolDetails || '未填寫'}</p>
          <p><strong>累計篇數：</strong> ${studentEntries.length} 篇</p>
        </div>
    `;

    studentEntries.forEach(entry => {
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

  if (selectedStudent) {
    return (
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <button onClick={() => setSelectedStudent(null)} className="flex items-center text-gray-500 hover:text-gray-800 transition-colors">
            <ArrowLeft className="w-4 h-4 mr-2" /> 返回列表
          </button>
          <button onClick={handlePrintStudent} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-sm">
             <Printer className="w-4 h-4" /> 匯出 / 列印 PDF
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
             <Card className="p-6 bg-white sticky top-4">
                <div className="flex flex-col items-center mb-6">
                   <img src={selectedStudent.avatarUrl} className="w-20 h-20 rounded-full bg-gray-100 mb-3" alt="" />
                   <h2 className="text-xl font-bold text-gray-900">{selectedStudent.name}</h2>
                   <div className="mt-2 text-xs bg-primary-50 text-primary-700 px-3 py-1 rounded-full">{studentEntries.length} 篇護照</div>
                </div>
                <div className="space-y-4 text-sm">
                   <div className="border-t pt-4">
                      <span className="text-gray-400 block text-xs">Email</span>
                      <span className="text-gray-700">{selectedStudent.email}</span>
                   </div>
                   <div>
                      <span className="text-gray-400 block text-xs">學校資訊</span>
                      <span className="text-gray-700">{selectedStudent.schoolDetails || '-'}</span>
                   </div>
                   <div>
                      <span className="text-gray-400 block text-xs">聯絡電話</span>
                      <span className="text-gray-700">{selectedStudent.phoneNumber || '-'}</span>
                   </div>
                </div>
             </Card>
          </div>

          <div className="lg:col-span-2 space-y-6">
             <h3 className="font-bold text-gray-800 text-lg flex items-center gap-2">
                <BookOpen className="w-5 h-5" /> 學習歷程清單
             </h3>
             {studentEntries.length === 0 ? (
               <div className="text-center py-12 bg-gray-50 rounded-xl text-gray-400 border border-dashed">尚無紀錄</div>
             ) : (
               studentEntries.map(entry => (
                <Card key={entry.id} className="p-5">
                  <div className="flex items-center gap-2 mb-2 text-xs text-gray-400">
                    <Calendar className="w-4 h-4" />
                    <span>{entry.date}</span>
                    <span className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded">
                      {courses.find(c => c.id === entry.courseId)?.title || '活動'}
                    </span>
                  </div>
                  <h4 className="text-lg font-bold text-gray-800 mb-2">{entry.title}</h4>
                  <p className="text-gray-600 text-sm whitespace-pre-wrap leading-relaxed">{entry.content}</p>
                </Card>
               ))
             )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6 flex justify-between items-end">
         <div>
            <h1 className="text-2xl font-bold text-gray-800">學生資料簡表</h1>
            <p className="text-gray-500">檢視學生的基本聯絡方式與學習篇數</p>
         </div>
         <button onClick={handleExportCSV} className="flex items-center gap-2 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg shadow-sm">
            <FileSpreadsheet className="w-4 h-4" /> 匯出 Excel
         </button>
      </div>
      
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm mb-6 flex items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
          <input type="text" placeholder="搜尋姓名或學校..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-9 pr-4 py-2 border rounded-lg text-sm" />
        </div>
        <div className="flex bg-gray-100 p-1 rounded-lg">
           <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded ${viewMode === 'grid' ? 'bg-white text-primary-600 shadow-sm' : 'text-gray-400'}`}><LayoutGrid className="w-4 h-4" /></button>
           <button onClick={() => setViewMode('table')} className={`p-1.5 rounded ${viewMode === 'table' ? 'bg-white text-primary-600 shadow-sm' : 'text-gray-400'}`}><TableIcon className="w-4 h-4" /></button>
        </div>
      </div>

      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {processedStudents.map(student => (
            <button key={student.id} onClick={() => setSelectedStudent(student)} className="bg-white p-4 rounded-xl border shadow-sm hover:border-primary-300 transition-all text-left flex items-center gap-4 group">
              <img src={student.avatarUrl} className="w-12 h-12 rounded-full bg-gray-100" alt="" />
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-gray-900 group-hover:text-primary-700 truncate">{student.name}</h3>
                <p className="text-xs text-gray-400 truncate">{student.schoolDetails || '校資訊未填'}</p>
                <div className="mt-1 text-[10px] text-primary-600 bg-primary-50 inline-block px-2 py-0.5 rounded">{getPassportEntries(student.id).length} 篇護照</div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-300" />
            </button>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-x-auto">
           <table className="w-full text-left text-sm whitespace-nowrap">
             <thead className="bg-gray-50 border-b text-gray-500">
               <tr>
                 <th className="px-4 py-3 font-semibold cursor-pointer" onClick={() => handleSort('name')}>姓名 <ArrowUpDown className="inline w-3 h-3" /></th>
                 <th className="px-4 py-3 font-semibold">學校資訊</th>
                 <th className="px-4 py-3 font-semibold">聯絡電話</th>
                 <th className="px-4 py-3 font-semibold cursor-pointer" onClick={() => handleSort('passportCount')}>護照篇數 <ArrowUpDown className="inline w-3 h-3" /></th>
                 <th className="px-4 py-3 text-right">操作</th>
               </tr>
             </thead>
             <tbody className="divide-y">
               {processedStudents.map(student => (
                 <tr key={student.id} className="hover:bg-gray-50">
                   <td className="px-4 py-3 font-medium text-gray-900">{student.name}</td>
                   <td className="px-4 py-3 text-gray-500">{student.schoolDetails || '-'}</td>
                   <td className="px-4 py-3 text-gray-500">{student.phoneNumber || '-'}</td>
                   <td className="px-4 py-3"><span className="bg-primary-50 text-primary-700 px-2 py-0.5 rounded text-xs">{getPassportEntries(student.id).length} 篇</span></td>
                   <td className="px-4 py-3 text-right">
                     <button onClick={() => setSelectedStudent(student)} className="text-primary-600 hover:underline text-xs">詳細閱覽</button>
                   </td>
                 </tr>
               ))}
             </tbody>
           </table>
        </div>
      )}
    </div>
  );
};