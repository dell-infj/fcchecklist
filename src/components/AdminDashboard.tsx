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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
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
  const [isAddingVehicle, setIsAddingVehicle] = useState(false);
  const [uploadingPdf, setUploadingPdf] = useState(false);
  const [availableCompanies, setAvailableCompanies] = useState<string[]>([]);
  const [newVehicle, setNewVehicle] = useState({
    vehicle_category: '',
    owner_unique_id: '',
    license_plate: '',
    model: '',
    year: new Date().getFullYear(),
    fuel_type: '',
    chassis: '',
    renavam: '',
    crv_number: '',
    crlv_pdf_url: '',
    status: 'active' as const
  });
  

  useEffect(() => {
    fetchData();
    fetchAvailableCompanies();
  }, []);

  const fetchAvailableCompanies = async () => {
    if (!profile) return;
    
    // Usar Set para remover duplicatas
    const companies = [...new Set([profile.unique_id, ...(profile.company_ids || [])].filter(Boolean))];
    setAvailableCompanies(companies);
  };

  const handlePdfUploadForNew = async (file: File) => {
    if (!file || file.type !== 'application/pdf') {
      toast({
        title: "Erro",
        description: "Por favor, selecione um arquivo PDF válido",
        variant: "destructive"
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Erro", 
        description: "O arquivo deve ter no máximo 5MB",
        variant: "destructive"
      });
      return;
    }

    try {
      setUploadingPdf(true);
      const fileExt = 'pdf';
      const fileName = `${user?.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('crlv-pdfs')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('crlv-pdfs')
        .getPublicUrl(fileName);

      setNewVehicle(prev => ({ ...prev, crlv_pdf_url: data.publicUrl }));
      
      toast({
        title: "Sucesso",
        description: "PDF do CRLV anexado com sucesso!"
      });
    } catch (error) {
      console.error('Error uploading PDF:', error);
      toast({
        title: "Erro",
        description: "Erro ao anexar PDF",
        variant: "destructive"
      });
    } finally {
      setUploadingPdf(false);
    }
  };

  const handleAddVehicle = async () => {
    if (!newVehicle.vehicle_category || !newVehicle.owner_unique_id || !newVehicle.license_plate || !newVehicle.model) {
      toast({
        title: "Erro",
        description: "Por favor, preencha todos os campos obrigatórios: Categoria, Empresa Proprietária, Placa e Modelo",
        variant: "destructive"
      });
      return;
    }

    try {
      // Usar a empresa selecionada como proprietária
      const vehicleData: any = {
        vehicle_category: newVehicle.vehicle_category,
        owner_unique_id: newVehicle.owner_unique_id,
        license_plate: newVehicle.license_plate,
        model: newVehicle.model,
        year: newVehicle.year,
        fuel_type: newVehicle.fuel_type,
        chassis: newVehicle.chassis,
        renavam: newVehicle.renavam,
        crv_number: newVehicle.crv_number,
        crlv_pdf_url: newVehicle.crlv_pdf_url,
        status: newVehicle.status,
        unique_id: profile?.unique_id || ''
      };

      const { error } = await supabase
        .from('vehicles')
        .insert([vehicleData]);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Veículo cadastrado com sucesso!"
      });

      setNewVehicle({
        vehicle_category: '',
        owner_unique_id: '',
        license_plate: '',
        model: '',
        year: new Date().getFullYear(),
        fuel_type: '',
        chassis: '',
        renavam: '',
        crv_number: '',
        crlv_pdf_url: '',
        status: 'active' as const
      });
      setIsAddingVehicle(false);
      fetchData(); // Refresh data after adding vehicle
    } catch (error) {
      console.error('Error adding vehicle:', error);
      toast({
        title: "Erro",
        description: "Erro ao cadastrar veículo",
        variant: "destructive"
      });
    }
  };

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
          className="cursor-pointer hover:bg-accent transition-all duration-300 hover:scale-105 hover:shadow-lg animate-fade-in"
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
          className="cursor-pointer hover:bg-accent transition-all duration-300 hover:scale-105 hover:shadow-lg animate-fade-in [animation-delay:100ms]"
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
          className="cursor-pointer hover:bg-accent transition-all duration-300 hover:scale-105 hover:shadow-lg animate-fade-in [animation-delay:200ms]"
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
            <CommandItem 
              onSelect={() => { navigate('/vehicles'); setOpenCommand(null); }}
              className="hover:scale-105 transition-all duration-300"
            >
              <Car className="mr-2 h-4 w-4" />
              Painel Veículos
            </CommandItem>
            <CommandItem 
              onSelect={() => { setIsAddingVehicle(true); setOpenCommand(null); }}
              className="hover:scale-105 transition-all duration-300"
            >
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
            <CommandItem 
              onSelect={() => { navigate('/checklist/new'); setOpenCommand(null); }}
              className="hover:scale-105 transition-all duration-300"
            >
              <FileText className="mr-2 h-4 w-4" />
              Nova Inspeção
            </CommandItem>
            <CommandItem 
              onSelect={() => { navigate('/inspectors'); setOpenCommand(null); }}
              className="hover:scale-105 transition-all duration-300"
            >
              <Users className="mr-2 h-4 w-4" />
              Lista de Inspetores
            </CommandItem>
            <CommandItem 
              onSelect={() => { navigate('/checklists'); setOpenCommand(null); }}
              className="hover:scale-105 transition-all duration-300"
            >
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
            <CommandItem 
              onSelect={() => { navigate('/reports'); setOpenCommand(null); }}
              className="hover:scale-105 transition-all duration-300"
            >
              <BarChart3 className="mr-2 h-4 w-4" />
              Histórico
            </CommandItem>
            <CommandItem 
              onSelect={() => { navigate('/checklist-editor'); setOpenCommand(null); }}
              className="hover:scale-105 transition-all duration-300"
            >
              <ClipboardList className="mr-2 h-4 w-4" />
              Editor
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>

      {/* Vehicle Registration Modal */}
      <Dialog open={isAddingVehicle} onOpenChange={setIsAddingVehicle}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Cadastrar Novo Veículo</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="vehicle_category">Categoria *</Label>
                <Select value={newVehicle.vehicle_category} onValueChange={(value) => setNewVehicle(prev => ({ ...prev, vehicle_category: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="carro">Carro</SelectItem>
                    <SelectItem value="caminhao">Caminhão</SelectItem>
                    <SelectItem value="moto">Moto</SelectItem>
                    <SelectItem value="retroescavadeira">Retroescavadeira</SelectItem>
                    <SelectItem value="passageiro">Passageiro</SelectItem>
                    <SelectItem value="onibus">Ônibus</SelectItem>
                    <SelectItem value="trator">Trator</SelectItem>
                    <SelectItem value="outros">Outros</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="owner_unique_id">Empresa Proprietária *</Label>
                <Select value={newVehicle.owner_unique_id} onValueChange={(value) => setNewVehicle(prev => ({ ...prev, owner_unique_id: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a empresa proprietária" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableCompanies.map((company, index) => (
                      <SelectItem key={`owner-${index}-${company}`} value={company}>
                        {company}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="license_plate">Placa *</Label>
                <Input
                  id="license_plate"
                  value={newVehicle.license_plate}
                  onChange={(e) => setNewVehicle(prev => ({ ...prev, license_plate: e.target.value }))}
                  placeholder="ABC-1234"
                />
              </div>
              <div>
                <Label htmlFor="model">Modelo *</Label>
                <Input
                  id="model"
                  value={newVehicle.model}
                  onChange={(e) => setNewVehicle(prev => ({ ...prev, model: e.target.value }))}
                  placeholder="Modelo do veículo"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="year">Ano</Label>
                <Input
                  id="year"
                  type="number"
                  value={newVehicle.year}
                  onChange={(e) => setNewVehicle(prev => ({ ...prev, year: parseInt(e.target.value) }))}
                  placeholder="Ano do veículo"
                />
              </div>
              <div>
                <Label htmlFor="fuel_type">Combustível</Label>
                <Select value={newVehicle.fuel_type} onValueChange={(value) => setNewVehicle(prev => ({ ...prev, fuel_type: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o combustível" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gasolina">Gasolina</SelectItem>
                    <SelectItem value="etanol">Etanol</SelectItem>
                    <SelectItem value="diesel-s10">Diesel S10</SelectItem>
                    <SelectItem value="ev">EV (Elétrico)</SelectItem>
                    <SelectItem value="gnv">GNV</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="chassis">Chassi</Label>
                <Input
                  id="chassis"
                  value={newVehicle.chassis}
                  onChange={(e) => setNewVehicle(prev => ({ ...prev, chassis: e.target.value }))}
                  placeholder="Número do chassi"
                />
              </div>
              <div>
                <Label htmlFor="renavam">Renavam</Label>
                <Input
                  id="renavam"
                  value={newVehicle.renavam}
                  onChange={(e) => setNewVehicle(prev => ({ ...prev, renavam: e.target.value }))}
                  placeholder="Número do Renavam"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="crv_number">Número CRV</Label>
              <Input
                id="crv_number"
                value={newVehicle.crv_number}
                onChange={(e) => setNewVehicle(prev => ({ ...prev, crv_number: e.target.value }))}
                placeholder="Número do CRV"
              />
            </div>

            <div>
              <Label htmlFor="crlv_pdf">PDF do CRLV (até 5MB)</Label>
              <Input
                id="crlv_pdf"
                type="file"
                accept=".pdf"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handlePdfUploadForNew(file);
                }}
                disabled={uploadingPdf}
              />
              {uploadingPdf && <p className="text-sm text-muted-foreground">Enviando PDF...</p>}
              {newVehicle.crlv_pdf_url && <p className="text-sm text-green-600">PDF anexado com sucesso!</p>}
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsAddingVehicle(false)}>
                Cancelar
              </Button>
              <Button onClick={handleAddVehicle}>
                Cadastrar Veículo
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Recent Checklists */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <ClipboardList className="w-5 h-5" />
                Checklists Recentes
              </CardTitle>
              <CardDescription>
                Últimas inspeções registradas no sistema
              </CardDescription>
            </div>
            {recentChecklists.length > 0 && (
              <Button 
                onClick={() => navigate('/checklist/new')}
                className="flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Nova Inspeção
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {recentChecklists.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <div className="text-center space-y-2">
                <ClipboardList className="w-16 h-16 mx-auto text-muted-foreground" />
                <p className="text-lg font-medium text-muted-foreground">
                  Nenhum checklist encontrado
                </p>
                <p className="text-sm text-muted-foreground">
                  Comece criando sua primeira inspeção
                </p>
              </div>
              <Button 
                onClick={() => navigate('/checklist/new')}
                className="flex items-center gap-2 px-8 py-3 text-lg hover:scale-105 transition-all duration-300 hover:shadow-lg animate-scale-in"
                size="lg"
              >
                <Plus className="w-5 h-5 animate-pulse" />
                Nova Inspeção
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {recentChecklists.map((checklist, index) => (
                <div 
                  key={checklist.id} 
                  className="flex items-center justify-between p-4 bg-secondary/50 rounded-lg hover:bg-secondary/70 transition-all duration-300 hover:scale-[1.02] hover:shadow-md animate-fade-in cursor-pointer"
                  style={{ animationDelay: `${index * 100}ms` }}
                  onClick={() => navigate(`/checklist/view/${checklist.id}`)}
                >
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