import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { useTheme } from 'next-themes';
import ProfileDrawer from './ProfileDrawer';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const { theme } = useTheme();

  if (!user || !profile) {
    navigate('/auth');
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-accent/5">
      {/* Header */}
      <header className="bg-card border-b border-border shadow-warm backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 flex items-center justify-center">
                <img 
                  src={theme === 'dark' ? "/lovable-uploads/e4375a80-1834-4afe-9de6-2f916ac8402a.png" : "/lovable-uploads/3ff7c9af-3109-4509-bc5c-81649a11772f.png"}
                  alt="FC Gestão Logo" 
                  className="w-16 h-16 object-contain"
                />
              </div>
              <div className="space-y-0 flex flex-col justify-center">
                <h1 className="text-2xl font-black text-foreground tracking-wider leading-none">FROTA</h1>
                <p className="text-sm text-muted-foreground -mt-4">Sistema de checklist</p>
              </div>
            </div>
            
            <ProfileDrawer />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        {children}
      </main>
    </div>
  );
};

export default Layout;