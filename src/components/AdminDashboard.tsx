import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Truck, CheckCircle, AlertCircle, Users, Plus, FileText, Check, ChevronsUpDown } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

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
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalVehicles: 0,
    activeInspections: 0,
    completedToday: 0,
    totalInspectors: 0
  });
  const [recentChecklists, setRecentChecklists] = useState<RecentChecklist[]>([]);
  const [loading, setLoading] = useState(true);
  const [isVehicleDialogOpen, setIsVehicleDialogOpen] = useState(false);
  const [isInspectorDialogOpen, setIsInspectorDialogOpen] = useState(false);
  const [companyIdSearchOpen, setCompanyIdSearchOpen] = useState(false);
  const [userSearchOpen, setUserSearchOpen] = useState(false);
  const [searchUsers, setSearchUsers] = useState<any[]>([]);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [newVehicle, setNewVehicle] = useState({
    vehicle_category: '',
    customer_name: '',
    license_plate: '',
    model: '',
    year: '',
    customer_phone: ''
  });
  const [newInspector, setNewInspector] = useState({
    user_id: '', // Para usuário existente
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    phone: '',
    company_id: '',
    is_existing_user: false // Flag para saber se é usuário existente ou novo
  });
  const { toast } = useToast();

  useEffect(() => {
    loadDashboardData();
  }, []);

  // Pesquisar usuários existentes
  useEffect(() => {
    const searchExistingUsers = async () => {
      if (userSearchQuery.length < 2) {
        setSearchUsers([]);
        return;
      }

      try {
        const { data } = await supabase
          .from('profiles')
          .select('id, user_id, first_name, last_name, role')
          .neq('role', 'inspector') // Excluir quem já é inspetor
          .or(`first_name.ilike.%${userSearchQuery}%,last_name.ilike.%${userSearchQuery}%`)
          .limit(10);

        // Buscar emails dos usuários (simplificado)
        const usersWithEmails = (data || []).map(profile => ({
          ...profile,
          email: `${profile.first_name.toLowerCase()}.${profile.last_name.toLowerCase()}@email.com` // Placeholder
        }));

        setSearchUsers(usersWithEmails);
      } catch (error) {
        console.error('Error searching users:', error);
      }
    };

    const debounceTimer = setTimeout(searchExistingUsers, 300);
    return () => clearTimeout(debounceTimer);
  }, [userSearchQuery]);

  const loadDashboardData = async () => {
    try {
      console.log('Loading dashboard data...', { profile });
      console.log('Profile company_ids:', profile?.company_ids);
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

  const handleCreateVehicle = async () => {
    try {
      const { error } = await supabase
        .from('vehicles')
        .insert([{
          truck_number: newVehicle.vehicle_category,
          customer_name: newVehicle.customer_name,
          license_plate: newVehicle.license_plate || null,
          model: newVehicle.model || null,
          year: newVehicle.year ? parseInt(newVehicle.year) : null,
          customer_phone: newVehicle.customer_phone || null
        }]);

      if (error) throw error;

      toast({
        title: "Sucesso!",
        description: "Veículo cadastrado com sucesso"
      });

      setIsVehicleDialogOpen(false);
      setNewVehicle({
        vehicle_category: '',
        customer_name: '',
        license_plate: '',
        model: '',
        year: '',
        customer_phone: ''
      });
      
      // Recarregar dados
      loadDashboardData();
    } catch (error) {
      console.error('Error creating vehicle:', error);
      toast({
        title: "Erro",
        description: "Erro ao cadastrar veículo",
        variant: "destructive"
      });
    }
  };

  const handleCreateInspector = async () => {
    try {
      if (newInspector.is_existing_user) {
        // Promover usuário existente a inspetor
        const { error } = await supabase
          .from('profiles')
          .update({
            role: 'inspector',
            company_name: newInspector.company_id,
            phone: newInspector.phone || null
          })
          .eq('id', newInspector.user_id);

        if (error) throw error;
      } else {
        // Criar novo usuário
        const { error } = await supabase.auth.signUp({
          email: newInspector.email,
          password: newInspector.password,
          options: {
            data: {
              first_name: newInspector.first_name,
              last_name: newInspector.last_name,
              role: 'inspector',
              phone: newInspector.phone,
              company_name: newInspector.company_id
            }
          }
        });

        if (error) throw error;
      }

      toast({
        title: "Sucesso!",
        description: newInspector.is_existing_user ? "Usuário promovido a inspetor com sucesso" : "Inspetor cadastrado com sucesso"
      });

      setIsInspectorDialogOpen(false);
      setNewInspector({
        user_id: '',
        email: '',
        password: '',
        first_name: '',
        last_name: '',
        phone: '',
        company_id: '',
        is_existing_user: false
      });
      setUserSearchQuery('');
      
      // Recarregar dados
      loadDashboardData();
    } catch (error) {
      console.error('Error creating inspector:', error);
      toast({
        title: "Erro",
        description: "Erro ao cadastrar inspetor",
        variant: "destructive"
      });
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
    <div className="space-y-6 px-4">
      <div className="flex flex-col gap-4">
        <div>
          <h2 className="text-xl font-bold">Dashboard Administrativo</h2>
          <p className="text-muted-foreground text-sm">Visão geral da frota e inspeções</p>
        </div>
        <div className="flex flex-col gap-2">
          <Dialog open={isVehicleDialogOpen} onOpenChange={setIsVehicleDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="default" className="gap-2 w-full h-12">
                <Plus className="h-4 w-4" />
                Novo Veículo
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Cadastrar Novo Veículo</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="vehicle_category">Categoria do Veículo *</Label>
                  <Select value={newVehicle.vehicle_category} onValueChange={(value) => setNewVehicle(prev => ({...prev, vehicle_category: value}))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="carro">Carro</SelectItem>
                      <SelectItem value="caminhao">Caminhão</SelectItem>
                      <SelectItem value="moto">Moto</SelectItem>
                      <SelectItem value="retroescavadeira">Retroescavadeira</SelectItem>
                      <SelectItem value="van">Van</SelectItem>
                      <SelectItem value="onibus">Ônibus</SelectItem>
                      <SelectItem value="trator">Trator</SelectItem>
                      <SelectItem value="outros">Outros</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="customer_name">Nome do Cliente *</Label>
                  <Input
                    id="customer_name"
                    value={newVehicle.customer_name}
                    onChange={(e) => setNewVehicle(prev => ({...prev, customer_name: e.target.value}))}
                    placeholder="Ex: Transportadora ABC"
                  />
                </div>
                <div>
                  <Label htmlFor="license_plate">Placa</Label>
                  <Input
                    id="license_plate"
                    value={newVehicle.license_plate}
                    onChange={(e) => setNewVehicle(prev => ({...prev, license_plate: e.target.value}))}
                    placeholder="Ex: ABC-1234"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="model">Modelo</Label>
                    <Input
                      id="model"
                      value={newVehicle.model}
                      onChange={(e) => setNewVehicle(prev => ({...prev, model: e.target.value}))}
                      placeholder="Ex: Volvo FH"
                    />
                  </div>
                  <div>
                    <Label htmlFor="year">Ano</Label>
                    <Input
                      id="year"
                      type="number"
                      value={newVehicle.year}
                      onChange={(e) => setNewVehicle(prev => ({...prev, year: e.target.value}))}
                      placeholder="2024"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="customer_phone">Telefone do Cliente</Label>
                  <Input
                    id="customer_phone"
                    value={newVehicle.customer_phone}
                    onChange={(e) => setNewVehicle(prev => ({...prev, customer_phone: e.target.value}))}
                    placeholder="(11) 99999-9999"
                  />
                </div>
                <div className="flex gap-2 pt-4">
                  <Button 
                    onClick={handleCreateVehicle}
                    disabled={!newVehicle.vehicle_category || !newVehicle.customer_name}
                    className="flex-1"
                  >
                    Cadastrar
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setIsVehicleDialogOpen(false)}
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          <Dialog open={isInspectorDialogOpen} onOpenChange={setIsInspectorDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2 w-full h-12">
                <Users className="h-4 w-4" />
                Novo Inspetor
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Cadastrar Novo Inspetor</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                {/* Pesquisa de usuários existentes */}
                <div className="space-y-2">
                  <Label>Pesquisar Usuário Existente (Opcional)</Label>
                  <Popover open={userSearchOpen} onOpenChange={setUserSearchOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={userSearchOpen}
                        className="w-full justify-between"
                      >
                        {newInspector.is_existing_user ? 
                          `${newInspector.first_name} ${newInspector.last_name}` :
                          "Pesquisar usuário existente..."
                        }
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0">
                      <Command>
                        <CommandInput 
                          placeholder="Digite nome do usuário..." 
                          value={userSearchQuery}
                          onValueChange={setUserSearchQuery}
                        />
                        <CommandEmpty>
                          {userSearchQuery.length < 2 ? 
                            "Digite pelo menos 2 caracteres..." : 
                            "Nenhum usuário encontrado."
                          }
                        </CommandEmpty>
                        <CommandGroup className="max-h-64 overflow-auto">
                          {searchUsers.map((user) => (
                            <CommandItem
                              key={user.id}
                              value={`${user.first_name} ${user.last_name} ${user.email}`}
                              onSelect={() => {
                                setNewInspector(prev => ({
                                  ...prev,
                                  user_id: user.id,
                                  first_name: user.first_name,
                                  last_name: user.last_name,
                                  email: user.email,
                                  is_existing_user: true,
                                  password: '' // Limpar senha pois não é necessário
                                }));
                                setUserSearchOpen(false);
                                setUserSearchQuery('');
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  newInspector.user_id === user.id ? "opacity-100" : "opacity-0"
                                )}
                              />
                              <div className="flex flex-col">
                                <span className="font-medium">
                                  {user.first_name} {user.last_name}
                                </span>
                                <span className="text-sm text-muted-foreground">
                                  {user.email}
                                </span>
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  {newInspector.is_existing_user && (
                    <div className="text-xs text-muted-foreground p-2 bg-blue-50 rounded">
                      Usuário existente selecionado. Será promovido a inspetor.
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">
                      {newInspector.is_existing_user ? "Editar dados do usuário" : "Dados do novo inspetor"}
                    </span>
                    {newInspector.is_existing_user && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          setNewInspector({
                            user_id: '',
                            email: '',
                            password: '',
                            first_name: '',
                            last_name: '',
                            phone: '',
                            company_id: '',
                            is_existing_user: false
                          });
                          setUserSearchQuery('');
                        }}
                      >
                        Criar Novo
                      </Button>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="inspector_first_name">Nome *</Label>
                    <Input
                      id="inspector_first_name"
                      value={newInspector.first_name}
                      onChange={(e) => setNewInspector(prev => ({...prev, first_name: e.target.value}))}
                      placeholder="João"
                    />
                  </div>
                  <div>
                    <Label htmlFor="inspector_last_name">Sobrenome *</Label>
                    <Input
                      id="inspector_last_name"
                      value={newInspector.last_name}
                      onChange={(e) => setNewInspector(prev => ({...prev, last_name: e.target.value}))}
                      placeholder="Silva"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="inspector_email">Email *</Label>
                  <Input
                    id="inspector_email"
                    type="email"
                    value={newInspector.email}
                    onChange={(e) => setNewInspector(prev => ({...prev, email: e.target.value}))}
                    placeholder="joao@empresa.com"
                    disabled={newInspector.is_existing_user}
                  />
                </div>
                {!newInspector.is_existing_user && (
                  <div>
                    <Label htmlFor="inspector_password">Senha *</Label>
                    <Input
                      id="inspector_password"
                      type="password"
                      value={newInspector.password}
                      onChange={(e) => setNewInspector(prev => ({...prev, password: e.target.value}))}
                      placeholder="Mínimo 6 caracteres"
                    />
                  </div>
                )}
                <div>
                  <Label htmlFor="inspector_phone">Telefone</Label>
                  <Input
                    id="inspector_phone"
                    value={newInspector.phone}
                    onChange={(e) => setNewInspector(prev => ({...prev, phone: e.target.value}))}
                    placeholder="(11) 99999-9999"
                  />
                </div>
                <div>
                  <Label>ID Único da Empresa *</Label>
                  <div className="text-xs text-muted-foreground mb-2">
                    IDs disponíveis: {profile?.unique_id ? 1 : 0} 
                    {profile?.unique_id && ` (${profile.unique_id})`}
                  </div>
                  <Popover open={companyIdSearchOpen} onOpenChange={setCompanyIdSearchOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={companyIdSearchOpen}
                        className="w-full justify-between"
                      >
                        {newInspector.company_id || "Selecionar ID da empresa..."}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0">
                      <Command>
                        <CommandInput placeholder="Pesquisar ID da empresa..." />
                        <CommandEmpty>
                          <div className="p-4 text-center">
                            <p className="text-sm text-muted-foreground mb-2">Nenhum ID encontrado.</p>
                            <p className="text-xs text-muted-foreground">
                              Adicione IDs únicos no seu perfil primeiro.
                            </p>
                          </div>
                        </CommandEmpty>
                        <CommandGroup className="max-h-64 overflow-auto">
                          {profile?.unique_id ? (
                            <CommandItem
                              value={profile.unique_id}
                              onSelect={() => {
                                setNewInspector(prev => ({...prev, company_id: profile.unique_id}));
                                setCompanyIdSearchOpen(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  newInspector.company_id === profile.unique_id ? "opacity-100" : "opacity-0"
                                )}
                              />
                              <div className="flex items-center gap-2">
                                <Badge variant="secondary">{profile.unique_id}</Badge>
                              </div>
                            </CommandItem>
                          ) : (
                            <div className="p-4 text-center">
                              <p className="text-sm text-muted-foreground mb-2">Nenhum ID único configurado.</p>
                              <p className="text-xs text-muted-foreground">
                                Configure IDs únicos no seu perfil primeiro.
                              </p>
                            </div>
                          )}
                        </CommandGroup>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="flex gap-2 pt-4">
                  <Button 
                    onClick={handleCreateInspector}
                    disabled={!newInspector.first_name || !newInspector.last_name || !newInspector.company_id || (!newInspector.is_existing_user && (!newInspector.email || !newInspector.password))}
                    className="flex-1"
                  >
                    Cadastrar
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setIsInspectorDialogOpen(false)}
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          <div className="flex flex-col gap-2">
            <Button 
              variant="outline" 
              onClick={() => navigate('/checklist-editor')}
              className="w-full h-12 gap-2"
            >
              <FileText className="h-4 w-4" />
              Editor de Checklist
            </Button>
            <Button 
              onClick={() => navigate('/checklist/new')}
              className="w-full h-12 gap-2"
            >
              <Plus className="h-4 w-4" />
              Nova Inspeção
            </Button>
            <Button 
              variant="outline" 
              className="w-full h-12 gap-2"
              onClick={() => navigate('/reports')}
            >
              <FileText className="h-4 w-4" />
              Relatórios
            </Button>
          </div>
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
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Checklists Recentes
            </CardTitle>
            {recentChecklists.length > 0 && (
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="gap-2"
                  onClick={() => toast({
                    title: "Em desenvolvimento",
                    description: "Funcionalidade de filtros será implementada em breve"
                  })}
                >
                  <FileText className="h-4 w-4" />
                  Ver Todos
                </Button>
                <Button 
                  size="sm" 
                  variant="default" 
                  className="gap-2"
                  onClick={() => navigate('/checklist/new')}
                >
                  <Plus className="h-4 w-4" />
                  Novo Checklist
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {recentChecklists.length === 0 ? (
            <div className="text-center py-12">
              <div className="mx-auto w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-4">
                <FileText className="h-12 w-12 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium mb-2">Nenhum checklist encontrado</h3>
              <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                Comece criando seu primeiro checklist de inspeção para acompanhar as verificações da frota.
              </p>
              <Button 
                variant="default" 
                className="gap-2"
                onClick={() => navigate('/checklist/new')}
              >
                <Plus className="h-4 w-4" />
                Criar Primeiro Checklist
              </Button>
            </div>
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