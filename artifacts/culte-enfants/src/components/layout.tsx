import { Link, useLocation } from "wouter";
import { Home, Library, Info } from "lucide-react";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [location] = useLocation();

  const navItems = [
    { href: "/", label: "Préparer", icon: Home },
    { href: "/lecons", label: "Mes Leçons", icon: Library },
    { href: "/apropos", label: "À propos", icon: Info },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      {/* Sidebar */}
      <nav className="w-full md:w-64 shrink-0 flex flex-col" style={{ background: "hsl(var(--sidebar))" }}>

        {/* Brand */}
        <div className="px-5 pt-6 pb-5 border-b" style={{ borderColor: "hsl(var(--sidebar-border))" }}>
          <div className="flex items-center gap-3">
            <div className="relative w-14 h-14 shrink-0 rounded-xl overflow-hidden shadow-lg border-2" style={{ borderColor: "hsl(var(--sidebar-primary))" }}>
              <img
                src="/logo.jpg"
                alt="Logo Culte d'Enfants"
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <h1
                className="font-bold text-lg leading-tight"
                style={{ color: "hsl(var(--sidebar-foreground))" }}
              >
                Culte<br />d'Enfants
              </h1>
              <p className="text-xs mt-0.5 font-medium tracking-wide" style={{ color: "hsl(var(--sidebar-primary))" }}>
                EEC — APC Assist
              </p>
            </div>
          </div>

          {/* Slogan */}
          <div
            className="mt-4 px-3 py-2 rounded-lg text-xs italic leading-snug text-center"
            style={{
              background: "hsl(var(--sidebar-accent))",
              color: "hsl(var(--sidebar-foreground) / 0.75)",
              borderLeft: "3px solid hsl(var(--sidebar-primary))",
            }}
          >
            "De la Parole à l'enfant — en un clic."
          </div>
        </div>

        {/* Navigation */}
        <div
          className="flex-1 px-3 py-4 flex flex-row md:flex-col gap-1 overflow-x-auto md:overflow-visible"
        >
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              location === item.href ||
              (item.href !== "/" && location.startsWith(item.href));
            return (
              <Link key={item.href} href={item.href}>
                <div
                  className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all cursor-pointer whitespace-nowrap md:whitespace-normal text-sm font-medium"
                  style={
                    isActive
                      ? {
                          background: "hsl(var(--sidebar-primary))",
                          color: "hsl(var(--sidebar-primary-foreground))",
                          boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                        }
                      : {
                          color: "hsl(var(--sidebar-foreground) / 0.7)",
                        }
                  }
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      (e.currentTarget as HTMLDivElement).style.background = "hsl(var(--sidebar-accent))";
                      (e.currentTarget as HTMLDivElement).style.color = "hsl(var(--sidebar-foreground))";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      (e.currentTarget as HTMLDivElement).style.background = "transparent";
                      (e.currentTarget as HTMLDivElement).style.color = "hsl(var(--sidebar-foreground) / 0.7)";
                    }
                  }}
                  data-testid={`nav-${item.label.toLowerCase().replace(/\s+/g, "-")}`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span>{item.label}</span>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Footer */}
        <div
          className="px-5 py-4 border-t text-center"
          style={{ borderColor: "hsl(var(--sidebar-border))" }}
        >
          <p className="text-xs" style={{ color: "hsl(var(--sidebar-foreground) / 0.4)" }}>
            Église Évangélique du Cameroun
          </p>
          <p className="text-xs mt-0.5" style={{ color: "hsl(var(--sidebar-foreground) / 0.3)" }}>
            © 2025 — Polytech Maroua
          </p>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 overflow-auto bg-background">
        <div className="max-w-4xl mx-auto w-full p-4 md:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
