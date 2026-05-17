import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Dashboard from "./pages/Dashboard";
import Debts from "./pages/Debts";
import FixedExpenses from "./pages/FixedExpenses";
import VariableExpenses from "./pages/VariableExpenses";
import History from "./pages/History";
import Simulator from "./pages/Simulator";
import Reports from "./pages/Reports";
import Income from "./pages/Income";
import Login from "@/pages/Login";
import DashboardLayout from "./components/DashboardLayout";
import { useAuth } from "./_core/hooks/useAuth";
import { getLoginUrl } from "./const";

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <p className="text-muted-foreground text-sm">Carregando...</p>
        </div>
      </div>
    );
  }
  if (!isAuthenticated) {
    window.location.href = getLoginUrl();
    return null;
  }
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route>
        <AuthGuard>
          <DashboardLayout>
            <Switch>
              <Route path="/" component={Dashboard} />
              <Route path="/debts" component={Debts} />
              <Route path="/fixed-expenses" component={FixedExpenses} />
              <Route path="/variable-expenses" component={VariableExpenses} />
              <Route path="/income" component={Income} />
              <Route path="/history" component={History} />
              <Route path="/simulator" component={Simulator} />
              <Route path="/reports" component={Reports} />
              <Route path="/404" component={NotFound} />
              <Route component={NotFound} />
            </Switch>
          </DashboardLayout>
        </AuthGuard>
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light" switchable>
        <TooltipProvider>
          <Toaster richColors position="top-right" />
          <AppRoutes />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
