import { useState, useEffect } from "react";
import { useAuthStore } from "@/store/authStore";
import { useLocation } from "wouter";
import DashboardLayout from "@/components/DashboardLayoutCustom";
import {
  trainingService,
  studentService,
  analyticsService,
} from "@/lib/firebaseService";
import { Training, Student, AttendanceSummary } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
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
import { Download, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { exportAttendanceToExcel } from "@/lib/excelUtils";

export default function Analytics() {
  const { isAuthenticated } = useAuthStore();
  const [, navigate] = useLocation();
  const [trainings, setTrainings] = useState<Training[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTraining, setSelectedTraining] = useState<string>("");
  const [summaries, setSummaries] = useState<Map<string, AttendanceSummary>>(
    new Map()
  );

  const COLORS = ["#3b82f6", "#ef4444", "#f59e0b", "#10b981"];

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
      if (trainingsData.length > 0) {
        setSelectedTraining(trainingsData[0].id);
      }
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const loadAnalytics = async () => {
    if (!selectedTraining) return;

    try {
      const newSummaries = new Map<string, AttendanceSummary>();
      for (const student of students) {
        const summary = await analyticsService.getAttendanceSummary(
          selectedTraining,
          student.id
        );
        if (summary) {
          newSummaries.set(student.id, summary);
        }
      }
      setSummaries(newSummaries);
    } catch (error) {
      console.error("Error loading analytics:", error);
      toast.error("Failed to load analytics");
    }
  };

  const handleExportReport = async () => {
    if (!selectedTraining) {
      toast.error("Please select a training first");
      return;
    }

    try {
      const training = trainings.find((t) => t.id === selectedTraining);
      if (!training) return;

      // Get all attendance records for this training
      const allAttendance = await analyticsService.getAllAttendanceForTraining(
        selectedTraining
      );

      const timestamp = new Date().toISOString().split("T")[0];
      exportAttendanceToExcel(
        training,
        students,
        allAttendance,
        `attendance_report_${training.name}_${timestamp}.xlsx`
      );
      toast.success("Attendance report exported successfully");
    } catch (error) {
      console.error("Error exporting report:", error);
      toast.error("Failed to export report");
    }
  };

  useEffect(() => {
    if (selectedTraining) {
      loadAnalytics();
    }
  }, [selectedTraining]);

  const selectedTrainingData = trainings.find((t) => t.id === selectedTraining);

  // Prepare chart data
  const attendanceData = Array.from(summaries.values()).map((summary) => {
    const student = students.find((s) => s.id === summary.studentId);
    return {
      name: student?.name || "Unknown",
      present: summary.presentCount,
      absent: summary.absentCount,
      od: summary.odCount,
      drive: summary.driveCount,
      percentage: Math.round(summary.attendancePercentage),
    };
  });

  const statusSummary = {
    present: Array.from(summaries.values()).reduce(
      (sum, s) => sum + s.presentCount,
      0
    ),
    absent: Array.from(summaries.values()).reduce(
      (sum, s) => sum + s.absentCount,
      0
    ),
    od: Array.from(summaries.values()).reduce((sum, s) => sum + s.odCount, 0),
    drive: Array.from(summaries.values()).reduce(
      (sum, s) => sum + s.driveCount,
      0
    ),
  };

  const statusData = [
    { name: "Present", value: statusSummary.present, color: "#10b981" },
    { name: "Absent", value: statusSummary.absent, color: "#ef4444" },
    { name: "OD", value: statusSummary.od, color: "#f59e0b" },
    { name: "Drive", value: statusSummary.drive, color: "#3b82f6" },
  ].filter((item) => item.value > 0);

  const avgAttendance =
    summaries.size > 0
      ? Math.round(
          Array.from(summaries.values()).reduce(
            (sum, s) => sum + s.attendancePercentage,
            0
          ) / summaries.size
        )
      : 0;

  if (!isAuthenticated) {
    return null;
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Analytics</h1>
            <p className="text-slate-600 mt-2">Attendance statistics and reports</p>
          </div>
          <Button
            onClick={handleExportReport}
            variant="outline"
            className="border-slate-300 text-slate-700 hover:bg-slate-50"
          >
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
        </div>

        {/* Selection Panel */}
        <Card className="bg-white border-slate-200 p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Select Training
              </label>
              <select
                value={selectedTraining}
                onChange={(e) => setSelectedTraining(e.target.value)}
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
          </div>
        </Card>

        {selectedTrainingData && (
          <>
            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card className="bg-white border-slate-200 p-6">
                <p className="text-slate-600 text-sm font-medium">Total Students</p>
                <p className="text-3xl font-bold text-slate-900 mt-2">
                  {summaries.size}
                </p>
              </Card>
              <Card className="bg-white border-slate-200 p-6">
                <p className="text-slate-600 text-sm font-medium">Avg Attendance</p>
                <p className="text-3xl font-bold text-green-600 mt-2">
                  {avgAttendance}%
                </p>
              </Card>
              <Card className="bg-white border-slate-200 p-6">
                <p className="text-slate-600 text-sm font-medium">Total Present</p>
                <p className="text-3xl font-bold text-slate-900 mt-2">
                  {statusSummary.present}
                </p>
              </Card>
              <Card className="bg-white border-slate-200 p-6">
                <p className="text-slate-600 text-sm font-medium">Total Absent</p>
                <p className="text-3xl font-bold text-red-600 mt-2">
                  {statusSummary.absent}
                </p>
              </Card>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Status Distribution */}
              <Card className="bg-white border-slate-200 p-6">
                <h2 className="text-lg font-bold text-slate-900 mb-4">
                  Status Distribution
                </h2>
                {statusData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={statusData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value }) => `${name}: ${value}`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {statusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-80 flex items-center justify-center text-slate-500">
                    No data available
                  </div>
                )}
              </Card>

              {/* Attendance by Student */}
              <Card className="bg-white border-slate-200 p-6">
                <h2 className="text-lg font-bold text-slate-900 mb-4">
                  Attendance % by Student
                </h2>
                {attendanceData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={attendanceData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="percentage" fill="#3b82f6" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-80 flex items-center justify-center text-slate-500">
                    No data available
                  </div>
                )}
              </Card>
            </div>

            {/* Detailed Table */}
            <Card className="bg-white border-slate-200 overflow-hidden">
              <div className="p-6 border-b border-slate-200">
                <h2 className="text-lg font-bold text-slate-900">
                  Student-wise Attendance
                </h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700">
                        Student Name
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
                    {attendanceData.map((row) => (
                      <tr key={row.name} className="hover:bg-slate-50">
                        <td className="px-6 py-4 text-sm text-slate-900 font-medium">
                          {row.name}
                        </td>
                        <td className="px-6 py-4 text-center text-sm text-slate-600">
                          {row.present}
                        </td>
                        <td className="px-6 py-4 text-center text-sm text-slate-600">
                          {row.absent}
                        </td>
                        <td className="px-6 py-4 text-center text-sm text-slate-600">
                          {row.od}
                        </td>
                        <td className="px-6 py-4 text-center text-sm text-slate-600">
                          {row.drive}
                        </td>
                        <td className="px-6 py-4 text-center text-sm font-semibold">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              row.percentage >= 75
                                ? "bg-green-100 text-green-800"
                                : row.percentage >= 50
                                  ? "bg-yellow-100 text-yellow-800"
                                  : "bg-red-100 text-red-800"
                            }`}
                          >
                            {row.percentage}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
