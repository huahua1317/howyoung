import React, { useState, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { Course, AttendanceRecord, AttendanceStatus } from '../types';
import { getCourses, getAttendanceRecords, getCategories } from '../services/storageService';
import { MapPin, Calendar, Users, Search, ExternalLink, Map, CheckCircle, Clock } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export const CourseHub: React.FC = () => {
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('全部');
  const [attendanceMap, setAttendanceMap] = useState<Record<string, AttendanceStatus>>({});

  useEffect(() => {
    setCourses(getCourses());
    setCategories(getCategories());
    if (user) {
      const records = getAttendanceRecords();
      const userRecords = records.filter(r => r.studentId === user.id);
      const map: Record<string, AttendanceStatus> = {};
      // For course hub card, we just show if they EVER attended any session of this course for simplicity, or just show enrollment status.
      // Or we can check if they attended "today".
      // Let's just show if they have ANY record for now to indicate participation.
      userRecords.forEach(r => map[r.courseId] = r.status);
      setAttendanceMap(map);
    }
  }, [user]);

  const filteredCourses = courses.filter(c => {
    const matchesSearch = c.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         c.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === '全部' || c.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const isCourseToday = (course: Course) => {
    const today = new Date().toISOString().split('T')[0];
    return course.sessionDates && course.sessionDates.includes(today);
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">探索精彩課程</h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          參加多元的生涯探索活動，發掘你的潛能與熱情。
        </p>
      </div>

      {/* Filters */}
      <div className="mb-8 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex gap-2 overflow-x-auto pb-2 w-full md:w-auto no-scrollbar">
          <button 
            onClick={() => setSelectedCategory('全部')}
            className={`px-5 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all ${selectedCategory === '全部' ? 'bg-primary-600 text-white shadow-md' : 'bg-white text-gray-500 hover:bg-gray-100'}`}
          >
            全部
          </button>
          {categories.map(cat => (
            <button 
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-5 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all ${selectedCategory === cat ? 'bg-primary-600 text-white shadow-md' : 'bg-white text-gray-500 hover:bg-gray-100'}`}
            >
              {cat}
            </button>
          ))}
        </div>
        
        <div className="relative w-full md:w-64">
          <input 
            type="text" 
            placeholder="搜尋課程..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-full border border-gray-200 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all shadow-sm"
          />
          <Search className="w-4 h-4 text-gray-400 absolute left-4 top-3.5" />
        </div>
      </div>

      {/* Course Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredCourses.map(course => {
          const attendanceStatus = attendanceMap[course.id];
          const isToday = isCourseToday(course);
          
          return (
            <Card key={course.id} hover className="flex flex-col h-full overflow-hidden group">
              <div className="h-52 relative overflow-hidden bg-gray-100">
                <img src={course.imageUrl} alt={course.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                <div className="absolute top-4 right-4 bg-white/95 backdrop-blur px-3 py-1.5 rounded-lg text-xs font-bold text-primary-700 shadow-sm border border-primary-50">
                  {course.category}
                </div>
                {isToday && (
                   <div className="absolute bottom-4 left-4 bg-green-500 text-white px-3 py-1 rounded-full text-[10px] font-bold animate-pulse shadow-lg flex items-center gap-1">
                     <Clock className="w-3 h-3" /> 今日有課
                   </div>
                )}
              </div>
              
              <div className="p-6 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-xl font-bold text-gray-900 line-clamp-1">{course.title}</h3>
                </div>
                <div className="text-xs text-primary-600 font-bold mb-3 flex items-center gap-1">
                   講師：{course.instructor}
                </div>
                <p className="text-gray-500 text-sm mb-6 line-clamp-2 flex-1 leading-relaxed">{course.description}</p>
                
                <div className="space-y-3 text-sm text-gray-600 mb-8 p-4 bg-gray-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <Calendar className="w-4 h-4 text-primary-500 flex-shrink-0" />
                    <span className="font-medium">{course.startDate} ~ {course.endDate}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Clock className="w-4 h-4 text-primary-500 flex-shrink-0" />
                    <span className="font-medium">{course.startTime}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <MapPin className="w-4 h-4 text-primary-500 flex-shrink-0" />
                    <span className="font-medium truncate" title={course.location}>{course.location}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Users className="w-4 h-4 text-primary-500 flex-shrink-0" />
                    <span className="font-medium">剩餘名額: {course.capacity - course.enrolledCount}</span>
                  </div>
                </div>

                <div className="space-y-3 mt-auto">
                  {course.googleFormUrl ? (
                    <a 
                      href={course.googleFormUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="w-full py-3 rounded-xl bg-gray-900 text-white font-bold hover:bg-black transition-all flex items-center justify-center gap-2 shadow-sm"
                    >
                      <span>報名活動</span>
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  ) : (
                    <button 
                      disabled
                      className="w-full py-3 rounded-xl bg-gray-100 text-gray-400 font-bold cursor-not-allowed"
                    >
                      尚未開放報名
                    </button>
                  )}
                  
                  {/* Note: Check-in button removed, directed to Check-in Tab */}
                  {isToday && (
                    <div className="text-center text-xs text-green-600 bg-green-50 py-2 rounded-lg font-bold">
                       請至「簽到專區」進行打卡
                    </div>
                  )}
                </div>
              </div>
            </Card>
          );
        })}

        {filteredCourses.length === 0 && (
          <div className="col-span-full text-center py-20 bg-white rounded-3xl border-2 border-dashed border-gray-100">
            <Search className="w-12 h-12 text-gray-200 mx-auto mb-4" />
            <p className="text-gray-400 font-medium">沒有找到符合條件的課程。</p>
          </div>
        )}
      </div>
    </div>
  );
};