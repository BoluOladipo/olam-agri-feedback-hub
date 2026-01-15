import { Link } from "react-router-dom";

export const Header = () => {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-display font-bold text-xl">O</span>
            </div>
            <div className="flex flex-col">
              <span className="font-display font-bold text-lg text-foreground leading-tight">
                Olam Agri
              </span>
              <span className="text-xs text-muted-foreground leading-tight">
                Product Survey
              </span>
            </div>
          </div>
        </Link>
        
        <nav className="flex items-center gap-4">
          <Link 
            to="/admin" 
            className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
          >
            Admin
          </Link>
        </nav>
      </div>
    </header>
  );
};
