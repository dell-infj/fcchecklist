import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LogOut, User, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

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
                  src="/lovable-uploads/3ff7c9af-3109-4509-bc5c-81649a11772f.png" 
                  alt="FC Gestão Logo" 
                  className="w-16 h-16 object-contain"
                />
              </div>
              <div>
                <h1 className="text-2xl font-black text-foreground tracking-wider">FROTA</h1>
                <p className="text-sm text-muted-foreground">Sistema de checklist</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <Card 
                className="px-4 py-2 cursor-pointer hover:bg-accent transition-colors"
                onClick={() => navigate('/profile')}
              >
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-primary" />
                  <div className="text-sm">
                    <div className="font-medium">
                      {profile.first_name} {profile.last_name}
                    </div>
                    <div className="text-xs text-muted-foreground capitalize">
                      {profile.role === 'admin' ? 'Administrador' : 'Inspetor'}
                    </div>
                  </div>
                </div>
              </Card>
              
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleSignOut}
                className="gap-2"
              >
                <LogOut className="h-4 w-4" />
                Sair
              </Button>
            </div>
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