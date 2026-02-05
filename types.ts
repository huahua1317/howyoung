export enum UserRole {
  STUDENT = 'STUDENT',
  SOCIAL_WORKER = 'SOCIAL_WORKER'
}

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string; // For authentication
  role: UserRole;
  avatarUrl?: string;
  
  // Minimal Essential Fields
  isProfileCompleted?: boolean;
  schoolDetails?: string; // 校名/科系/年級
  phoneNumber?: string;
}

export interface SystemSettings {
  landingTitle: string;
  landingSubtitle: string;
  landingImageUrl: string;
  syncWebhookUrl?: string;
  authorizedWorkerEmails: string[]; // 授權可註冊為社工的 Email 名單
  deployedUrl?: string; // 手動設定的網站發布網址，解決 blob/localhost 問題
}

export interface CloudConfig {
  enabled: boolean;
  googleScriptUrl: string; // Changed from accessKey/binId to Google Script URL
  lastSyncTime?: string;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  startDate: string; // Changed from single date to range
  endDate: string;   // Changed from single date to range
  sessionDates: string[]; // List of specific dates for attendance
  startTime: string; 
  location: string;
  locationLat?: number; 
  locationLng?: number;
  checkInRadius?: number; // 簽到範圍 (公尺)
  category: string; 
  instructor: string;
  imageUrl?: string;
  capacity: number;
  enrolledCount: number;
  tags: string[];
  googleFormUrl?: string;
}

export interface PassportEntry {
  id: string;
  studentId: string;
  courseId?: string; 
  title: string;
  content: string; 
  date: string;
  tags: string[];
  imageUrls: string[];
  isPublic: boolean; 
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  date: string;
  authorName: string;
  link?: string; 
}

export enum AttendanceStatus {
  ON_TIME = '準時',
  LATE = '遲到',
  LEAVE = '請假',
  ABSENT = '無故缺席'
}

export interface AttendanceRecord {
  id: string;
  courseId: string;
  studentId: string;
  checkInTime: string;
  sessionDate: string; // The specific date this record belongs to
  status: AttendanceStatus;
  isManual?: boolean; 
}

export type ToastType = 'success' | 'error' | 'info';

export interface ToastMessage {
  id: string;
  type: ToastType;
  message: string;
}