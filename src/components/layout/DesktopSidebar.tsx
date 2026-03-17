import { Home, ClipboardCheck, Dumbbell, User, BookOpen } from "lucide-react";
import { NavLink } from "@/components/NavLink";

const navItems = [
  { title: "Dashboard", url: "/", icon: Home },
  { title: "Programme", url: "/programme", icon: BookOpen },
  { title: "Diagnostics", url: "/diagnostics", icon: ClipboardCheck },
  { title: "Workout", url: "/workout", icon: Dumbbell },
  { title: "Profil", url: "/profile", icon: User },
];

const DesktopSidebar = () => {
  return (
    <aside className="hidden md:flex md:w-64 md:flex-col md:border-r md:border-border md:bg-background">
      <div className="flex h-16 items-center border-b border-border px-6">
        <h1 className="text-xl font-oswald font-bold uppercase tracking-wider text-primary">
          Spartan
        </h1>
      </div>

      <nav className="flex flex-1 flex-col gap-1 p-4">
        {navItems.map((item) => (
          <NavLink
            key={item.title}
            to={item.url}
            end={item.url === "/"}
            className="flex items-center gap-3 rounded-sm px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-secondary-foreground"
            activeClassName="bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground"
          >
            <item.icon className="h-5 w-5" />
            <span className="font-oswald uppercase tracking-wider text-xs">
              {item.title}
            </span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
};

export { DesktopSidebar };
