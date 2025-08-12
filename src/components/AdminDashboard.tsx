import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Car, Users, FileText, BarChart3, Edit, ClipboardList, UserCheck, ChartBar } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

interface RecentChecklist {
  id: string;
  vehicle: {
    vehicle_category: string;
    owner_unique_id: string;
    license_plate: string;
  };
  inspector: {
    first_name: string;
    last_name: string;
  };
  status: string;
  inspection_date: string;
}

interface DashboardStats {
  vehicles: number;
  checklists: number;
  inspectors: number;
  completedToday: number;
  activeInspections: number;
}

export default function AdminDashboard() {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [stats, setStats] = useState<DashboardStats>({
    vehicles: 0,
    checklists: 0,
    inspectors: 0,
    completedToday: 0,
    activeInspections: 0
  });
  
  const [recentChecklists, setRecentChecklists] = useState<RecentChecklist[]>([]);
  

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [vehiclesData, checklistsData, profilesData] = await Promise.all([
        supabase.from('vehicles').select('*').order('created_at', { ascending: false }),
        supabase.from('checklists').select('*').order('created_at', { ascending: false }),
        supabase.from('profiles').select('*').eq('role', 'inspector')
      ]);

      // Get recent checklists with related data - usar any temporariamente
      const { data: recentData }: any = await supabase
        .from('checklists')
        .select(`
          id,
          status,
          inspection_date,
          vehicles!inner (
            vehicle_category,
            owner_unique_id,
            license_plate
          ),
          profiles!inner (
            first_name,
            last_name
          )
        `)
        .order('created_at', { ascending: false })
        .limit(5);

      const today = new Date().toISOString().split('T')[0];
      const stats = {
        vehicles: vehiclesData.data?.length || 0,
        checklists: checklistsData.data?.length || 0,
        inspectors: profilesData.data?.length || 0,
        completedToday: checklistsData.data?.filter(c => 
          c.status === 'completed' && 
          c.inspection_date === today
        ).length || 0,
        activeInspections: checklistsData.data?.filter(c => c.status === 'draft').length || 0
      };

      setStats(stats);
      setRecentChecklists(recentData?.map((item: any) => ({
        id: item.id,
        status: item.status,
        inspection_date: item.inspection_date,
        vehicle: {
          vehicle_category: item.vehicles?.vehicle_category || '',
          owner_unique_id: item.vehicles?.owner_unique_id || '',
          license_plate: item.vehicles?.license_plate || ''
        },
        inspector: {
          first_name: item.profiles?.first_name || '',
          last_name: item.profiles?.last_name || ''
        }
      })) || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };


  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="default" className="bg-success">Concluído</Badge>;
      case 'draft':
        return <Badge variant="secondary">Rascunho</Badge>;
      case 'reviewed':
        return <Badge variant="outline">Revisado</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };


  return (
    <div className="space-y-6 px-4">
      {/* Header com botões de navegação */}
      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-xl font-bold">Dashboard Administrativo</h2>
            <p className="text-muted-foreground text-sm">Visão geral da frota e inspeções</p>
          </div>
          
          {/* Botões de navegação - ícones pequenos no desktop */}
          <div className="hidden md:flex gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => navigate('/checklist/new')}
              className="gap-2"
            >
              <UserCheck className="w-4 h-4" />
              <span className="hidden lg:inline">Inspetor</span>
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => navigate('/vehicles')}
              className="gap-2"
            >
              <Car className="w-4 h-4" />
              <span className="hidden lg:inline">Gerenciar Veículos</span>
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => navigate('/reports')}
              className="gap-2"
            >
              <ChartBar className="w-4 h-4" />
              <span className="hidden lg:inline">Relatórios</span>
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => navigate('/checklist-editor')}
              className="gap-2"
            >
              <Edit className="w-4 h-4" />
              <span className="hidden lg:inline">Editor</span>
            </Button>
          </div>
        </div>
        
        
        {/* Botões mobile - visíveis apenas no mobile */}
        <div className="md:hidden flex flex-col gap-2">
          <Button 
            variant="outline" 
            className="w-full h-12 gap-2"
            onClick={() => navigate('/checklist/new')}
          >
            <UserCheck className="h-4 w-4" />
            Painel Inspetor
          </Button>
          <Button 
            variant="outline" 
            className="w-full h-12 gap-2"
            onClick={() => navigate('/vehicles')}
          >
            <Car className="h-4 w-4" />
            Gerenciar Veículos
          </Button>
          <Button 
            variant="outline" 
            className="w-full h-12 gap-2"
            onClick={() => navigate('/reports')}
          >
            <ChartBar className="h-4 w-4" />
            Relatórios
          </Button>
          <Button 
            variant="outline" 
            className="w-full h-12 gap-2"
            onClick={() => navigate('/checklist-editor')}
          >
            <Edit className="h-4 w-4" />
            Editor de Checklist
          </Button>
        </div>

      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <Card 
          className="cursor-pointer hover:bg-accent transition-colors"
          onClick={() => navigate('/vehicles')}
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Car className="w-5 h-5" />
              Veículos
            </CardTitle>
            <CardDescription>
              {stats.vehicles} veículos cadastrados
            </CardDescription>
          </CardHeader>
        </Card>

        <Card className="cursor-pointer hover:bg-accent transition-colors">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Checklists
            </CardTitle>
            <CardDescription>
              {stats.checklists} inspeções registradas
            </CardDescription>
          </CardHeader>
        </Card>

        <Card className="cursor-pointer hover:bg-accent transition-colors">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Inspetores
            </CardTitle>
            <CardDescription>
              {stats.inspectors} inspetores ativos
            </CardDescription>
          </CardHeader>
        </Card>

        <Card className="cursor-pointer hover:bg-accent transition-colors">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Concluídas Hoje
            </CardTitle>
            <CardDescription>
              {stats.completedToday} inspeções concluídas
            </CardDescription>
          </CardHeader>
        </Card>

        <Card className="cursor-pointer hover:bg-accent transition-colors">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardList className="w-5 h-5" />
              Em Andamento
            </CardTitle>
            <CardDescription>
              {stats.activeInspections} inspeções ativas
            </CardDescription>
          </CardHeader>
        </Card>
      </div>

      {/* Recent Checklists */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardList className="w-5 h-5" />
            Checklists Recentes
          </CardTitle>
          <CardDescription>
            Últimas inspeções registradas no sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          {recentChecklists.length === 0 ? (
            <p className="text-muted-foreground text-center py-6">
              Nenhum checklist encontrado
            </p>
          ) : (
            <div className="space-y-4">
              {recentChecklists.map((checklist) => (
                <div key={checklist.id} className="flex items-center justify-between p-4 bg-secondary/50 rounded-lg">
                  <div>
                    <p className="font-medium">
                      {checklist.vehicle.vehicle_category} - {checklist.vehicle.license_plate}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Proprietário: {checklist.vehicle.owner_unique_id}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Inspetor: {checklist.inspector.first_name} {checklist.inspector.last_name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(checklist.inspection_date).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(checklist.status)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}