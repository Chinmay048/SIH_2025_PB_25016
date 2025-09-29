import { useNavigate, useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
} from "./ui/sidebar";
import { Button } from "./ui/button";
import {
  LayoutDashboard,
  Calendar,
  History,
  BarChart3,
  FileText,
  Plus,
  LogOut,
} from "lucide-react";

interface MenuItem {
  path: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const AppSidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems: MenuItem[] = [
    { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { path: "/sessions", label: "Sessions", icon: Calendar },
    { path: "/history", label: "History", icon: History },
    { path: "/analytics", label: "Analytics", icon: BarChart3 },
    { path: "/requests", label: "Requests", icon: FileText },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <Sidebar className="border-r border-gray-200 w-64 min-w-64 max-w-64 flex-shrink-0">
      <SidebarHeader className="border-b h-16 border-gray-200 bg-white px-6 py-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Upastithi</h1>
          <p className="text-xs text-gray-600">Faculty Panel</p>
        </div>
      </SidebarHeader>

      <SidebarContent className="bg-white px-4 py-6 space-y-2">
        <div className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <Button
                key={item.path}
                onClick={() => navigate(item.path)}
                variant={isActive(item.path) ? "default" : "ghost"}
                className={`w-full justify-start text-sm font-medium flex items-center gap-3 ${
                  isActive(item.path)
                    ? "bg-gray-900 hover:bg-gray-800 text-white"
                    : "text-gray-700 hover:bg-gray-100 hover:text-gray-700"
                }`}
              >
                <Icon className="h-5 w-5" />
                {item.label}
              </Button>
            );
          })}
        </div>
      </SidebarContent>

      <SidebarFooter className="border-t border-gray-200 bg-white px-4 py-6">
        <SidebarGroup>
          <SidebarGroupLabel className="text-sm font-medium text-gray-600 mb-4">
            Quick Actions
          </SidebarGroupLabel>
          <SidebarGroupContent className="space-y-3">
            <Button
              onClick={() => navigate("/sessions")}
              className="w-full bg-gray-900 hover:bg-gray-800 text-white text-sm py-2.5 font-medium flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Create Session
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                // Add logout logic here
                console.log("Logout clicked");
              }}
              className="w-full border-gray-300 text-gray-600 hover:bg-gray-50 text-sm py-2.5 font-medium flex items-center gap-2"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarFooter>
    </Sidebar>
  );
};

export default AppSidebar;
