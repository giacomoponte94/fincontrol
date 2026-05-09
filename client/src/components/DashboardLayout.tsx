import { useAuth } from "@/_core/hooks/useAuth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { getLoginUrl } from "@/const";
import { useIsMobile } from "@/hooks/useMobile";
import {
  LayoutDashboard,
  CreditCard,
  Receipt,
  ShoppingBag,
  TrendingUp,
  History,
  Calculator,
  FileText,
  LogOut,
  Menu,
  Wallet,
  Sun,
  Moon,
} from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { CSSProperties, useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { DashboardLayoutSkeleton } from "./DashboardLayoutSkeleton";
import { Button } from "./ui/button";
import { trpc } from "@/lib/trpc";
import { Badge } from "./ui/badge";

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/" },
  { icon: CreditCard, label: "Dívidas", path: "/debts" },
  { icon: Receipt, label: "Gastos Fixos", path: "/fixed-expenses" },
  { icon: ShoppingBag, label: "Gastos Variáveis", path: "/variable-expenses" },
  { icon: TrendingUp, label: "Renda", path: "/income" },
  { icon: History, label: "Histórico", path: "/history" },
  { icon: Calculator, label: "Simulador", path: "/simulator" },
  { icon: FileText, label: "Relatórios", path: "/reports" },
];

const SIDEBAR_WIDTH_KEY = "sidebar-width";
const DEFAULT_WIDTH = 260;
const MIN_WIDTH = 200;
const MAX_WIDTH = 380;

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const saved = localStorage.getItem(SIDEBAR_WIDTH_KEY);
    return saved ? parseInt(saved, 10) : DEFAULT_WIDTH;
  });
  const { loading, user } = useAuth();

  useEffect(() => {
    localStorage.setItem(SIDEBAR_WIDTH_KEY, sidebarWidth.toString());
  }, [sidebarWidth]);

  if (loading) return <DashboardLayoutSkeleton />;

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="flex flex-col items-center gap-8 p-8 max-w-md w-full">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Wallet className="w-8 h-8 text-primary" />
          </div>
          <div className="flex flex-col items-center gap-3 text-center">
            <h1 className="text-2xl font-display font-semibold">FinControlling</h1>
            <p className="text-sm text-muted-foreground max-w-sm">
              Faça login para acessar seu painel de gestão financeira pessoal.
            </p>
          </div>
          <Button onClick={() => { window.location.href = getLoginUrl(); }} size="lg" className="w-full">
            Entrar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider style={{ "--sidebar-width": `${sidebarWidth}px` } as CSSProperties}>
      <DashboardLayoutContent setSidebarWidth={setSidebarWidth}>
        {children}
      </DashboardLayoutContent>
    </SidebarProvider>
  );
}

