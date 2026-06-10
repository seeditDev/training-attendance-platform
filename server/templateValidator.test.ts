import { describe, it, expect } from "vitest";
import type { Student, Training } from "../client/src/lib/types";

// Mock implementations of validator functions
function normalizeStatus(status: string): string | null {
  const normalized = status.toLowerCase().trim();
  const statusMap: Record<string, string> = {
    "p": "present",
    "a": "absent",
    "od": "od",
    "d": "drive",
  };
  return statusMap[normalized] || null;
}

function validateAttendanceTemplate(
  data: any[],
  students: Student[],
  training: Training
) {
  const errors: any[] = [];
  const warnings: any[] = [];
  let processedRows = 0;

  if (data.length === 0) {
    errors.push({
      message: "Template is empty",
      severity: "error",
    });
    return { valid: false, errors, warnings, processedRows };
  }

  const firstRow = data[0];
  if (!firstRow || !firstRow.rollno) {
    errors.push({
      message: 'Missing required header "rollno"',
      severity: "error",
    });
  }

  const sessionCount = training.sessions.length;
  const expectedSessionCols = Array.from({ length: sessionCount }, (_, i) => `s${i + 1}`);
  const missingSessionCols = expectedSessionCols.filter((col) => !(col in firstRow));

  if (missingSessionCols.length > 0) {
    errors.push({
      message: `Missing session columns: ${missingSessionCols.join(", ")}`,
      severity: "error",
    });
  }

  const processedRollnos = new Set<string>();

  data.forEach((row, index) => {
    const rowNum = index + 1;
    const rollno = row.rollno?.toString().trim();

    if (!rollno) {
      errors.push({
        row: rowNum,
        field: "rollno",
        message: "Roll number is required",
        severity: "error",
      });
      return;
    }

    if (processedRollnos.has(rollno)) {
      errors.push({
        row: rowNum,
        field: "rollno",
        message: `Duplicate roll number: ${rollno}`,
        severity: "error",
      });
      return;
    }
    processedRollnos.add(rollno);

    const student = students.find((s) => s.registrationNo === rollno);
    if (!student) {
      warnings.push({
        row: rowNum,
        field: "rollno",
        message: `Student with roll number ${rollno} not found. Row will be skipped.`,
        severity: "warning",
      });
      return;
    }

    let hasValidStatus = false;
    expectedSessionCols.forEach((col) => {
      const status = row[col]?.toString().trim();
      if (status) {
        const normalized = normalizeStatus(status);
        if (!normalized) {
          errors.push({
            row: rowNum,
            field: col,
            message: `Invalid status "${status}". Use P (Present), A (Absent), OD, or D (Drive)`,
            severity: "error",
          });
        } else {
          hasValidStatus = true;
        }
      }
    });

    if (hasValidStatus || expectedSessionCols.some((col) => row[col])) {
      processedRows++;
    }
  });

  const valid = errors.length === 0;
  return { valid, errors, warnings, processedRows };
}

describe("Template Validation", () => {
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
      department: "CSE",
      academicYear: "2024",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  const mockTraining: Training = {
    id: "t1",
    name: "Training 1",
    type: "Workshop",
    academicYear: "2024",
    startDate: new Date(),
    endDate: new Date(),
    status: "active",
    sessions: [
      { id: "sess1", name: "S1", order: 1 },
      { id: "sess2", name: "S2", order: 2 },
      { id: "sess3", name: "S3", order: 3 },
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  it("should reject empty template", () => {
    const result = validateAttendanceTemplate([], mockStudents, mockTraining);
    expect(result.valid).toBe(false);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]?.message).toContain("empty");
  });

  it("should reject template missing rollno header", () => {
    const data = [{ s1: "P", s2: "P", s3: "P" }];
    const result = validateAttendanceTemplate(data, mockStudents, mockTraining);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.message.includes("rollno"))).toBe(true);
  });

  it("should reject template missing session columns", () => {
    const data = [{ rollno: "001", s1: "P" }];
    const result = validateAttendanceTemplate(data, mockStudents, mockTraining);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.message.includes("Missing session columns"))).toBe(true);
  });

  it("should reject rows with missing roll number", () => {
    const data = [
      { rollno: "001", s1: "P", s2: "P", s3: "P" },
      { rollno: "", s1: "P", s2: "P", s3: "P" },
    ];
    const result = validateAttendanceTemplate(data, mockStudents, mockTraining);
    expect(result.errors.some((e) => e.row === 2 && e.message.includes("required"))).toBe(true);
  });

  it("should reject duplicate roll numbers", () => {
    const data = [
      { rollno: "001", s1: "P", s2: "P", s3: "P" },
      { rollno: "001", s1: "P", s2: "P", s3: "P" },
    ];
    const result = validateAttendanceTemplate(data, mockStudents, mockTraining);
    expect(result.errors.some((e) => e.row === 2 && e.message.includes("Duplicate"))).toBe(true);
  });

  it("should warn for unknown roll numbers", () => {
    const data = [
      { rollno: "001", s1: "P", s2: "P", s3: "P" },
      { rollno: "999", s1: "P", s2: "P", s3: "P" },
    ];
    const result = validateAttendanceTemplate(data, mockStudents, mockTraining);
    expect(result.warnings.some((w) => w.row === 2 && w.message.includes("not found"))).toBe(true);
  });

  it("should reject invalid status values", () => {
    const data = [
      { rollno: "001", s1: "P", s2: "INVALID", s3: "P" },
    ];
    const result = validateAttendanceTemplate(data, mockStudents, mockTraining);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.field === "s2" && e.message.includes("Invalid status"))).toBe(true);
  });

  it("should accept valid template with all statuses", () => {
    const data = [
      { rollno: "001", s1: "P", s2: "A", s3: "OD" },
      { rollno: "002", s1: "D", s2: "P", s3: "A" },
    ];
    const result = validateAttendanceTemplate(data, mockStudents, mockTraining);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
    expect(result.processedRows).toBe(2);
  });

  it("should accept lowercase status values", () => {
    const data = [
      { rollno: "001", s1: "p", s2: "a", s3: "od" },
    ];
    const result = validateAttendanceTemplate(data, mockStudents, mockTraining);
    expect(result.valid).toBe(true);
  });

  it("should accept mixed case status values", () => {
    const data = [
      { rollno: "001", s1: "P", s2: "A", s3: "OD" },
      { rollno: "002", s1: "p", s2: "a", s3: "od" },
    ];
    const result = validateAttendanceTemplate(data, mockStudents, mockTraining);
    expect(result.valid).toBe(true);
  });

  it("should normalize status abbreviations correctly", () => {
    expect(normalizeStatus("P")).toBe("present");
    expect(normalizeStatus("p")).toBe("present");
    expect(normalizeStatus("A")).toBe("absent");
    expect(normalizeStatus("a")).toBe("absent");
    expect(normalizeStatus("OD")).toBe("od");
    expect(normalizeStatus("od")).toBe("od");
    expect(normalizeStatus("D")).toBe("drive");
    expect(normalizeStatus("d")).toBe("drive");
    expect(normalizeStatus("INVALID")).toBeNull();
  });

  it("should handle whitespace in status values", () => {
    expect(normalizeStatus("  P  ")).toBe("present");
    expect(normalizeStatus("  OD  ")).toBe("od");
  });
});
