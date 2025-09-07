import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Home, ArrowLeft } from "lucide-react";
import Layout from "@/components/Layout";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <Layout>
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center space-y-6 fade-in-up">
          <div className="space-y-4">
            <h1 className="text-6xl font-black text-primary">404</h1>
            <h2 className="text-2xl font-bold text-foreground">Página não encontrada</h2>
            <p className="text-lg text-muted-foreground max-w-md mx-auto">
              A página que você está procurando não existe ou foi movida.
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              onClick={() => navigate('/')}
              className="gap-2 hover:scale-105 transition-all duration-300 hover:shadow-lg"
              size="lg"
            >
              <Home className="h-5 w-5" />
              Ir para o Dashboard
            </Button>
            
            <Button 
              onClick={() => navigate(-1)}
              variant="outline"
              className="gap-2 hover:scale-105 transition-all duration-300 hover:shadow-lg"
              size="lg"
            >
              <ArrowLeft className="h-5 w-5" />
              Voltar
            </Button>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default NotFound;
