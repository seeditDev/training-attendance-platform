import { Attendance, Student, Training } from "./types";

export interface DaywiseData {
  date: string;
  presentCount: number;
  absentCount: number;
  odCount: number;
  driveCount: number;
  totalStudents: number;
  attendancePercentage: number;
}

export interface WeekwiseData {
  week: string;
  startDate: string;
  endDate: string;
  presentCount: number;
  absentCount: number;
  odCount: number;
  driveCount: number;
  totalRecords: number;
  attendancePercentage: number;
}

export interface BatchwiseData {
  batch: string;
  presentCount: number;
  absentCount: number;
  odCount: number;
  driveCount: number;
  totalStudents: number;
  attendancePercentage: number;
}

export interface DepartmentwiseData {
  department: string;
  presentCount: number;
  absentCount: number;
  odCount: number;
  driveCount: number;
  totalStudents: number;
  attendancePercentage: number;
}

export interface StudentwiseData {
  studentId: string;
  name: string;
  registrationNo: string;
  department: string;
  presentCount: number;
  absentCount: number;
  odCount: number;
  driveCount: number;
  totalSessions: number;
  attendancePercentage: number;
}

export interface SessionwiseData {
  sessionId: string;
  sessionName: string;
  presentCount: number;
  absentCount: number;
  odCount: number;
  driveCount: number;
  totalStudents: number;
  attendancePercentage: number;
}

export class AnalyticsService {
  /**
   * Calculate daywise attendance trends
   */
  static calculateDaywise(
    attendanceRecords: Attendance[],
    students: Student[]
  ): DaywiseData[] {
    const daywiseMap = new Map<string, DaywiseData>();

    attendanceRecords.forEach((record) => {
      const dateStr = record.date.toISOString().split("T")[0];

      if (!daywiseMap.has(dateStr)) {
        daywiseMap.set(dateStr, {
          date: dateStr,
          presentCount: 0,
          absentCount: 0,
          odCount: 0,
          driveCount: 0,
          totalStudents: students.length,
          attendancePercentage: 0,
        });
      }

      const dayData = daywiseMap.get(dateStr)!;
      if (record.status === "present") dayData.presentCount++;
      else if (record.status === "absent") dayData.absentCount++;
      else if (record.status === "od") dayData.odCount++;
      else if (record.status === "drive") dayData.driveCount++;
    });

    // Calculate percentages
    daywiseMap.forEach((data) => {
      const totalMarked = data.presentCount + data.absentCount + data.odCount + data.driveCount;
      data.attendancePercentage = totalMarked > 0 ? (data.presentCount / totalMarked) * 100 : 0;
    });

    return Array.from(daywiseMap.values()).sort((a, b) => a.date.localeCompare(b.date));
  }

  /**
   * Calculate weekwise attendance trends
   */
  static calculateWeekwise(
    attendanceRecords: Attendance[],
    students: Student[]
  ): WeekwiseData[] {
    const weekwiseMap = new Map<string, WeekwiseData>();

    attendanceRecords.forEach((record) => {
      const date = new Date(record.date);
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);

      const weekKey = weekStart.toISOString().split("T")[0];

      if (!weekwiseMap.has(weekKey)) {
        weekwiseMap.set(weekKey, {
          week: `Week of ${weekStart.toLocaleDateString()}`,
          startDate: weekStart.toISOString().split("T")[0],
          endDate: weekEnd.toISOString().split("T")[0],
          presentCount: 0,
          absentCount: 0,
          odCount: 0,
          driveCount: 0,
          totalRecords: 0,
          attendancePercentage: 0,
        });
      }

      const weekData = weekwiseMap.get(weekKey)!;
      weekData.totalRecords++;

      if (record.status === "present") weekData.presentCount++;
      else if (record.status === "absent") weekData.absentCount++;
      else if (record.status === "od") weekData.odCount++;
      else if (record.status === "drive") weekData.driveCount++;
    });

    // Calculate percentages
    weekwiseMap.forEach((data) => {
      data.attendancePercentage =
        data.totalRecords > 0 ? (data.presentCount / data.totalRecords) * 100 : 0;
    });

