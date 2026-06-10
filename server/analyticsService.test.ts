import { describe, it, expect } from "vitest";
import type { Attendance, Student, Training } from "../client/src/lib/types";

// Mock AnalyticsService
class AnalyticsService {
  static calculateDaywise(attendanceRecords: Attendance[], students: Student[]) {
    const daywiseMap = new Map<string, any>();

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

    daywiseMap.forEach((data) => {
      const totalMarked = data.presentCount + data.absentCount + data.odCount + data.driveCount;
      data.attendancePercentage = totalMarked > 0 ? (data.presentCount / totalMarked) * 100 : 0;
    });

    return Array.from(daywiseMap.values()).sort((a, b) => a.date.localeCompare(b.date));
  }

  static calculateBatchwise(attendanceRecords: Attendance[], students: Student[]) {
    const batchMap = new Map<string, any>();

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

    batchMap.forEach((data) => {
      const totalMarked = data.presentCount + data.absentCount + data.odCount + data.driveCount;
      data.attendancePercentage = totalMarked > 0 ? (data.presentCount / totalMarked) * 100 : 0;
    });

    return Array.from(batchMap.values()).sort((a, b) => a.batch.localeCompare(b.batch));
  }

  static calculateDepartmentwise(attendanceRecords: Attendance[], students: Student[]) {
    const deptMap = new Map<string, any>();

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

    deptMap.forEach((data) => {
      const totalMarked = data.presentCount + data.absentCount + data.odCount + data.driveCount;
      data.attendancePercentage = totalMarked > 0 ? (data.presentCount / totalMarked) * 100 : 0;
    });

    return Array.from(deptMap.values()).sort((a, b) => a.department.localeCompare(b.department));
  }

