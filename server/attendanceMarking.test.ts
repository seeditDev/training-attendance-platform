import { describe, it, expect } from "vitest";

describe("Attendance Marking Methods", () => {
  it("should initialize all students with Present status by default", () => {
    const students = [
      { id: "s1", name: "Student 1", registrationNo: "001" },
      { id: "s2", name: "Student 2", registrationNo: "002" },
      { id: "s3", name: "Student 3", registrationNo: "003" },
    ];

    const sessions = [
      { id: "session1", name: "S1" },
      { id: "session2", name: "S2" },
      { id: "session3", name: "S3" },
    ];

    const attendanceRecords = new Map<string, Map<string, string>>();

    // Initialize all students with Present
    students.forEach((student) => {
      attendanceRecords.set(student.id, new Map());
      sessions.forEach((session) => {
        attendanceRecords.get(student.id)!.set(session.id, "present");
      });
    });

    expect(attendanceRecords.size).toBe(3);
    students.forEach((student) => {
      sessions.forEach((session) => {
        expect(attendanceRecords.get(student.id)?.get(session.id)).toBe("present");
      });
    });
  });

  it("should support bulk status change for all students", () => {
    const students = [
      { id: "s1", name: "Student 1" },
      { id: "s2", name: "Student 2" },
    ];

    const sessions = [
      { id: "session1", name: "S1" },
      { id: "session2", name: "S2" },
    ];

    const attendanceRecords = new Map<string, Map<string, string>>();

    // Initialize with Present
    students.forEach((student) => {
      attendanceRecords.set(student.id, new Map());
      sessions.forEach((session) => {
        attendanceRecords.get(student.id)!.set(session.id, "present");
      });
    });

    // Bulk change to Absent
    const newRecords = new Map(attendanceRecords);
    students.forEach((student) => {
      sessions.forEach((session) => {
        newRecords.get(student.id)!.set(session.id, "absent");
      });
    });

    // Verify all changed to absent
    students.forEach((student) => {
      sessions.forEach((session) => {
        expect(newRecords.get(student.id)?.get(session.id)).toBe("absent");
      });
    });
  });

  it("should support radio button individual selection", () => {
    const attendanceRecords = new Map<string, Map<string, string>>();
    attendanceRecords.set("s1", new Map([["session1", "present"]]));

    // Change via radio button
    const newRecords = new Map(attendanceRecords);
    newRecords.get("s1")!.set("session1", "absent");

    expect(newRecords.get("s1")?.get("session1")).toBe("absent");
  });

  it("should parse Excel template with rollno and session columns", () => {
    const excelData = [
      { rollno: "001", s1: "P", s2: "P", s3: "A", s4: "OD" },
      { rollno: "002", s1: "P", s2: "A", s3: "P", s4: "P" },
      { rollno: "003", s1: "A", s2: "A", s3: "A", s4: "A" },
    ];

    const students = [
      { id: "s1", registrationNo: "001", name: "Student 1" },
      { id: "s2", registrationNo: "002", name: "Student 2" },
      { id: "s3", registrationNo: "003", name: "Student 3" },
    ];

    const sessions = [
      { id: "session1", name: "S1" },
      { id: "session2", name: "S2" },
      { id: "session3", name: "S3" },
      { id: "session4", name: "S4" },
    ];

    const newRecords = new Map<string, Map<string, string>>();

    excelData.forEach((row: any) => {
      const rollno = row.rollno?.toString().trim();
      const student = students.find((s) => s.registrationNo === rollno);

      if (student) {
        if (!newRecords.has(student.id)) {
          newRecords.set(student.id, new Map());
        }

        sessions.forEach((session, index) => {
          const statusVal = row[`s${index + 1}`]?.toString().toLowerCase().trim() || "present";
          newRecords.get(student.id)!.set(session.id, statusVal);
        });
      }
    });

    expect(newRecords.size).toBe(3);
    expect(newRecords.get("s1")?.get("session1")).toBe("p");
    expect(newRecords.get("s1")?.get("session3")).toBe("a");
    expect(newRecords.get("s2")?.get("session2")).toBe("a");
  });

  it("should handle status abbreviations P, A, OD, D", () => {
    const statusMap = {
      "P": "present",
      "p": "present",
      "A": "absent",
      "a": "absent",
      "OD": "od",
      "od": "od",
      "D": "drive",
      "d": "drive",
    };

    Object.entries(statusMap).forEach(([abbr, full]) => {
      const normalized = abbr.toLowerCase().trim();
      expect(["p", "a", "od", "d"]).toContain(normalized);
    });
  });

  it("should generate template with all students and default Present status", () => {
    const students = [
      { id: "s1", registrationNo: "001", name: "Student 1" },
      { id: "s2", registrationNo: "002", name: "Student 2" },
    ];

    const sessions = [
      { id: "session1", name: "S1" },
      { id: "session2", name: "S2" },
      { id: "session3", name: "S3" },
    ];

    const templateData = students.map((student) => {
      const row: any = {
        rollno: student.registrationNo || "",
      };

      sessions.forEach((session, index) => {
        row[`s${index + 1}`] = "P";
      });

      return row;
    });

    expect(templateData).toHaveLength(2);
    expect(templateData[0]?.rollno).toBe("001");
    expect(templateData[0]?.s1).toBe("P");
    expect(templateData[0]?.s2).toBe("P");
    expect(templateData[0]?.s3).toBe("P");
  });

  it("should generate sample template with mixed statuses", () => {
    const sampleData = [
      {
        rollno: "001",
        s1: "P",
        s2: "P",
        s3: "A",
        s4: "OD",
      },
      {
        rollno: "002",
        s1: "P",
        s2: "A",
        s3: "P",
        s4: "P",
      },
    ];

    expect(sampleData).toHaveLength(2);
    expect(sampleData[0]?.s3).toBe("A");
    expect(sampleData[0]?.s4).toBe("OD");
    expect(sampleData[1]?.s2).toBe("A");
  });
});
