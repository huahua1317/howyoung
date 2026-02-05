import { Course, PassportEntry, User, UserRole, Announcement, AttendanceRecord, AttendanceStatus, SystemSettings } from "./types";

export const APP_NAME = "CareerPassport";

export const DEFAULT_SYSTEM_SETTINGS: SystemSettings = {
  landingTitle: "探索未來，\n從這裡開始。",
  landingSubtitle: "CareerPassport 是一個專為青少年設計的生涯探索紀錄平台。累積你的學習歷程，發現你的無限可能。",
  landingImageUrl: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?ixlib.rb-4.0.3&auto=format&fit=crop&w=1351&q=80",
  syncWebhookUrl: "",
  authorizedWorkerEmails: ["chang@socialwork.org", "lemon70431@gfm.org.tw"],
  deployedUrl: "" // 預設為空，由使用者手動設定或自動偵測
};

export const DEFAULT_CATEGORIES = [
  '自我探索',
  '職涯體驗',
  '志工服務',
  '技能學習',
  '科技應用',
  '藝術創作'
];

export const MOCK_USERS: User[] = [
  {
    id: 'u1',
    name: '小明',
    email: 'ming@student.edu',
    password: 'password123',
    role: UserRole.STUDENT,
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix',
    isProfileCompleted: false
  },
  {
    id: 'u3',
    name: '小華',
    email: 'hua@student.edu',
    password: 'password123',
    role: UserRole.STUDENT,
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jessica',
    isProfileCompleted: true,
    schoolDetails: '建國中學 / 一年級',
    phoneNumber: '0912345678'
  },
  {
    id: 'u2',
    name: '張社工',
    email: 'chang@socialwork.org',
    password: 'password123',
    role: UserRole.SOCIAL_WORKER,
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka'
  },
  {
    id: 'u_admin_lemon',
    name: '檸檬社工',
    email: 'lemon70431@gfm.org.tw',
    password: '04151704', 
    role: UserRole.SOCIAL_WORKER,
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Lemon'
  }
];

export const INITIAL_ANNOUNCEMENTS: Announcement[] = [
  {
    id: 'a1',
    title: '【重要】暑期職涯探索營報名開始！',
    content: '今年的暑期營隊將參訪知名科技公司，名額有限，請大家盡快填寫報名表。',
    date: '2024-05-20',
    authorName: '張社工',
    link: 'https://docs.google.com/forms'
  }
];

const today = new Date().toISOString().split('T')[0];

export const INITIAL_COURSES: Course[] = [
  {
    id: 'c1',
    title: '一日咖啡師體驗 (測試用)',
    description: '此課程日期設定為今天，方便測試 GPS 簽到功能。',
    startDate: today,
    endDate: today,
    sessionDates: [today], // IMPORTANT: Added sessionDates
    startTime: '09:00',
    location: '轉角咖啡廳',
    locationLat: 25.0330, 
    locationLng: 121.5654,
    category: '職涯體驗',
    instructor: '林店長',
    imageUrl: 'https://picsum.photos/id/42/800/600',
    capacity: 10,
    enrolledCount: 8,
    tags: ['餐飲', '實作', '咖啡'],
    googleFormUrl: 'https://docs.google.com/forms/u/0/'
  }
];

export const INITIAL_ENTRIES: PassportEntry[] = [
  {
    id: 'e1',
    studentId: 'u1',
    courseId: 'c1',
    title: '第一次拉花就上手？',
    content: '今天參加了咖啡師體驗，原本以為很簡單，結果奶泡打得不夠綿密，拉花變成了一坨雲... 不過店長說我的服務態度很好，或許我適合接觸人群的工作！這讓我對服務業有了新的想像。',
    date: '2024-06-15',
    tags: ['咖啡', '挫折與成長', '職涯初探'],
    imageUrls: ['https://picsum.photos/id/63/400/300'],
    isPublic: true
  }
];

export const INITIAL_ATTENDANCE: AttendanceRecord[] = [
  {
    id: 'at1',
    courseId: 'c1',
    studentId: 'u1',
    checkInTime: '2024-06-15T08:55:00',
    sessionDate: '2024-06-15',
    status: AttendanceStatus.ON_TIME
  }
];