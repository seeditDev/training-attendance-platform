import { useAuthStore } from "@/store/authStore";
import { useLocation } from "wouter";
import { useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayoutCustom";
import { Card } from "@/components/ui/card";
import { BarChart3, Users, BookOpen, Calendar } from "lucide-react";

export default function Dashboard() {
  const { isAuthenticated } = useAuthStore();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/");
    }
  }, [isAuthenticated, navigate]);

  if (!isAuthenticated) {
    return null;
  }

  const stats = [
    {
      label: "Total Trainings",
      value: "0",
      icon: BookOpen,
      color: "from-blue-500 to-blue-600",
    },
    {
      label: "Total Students",
      value: "0",
      icon: Users,
      color: "from-purple-500 to-purple-600",
    },
    {
      label: "Attendance Today",
      value: "0%",
      icon: Calendar,
      color: "from-green-500 to-green-600",
    },
    {
      label: "Active Trainings",
      value: "0",
      icon: BarChart3,
      color: "from-orange-500 to-orange-600",
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-slate-600 mt-2">Welcome to your training attendance management system</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card
                key={stat.label}
                className="bg-white border-slate-200 hover:shadow-lg transition-shadow duration-300"
              >
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`p-3 rounded-lg bg-gradient-to-br ${stat.color}`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <p className="text-slate-600 text-sm font-medium">{stat.label}</p>
                  <p className="text-3xl font-bold text-slate-900 mt-2">{stat.value}</p>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="bg-white border-slate-200 p-6">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Recent Activities</h2>
            <div className="space-y-3 text-slate-600">
              <p className="text-sm">No recent activities yet</p>
            </div>
          </Card>

          <Card className="bg-white border-slate-200 p-6">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Quick Actions</h2>
            <div className="space-y-3">
              <button className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium">
                Create Training Program
              </button>
              <button className="w-full px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors text-sm font-medium">
                Add Students
              </button>
              <button className="w-full px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm font-medium">
                Mark Attendance
              </button>
            </div>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
