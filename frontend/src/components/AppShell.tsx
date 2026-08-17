import { useState } from 'react';
import { Menu } from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import { Sheet, SheetContent } from '@/components/ui/sheet';

interface AppShellProps {
  children: React.ReactNode;
}

const AppShell = ({ children }: AppShellProps) => {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <aside className="hidden md:flex fixed inset-y-0 left-0 w-64 z-40">
        <Sidebar />
      </aside>

      <header
        className="md:hidden sticky top-0 z-30 flex items-center justify-between h-14 px-4 border-b border-border bg-background"
      >
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          className="p-2 -ml-2 rounded-md hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          aria-label="Open navigation menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        <span className="text-lg font-extrabold font-display lowercase tracking-tight">quipp</span>
        <span className="w-9" aria-hidden />
      </header>

      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetContent side="left" className="p-0 w-72 border-r-0 bg-transparent">
          <Sidebar onNavigate={() => setDrawerOpen(false)} />
        </SheetContent>
      </Sheet>

      <main className="md:pl-64">
        <div className="min-h-[calc(100vh-3.5rem)] md:min-h-screen">{children}</div>
      </main>
    </div>
  );
};

export default AppShell;
