import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Truck, CheckCircle, AlertCircle, Users, Plus, FileText } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface DashboardStats {
  totalVehicles: number;
  activeInspections: number;
  completedToday: number;
  totalInspectors: number;
}

interface RecentChecklist {
  id: string;
  vehicle: {
    truck_number: string;
    customer_name: string;
  };
  inspector: {
    first_name: string;
    last_name: string;
  };
  status: string;
  inspection_date: string;
}

const AdminDashboard = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalVehicles: 0,
    activeInspections: 0,
    completedToday: 0,
    totalInspectors: 0
  });
  const [recentChecklists, setRecentChecklists] = useState<RecentChecklist[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      // Get total vehicles
      const { count: vehicleCount } = await supabase
        .from('vehicles')
        .select('*', { count: 'exact', head: true });

      // Get total inspectors
      const { count: inspectorCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'inspector');

      // Get checklists for today
      const today = new Date().toISOString().split('T')[0];
      const { data: todayChecklists, count: todayCount } = await supabase
        .from('checklists')
        .select('*', { count: 'exact' })
        .eq('inspection_date', today);

      // Get active (draft) inspections
      const { count: activeCount } = await supabase
        .from('checklists')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'draft');

      // Get recent checklists with related data
      const { data: recentData } = await supabase
        .from('checklists')
        .select(`
          id,
          status,
          inspection_date,
          vehicles (
            truck_number,
            customer_name
          ),
          profiles (
            first_name,
            last_name
          )
        `)
        .order('created_at', { ascending: false })
        .limit(5);

      setStats({
        totalVehicles: vehicleCount || 0,
        activeInspections: activeCount || 0,
        completedToday: todayCount || 0,
        totalInspectors: inspectorCount || 0
      });

      setRecentChecklists(recentData?.map(item => ({
        id: item.id,
        status: item.status,
        inspection_date: item.inspection_date,
        vehicle: {
          truck_number: item.vehicles?.truck_number || '',
          customer_name: item.vehicles?.customer_name || ''
        },
        inspector: {
          first_name: item.profiles?.first_name || '',
          last_name: item.profiles?.last_name || ''
        }
      })) || []);

    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar dados do dashboard",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
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

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Dashboard Administrativo</h2>
          <p className="text-muted-foreground">Visão geral da frota e inspeções</p>
        </div>
        <div className="flex gap-2">
          <Button variant="warm" className="gap-2">
            <Plus className="h-4 w-4" />
            Novo Veículo
          </Button>
          <Button variant="outline" className="gap-2">
            <FileText className="h-4 w-4" />
            Relatórios
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="shadow-fleet hover-lift warm-glow">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-lg">
                <Truck className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total de Veículos</p>
                <p className="text-2xl font-bold">{stats.totalVehicles}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-fleet hover-lift">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-warning/10 rounded-lg">
                <AlertCircle className="h-6 w-6 text-warning" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Inspeções Ativas</p>
                <p className="text-2xl font-bold">{stats.activeInspections}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-fleet hover-lift">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-success/10 rounded-lg">
                <CheckCircle className="h-6 w-6 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Concluídas Hoje</p>
                <p className="text-2xl font-bold">{stats.completedToday}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-fleet hover-lift warm-glow">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-accent/10 rounded-lg">
                <Users className="h-6 w-6 text-accent" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Inspetores</p>
                <p className="text-2xl font-bold">{stats.totalInspectors}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Checklists */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Checklists Recentes
          </CardTitle>
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
                  <div className="flex items-center gap-4">
                    <div>
                      <p className="font-medium">
                        Caminhão {checklist.vehicle.truck_number}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {checklist.vehicle.customer_name}
                      </p>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      <p>Inspetor: {checklist.inspector.first_name} {checklist.inspector.last_name}</p>
                      <p>Data: {new Date(checklist.inspection_date).toLocaleDateString('pt-BR')}</p>
                    </div>
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
};

export default AdminDashboard;