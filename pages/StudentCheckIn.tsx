import React, { useState, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { Course, AttendanceRecord, AttendanceStatus } from '../types';
import { getCourses, calculateDistance, saveAttendanceRecord, getAttendanceRecords } from '../services/storageService';
import { useAuth } from '../contexts/AuthContext';
import { Navigation, Clock, MapPin, CheckCircle, Calendar, AlertTriangle } from 'lucide-react';

export const StudentCheckIn: React.FC = () => {
  const { user } = useAuth();
  const [todaysCourses, setTodaysCourses] = useState<Course[]>([]);
  const [checkingInId, setCheckingInId] = useState<string | null>(null);
  const [attendanceMap, setAttendanceMap] = useState<Record<string, AttendanceStatus>>({});
  
  const todayStr = new Date().toISOString().split('T')[0];

  useEffect(() => {
    // Filter courses that have TODAY in their sessionDates
    const allCourses = getCourses();
    const activeCourses = allCourses.filter(c => 
      c.sessionDates && c.sessionDates.includes(todayStr)
    );
    setTodaysCourses(activeCourses);

    if (user) {
      const records = getAttendanceRecords();
      const userRecords = records.filter(r => r.studentId === user.id && r.sessionDate === todayStr);
      const map: Record<string, AttendanceStatus> = {};
      userRecords.forEach(r => map[r.courseId] = r.status);
      setAttendanceMap(map);
    }
  }, [user, todayStr]);

  const handleCheckIn = async (course: Course) => {
    if (!user) return;
    if (!course.locationLat || !course.locationLng) {
      alert("此課程未設定 GPS 簽到座標，請找現場社工點名。");
      return;
    }

    setCheckingInId(course.id);

    if (!navigator.geolocation) {
       alert("您的裝置不支援地理位置功能。");
       setCheckingInId(null);
       return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const dist = calculateDistance(
          position.coords.latitude,
          position.coords.longitude,
          course.locationLat!,
          course.locationLng!
        );

        // Use custom radius if set, otherwise fallback to 100m
        const MAX_DISTANCE = course.checkInRadius || 100;

        if (dist <= MAX_DISTANCE) {
          const now = new Date();
          const courseDate = new Date(todayStr + 'T' + (course.startTime || '09:00'));
          const lateThreshold = new Date(courseDate.getTime() + 15 * 60000); // 15 mins late
          
          let status = AttendanceStatus.ON_TIME;
          if (now > lateThreshold) {
            status = AttendanceStatus.LATE;
          }

          const record: AttendanceRecord = {
            id: Date.now().toString(),
            courseId: course.id,
            studentId: user.id,
            checkInTime: now.toISOString(),
            sessionDate: todayStr, // Explicitly set today's date
            status: status
          };
          
          saveAttendanceRecord(record);
          setAttendanceMap(prev => ({...prev, [course.id]: status}));
          alert(`簽到成功！\n狀態：${status}\n距離：${Math.round(dist)} 公尺 (範圍：${MAX_DISTANCE}m)`);
        } else {
          alert(`簽到失敗：\n目前距離課程地點約 ${Math.round(dist)} 公尺。\n請進入 ${MAX_DISTANCE} 公尺範圍內再嘗試。`);
        }
        setCheckingInId(null);
      },
      (error) => {
        console.error(error);
        alert("無法獲取您的位置，請檢查手機的 GPS 開關與瀏覽器權限。");
        setCheckingInId(null);
      },
      { enableHighAccuracy: true, timeout: 5000 }
    );
  };

  return (
    <div className="max-w-2xl mx-auto py-6">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center justify-center gap-2">
           <Navigation className="w-8 h-8 text-primary-600" />
           今日課程簽到
        </h1>
        <p className="text-gray-500 mt-2">日期：{todayStr}</p>
      </div>

      {todaysCourses.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-gray-200">
           <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
           <p className="text-gray-500 font-medium">今天沒有需要簽到的課程。</p>
        </div>
      ) : (
        <div className="space-y-4">
          {todaysCourses.map(course => {
             const status = attendanceMap[course.id];
             return (
               <Card key={course.id} className="p-6 border-l-4 border-l-primary-500 shadow-md">
                  <div className="flex justify-between items-start mb-4">
                     <div>
                        <h3 className="text-lg font-bold text-gray-900">{course.title}</h3>
                        <div className="text-sm text-gray-500 flex items-center gap-2 mt-1">
                           <Clock className="w-4 h-4" /> {course.startTime}
                           <span className="mx-1">|</span>
                           <MapPin className="w-4 h-4" /> {course.location}
                        </div>
                     </div>
                     <span className="bg-primary-50 text-primary-700 px-3 py-1 rounded-full text-xs font-bold">
                        {course.category}
                     </span>
                  </div>

                  {status ? (
                     <div className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 text-lg ${
                        status === AttendanceStatus.ON_TIME ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        <CheckCircle className="w-6 h-6" />
                        已完成簽到：{status}
                      </div>
                  ) : (
                     course.locationLat ? (
                       <button
                          onClick={() => handleCheckIn(course)}
                          disabled={!!checkingInId}
                          className="w-full py-4 rounded-xl bg-primary-600 text-white font-bold hover:bg-primary-700 shadow-lg transition-all flex items-center justify-center gap-3 active:scale-95"
                       >
                          {checkingInId === course.id ? (
                             <>定位中...</>
                          ) : (
                             <>
                               <Navigation className="w-6 h-6" />
                               點擊進行 GPS 簽到
                             </>
                          )}
                       </button>
                     ) : (
                        <div className="bg-gray-50 p-4 rounded-xl flex items-center justify-center gap-2 text-gray-500">
                           <AlertTriangle className="w-5 h-5" />
                           此課程需現場人工簽到
                        </div>
                     )
                  )}
               </Card>
             );
          })}
        </div>
      )}
    </div>
  );
};