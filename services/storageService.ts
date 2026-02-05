import { User, Course, PassportEntry, Announcement, AttendanceRecord, SystemSettings, UserRole, CloudConfig } from "../types";
import { DEFAULT_SYSTEM_SETTINGS, DEFAULT_CATEGORIES, INITIAL_COURSES } from "../constants";

// --- Configuration ---
const GAS_API_URL = "https://script.google.com/macros/s/AKfycbwGKw36q-H8OAseTLjB_aLYvvwFX8UDDuP0p5uwOXnz88jq6bFEv2pNsbzZSqymh-ZV/exec";

// --- Hardcoded Admin Credentials (Fail-safe) ---
// 這是系統的最高管理員，無論雲端資料如何，此帳號永遠被允許登入/註冊社工
// Reverted to the correct admin email
const ADMIN_EMAIL = "lemon70431@gfm.org.tw";
const ADMIN_PASS = "04151704";

// --- Local Cache State (In-Memory) ---
let currentUserCreds: { userId: string; password?: string } | null = null;

let cache = {
  users: [] as User[],
  courses: [] as Course[],
  entries: [] as PassportEntry[],
  announcements: [] as Announcement[],
  attendance: [] as AttendanceRecord[],
  categories: DEFAULT_CATEGORIES,
  settings: DEFAULT_SYSTEM_SETTINGS,
  cloudConfig: { enabled: false, googleScriptUrl: '' } as CloudConfig
};

// --- Core API Caller ---
interface ApiResponse {
  status: 'success' | 'fail' | 'error';
  message?: string;
  data?: any;
}

const callGasApi = async (payload: any): Promise<ApiResponse> => {
  try {
    const response = await fetch(GAS_API_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload),
    });
    
    const text = await response.text();
    if (text.startsWith("<!DOCTYPE html")) {
      console.error("GAS returned HTML error");
      return { status: 'error', message: '伺服器發生錯誤 (Script Error)' };
    }

    return JSON.parse(text);
  } catch (error) {
    console.error("API Call Error:", error);
    return { status: 'error', message: '網路連線失敗' };
  }
};

// --- Authentication & Initialization ---

export const apiLogin = async (userId: string, password: string): Promise<{ success: boolean; message?: string; user?: User }> => {
  const payload = {
    action: "login",
    userId: userId,
    password: password
  };

  let res = await callGasApi(payload);

  // Helper: Check if credentials match the hardcoded admin
  const isAdminCreds = userId.toLowerCase() === ADMIN_EMAIL.toLowerCase() && password === ADMIN_PASS;

  // --- ADMIN BOOTSTRAP LOGIC (管理員救援機制) ---
  // 情境 1: API 回傳失敗 (例如資料庫全空)，但帳密正確 -> 強制初始化
  if (res.status !== 'success' && isAdminCreds) {
      console.log("偵測到管理員帳號 (API Fail)，嘗試自動初始化...");
      
      const adminUser: User = {
          id: 'u_admin_lemon',
          name: '檸檬社工 (Admin)',
          email: ADMIN_EMAIL,
          role: UserRole.SOCIAL_WORKER,
          avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Lemon',
          isProfileCompleted: true
      };
      
      // 強制寫入雲端
      const saveRes = await callGasApi({
          action: "save",
          userId: userId, 
          password: password,
          data: { ...adminUser, dataType: 'user' }
      });

      if (saveRes.status === 'success') {
           res = await callGasApi(payload);
      } else {
           console.warn("管理員雲端初始化失敗，使用本地模式登入");
           currentUserCreds = { userId, password };
           cache.users = [adminUser];
           return { success: true, user: adminUser };
      }
  }

  if (res.status === 'success' && res.data) {
    // 1. Update Credentials
    currentUserCreds = { userId, password };
    
    // 2. Hydrate Cache with data from Cloud
    const cloudData = res.data;
    
    // [FIX] 解決剛註冊完立刻登入時，因為雲端延遲導致使用者被覆蓋消失的問題
    // 先暫存本地已知的使用者 (如果有的話)
    const potentialLocalUser = cache.users.find(u => u.email.toLowerCase() === userId.toLowerCase());

    cache.users = cloudData.users || [];
    
    // 如果雲端回傳的名單裡沒有這個人，但我們本地緩存裡有 (剛註冊)，則把它加回來
    if (potentialLocalUser && !cache.users.find(u => u.id === potentialLocalUser.id)) {
        console.log("偵測到雲端資料同步延遲，使用本地暫存的使用者資料進行登入。");
        cache.users.push(potentialLocalUser);
    }

    cache.courses = cloudData.courses || []; 
    cache.entries = cloudData.entries || [];
    cache.announcements = cloudData.announcements || [];
    cache.attendance = cloudData.attendance || [];
    cache.categories = cloudData.categories || DEFAULT_CATEGORIES;
    cache.settings = cloudData.settings || DEFAULT_SYSTEM_SETTINGS;
    cache.cloudConfig = cloudData.cloudConfig || { enabled: false, googleScriptUrl: '' };

    const foundUser = cache.users.find((u: User) => u.email.toLowerCase() === userId.toLowerCase());
    
    if (foundUser) {
        return { success: true, user: foundUser };
    } else {
        // 情境 2: API 回傳成功 (Success)，但在回傳的列表中找不到該使用者 (Ghost Login)
        // 這通常發生在資料庫同步有問題時。如果這是管理員，我們允許他登入以修復系統。
        if (isAdminCreds) {
             console.warn("API 回傳成功但找不到 User 資料，啟動管理員救援登入");
             const adminUser: User = {
                id: 'u_admin_lemon',
                name: '檸檬社工 (Admin)',
                email: ADMIN_EMAIL,
                role: UserRole.SOCIAL_WORKER,
                avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Lemon',
                isProfileCompleted: true
            };
            // 暫時加入快取
            cache.users.push(adminUser);
            return { success: true, user: adminUser };
        }

        return { success: false, message: "找不到此使用者資料，請確認您已完成註冊。" };
    }
  } else {
    return { success: false, message: res.message || "帳號或密碼錯誤" };
  }
};

