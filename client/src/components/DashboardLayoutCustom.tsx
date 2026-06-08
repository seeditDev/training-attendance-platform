import { ReactNode, useState } from "react";
import { useAuthStore } from "@/store/authStore";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Menu, X, LogOut, BarChart3, Users, BookOpen, Calendar } from "lucide-react";

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { adminName, logout } = useAuthStore();
  const [, navigate] = useLocation();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const navItems = [
    {
      label: "Dashboard",
      icon: BarChart3,
      href: "/dashboard",
    },
    {
      label: "Training Programs",
      icon: BookOpen,
      href: "/trainings",
    },
    {
      label: "Students",
      icon: Users,
      href: "/students",
    },
    {
      label: "Attendance",
      icon: Calendar,
      href: "/attendance",
    },
    {
      label: "Analytics",
      icon: BarChart3,
      href: "/analytics",
    },
  ];

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? "w-64" : "w-20"
        } bg-gradient-to-b from-slate-900 to-slate-800 text-white transition-all duration-300 flex flex-col shadow-lg`}
      >
        {/* Logo */}
        <div className="p-6 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <BookOpen className="w-6 h-6" />
            </div>
            {sidebarOpen && (
              <div>
                <h1 className="font-bold text-lg">Training</h1>
                <p className="text-xs text-slate-400">Attendance</p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.href}
                onClick={() => navigate(item.href)}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-700 transition-colors duration-200 text-slate-200 hover:text-white group"
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {sidebarOpen && (
                  <span className="text-sm font-medium">{item.label}</span>
                )}
              </button>
            );
          })}
        </nav>

        {/* User Section */}
        <div className="p-4 border-t border-slate-700 space-y-3">
          {sidebarOpen && (
            <div className="px-4 py-3 bg-slate-700/50 rounded-lg">
              <p className="text-xs text-slate-400">Logged in as</p>
              <p className="text-sm font-semibold text-white">{adminName}</p>
            </div>
          )}
          <Button
            onClick={handleLogout}
            variant="outline"
            className={`w-full flex items-center justify-center gap-2 bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20 ${
              !sidebarOpen && "p-2"
            }`}
          >
            <LogOut className="w-4 h-4" />
            {sidebarOpen && "Logout"}
          </Button>
        </div>

        {/* Toggle Button */}
        <div className="p-4 border-t border-slate-700">
          <Button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            variant="ghost"
            size="sm"
            className="w-full text-slate-400 hover:text-white"
          >
            {sidebarOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {/* Header */}
        <header className="bg-white border-b border-slate-200 px-8 py-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-slate-900">Training Attendance Platform</h2>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm text-slate-600">Welcome back</p>
                <p className="font-semibold text-slate-900">{adminName}</p>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
