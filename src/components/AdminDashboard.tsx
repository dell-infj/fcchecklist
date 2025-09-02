import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from '@/components/ui/command';
import { Car, Users, FileText, BarChart3, ClipboardList, Plus } from 'lucide-react';
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
  
  const [recentChecklists, setRecentChecklists] = useState<RecentChecklist[]>([]);
  const [openCommand, setOpenCommand] = useState<'vehicles' | 'inspection' | 'reports' | null>(null);
  

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
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
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold">Dashboard Administrativo</h2>
        <p className="text-muted-foreground text-sm">Visão geral da frota e inspeções</p>
      </div>

      {/* Main Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card 
          className="cursor-pointer hover:bg-accent transition-colors"
          onClick={() => setOpenCommand('vehicles')}
        >
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Car className="w-8 h-8" />
                <span>Veículos</span>
              </div>
              <Plus className="w-6 h-6 text-muted-foreground" />
            </CardTitle>
            <CardDescription>
              Gerenciar frota de veículos
            </CardDescription>
          </CardHeader>
        </Card>

        <Card 
          className="cursor-pointer hover:bg-accent transition-colors"
          onClick={() => setOpenCommand('inspection')}
        >
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-8 h-8" />
                <span>Inspeção</span>
              </div>
              <Plus className="w-6 h-6 text-muted-foreground" />
            </CardTitle>
            <CardDescription>
              Criar e gerenciar inspeções
            </CardDescription>
          </CardHeader>
        </Card>

        <Card 
          className="cursor-pointer hover:bg-accent transition-colors"
          onClick={() => setOpenCommand('reports')}
        >
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-8 h-8" />
                <span>Relatórios</span>
              </div>
              <Plus className="w-6 h-6 text-muted-foreground" />
            </CardTitle>
            <CardDescription>
              Histórico e análises
            </CardDescription>
          </CardHeader>
        </Card>
      </div>

      {/* Command Dialogs */}
      <CommandDialog open={openCommand === 'vehicles'} onOpenChange={() => setOpenCommand(null)}>
        <CommandInput placeholder="Digite um comando..." />
        <CommandList>
          <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>
          <CommandGroup heading="Veículos">
            <CommandItem onSelect={() => { navigate('/vehicles'); setOpenCommand(null); }}>
              <Car className="mr-2 h-4 w-4" />
              Painel Veículos
            </CommandItem>
            <CommandItem onSelect={() => { /* TODO: Open vehicle form */; setOpenCommand(null); }}>
              <Plus className="mr-2 h-4 w-4" />
              Cadastrar Veículo
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>

      <CommandDialog open={openCommand === 'inspection'} onOpenChange={() => setOpenCommand(null)}>
        <CommandInput placeholder="Digite um comando..." />
        <CommandList>
          <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>
          <CommandGroup heading="Inspeção">
            <CommandItem onSelect={() => { navigate('/checklist/new'); setOpenCommand(null); }}>
              <FileText className="mr-2 h-4 w-4" />
              Nova Inspeção
            </CommandItem>
            <CommandItem onSelect={() => { navigate('/inspectors'); setOpenCommand(null); }}>
              <Users className="mr-2 h-4 w-4" />
              Lista de Inspetores
            </CommandItem>
            <CommandItem onSelect={() => { navigate('/checklists'); setOpenCommand(null); }}>
              <ClipboardList className="mr-2 h-4 w-4" />
              Histórico
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>

      <CommandDialog open={openCommand === 'reports'} onOpenChange={() => setOpenCommand(null)}>
        <CommandInput placeholder="Digite um comando..." />
        <CommandList>
          <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>
          <CommandGroup heading="Relatórios">
            <CommandItem onSelect={() => { navigate('/reports'); setOpenCommand(null); }}>
              <BarChart3 className="mr-2 h-4 w-4" />
              Histórico
            </CommandItem>
            <CommandItem onSelect={() => { navigate('/checklist-editor'); setOpenCommand(null); }}>
              <ClipboardList className="mr-2 h-4 w-4" />
              Editor
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>

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