import { useEffect, useState, useMemo } from "react";
import { useLocation } from "wouter";
import { useAuthStore } from "@/store/authStore";
import { trainingService, attendanceService } from "@/lib/firebaseService";
import { Training, Attendance } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Calendar, ChevronLeft } from "lucide-react";
import { toast } from "sonner";

export default function AttendanceHistory() {
  const { isAuthenticated } = useAuthStore();
  const [, navigate] = useLocation();
  const [trainings, setTrainings] = useState<Training[]>([]);
  const [selectedTraining, setSelectedTraining] = useState<string>("");
  const [history, setHistory] = useState<{ date: Date; count: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchDate, setSearchDate] = useState("");

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    loadTrainings();
  }, [isAuthenticated, navigate]);

  const loadTrainings = async () => {
    try {
      const data = await trainingService.getAll();
      setTrainings(data);
      if (data.length > 0) {
        setSelectedTraining(data[0].id);
      }
    } catch (error) {
      console.error("Error loading trainings:", error);
      toast.error("Failed to load trainings");
    }
  };

  useEffect(() => {
    if (!selectedTraining) return;

    const loadHistory = async () => {
      try {
        setLoading(true);
        const data = await attendanceService.getHistoryByTraining(selectedTraining, 100);
        setHistory(data);
      } catch (error) {
        console.error("Error loading history:", error);
        toast.error("Failed to load attendance history");
      } finally {
        setLoading(false);
      }
    };

    loadHistory();
  }, [selectedTraining]);

  const filteredHistory = useMemo(() => {
    if (!searchDate) return history;
    return history.filter((item) => item.date.toISOString().split("T")[0].includes(searchDate));
  }, [history, searchDate]);

  const handleViewAttendance = (date: Date) => {
    const dateStr = date.toISOString().split("T")[0];
    navigate(`/attendance?training=${selectedTraining}&date=${dateStr}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/attendance")}
              className="text-slate-600 hover:text-slate-900"
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Attendance History</h1>
            <p className="text-slate-600 mt-2">View and manage past attendance records</p>
          </div>
        </div>

        {/* Selection Panel */}
        <Card className="bg-white border-slate-200 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Select Training
              </label>
              <Select value={selectedTraining} onValueChange={setSelectedTraining}>
                <SelectTrigger className="border-slate-300">
                  <SelectValue placeholder="Choose a training" />
                </SelectTrigger>
                <SelectContent>
                  {trainings.map((training) => (
                    <SelectItem key={training.id} value={training.id}>
                      {training.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Search Date
              </label>
              <Input
                type="date"
                value={searchDate}
                onChange={(e) => setSearchDate(e.target.value)}
                className="border-slate-300"
              />
            </div>
          </div>
        </Card>

        {/* History List */}
        <div className="space-y-3">
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
              <p className="mt-4 text-slate-600">Loading history...</p>
            </div>
          ) : filteredHistory.length === 0 ? (
            <Card className="bg-white border-slate-200 p-8 text-center">
              <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-600">No attendance records found</p>
            </Card>
          ) : (
            filteredHistory.map((item) => {
              const dateStr = item.date.toISOString().split("T")[0];
              const dateObj = new Date(dateStr);
              const formatted = dateObj.toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              });

              return (
                <Card
                  key={dateStr}
                  className="bg-white border-slate-200 p-4 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => handleViewAttendance(item.date)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                        <Calendar className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900">{formatted}</p>
                        <p className="text-sm text-slate-600">{item.count} attendance records</p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-slate-300 text-slate-700 hover:bg-slate-50"
                    >
                      View Details
                    </Button>
                  </div>
                </Card>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