    return Array.from(weekwiseMap.values()).sort((a, b) => a.startDate.localeCompare(b.startDate));
  }

  /**
   * Calculate batchwise attendance
   */
  static calculateBatchwise(
    attendanceRecords: Attendance[],
    students: Student[]
  ): BatchwiseData[] {
    const batchMap = new Map<string, BatchwiseData>();

    // Initialize batches
    students.forEach((student) => {
      const batch = student.academicYear || "Unknown";
      if (!batchMap.has(batch)) {
        batchMap.set(batch, {
          batch,
          presentCount: 0,
          absentCount: 0,
          odCount: 0,
          driveCount: 0,
          totalStudents: 0,
          attendancePercentage: 0,
        });
      }
      batchMap.get(batch)!.totalStudents++;
    });

    // Count attendance by batch
    attendanceRecords.forEach((record) => {
      const student = students.find((s) => s.id === record.studentId);
      if (student) {
        const batch = student.academicYear || "Unknown";
        const batchData = batchMap.get(batch);
        if (batchData) {
          if (record.status === "present") batchData.presentCount++;
          else if (record.status === "absent") batchData.absentCount++;
          else if (record.status === "od") batchData.odCount++;
          else if (record.status === "drive") batchData.driveCount++;
        }
      }
    });

    // Calculate percentages
    batchMap.forEach((data) => {
      const totalMarked = data.presentCount + data.absentCount + data.odCount + data.driveCount;
      data.attendancePercentage = totalMarked > 0 ? (data.presentCount / totalMarked) * 100 : 0;
    });

    return Array.from(batchMap.values()).sort((a, b) => a.batch.localeCompare(b.batch));
  }

  /**
   * Calculate departmentwise attendance
   */
  static calculateDepartmentwise(
    attendanceRecords: Attendance[],
    students: Student[]
  ): DepartmentwiseData[] {
    const deptMap = new Map<string, DepartmentwiseData>();

    // Initialize departments
    students.forEach((student) => {
      const dept = student.department || "Unknown";
      if (!deptMap.has(dept)) {
        deptMap.set(dept, {
          department: dept,
          presentCount: 0,
          absentCount: 0,
          odCount: 0,
          driveCount: 0,
          totalStudents: 0,
          attendancePercentage: 0,
        });
      }
      deptMap.get(dept)!.totalStudents++;
    });

    // Count attendance by department
    attendanceRecords.forEach((record) => {
      const student = students.find((s) => s.id === record.studentId);
      if (student) {
        const dept = student.department || "Unknown";
        const deptData = deptMap.get(dept);
        if (deptData) {
          if (record.status === "present") deptData.presentCount++;
          else if (record.status === "absent") deptData.absentCount++;
          else if (record.status === "od") deptData.odCount++;
          else if (record.status === "drive") deptData.driveCount++;
        }
      }
    });

    // Calculate percentages
    deptMap.forEach((data) => {
      const totalMarked = data.presentCount + data.absentCount + data.odCount + data.driveCount;
      data.attendancePercentage = totalMarked > 0 ? (data.presentCount / totalMarked) * 100 : 0;
    });

    return Array.from(deptMap.values()).sort((a, b) => a.department.localeCompare(b.department));
  }

  /**
   * Calculate studentwise attendance
   */
  static calculateStudentwise(
    attendanceRecords: Attendance[],
    students: Student[]
  ): StudentwiseData[] {
    const studentMap = new Map<string, StudentwiseData>();

    // Initialize students
    students.forEach((student) => {
      studentMap.set(student.id, {
        studentId: student.id,
        name: student.name,
        registrationNo: student.registrationNo || "",
        department: student.department || "Unknown",
        presentCount: 0,
        absentCount: 0,
        odCount: 0,
        driveCount: 0,
        totalSessions: 0,
        attendancePercentage: 0,
      });
    });

    // Count attendance by student
    attendanceRecords.forEach((record) => {
      const studentData = studentMap.get(record.studentId);
      if (studentData) {
        studentData.totalSessions++;
        if (record.status === "present") studentData.presentCount++;
        else if (record.status === "absent") studentData.absentCount++;
        else if (record.status === "od") studentData.odCount++;
        else if (record.status === "drive") studentData.driveCount++;
      }
    });

    // Calculate percentages
    studentMap.forEach((data) => {
      data.attendancePercentage =
        data.totalSessions > 0 ? (data.presentCount / data.totalSessions) * 100 : 0;
    });

    return Array.from(studentMap.values())
      .filter((s) => s.totalSessions > 0)
      .sort((a, b) => b.attendancePercentage - a.attendancePercentage);
  }

  /**
   * Calculate sessionwise attendance
   */
  static calculateSessionwise(
    attendanceRecords: Attendance[],
    training: Training
  ): SessionwiseData[] {
    const sessionMap = new Map<string, SessionwiseData>();

    // Initialize sessions
    training.sessions.forEach((session) => {
      sessionMap.set(session.id, {
        sessionId: session.id,
        sessionName: session.name,
        presentCount: 0,
        absentCount: 0,
        odCount: 0,
        driveCount: 0,
        totalStudents: 0,
        attendancePercentage: 0,
      });
    });

    // Count attendance by session
    attendanceRecords.forEach((record) => {
      const sessionData = sessionMap.get(record.sessionId);
      if (sessionData) {
        sessionData.totalStudents++;
        if (record.status === "present") sessionData.presentCount++;
        else if (record.status === "absent") sessionData.absentCount++;
        else if (record.status === "od") sessionData.odCount++;
        else if (record.status === "drive") sessionData.driveCount++;
      }
    });

    // Calculate percentages
    sessionMap.forEach((data) => {
      data.attendancePercentage =
        data.totalStudents > 0 ? (data.presentCount / data.totalStudents) * 100 : 0;
    });

    return Array.from(sessionMap.values());
  }

  /**
   * Get summary statistics
   */
  static getSummary(attendanceRecords: Attendance[], students: Student[]) {
    let presentCount = 0;
    let absentCount = 0;
    let odCount = 0;
    let driveCount = 0;

    attendanceRecords.forEach((record) => {
      if (record.status === "present") presentCount++;
      else if (record.status === "absent") absentCount++;
      else if (record.status === "od") odCount++;
      else if (record.status === "drive") driveCount++;
    });

    const totalMarked = presentCount + absentCount + odCount + driveCount;
    const attendancePercentage = totalMarked > 0 ? (presentCount / totalMarked) * 100 : 0;

    return {
      totalStudents: students.length,
      totalRecords: attendanceRecords.length,
      presentCount,
      absentCount,
      odCount,
      driveCount,
      attendancePercentage: Math.round(attendancePercentage * 100) / 100,
    };
  }
}
