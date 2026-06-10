import { useState, useEffect } from "react";
import { useAuthStore } from "@/store/authStore";
import { useLocation } from "wouter";
import DashboardLayout from "@/components/DashboardLayoutCustom";
import {
  trainingService,
  studentService,
  attendanceService,
} from "@/lib/firebaseService";
import { Training, Student, Attendance as AttendanceRecord } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Calendar, Save, Download, Upload, AlertCircle, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import {
  validateAttendanceTemplate,
  parseAndNormalizeTemplate,
  type TemplateValidationError,
} from "@/lib/templateValidator";

export default function Attendance() {
  const { isAuthenticated } = useAuthStore();
  const [, navigate] = useLocation();
  const [trainings, setTrainings] = useState<Training[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [markingMethod, setMarkingMethod] = useState<"radio" | "import">("radio");

  const [selectedTraining, setSelectedTraining] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [attendanceRecords, setAttendanceRecords] = useState<
    Map<string, Map<string, string>>
  >(new Map());
  const [saving, setSaving] = useState(false);
  const [validationErrors, setValidationErrors] = useState<TemplateValidationError[]>([]);
  const [validationWarnings, setValidationWarnings] = useState<TemplateValidationError[]>([]);
  const [bulkSelectStates, setBulkSelectStates] = useState<Record<string, boolean>>({
    present: false,
    absent: false,
    od: false,
    drive: false,
  });

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/");
      return;
    }
    loadData();
  }, [isAuthenticated, navigate]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [trainingsData, studentsData] = await Promise.all([
        trainingService.getAll(),
        studentService.getAll(),
      ]);
      setTrainings(trainingsData);
      setStudents(studentsData);
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const loadAttendance = async () => {
    if (!selectedTraining || !selectedDate) return;

    try {
      const records = await attendanceService.getByDateAndTraining(
        selectedTraining,
        new Date(selectedDate)
      );

      const recordsMap = new Map<string, Map<string, string>>();
      const selectedTrainingData = trainings.find((t) => t.id === selectedTraining);

      // Initialize all students with "present" as default
      students.forEach((student) => {
        recordsMap.set(student.id, new Map());
        selectedTrainingData?.sessions.forEach((session) => {
          recordsMap.get(student.id)!.set(session.id, "present");
        });
      });

      // Override with existing records
      records.forEach((record) => {
        if (!recordsMap.has(record.studentId)) {
          recordsMap.set(record.studentId, new Map());
        }
        recordsMap.get(record.studentId)!.set(record.sessionId, record.status);
      });

      setAttendanceRecords(recordsMap);
      setBulkSelectStates({ present: false, absent: false, od: false, drive: false });
    } catch (error) {
      console.error("Error loading attendance:", error);
      toast.error("Failed to load attendance");
    }
  };

  const handleAttendanceChange = (
    studentId: string,
    sessionId: string,
    status: string
  ) => {
    const newRecords = new Map(attendanceRecords);
    if (!newRecords.has(studentId)) {
      newRecords.set(studentId, new Map());
    }
    newRecords.get(studentId)!.set(sessionId, status);
    setAttendanceRecords(newRecords);
  };

  const handleBulkCheckboxChange = (status: string) => {
    const newStates = { ...bulkSelectStates, [status]: !bulkSelectStates[status as keyof typeof bulkSelectStates] };
    setBulkSelectStates(newStates);

    // If any checkbox is checked, apply that status to all students
    const checkedStatuses = Object.entries(newStates)
      .filter(([, checked]) => checked)
      .map(([status]) => status);

    if (checkedStatuses.length === 0) {
      return;
    }

    const selectedTrainingData = trainings.find((t) => t.id === selectedTraining);
    if (!selectedTrainingData) return;

    const newRecords = new Map(attendanceRecords);
    const statusToApply = checkedStatuses[0]; // Apply first checked status

    students.forEach((student) => {
      if (!newRecords.has(student.id)) {
        newRecords.set(student.id, new Map());
      }
      selectedTrainingData.sessions.forEach((session) => {
        newRecords.get(student.id)!.set(session.id, statusToApply);
      });
    });

    setAttendanceRecords(newRecords);
    toast.success(`All students marked as ${statusToApply.toUpperCase()}`);

    // Reset checkboxes after applying
    setBulkSelectStates({ present: false, absent: false, od: false, drive: false });
  };

  const handleSave = async () => {
    if (!selectedTraining || !selectedDate) {
      toast.error("Please select training and date");
      return;
    }

    try {
      setSaving(true);
      const recordsToSave: AttendanceRecord[] = [];
      attendanceRecords.forEach((sessionMap, studentId) => {
        sessionMap.forEach((status, sessionId) => {
          if (status) {
            recordsToSave.push({
              id: `${studentId}-${selectedTraining}-${selectedDate}-${sessionId}`,
              trainingId: selectedTraining,
              studentId,
              date: new Date(selectedDate),
              sessionId,
              status: status as any,
              createdAt: new Date(),
              updatedAt: new Date(),
            });
          }
        });
      });

      if (recordsToSave.length > 0) {
        await attendanceService.bulkUpsert(recordsToSave);
        toast.success("Attendance saved successfully");
      } else {
        toast.info("No attendance records to save");
      }
    } catch (error) {
      console.error("Error saving attendance:", error);
      toast.error("Failed to save attendance");
    } finally {
      setSaving(false);
    }
  };

  const downloadTemplate = () => {
    const selectedTrainingData = trainings.find((t) => t.id === selectedTraining);
    if (!selectedTrainingData) {
      toast.error("Please select a training first");
      return;
    }

    const templateData = students.map((student) => {
      const row: any = {
        rollno: student.registrationNo || "",
      };

      selectedTrainingData.sessions.forEach((session, index) => {
        row[`s${index + 1}`] = "P";
      });

      return row;
    });

    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Attendance");
    XLSX.writeFile(
      wb,
      `attendance_template_${selectedTrainingData.name}_${selectedDate}.xlsx`
    );
    toast.success("Template downloaded");
  };

  const downloadSampleTemplate = () => {
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

    const ws = XLSX.utils.json_to_sheet(sampleData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sample");
    XLSX.writeFile(wb, "attendance_sample_template.xlsx");
    toast.success("Sample template downloaded");
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const data = event.target?.result;
          const workbook = XLSX.read(data, { type: "binary" });
          const worksheet = workbook.Sheets[workbook.SheetNames[0]];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);
          const selectedTrainingData = trainings.find((t) => t.id === selectedTraining);

          if (!selectedTrainingData) {
            toast.error("Please select a training first");
            return;
          }

          // Validate template
          const validation = validateAttendanceTemplate(
            jsonData as any[],
            students,
            selectedTrainingData
          );

          setValidationErrors(validation.errors);
          setValidationWarnings(validation.warnings);

          if (!validation.valid) {
            toast.error(`Template validation failed: ${validation.errors.length} error(s)`);
            return;
          }

          // Parse and normalize template
          const newRecords = parseAndNormalizeTemplate(
            jsonData as any[],
            students,
            selectedTrainingData
          );

          setAttendanceRecords(newRecords);
          toast.success(`Imported ${newRecords.size} student records`);
          setValidationErrors([]);
          setValidationWarnings([]);
        } catch (error) {
          console.error("Error uploading file:", error);
          toast.error("Failed to parse attendance file");
        }
      };
      reader.readAsBinaryString(file);
    } catch (error) {
      console.error("Error reading file:", error);
      toast.error("Failed to read file");
    }
  };

  const selectedTrainingData = trainings.find((t) => t.id === selectedTraining);

  if (!isAuthenticated) {
    return null;
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Mark Attendance</h1>
          <p className="text-slate-600 mt-2">
            Record session-wise attendance for students
          </p>
        </div>

        {/* Selection Panel */}
        <Card className="bg-white border-slate-200 p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Select Training
              </label>
              <select
                value={selectedTraining}
                onChange={(e) => {
                  setSelectedTraining(e.target.value);
                  setAttendanceRecords(new Map());
                }}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Choose a training...</option>
                {trainings.map((training) => (
                  <option key={training.id} value={training.id}>
                    {training.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Select Date
                </div>
              </label>
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => {
                  setSelectedDate(e.target.value);
                  setAttendanceRecords(new Map());
                }}
              />
            </div>

            <div className="flex items-end">
              <Button
                onClick={loadAttendance}
                disabled={!selectedTraining || !selectedDate || loading}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white"
              >
                Load Attendance
              </Button>
            </div>
          </div>
        </Card>

        {/* Marking Method Tabs */}
        {selectedTrainingData && (
          <div className="flex gap-2 border-b border-slate-200">
            <button
              onClick={() => {
                setMarkingMethod("radio");
                setValidationErrors([]);
                setValidationWarnings([]);
              }}
              className={`px-4 py-2 font-medium transition-colors ${
                markingMethod === "radio"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Manual Entry (Radio Buttons)
            </button>
            <button
              onClick={() => setMarkingMethod("import")}
              className={`px-4 py-2 font-medium transition-colors ${
                markingMethod === "import"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Import from Excel
            </button>
          </div>
        )}

        {/* Attendance Sheet - Radio Button Method */}
        {selectedTrainingData && markingMethod === "radio" && (
          <Card className="bg-white border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-200">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    {selectedTrainingData.name} - {selectedDate}
                  </h2>
                  <p className="text-sm text-slate-600 mt-1">
                    {selectedTrainingData.sessions.length} sessions configured
                  </p>
                </div>
              </div>

              {/* Bulk Select Checkboxes */}
              <div className="space-y-3">
                <p className="text-sm font-medium text-slate-700">Select All:</p>
                <div className="flex flex-wrap gap-4">
                  {[
                    { value: "present", label: "Present (P)", color: "bg-green-500 hover:bg-green-600" },
                    { value: "absent", label: "Absent (A)", color: "bg-red-500 hover:bg-red-600" },
                    { value: "od", label: "OD", color: "bg-yellow-500 hover:bg-yellow-600" },
                    { value: "drive", label: "Drive (D)", color: "bg-purple-500 hover:bg-purple-600" },
                  ].map((option) => (
                    <label key={option.value} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={bulkSelectStates[option.value as keyof typeof bulkSelectStates]}
                        onChange={() => handleBulkCheckboxChange(option.value)}
                        className="w-4 h-4 rounded"
                      />
                      <span className="text-sm font-medium text-slate-700">{option.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {students.length === 0 ? (
              <div className="p-12 text-center">
                <p className="text-slate-600">
                  No students available. Please add students first.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 sticky left-0 bg-slate-50">
                        Student Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700">
                        Reg No
                      </th>
                      {selectedTrainingData.sessions.map((session) => (
                        <th
                          key={session.id}
                          className="px-4 py-3 text-center text-xs font-semibold text-slate-700"
                        >
                          {session.name}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {students.map((student) => (
                      <tr key={student.id} className="hover:bg-slate-50">
                        <td className="px-6 py-4 text-sm text-slate-900 font-medium sticky left-0 bg-white hover:bg-slate-50">
                          {student.name}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600">
                          {student.registrationNo}
                        </td>
                        {selectedTrainingData.sessions.map((session) => (
                          <td
                            key={`${student.id}-${session.id}`}
                            className="px-4 py-4 text-center"
                          >
                            <div className="flex justify-center gap-2">
                              {["present", "absent", "od", "drive"].map((status) => (
                                <label
                                  key={status}
                                  className="flex items-center gap-1 cursor-pointer"
                                >
                                  <input
                                    type="radio"
                                    name={`${student.id}-${session.id}`}
                                    value={status}
                                    checked={
                                      attendanceRecords
                                        .get(student.id)
                                        ?.get(session.id) === status
                                    }
                                    onChange={(e) =>
                                      handleAttendanceChange(
                                        student.id,
                                        session.id,
                                        e.target.value
                                      )
                                    }
                                    className="w-4 h-4"
                                  />
                                  <span className="text-xs font-medium">
                                    {status === "present"
                                      ? "P"
                                      : status === "absent"
                                      ? "A"
                                      : status === "od"
                                      ? "OD"
                                      : "D"}
                                  </span>
                                </label>
                              ))}
                            </div>
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="p-6 border-t border-slate-200 flex justify-end gap-3">
              <Button variant="outline">Cancel</Button>
              <Button
                onClick={handleSave}
                disabled={saving || attendanceRecords.size === 0}
                className="bg-green-500 hover:bg-green-600 text-white"
              >
                <Save className="w-4 h-4 mr-2" />
                {saving ? "Saving..." : "Save Attendance"}
              </Button>
            </div>
          </Card>
        )}

        {/* Import Method */}
        {selectedTrainingData && markingMethod === "import" && (
          <div className="space-y-6">
            {/* Template Download Section */}
            <Card className="bg-blue-50 border-blue-200 p-6">
              <h3 className="text-lg font-bold text-slate-900 mb-4">
                Download Template
              </h3>
              <p className="text-slate-600 mb-4">
                Download a pre-filled template with all students for this training and date.
                Format: rollno, s1, s2, s3, s4 (where s1, s2, etc. are sessions)
              </p>
              <div className="flex gap-3">
                <Button
                  onClick={downloadTemplate}
                  className="bg-blue-500 hover:bg-blue-600 text-white"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download Filled Template
                </Button>
                <Button
                  onClick={downloadSampleTemplate}
                  variant="outline"
                  className="border-blue-300 text-blue-700 hover:bg-blue-50"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download Sample Template
                </Button>
              </div>
            </Card>

            {/* Validation Errors */}
            {validationErrors.length > 0 && (
              <Card className="bg-red-50 border-red-200 p-4">
                <div className="flex gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-red-900 mb-2">Validation Errors</h4>
                    <ul className="space-y-1">
                      {validationErrors.map((error, idx) => (
                        <li key={idx} className="text-sm text-red-800">
                          {error.row && <span className="font-medium">Row {error.row}: </span>}
                          {error.field && <span className="font-medium">[{error.field}] </span>}
                          {error.message}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </Card>
            )}

            {/* Validation Warnings */}
            {validationWarnings.length > 0 && (
              <Card className="bg-yellow-50 border-yellow-200 p-4">
                <div className="flex gap-3">
                  <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-yellow-900 mb-2">Warnings</h4>
                    <ul className="space-y-1">
                      {validationWarnings.map((warning, idx) => (
                        <li key={idx} className="text-sm text-yellow-800">
                          {warning.row && <span className="font-medium">Row {warning.row}: </span>}
                          {warning.field && <span className="font-medium">[{warning.field}] </span>}
                          {warning.message}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </Card>
            )}

            {/* File Upload Section */}
            <Card className="bg-white border-slate-200 p-6">
              <h3 className="text-lg font-bold text-slate-900 mb-4">
                Upload Attendance File
              </h3>
              <p className="text-slate-600 mb-4">
                Upload an Excel file with attendance data. Use the template format: rollno, s1, s2, s3, s4
              </p>

              <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center">
                <Upload className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                <input
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="file-upload"
                />
                <label htmlFor="file-upload" className="cursor-pointer">
                  <p className="text-slate-900 font-medium">
                    Click to upload or drag and drop
                  </p>
                  <p className="text-slate-600 text-sm">
                    Excel (.xlsx, .xls) or CSV files
                  </p>
                </label>
              </div>

              {attendanceRecords.size > 0 && validationErrors.length === 0 && (
                <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg flex gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <p className="text-green-700 font-medium">
                    ✓ {attendanceRecords.size} students loaded successfully
                  </p>
                </div>
              )}

              <div className="mt-6 flex justify-end gap-3">
                <Button variant="outline">Cancel</Button>
                <Button
                  onClick={handleSave}
                  disabled={saving || attendanceRecords.size === 0}
                  className="bg-green-500 hover:bg-green-600 text-white"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {saving ? "Saving..." : "Save Attendance"}
                </Button>
              </div>
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