function DashboardLayoutContent({
  children,
  setSidebarWidth,
}: {
  children: React.ReactNode;
  setSidebarWidth: (width: number) => void;
}) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [location, setLocation] = useLocation();
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === "collapsed";
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();
  const activeMenuItem = menuItems.find((item) => item.path === location);

  const { data: alerts } = trpc.alerts.list.useQuery(undefined, { refetchInterval: 60000 });
  const unreadAlerts = alerts?.filter((a) => !a.isRead).length ?? 0;

  useEffect(() => {
    if (isCollapsed) setIsResizing(false);
  }, [isCollapsed]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      const sidebarLeft = sidebarRef.current?.getBoundingClientRect().left ?? 0;
      const newWidth = e.clientX - sidebarLeft;
      if (newWidth >= MIN_WIDTH && newWidth <= MAX_WIDTH) setSidebarWidth(newWidth);
    };
    const handleMouseUp = () => setIsResizing(false);
    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    }
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isResizing, setSidebarWidth]);

  return (
    <>
      <div className="relative" ref={sidebarRef}>
        <Sidebar collapsible="icon" className="border-r border-border/50" disableTransition={isResizing}>
          <SidebarHeader className="h-16 justify-center border-b border-border/50">
            <div className="flex items-center gap-3 px-2 w-full">
              <button
                onClick={toggleSidebar}
                className="h-8 w-8 flex items-center justify-center hover:bg-secondary rounded-lg transition-colors shrink-0"
                aria-label="Toggle navigation"
              >
                <Menu className="h-4 w-4 text-muted-foreground" />
              </button>
              {!isCollapsed && (
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-6 h-6 rounded-md bg-primary/20 flex items-center justify-center shrink-0">
                    <Wallet className="w-3.5 h-3.5 text-primary" />
                  </div>
                  <span className="font-display font-semibold text-sm truncate text-foreground">
                    FinControlling
                  </span>
                </div>
              )}
            </div>
          </SidebarHeader>

          <SidebarContent className="gap-0 py-2">
            <SidebarMenu className="px-2 gap-0.5">
              {menuItems.map((item) => {
                const isActive = location === item.path;
                return (
                  <SidebarMenuItem key={item.path}>
                    <SidebarMenuButton
                      isActive={isActive}
                      onClick={() => {
                        setLocation(item.path);
                        if (isMobile) toggleSidebar();
                      }}
                      tooltip={item.label}
                      className={`h-9 transition-all font-normal text-sm rounded-lg ${
                        isActive
                          ? "bg-primary/10 text-primary font-medium border-l-2 border-primary rounded-l-none"
                          : "text-muted-foreground hover:text-foreground hover:bg-secondary/80"
                      }`}
                    >
                      <item.icon className={`h-4 w-4 shrink-0 ${isActive ? "text-primary" : ""}`} />
                      <span>{item.label}</span>
                      {item.path === "/" && unreadAlerts > 0 && !isCollapsed && (
                        <Badge variant="destructive" className="ml-auto h-4 px-1 text-[10px]">
                          {unreadAlerts}
                        </Badge>
                      )}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarContent>

          <SidebarFooter className="p-3 border-t border-border/50">
            {!isCollapsed && (
              <button
                onClick={toggleTheme}
                className="flex items-center gap-2 w-full px-2 py-1.5 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-colors mb-1"
              >
                {theme === "dark" ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
                <span>{theme === "dark" ? "Modo Claro" : "Modo Escuro"}</span>
              </button>
            )}
            {isCollapsed && (
              <button
                onClick={toggleTheme}
                className="flex items-center justify-center w-full py-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-colors mb-1"
                aria-label="Alternar tema"
              >
                {theme === "dark" ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
              </button>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-secondary/80 transition-colors w-full text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  <Avatar className="h-8 w-8 border border-border shrink-0">
                    <AvatarFallback className="text-xs font-medium bg-primary/10 text-primary">
                      {user?.name?.charAt(0).toUpperCase() ?? "U"}
                    </AvatarFallback>
                  </Avatar>
                  {!isCollapsed && (
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate leading-none text-foreground">
                        {user?.name || "Usuário"}
                      </p>
                      <p className="text-[10px] text-muted-foreground truncate mt-1">
                        {user?.email || ""}
                      </p>
                    </div>
                  )}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout} className="cursor-pointer text-destructive focus:text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sair</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarFooter>
        </Sidebar>

        <div
          className={`absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-primary/20 transition-colors ${isCollapsed ? "hidden" : ""}`}
          onMouseDown={() => { if (!isCollapsed) setIsResizing(true); }}
          style={{ zIndex: 50 }}
        />
      </div>

      <SidebarInset>
        {isMobile && (
          <div className="flex border-b border-border/50 h-14 items-center justify-between bg-background/95 px-4 backdrop-blur sticky top-0 z-40">
            <div className="flex items-center gap-3">
              <button
                onClick={toggleSidebar}
                className="h-8 w-8 flex items-center justify-center hover:bg-secondary rounded-lg transition-colors"
                aria-label="Abrir menu"
              >
                <Menu className="h-5 w-5 text-muted-foreground" />
              </button>
              <span className="font-medium text-sm">{activeMenuItem?.label ?? "Menu"}</span>
            </div>
              <div className="flex items-center gap-2">
                {unreadAlerts > 0 && (
                  <Badge variant="destructive" className="h-5 px-1.5 text-xs">
                    {unreadAlerts}
                  </Badge>
                )}
                <button
                  onClick={toggleTheme}
                  className="h-8 w-8 flex items-center justify-center hover:bg-secondary rounded-lg transition-colors"
                  aria-label="Alternar tema"
                >
                  {theme === "dark" ? <Sun className="h-4 w-4 text-muted-foreground" /> : <Moon className="h-4 w-4 text-muted-foreground" />}
                </button>
              </div>
          </div>
        )}
        <main className="flex-1 p-6 min-h-screen">{children}</main>
      </SidebarInset>
    </>
  );
}
