import * as XLSX from "xlsx";
import { Student, Attendance, Training } from "./types";

/**
 * Export students to Excel
 */
export const exportStudentsToExcel = (students: Student[], filename: string = "students.xlsx") => {
  const data = students.map((student) => ({
    "Registration No": student.registrationNo,
    "Roll No": student.rollNo,
    Name: student.name,
    Department: student.department,
    "Academic Year": student.academicYear,
    Batch: student.batch || "",
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Students");

  // Set column widths
  worksheet["!cols"] = [
    { wch: 18 },
    { wch: 12 },
    { wch: 20 },
    { wch: 15 },
    { wch: 15 },
    { wch: 15 },
  ];

  XLSX.writeFile(workbook, filename);
};

/**
 * Import students from Excel
 */
export const importStudentsFromExcel = (file: File): Promise<Omit<Student, "id" | "createdAt" | "updatedAt">[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: "binary" });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        const students = jsonData.map((row: any) => ({
          registrationNo: row["Registration No"] || "",
          rollNo: row["Roll No"] || "",
          name: row["Name"] || "",
          department: row["Department"] || "",
          academicYear: row["Academic Year"] || "",
          batch: row["Batch"] || "",
        }));

        resolve(students);
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => {
      reject(new Error("Failed to read file"));
    };

    reader.readAsBinaryString(file);
  });
};

/**
 * Export attendance to Excel
 */
export const exportAttendanceToExcel = (
  training: Training,
  students: Student[],
  attendance: Attendance[],
  filename: string = "attendance.xlsx"
) => {
  const data: any[] = [];

  // Title row
  data.push({
    "Training": training.name,
    "Type": training.type,
    "Academic Year": training.academicYear,
  });
  data.push({}); // Empty row

  // Headers
  const headers: any = {
    "Registration No": "Registration No",
    "Roll No": "Roll No",
    Name: "Name",
    Department: "Department",
  };

  // Add session headers
  training.sessions.forEach((session) => {
    headers[session.name] = session.name;
  });

  data.push(headers);

  // Add student data
  students.forEach((student) => {
    const row: any = {
      "Registration No": student.registrationNo,
      "Roll No": student.rollNo,
      Name: student.name,
      Department: student.department,
    };

    training.sessions.forEach((session) => {
      const studentAttendance = attendance.filter(
        (a) => a.studentId === student.id && a.sessionId === session.id
      );
      row[session.name] = studentAttendance.map((a) => a.status).join(", ") || "-";
    });

    data.push(row);
  });

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Attendance");

  XLSX.writeFile(workbook, filename);
};

/**
 * Generate attendance template Excel
 */
export const generateAttendanceTemplate = (
  training: Training,
  students: Student[],
  date: Date,
  filename: string = "attendance_template.xlsx"
) => {
  const dateStr = date.toISOString().split("T")[0];
  const data: any[] = [];

  // Headers
  const headers: any = {
    "Registration No": "Registration No",
    "Roll No": "Roll No",
    Name: "Name",
    Department: "Department",
  };

  training.sessions.forEach((session) => {
    headers[session.name] = session.name;
  });

  data.push(headers);

  // Add student rows with empty attendance
  students.forEach((student) => {
    const row: any = {
      "Registration No": student.registrationNo,
      "Roll No": student.rollNo,
      Name: student.name,
      Department: student.department,
    };

    training.sessions.forEach(() => {
      row[`Session`] = ""; // Empty for user to fill
    });

    data.push(row);
  });

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, `Attendance_${dateStr}`);

  XLSX.writeFile(workbook, filename);
};
