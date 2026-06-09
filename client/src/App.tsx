import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { useEffect } from "react";
import { useAuthStore } from "@/store/authStore";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Trainings from "./pages/Trainings";
import Students from "./pages/Students";
import Attendance from "./pages/Attendance";
import AttendanceHistory from "./pages/AttendanceHistory";
import Analytics from "./pages/Analytics";

function Router() {
  const { isAuthenticated, checkAuth } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, []);

  return (
    <Switch>
      <Route path={"/ "} component={isAuthenticated ? Dashboard : Login} />
      <Route path={"/"} component={isAuthenticated ? Dashboard : Login} />
      <Route path={"/dashboard"} component={Dashboard} />
      <Route path={"/trainings"} component={Trainings} />
      <Route path={"/students"} component={Students} />
      <Route path={"/attendance"} component={Attendance} />
      <Route path={"/attendance-history"} component={AttendanceHistory} />
      <Route path={"/analytics"} component={Analytics} />
      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="light"
        // switchable
      >
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
