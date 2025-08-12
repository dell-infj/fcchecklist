import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Plus, Car, Users, FileText, BarChart3, Edit, Trash2, Settings, ClipboardList, UserCheck, ChartBar } from 'lucide-react';
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
  
  const [uploadingPdf, setUploadingPdf] = useState(false);
  const [availableCompanies, setAvailableCompanies] = useState<string[]>([]);
  const [isAddingVehicle, setIsAddingVehicle] = useState(false);

  useEffect(() => {
    fetchData();
    fetchAvailableCompanies();
  }, []);

  const fetchAvailableCompanies = async () => {
    if (!profile) return;
    
    const companies = [profile.unique_id, ...(profile.company_ids || [])].filter(Boolean);
    setAvailableCompanies(companies);
  };

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

  const handlePdfUpload = async (file: File) => {
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
      fetchData();
    } catch (error) {
      console.error('Error adding vehicle:', error);
      toast({
        title: "Erro",
        description: "Erro ao cadastrar veículo",
        variant: "destructive"
      });
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

        <div className="flex flex-col gap-2">
          <Dialog open={isAddingVehicle} onOpenChange={setIsAddingVehicle}>
            <DialogTrigger asChild>
              <Button variant="default" className="gap-2 w-full h-12">
                <Plus className="h-4 w-4" />
                Novo Veículo
              </Button>
            </DialogTrigger>
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
                      if (file) handlePdfUpload(file);
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

          <Button 
            variant="outline" 
            className="w-full h-12 gap-2"
            onClick={() => navigate('/vehicles')}
          >
            <Settings className="h-4 w-4" />
            Gerenciar Veículos
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