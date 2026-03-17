import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="text-center space-y-6">
        <h1 className="text-7xl font-bold text-primary font-oswald">404</h1>
        <p className="text-lg text-muted-foreground">Cette page n'existe pas.</p>
        <Button onClick={() => navigate("/")} variant="outline" className="gap-2 rounded-sm font-oswald uppercase tracking-wider">
          <ArrowLeft className="h-4 w-4" /> Retour au dashboard
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