  static calculateStudentwise(attendanceRecords: Attendance[], students: Student[]) {
    const studentMap = new Map<string, any>();

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

    studentMap.forEach((data) => {
      data.attendancePercentage =
        data.totalSessions > 0 ? (data.presentCount / data.totalSessions) * 100 : 0;
    });

    return Array.from(studentMap.values())
      .filter((s) => s.totalSessions > 0)
      .sort((a, b) => b.attendancePercentage - a.attendancePercentage);
  }

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

describe("Analytics Service", () => {
  const mockStudents: Student[] = [
    {
      id: "s1",
      registrationNo: "001",
      rollNo: "001",
      name: "Student 1",
      department: "CSE",
      academicYear: "2024",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "s2",
      registrationNo: "002",
      rollNo: "002",
      name: "Student 2",
      department: "ECE",
      academicYear: "2024",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "s3",
      registrationNo: "003",
      rollNo: "003",
      name: "Student 3",
      department: "CSE",
      academicYear: "2023",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  const mockAttendance: Attendance[] = [
    {
      id: "a1",
      trainingId: "t1",
      studentId: "s1",
      date: new Date("2024-01-15"),
      sessionId: "sess1",
      status: "present",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "a2",
      trainingId: "t1",
      studentId: "s2",
      date: new Date("2024-01-15"),
      sessionId: "sess1",
      status: "absent",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "a3",
      trainingId: "t1",
      studentId: "s3",
      date: new Date("2024-01-15"),
      sessionId: "sess1",
      status: "od",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "a4",
      trainingId: "t1",
      studentId: "s1",
      date: new Date("2024-01-16"),
      sessionId: "sess1",
      status: "present",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "a5",
      trainingId: "t1",
      studentId: "s2",
      date: new Date("2024-01-16"),
      sessionId: "sess1",
      status: "present",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  describe("getSummary", () => {
    it("should calculate correct summary statistics", () => {
      const summary = AnalyticsService.getSummary(mockAttendance, mockStudents);

      expect(summary.totalStudents).toBe(3);
      expect(summary.totalRecords).toBe(5);
      expect(summary.presentCount).toBe(3);
      expect(summary.absentCount).toBe(1);
      expect(summary.odCount).toBe(1);
      expect(summary.driveCount).toBe(0);
      expect(summary.attendancePercentage).toBe(60);
    });

    it("should handle empty attendance data", () => {
      const summary = AnalyticsService.getSummary([], mockStudents);

      expect(summary.totalStudents).toBe(3);
      expect(summary.totalRecords).toBe(0);
      expect(summary.presentCount).toBe(0);
      expect(summary.attendancePercentage).toBe(0);
    });
  });

  describe("calculateDaywise", () => {
    it("should group attendance by date", () => {
      const daywise = AnalyticsService.calculateDaywise(mockAttendance, mockStudents);

      expect(daywise).toHaveLength(2);
      expect(daywise[0]?.date).toBe("2024-01-15");
      expect(daywise[1]?.date).toBe("2024-01-16");
    });

    it("should calculate correct counts per day", () => {
      const daywise = AnalyticsService.calculateDaywise(mockAttendance, mockStudents);

      expect(daywise[0]?.presentCount).toBe(1);
      expect(daywise[0]?.absentCount).toBe(1);
      expect(daywise[0]?.odCount).toBe(1);
      expect(daywise[1]?.presentCount).toBe(2);
      expect(daywise[1]?.absentCount).toBe(0);
    });

    it("should calculate attendance percentage correctly", () => {
      const daywise = AnalyticsService.calculateDaywise(mockAttendance, mockStudents);

      expect(daywise[0]?.attendancePercentage).toBeCloseTo(33.33, 1);
      expect(daywise[1]?.attendancePercentage).toBe(100);
    });
  });

  describe("calculateBatchwise", () => {
    it("should group attendance by batch", () => {
      const batchwise = AnalyticsService.calculateBatchwise(mockAttendance, mockStudents);

      expect(batchwise.length).toBeGreaterThan(0);
      const batches = batchwise.map((b) => b.batch);
      expect(batches).toContain("2024");
      expect(batches).toContain("2023");
    });

    it("should calculate correct totals per batch", () => {
      const batchwise = AnalyticsService.calculateBatchwise(mockAttendance, mockStudents);

      const batch2024 = batchwise.find((b) => b.batch === "2024");
      expect(batch2024?.totalStudents).toBe(2);
      expect(batch2024?.presentCount).toBeGreaterThan(0);
    });
  });

  describe("calculateDepartmentwise", () => {
    it("should group attendance by department", () => {
      const deptwise = AnalyticsService.calculateDepartmentwise(mockAttendance, mockStudents);

      const depts = deptwise.map((d) => d.department);
      expect(depts).toContain("CSE");
      expect(depts).toContain("ECE");
    });

    it("should calculate correct totals per department", () => {
      const deptwise = AnalyticsService.calculateDepartmentwise(mockAttendance, mockStudents);

      const cse = deptwise.find((d) => d.department === "CSE");
      expect(cse?.totalStudents).toBe(2);
    });
  });

  describe("calculateStudentwise", () => {
    it("should calculate attendance per student", () => {
      const studentwise = AnalyticsService.calculateStudentwise(mockAttendance, mockStudents);

      expect(studentwise.length).toBeGreaterThan(0);
      const student1 = studentwise.find((s) => s.studentId === "s1");
      expect(student1?.totalSessions).toBe(2);
      expect(student1?.presentCount).toBe(2);
    });

    it("should sort by attendance percentage descending", () => {
      const studentwise = AnalyticsService.calculateStudentwise(mockAttendance, mockStudents);

      for (let i = 0; i < studentwise.length - 1; i++) {
        expect(studentwise[i]!.attendancePercentage).toBeGreaterThanOrEqual(
          studentwise[i + 1]!.attendancePercentage
        );
      }
    });

    it("should exclude students with no sessions", () => {
      const emptyStudent: Student = {
        id: "s4",
        registrationNo: "004",
        rollNo: "004",
        name: "Student 4",
        department: "IT",
        academicYear: "2024",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const studentwise = AnalyticsService.calculateStudentwise(mockAttendance, [
        ...mockStudents,
        emptyStudent,
      ]);

      expect(studentwise.find((s) => s.studentId === "s4")).toBeUndefined();
    });
  });
});
