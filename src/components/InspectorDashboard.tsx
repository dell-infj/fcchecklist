import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ClipboardList, Truck, CheckCircle, Clock, Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface Vehicle {
  id: string;
  vehicle_category: string;
  owner_unique_id: string;
  license_plate?: string;
  model?: string;
  status: string;
}

interface MyChecklist {
  id: string;
  status: string;
  inspection_date: string;
  vehicle: {
    vehicle_category: string;
    owner_unique_id: string;
  };
}

const InspectorDashboard = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [myChecklists, setMyChecklists] = useState<MyChecklist[]>([]);
  const [stats, setStats] = useState({
    pending: 0,
    completed: 0,
    todayCompleted: 0
  });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (profile) {
      loadInspectorData();
    }
  }, [profile]);

  const loadInspectorData = async () => {
    try {
      // Get all active vehicles
      // Usar any temporariamente para contornar problemas de tipo
      const { data: vehicleData }: any = await supabase
        .from('vehicles')
        .select('id, vehicle_category, owner_unique_id, license_plate, model, status')
        .eq('status', 'active')
        .order('vehicle_category');

      // Get my checklists
      // Usar any temporariamente para contornar problemas de tipo
      const { data: checklistData }: any = await supabase
        .from('checklists')
        .select(`
          id,
          status,
          inspection_date,
          vehicles (
            vehicle_category,
            owner_unique_id
          )
        `)
        .eq('inspector_id', profile?.id)
        .order('created_at', { ascending: false })
        .limit(10);

      // Calculate stats
      const today = new Date().toISOString().split('T')[0];
      const pending = checklistData?.filter(c => c.status === 'draft').length || 0;
      const completed = checklistData?.filter(c => c.status === 'completed').length || 0;
      const todayCompleted = checklistData?.filter(
        c => c.status === 'completed' && c.inspection_date === today
      ).length || 0;

      setVehicles(vehicleData || []);
      setMyChecklists(checklistData?.map(item => ({
        id: item.id,
        status: item.status,
        inspection_date: item.inspection_date,
        vehicle: {
          vehicle_category: item.vehicles?.vehicle_category || '',
          owner_unique_id: item.vehicles?.owner_unique_id || ''
        }
      })) || []);
      setStats({ pending, completed, todayCompleted });

    } catch (error) {
      console.error('Error loading inspector data:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar dados do inspetor",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const startNewInspection = async (vehicleId: string) => {
    try {
      // Navegar diretamente para a página de novo checklist com o veículo selecionado
      navigate(`/checklist/new?vehicle=${vehicleId}`);
    } catch (error) {
      console.error('Error starting inspection:', error);
      toast({
        title: "Erro",
        description: "Erro ao iniciar nova inspeção",
        variant: "destructive"
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="default" className="bg-success">Concluído</Badge>;
      case 'draft':
        return <Badge variant="secondary">Em Andamento</Badge>;
      case 'reviewed':
        return <Badge variant="outline">Revisado</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-16 bg-muted rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6 px-4">
      <div className="flex flex-col gap-3">
        <div>
          <h2 className="text-xl font-bold">Painel do Inspetor</h2>
          <p className="text-muted-foreground text-sm">
            Bem-vindo, {profile?.first_name}! Gerencie suas inspeções aqui.
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4">
        <Card className="shadow-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-warning/10 rounded-lg">
                <Clock className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Pendentes</p>
                <p className="text-xl font-bold">{stats.pending}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-success/10 rounded-lg">
                <CheckCircle className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Concluídas</p>
                <p className="text-xl font-bold">{stats.completed}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <ClipboardList className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Hoje</p>
                <p className="text-xl font-bold">{stats.todayCompleted}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Vehicles List */}
      <Card className="shadow-card" data-vehicles-section>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5" />
            Veículos Disponíveis
          </CardTitle>
        </CardHeader>
        <CardContent>
          {vehicles.length === 0 ? (
            <p className="text-muted-foreground text-center py-6">
              Nenhum veículo disponível para inspeção
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {vehicles.map((vehicle) => (
                <Card key={vehicle.id} className="border">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold">
                          {vehicle.vehicle_category} - {vehicle.license_plate || 'Sem placa'}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {vehicle.owner_unique_id}
                        </p>
                        {vehicle.model && (
                          <p className="text-xs text-muted-foreground">
                            {vehicle.model}
                          </p>
                        )}
                      </div>
                      <Button 
                        size="sm" 
                        onClick={() => startNewInspection(vehicle.id)}
                        variant="safety"
                        className="gap-2 w-full h-10"
                      >
                        <Plus className="h-4 w-4" />
                        Iniciar Inspeção
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* My Checklists */}
      <Card className="shadow-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5" />
              Minhas Inspeções
            </CardTitle>
            {myChecklists.length > 0 && (
              <div className="flex flex-col gap-2">
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="gap-2 w-full h-10"
                  onClick={() => toast({
                    title: "Em desenvolvimento",
                    description: "Funcionalidade de filtros será implementada em breve"
                  })}
                >
                  <ClipboardList className="h-4 w-4" />
                  Ver Todas
                </Button>
                 <Button 
                   size="sm" 
                   variant="default" 
                   className="gap-2 w-full h-10"
                   onClick={() => navigate('/checklist/new')}
                 >
                   <Plus className="h-4 w-4" />
                   Nova Inspeção
                 </Button>
                 <Button 
                   size="sm" 
                   variant="outline" 
                   className="gap-2 w-full h-10"
                   onClick={() => navigate('/vehicles')}
                 >
                   <Truck className="h-4 w-4" />
                   Ver Veículos
                 </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {myChecklists.length === 0 ? (
            <div className="text-center py-12">
              <div className="mx-auto w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-4">
                <ClipboardList className="h-12 w-12 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium mb-2">Nenhuma inspeção encontrada</h3>
              <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                Comece selecionando um veículo acima para criar sua primeira inspeção.
              </p>
              <Button 
                variant="default" 
                className="gap-2"
                onClick={() => navigate('/checklist/new')}
              >
                <Plus className="h-4 w-4" />
                Criar Primeira Inspeção
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {myChecklists.map((checklist) => (
                <div key={checklist.id} className="flex items-center justify-between p-4 bg-secondary/50 rounded-lg">
                  <div>
                    <p className="font-medium">
                      {checklist.vehicle.vehicle_category}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {checklist.vehicle.owner_unique_id}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(checklist.inspection_date).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(checklist.status)}
                     {checklist.status === 'draft' && (
                       <Button 
                         size="sm" 
                         variant="outline"
                         onClick={() => navigate(`/checklist/edit/${checklist.id}`)}
                       >
                         Continuar
                       </Button>
                     )}
                     {checklist.status === 'completed' && (
                       <Button 
                         size="sm" 
                         variant="outline"
                         onClick={() => navigate(`/checklist/view/${checklist.id}`)}
                       >
                         Ver Relatório
                       </Button>
                     )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default InspectorDashboard;