export const apiRegister = async (user: User, password: string): Promise<{ success: boolean; message?: string }> => {
    // 1. Prepare payload
    // 我們使用 action: "save" 並且附帶 dataType: 'user' 來建立新用戶
    // 雖然通常 save 需要登入，但在這裡我們把「新帳號的帳密」當作憑證傳過去
    const payload = {
        action: "save",
        userId: user.email,
        password: password,
        data: {
            ...user,
            dataType: 'user'
        }
    };

    // 2. Call API
    const res = await callGasApi(payload);

    if (res.status === 'success') {
        // 3. Update Local State (Auto Login after register)
        currentUserCreds = { userId: user.email, password: password };
        
        const idx = cache.users.findIndex(u => u.id === user.id);
        if (idx >= 0) cache.users[idx] = user;
        else cache.users.push(user);
        
        // 如果後端回傳了最新的資料集，順便更新 Cache
        if (res.data) {
             const cloudData = res.data;
             if (cloudData.users) cache.users = cloudData.users;
             // ... other syncs
        }
        
        return { success: true };
    } else {
        return { success: false, message: res.message || "註冊失敗，請稍後再試" };
    }
};

export const apiLogout = () => {
  currentUserCreds = null;
};

// --- Generic Save Function ---

const saveToCloud = async (dataType: string, dataItem: any) => {
  if (!currentUserCreds || !currentUserCreds.password) {
    console.error("Cannot save: No credentials found (Not logged in?)");
    return { success: false, message: "尚未登入" };
  }

  const dataPayload = {
    ...dataItem,
    dataType: dataType 
  };

  const payload = {
    action: "save",
    userId: currentUserCreds.userId,
    password: currentUserCreds.password,
    data: dataPayload
  };

  return await callGasApi(payload);
};

// --- Data Accessors ---

// Users
export const getUsers = () => cache.users;
export const getUserById = async (id: string) => cache.users.find(u => u.id === id) || null;
export const saveUser = async (user: User) => {
  const idx = cache.users.findIndex(u => u.id === user.id);
  if (idx >= 0) cache.users[idx] = user;
  else cache.users.push(user);
  await saveToCloud('user', user);
};

// Courses
export const getCourses = () => {
    if (cache.courses.length === 0) return INITIAL_COURSES; 
    return cache.courses;
};
export const saveCourse = async (course: Course) => {
  const idx = cache.courses.findIndex(c => c.id === course.id);
  if (idx >= 0) cache.courses[idx] = course;
  else cache.courses.push(course);
  await saveToCloud('course', course);
};
export const deleteCourse = async (id: string) => {
  cache.courses = cache.courses.filter(c => c.id !== id);
  await saveToCloud('delete_course', { id }); 
};

// Entries
export const getPassportEntries = (studentId?: string) => {
  if (studentId) return cache.entries.filter(e => e.studentId === studentId);
  return cache.entries;
};
export const savePassportEntry = async (entry: PassportEntry) => {
  const idx = cache.entries.findIndex(e => e.id === entry.id);
  if (idx >= 0) cache.entries[idx] = entry;
  else cache.entries.unshift(entry);
  await saveToCloud('entry', entry);
};
export const deletePassportEntry = async (id: string) => {
  cache.entries = cache.entries.filter(e => e.id !== id);
  await saveToCloud('delete_entry', { id });
};

// Announcements
export const getAnnouncements = () => cache.announcements;
export const saveAnnouncement = async (announcement: Announcement) => {
    const idx = cache.announcements.findIndex(a => a.id === announcement.id);
    if (idx >= 0) cache.announcements[idx] = announcement;
    else cache.announcements.unshift(announcement);
    await saveToCloud('announcement', announcement);
};
export const deleteAnnouncement = async (id: string) => {
    cache.announcements = cache.announcements.filter(a => a.id !== id);
    await saveToCloud('delete_announcement', { id });
};

// Attendance
export const getAttendanceRecords = () => cache.attendance;
export const saveAttendanceRecord = async (record: AttendanceRecord) => {
    const idx = cache.attendance.findIndex(a => a.id === record.id);
    if (idx >= 0) cache.attendance[idx] = record;
    else cache.attendance.push(record);
    await saveToCloud('attendance', record);
};

// Settings & Categories
export const getSystemSettings = () => cache.settings;
export const saveSystemSettings = async (settings: SystemSettings) => {
    cache.settings = settings;
    await saveToCloud('settings', settings);
};
export const getCategories = () => cache.categories;
export const saveCategories = async (categories: string[]) => {
    cache.categories = categories;
    await saveToCloud('categories', { items: categories });
};
export const getCloudConfig = () => cache.cloudConfig;
export const saveCloudConfig = async (config: CloudConfig) => {
    cache.cloudConfig = config;
    await saveToCloud('cloudConfig', config);
};

export const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371e3;
  const φ1 = lat1 * Math.PI/180;
  const φ2 = lat2 * Math.PI/180;
  const Δφ = (lat2-lat1) * Math.PI/180;
  const Δλ = (lon2-lon1) * Math.PI/180;
  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};