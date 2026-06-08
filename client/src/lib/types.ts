/**
 * Firestore Data Models and Types
 */

export interface Training {
  id: string;
  name: string;
  type: string;
  academicYear: string;
  startDate: Date;
  endDate: Date;
  status: "active" | "completed" | "draft";
  description?: string;
  sessions: Session[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Session {
  id: string;
  name: string;
  order: number;
}

export interface Student {
  id: string;
  registrationNo: string;
  rollNo: string;
  name: string;
  department: string;
  academicYear: string;
  batch?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Attendance {
  id: string;
  trainingId: string;
  studentId: string;
  date: Date;
  sessionId: string;
  status: "present" | "absent" | "od" | "drive";
  remarks?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AttendanceSummary {
  trainingId: string;
  studentId: string;
  totalSessions: number;
  presentCount: number;
  absentCount: number;
  odCount: number;
  driveCount: number;
  attendancePercentage: number;
}

export interface TrainingStats {
  totalTrainings: number;
  activeTrainings: number;
  completedTrainings: number;
  totalStudents: number;
  averageAttendance: number;
}

export const DEPARTMENTS = [
  "CSE",
  "AI&DS",
  "CSBS",
  "IT",
  "ECE",
  "EEE",
  "MECH",
  "CIVIL",
  "MBA",
  "MCA",
  "Other",
];

export const ATTENDANCE_STATUS = ["present", "absent", "od", "drive"] as const;
export type AttendanceStatus = (typeof ATTENDANCE_STATUS)[number];

export const TRAINING_STATUS = ["active", "completed", "draft"] as const;
export type TrainingStatus = (typeof TRAINING_STATUS)[number];
