import { useState, useEffect } from "react";
import { useAuthStore } from "@/store/authStore";
import { useLocation } from "wouter";
import DashboardLayout from "@/components/DashboardLayoutCustom";
import {
  trainingService,
  studentService,
  attendanceService,
} from "@/lib/firebaseService";
import { Training, Student, Attendance } from "@/lib/types";
import { AnalyticsService } from "@/lib/analyticsService";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { Download, Calendar } from "lucide-react";
import { toast } from "sonner";
import * as XLSX from "xlsx";

export default function AnalyticsDashboard() {
  const { isAuthenticated } = useAuthStore();
  const [, navigate] = useLocation();
  const [trainings, setTrainings] = useState<Training[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedTraining, setSelectedTraining] = useState<string>("");
  const [startDate, setStartDate] = useState(
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  );
  const [endDate, setEndDate] = useState(new Date().toISOString().split("T")[0]);

  const [attendanceData, setAttendanceData] = useState<Attendance[]>([]);
  const [activeTab, setActiveTab] = useState<
    "daywise" | "weekwise" | "batchwise" | "departmentwise" | "studentwise" | "sessionwise"
  >("daywise");

  const COLORS = ["#10b981", "#ef4444", "#f59e0b", "#8b5cf6"];
  const STATUS_COLORS: Record<string, string> = {
    present: "#10b981",
    absent: "#ef4444",
    od: "#f59e0b",
    drive: "#8b5cf6",
  };

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
    if (!selectedTraining) {
      toast.error("Please select a training");
      return;
    }

    try {
      const records = await attendanceService.getByTraining(selectedTraining);
      const filtered = records.filter((r) => {
        const recordDate = new Date(r.date).toISOString().split("T")[0];
        return recordDate >= startDate && recordDate <= endDate;
      });
      setAttendanceData(filtered);
      toast.success(`Loaded ${filtered.length} attendance records`);
    } catch (error) {
      console.error("Error loading attendance:", error);
      toast.error("Failed to load attendance data");
    }
  };

  const selectedTrainingData = trainings.find((t) => t.id === selectedTraining);
  const summary = AnalyticsService.getSummary(attendanceData, students);
  const daywiseData = AnalyticsService.calculateDaywise(attendanceData, students);
  const weekwiseData = AnalyticsService.calculateWeekwise(attendanceData, students);
  const batchwiseData = AnalyticsService.calculateBatchwise(attendanceData, students);
  const departmentwiseData = AnalyticsService.calculateDepartmentwise(attendanceData, students);
  const studentwiseData = AnalyticsService.calculateStudentwise(attendanceData, students);
  const sessionwiseData = AnalyticsService.calculateSessionwise(
    attendanceData,
    selectedTrainingData || { sessions: [] } as any
  );

  const exportToExcel = (data: any[], filename: string) => {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Analytics");
    XLSX.writeFile(wb, `${filename}_${new Date().toISOString().split("T")[0]}.xlsx`);
    toast.success("Exported to Excel");
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Analytics Dashboard</h1>
          <p className="text-slate-600 mt-2">
            Comprehensive attendance analysis and trends
          </p>
        </div>

        {/* Filters */}
        <Card className="bg-white border-slate-200 p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Select Training
              </label>
              <select
                value={selectedTraining}
                onChange={(e) => {
                  setSelectedTraining(e.target.value);
                  setAttendanceData([]);
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
                Start Date
              </label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                End Date
              </label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>

            <div className="flex items-end">
              <Button
                onClick={loadAttendance}
                disabled={!selectedTraining || loading}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white"
              >
                <Calendar className="w-4 h-4 mr-2" />
                Load Data
              </Button>
            </div>
          </div>
        </Card>

        {/* Summary Cards */}
        {attendanceData.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 p-6">
              <p className="text-sm font-medium text-green-700">Present</p>
              <p className="text-3xl font-bold text-green-900 mt-2">{summary.presentCount}</p>
              <p className="text-xs text-green-600 mt-1">
                {Math.round((summary.presentCount / summary.totalRecords) * 100) || 0}%
              </p>
            </Card>

            <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200 p-6">
              <p className="text-sm font-medium text-red-700">Absent</p>
              <p className="text-3xl font-bold text-red-900 mt-2">{summary.absentCount}</p>
              <p className="text-xs text-red-600 mt-1">
                {Math.round((summary.absentCount / summary.totalRecords) * 100) || 0}%
              </p>
            </Card>

            <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200 p-6">
              <p className="text-sm font-medium text-yellow-700">OD</p>
              <p className="text-3xl font-bold text-yellow-900 mt-2">{summary.odCount}</p>
              <p className="text-xs text-yellow-600 mt-1">
                {Math.round((summary.odCount / summary.totalRecords) * 100) || 0}%
              </p>
            </Card>

            <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 p-6">
              <p className="text-sm font-medium text-purple-700">Drive</p>
              <p className="text-3xl font-bold text-purple-900 mt-2">{summary.driveCount}</p>
              <p className="text-xs text-purple-600 mt-1">
                {Math.round((summary.driveCount / summary.totalRecords) * 100) || 0}%
              </p>
            </Card>

            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 p-6">
              <p className="text-sm font-medium text-blue-700">Avg Attendance</p>
              <p className="text-3xl font-bold text-blue-900 mt-2">
                {summary.attendancePercentage.toFixed(1)}%
              </p>
              <p className="text-xs text-blue-600 mt-1">{summary.totalRecords} records</p>
            </Card>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 border-b border-slate-200 overflow-x-auto">
          {[
            { id: "daywise", label: "Daywise" },
            { id: "weekwise", label: "Weekwise" },
            { id: "batchwise", label: "Batchwise" },
            { id: "departmentwise", label: "Departmentwise" },
            { id: "studentwise", label: "Studentwise" },
            { id: "sessionwise", label: "Sessionwise" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 font-medium transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Daywise View */}
        {activeTab === "daywise" && (
          <Card className="bg-white border-slate-200 p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-slate-900">Daywise Attendance Trends</h2>
              <Button
                onClick={() => exportToExcel(daywiseData, "daywise_attendance")}
                variant="outline"
                size="sm"
              >
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
            {daywiseData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={daywiseData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="presentCount" stroke="#10b981" name="Present" />
                  <Line type="monotone" dataKey="absentCount" stroke="#ef4444" name="Absent" />
                  <Line type="monotone" dataKey="odCount" stroke="#f59e0b" name="OD" />
                  <Line type="monotone" dataKey="driveCount" stroke="#8b5cf6" name="Drive" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-slate-600 text-center py-8">No data available</p>
            )}
          </Card>
        )}

        {/* Weekwise View */}
        {activeTab === "weekwise" && (
          <Card className="bg-white border-slate-200 p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-slate-900">Weekwise Attendance Summary</h2>
              <Button
                onClick={() => exportToExcel(weekwiseData, "weekwise_attendance")}
                variant="outline"
                size="sm"
              >
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
            {weekwiseData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={weekwiseData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="week" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="presentCount" fill="#10b981" name="Present" />
                  <Bar dataKey="absentCount" fill="#ef4444" name="Absent" />
                  <Bar dataKey="odCount" fill="#f59e0b" name="OD" />
                  <Bar dataKey="driveCount" fill="#8b5cf6" name="Drive" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-slate-600 text-center py-8">No data available</p>
            )}
          </Card>
        )}

        {/* Batchwise View */}
        {activeTab === "batchwise" && (
          <Card className="bg-white border-slate-200 p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-slate-900">Batchwise Attendance</h2>
              <Button
                onClick={() => exportToExcel(batchwiseData, "batchwise_attendance")}
                variant="outline"
                size="sm"
              >
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
            {batchwiseData.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700">
                        Batch
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-semibold text-slate-700">
                        Present
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-semibold text-slate-700">
                        Absent
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-semibold text-slate-700">
                        OD
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-semibold text-slate-700">
                        Drive
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-semibold text-slate-700">
                        Attendance %
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {batchwiseData.map((batch) => (
                      <tr key={batch.batch} className="hover:bg-slate-50">
                        <td className="px-6 py-4 text-sm font-medium text-slate-900">
                          {batch.batch}
                        </td>
                        <td className="px-6 py-4 text-center text-sm text-green-600 font-medium">
                          {batch.presentCount}
                        </td>
                        <td className="px-6 py-4 text-center text-sm text-red-600 font-medium">
                          {batch.absentCount}
                        </td>
                        <td className="px-6 py-4 text-center text-sm text-yellow-600 font-medium">
                          {batch.odCount}
                        </td>
                        <td className="px-6 py-4 text-center text-sm text-purple-600 font-medium">
                          {batch.driveCount}
                        </td>
                        <td className="px-6 py-4 text-center text-sm font-bold text-slate-900">
                          {batch.attendancePercentage.toFixed(1)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-slate-600 text-center py-8">No data available</p>
            )}
          </Card>
        )}

        {/* Departmentwise View */}
        {activeTab === "departmentwise" && (
          <Card className="bg-white border-slate-200 p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-slate-900">Departmentwise Attendance</h2>
              <Button
                onClick={() => exportToExcel(departmentwiseData, "departmentwise_attendance")}
                variant="outline"
                size="sm"
              >
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
            {departmentwiseData.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={departmentwiseData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="department" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="attendancePercentage" fill="#3b82f6" name="Attendance %" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div>
                  <div className="space-y-3">
                    {departmentwiseData.map((dept) => (
                      <div key={dept.department} className="p-4 bg-slate-50 rounded-lg">
                        <div className="flex justify-between items-center mb-2">
                          <p className="font-medium text-slate-900">{dept.department}</p>
                          <p className="text-sm font-bold text-blue-600">
                            {dept.attendancePercentage.toFixed(1)}%
                          </p>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-2">
                          <div
                            className="bg-blue-500 h-2 rounded-full"
                            style={{ width: `${dept.attendancePercentage}%` }}
                          />
                        </div>
                        <p className="text-xs text-slate-600 mt-2">
                          {dept.presentCount}P / {dept.absentCount}A / {dept.odCount}OD /{" "}
                          {dept.driveCount}D
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-slate-600 text-center py-8">No data available</p>
            )}
          </Card>
        )}

        {/* Studentwise View */}
        {activeTab === "studentwise" && (
          <Card className="bg-white border-slate-200 p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-slate-900">Studentwise Attendance</h2>
              <Button
                onClick={() => exportToExcel(studentwiseData, "studentwise_attendance")}
                variant="outline"
                size="sm"
              >
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
            {studentwiseData.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700">
                        Name
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700">
                        Reg No
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700">
                        Dept
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-slate-700">
                        P
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-slate-700">
                        A
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-slate-700">
                        OD
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-slate-700">
                        D
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-slate-700">
                        Attendance %
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {studentwiseData.map((student) => (
                      <tr key={student.studentId} className="hover:bg-slate-50">
                        <td className="px-4 py-3 text-sm font-medium text-slate-900">
                          {student.name}
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-600">
                          {student.registrationNo}
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-600">{student.department}</td>
                        <td className="px-4 py-3 text-center text-sm text-green-600 font-medium">
                          {student.presentCount}
                        </td>
                        <td className="px-4 py-3 text-center text-sm text-red-600 font-medium">
                          {student.absentCount}
                        </td>
                        <td className="px-4 py-3 text-center text-sm text-yellow-600 font-medium">
                          {student.odCount}
                        </td>
                        <td className="px-4 py-3 text-center text-sm text-purple-600 font-medium">
                          {student.driveCount}
                        </td>
                        <td className="px-4 py-3 text-center text-sm font-bold text-slate-900">
                          {student.attendancePercentage.toFixed(1)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-slate-600 text-center py-8">No data available</p>
            )}
          </Card>
        )}

        {/* Sessionwise View */}
        {activeTab === "sessionwise" && (
          <Card className="bg-white border-slate-200 p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-slate-900">Sessionwise Attendance</h2>
              <Button
                onClick={() => exportToExcel(sessionwiseData, "sessionwise_attendance")}
                variant="outline"
                size="sm"
              >
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
            {sessionwiseData.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={sessionwiseData}
                      dataKey="attendancePercentage"
                      nameKey="sessionName"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label
                    >
                      {sessionwiseData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>

                <div className="space-y-3">
                  {sessionwiseData.map((session) => (
                    <div key={session.sessionId} className="p-4 bg-slate-50 rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <p className="font-medium text-slate-900">{session.sessionName}</p>
                        <p className="text-sm font-bold text-blue-600">
                          {session.attendancePercentage.toFixed(1)}%
                        </p>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2">
                        <div
                          className="bg-blue-500 h-2 rounded-full"
                          style={{ width: `${session.attendancePercentage}%` }}
                        />
                      </div>
                      <p className="text-xs text-slate-600 mt-2">
                        {session.presentCount}P / {session.absentCount}A / {session.odCount}OD /{" "}
                        {session.driveCount}D
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-slate-600 text-center py-8">No data available</p>
            )}
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
