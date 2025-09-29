import type { ReactNode } from "react";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "./ui/sidebar";
import AppSidebar from "./AppSidebar";

interface AppLayoutProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
}

const AppLayout = ({ children, title, subtitle }: AppLayoutProps) => {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <div className="flex flex-col min-h-screen">
          {/* Top Header - matches Layout design */}
          <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
            <div className="flex items-center justify-between h-16 px-6">
              <div className="flex items-center">
                <SidebarTrigger className="lg:hidden mr-3" />
                {title && (
                  <div>
                    <h1 className="text-xl font-semibold text-gray-900">
                      {title}
                    </h1>
                    {subtitle && (
                      <p className="text-sm text-gray-600 mt-0.5">{subtitle}</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </header>

          {/* Main Content Area - matches Layout design */}
          <main className="flex-1 w-full bg-gray-50">{children}</main>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
};

export default AppLayout;
