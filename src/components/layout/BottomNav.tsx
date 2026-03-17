import { Home, ClipboardCheck, Dumbbell, User } from "lucide-react";
import { NavLink } from "@/components/NavLink";

const navItems = [
  { title: "Dashboard", url: "/", icon: Home },
  { title: "Diagnostics", url: "/diagnostics", icon: ClipboardCheck },
  { title: "Workout", url: "/workout", icon: Dumbbell },
  { title: "Profil", url: "/profile", icon: User },
];

const BottomNav = () => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background md:hidden">
      <div className="flex h-16 items-center justify-around">
        {navItems.map((item) => (
          <NavLink
            key={item.title}
            to={item.url}
            end={item.url === "/"}
            className="flex flex-col items-center gap-1 px-3 py-2 text-muted-foreground transition-colors"
            activeClassName="text-primary"
          >
            <item.icon className="h-5 w-5" />
            <span className="text-[10px] font-medium uppercase tracking-wider font-oswald">
              {item.title}
            </span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
};

export { BottomNav };
