import { Outlet } from "react-router-dom";
import { BottomNav } from "./BottomNav";
import { DesktopSidebar } from "./DesktopSidebar";

const AppLayout = () => {
  return (
    <div className="flex min-h-screen w-full bg-background">
      <DesktopSidebar />

      <main className="flex flex-1 flex-col pb-16 md:pb-0">
        <Outlet />
      </main>

      <BottomNav />
    </div>
  );
};

export { AppLayout };
