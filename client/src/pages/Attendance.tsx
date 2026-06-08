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
import { Calendar, Save } from "lucide-react";
import { toast } from "sonner";

export default function Attendance() {
  const { isAuthenticated } = useAuthStore();
  const [, navigate] = useLocation();
  const [trainings, setTrainings] = useState<Training[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedTraining, setSelectedTraining] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [attendanceRecords, setAttendanceRecords] = useState<
    Map<string, Map<string, string>>
  >(new Map());
  const [saving, setSaving] = useState(false);

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
      records.forEach((record) => {
        if (!recordsMap.has(record.studentId)) {
          recordsMap.set(record.studentId, new Map());
        }
        recordsMap.get(record.studentId)!.set(record.sessionId, record.status);
      });

      setAttendanceRecords(recordsMap);
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

  const handleSave = async () => {
    if (!selectedTraining || !selectedDate) {
      toast.error("Please select training and date");
      return;
    }

    try {
      setSaving(true);
      const training = trainings.find((t) => t.id === selectedTraining);
      if (!training) return;

      const recordsToSave: AttendanceRecord[] = [];
      attendanceRecords.forEach((sessionMap, studentId) => {
        sessionMap.forEach((status, sessionId) => {
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

        {/* Attendance Sheet */}
        {selectedTrainingData && (
          <Card className="bg-white border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-200">
              <h2 className="text-lg font-bold text-slate-900">
                {selectedTrainingData.name} - {selectedDate}
              </h2>
              <p className="text-sm text-slate-600 mt-1">
                {selectedTrainingData.sessions.length} sessions configured
              </p>
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
                        {selectedTrainingData.sessions.map((session) => (
                          <td
                            key={`${student.id}-${session.id}`}
                            className="px-4 py-4 text-center"
                          >
                            <select
                              value={
                                attendanceRecords
                                  .get(student.id)
                                  ?.get(session.id) || ""
                              }
                              onChange={(e) =>
                                handleAttendanceChange(
                                  student.id,
                                  session.id,
                                  e.target.value
                                )
                              }
                              className="px-2 py-1 border border-slate-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="">-</option>
                              <option value="present">P</option>
                              <option value="absent">A</option>
                              <option value="od">OD</option>
                              <option value="drive">Drive</option>
                            </select>
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
      </div>
    </DashboardLayout>
  );
}
