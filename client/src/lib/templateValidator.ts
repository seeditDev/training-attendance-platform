import { Student, Training } from "./types";

export interface TemplateValidationError {
  row?: number;
  field?: string;
  message: string;
  severity: "error" | "warning";
}

export interface TemplateValidationResult {
  valid: boolean;
  errors: TemplateValidationError[];
  warnings: TemplateValidationError[];
  processedRows: number;
}

const VALID_STATUSES = ["p", "a", "od", "d"];
const STATUS_MAP: Record<string, string> = {
  "p": "present",
  "a": "absent",
  "od": "od",
  "d": "drive",
};

export function normalizeStatus(status: string): string | null {
  const normalized = status.toLowerCase().trim();
  if (VALID_STATUSES.includes(normalized)) {
    return STATUS_MAP[normalized];
  }
  return null;
}

export function validateAttendanceTemplate(
  data: any[],
  students: Student[],
  training: Training
): TemplateValidationResult {
  const errors: TemplateValidationError[] = [];
  const warnings: TemplateValidationError[] = [];
  let processedRows = 0;

  // Validate headers
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

  // Check for session columns
  const sessionCount = training.sessions.length;
  const expectedSessionCols = Array.from({ length: sessionCount }, (_, i) => `s${i + 1}`);
  const missingSessionCols = expectedSessionCols.filter((col) => !(col in firstRow));

  if (missingSessionCols.length > 0) {
    errors.push({
      message: `Missing session columns: ${missingSessionCols.join(", ")}`,
      severity: "error",
    });
  }

  // Validate each row
  const processedRollnos = new Set<string>();

  data.forEach((row, index) => {
    const rowNum = index + 1;

    // Check for rollno
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

    // Check for duplicate roll numbers
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

    // Check if student exists
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

    // Validate status columns
    let hasValidStatus = false;
    expectedSessionCols.forEach((col, sessionIndex) => {
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

export function parseAndNormalizeTemplate(
  data: any[],
  students: Student[],
  training: Training
): Map<string, Map<string, string>> {
  const records = new Map<string, Map<string, string>>();
  const sessionCount = training.sessions.length;
  const expectedSessionCols = Array.from({ length: sessionCount }, (_, i) => `s${i + 1}`);

  data.forEach((row) => {
    const rollno = row.rollno?.toString().trim();
    const student = students.find((s) => s.registrationNo === rollno);

    if (student) {
      if (!records.has(student.id)) {
        records.set(student.id, new Map());
      }

      training.sessions.forEach((session, index) => {
        const colName = expectedSessionCols[index];
        const statusValue = row[colName]?.toString().trim();
        const normalized = statusValue ? normalizeStatus(statusValue) : "present";

        if (normalized) {
          records.get(student.id)!.set(session.id, normalized);
        }
      });
    }
  });

  return records;
}
