import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Calendar } from '@/components/ui/calendar';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ArrowLeft, Upload, Save, Camera, FileText, Check, ChevronsUpDown, CalendarIcon } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import Layout from '@/components/Layout';
import SignatureCanvas from '@/components/SignatureCanvas';

interface Vehicle {
  id: string;
  truck_number: string;
  customer_name: string;
  customer_phone?: string;
}

interface Inspector {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
}

interface ChecklistItem {
  status: string;
  observation: string;
}

interface FormData {
  vehicle_id: string;
  inspector_id: string;
  inspection_date: Date;
  vehicle_mileage: string;
  all_cabinets_latches: ChecklistItem;
  cigarette_lighter: ChecklistItem;
  all_interior_lights: ChecklistItem;
  passenger_seat: ChecklistItem;
  fire_extinguisher: ChecklistItem;
  functional_camera: ChecklistItem;
  cabin_curtains: ChecklistItem;
  all_outside_lights: ChecklistItem;
  windshield_wipers: ChecklistItem;
  tires: ChecklistItem;
  chains: ChecklistItem;
  safety_triangles: ChecklistItem;
  engine_oil: ChecklistItem;
  vehicle_water: ChecklistItem;
  battery: ChecklistItem;
  overall_condition: string;
  additional_notes: string;
  interior_photo_url: string;
  exterior_photo_url: string;
  inspector_signature: string;
}

const NewChecklist = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { toast } = useToast();
  
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [inspectors, setInspectors] = useState<Inspector[]>([]);
  const [filteredInspectors, setFilteredInspectors] = useState<Inspector[]>([]);
  const [inspectorSearchOpen, setInspectorSearchOpen] = useState(false);
  const [inspectorSearch, setInspectorSearch] = useState('');
  const [loading, setLoading] = useState(true);
  
  const [formData, setFormData] = useState<FormData>({
    // Identificação
    vehicle_id: '',
    inspector_id: profile?.role === 'inspector' ? profile.id : '',
    inspection_date: new Date(),
    vehicle_mileage: '',
    
    // Novos itens do checklist com status e observações
    all_cabinets_latches: { status: 'funcionando', observation: '' },
    cigarette_lighter: { status: 'funcionando', observation: '' },
    all_interior_lights: { status: 'funcionando', observation: '' },
    passenger_seat: { status: 'funcionando', observation: '' },
    fire_extinguisher: { status: 'funcionando', observation: '' },
    functional_camera: { status: 'funcionando', observation: '' },
    cabin_curtains: { status: 'funcionando', observation: '' },
    all_outside_lights: { status: 'funcionando', observation: '' },
    windshield_wipers: { status: 'funcionando', observation: '' },
    tires: { status: 'funcionando', observation: '' },
    chains: { status: 'funcionando', observation: '' },
    safety_triangles: { status: 'funcionando', observation: '' },
    engine_oil: { status: 'funcionando', observation: '' },
    vehicle_water: { status: 'funcionando', observation: '' },
    battery: { status: 'funcionando', observation: '' },
    
    // Observações e fotos
    overall_condition: '',
    additional_notes: '',
    interior_photo_url: '',
    exterior_photo_url: '',
    inspector_signature: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    // Filter inspectors based on search
    if (inspectorSearch) {
      const filtered = inspectors.filter(inspector =>
        inspector.first_name.toLowerCase().includes(inspectorSearch.toLowerCase()) ||
        inspector.last_name.toLowerCase().includes(inspectorSearch.toLowerCase()) ||
        inspector.email.toLowerCase().includes(inspectorSearch.toLowerCase()) ||
        `${inspector.first_name} ${inspector.last_name}`.toLowerCase().includes(inspectorSearch.toLowerCase())
      );
      setFilteredInspectors(filtered);
    } else {
      setFilteredInspectors(inspectors);
    }
  }, [inspectorSearch, inspectors]);

  const loadData = async () => {
    try {
      // Carregar veículos
      const { data: vehicleData } = await supabase
        .from('vehicles')
        .select('id, truck_number, customer_name, customer_phone')
        .eq('status', 'active')
        .order('truck_number');

      // Carregar inspetores (apenas admins podem ver todos)
      let inspectorData = [];
      if (profile?.role === 'admin') {
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, first_name, last_name, user_id')
          .eq('role', 'inspector')
          .order('first_name');

        if (profilesData) {
          // Carregar dados dos usuários via RPC ou API admin se necessário
          inspectorData = profilesData.map(profile => ({
            id: profile.id,
            first_name: profile.first_name,
            last_name: profile.last_name,
            email: 'Email não disponível' // Simplificado para evitar problemas de API
          }));
        }
      }

      setVehicles(vehicleData || []);
      setInspectors(inspectorData);
      setFilteredInspectors(inspectorData);
    } catch (error) {
      console.error('Error loading data:', error);
      // Fallback: load without emails
      if (profile?.role === 'admin') {
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, first_name, last_name')
          .eq('role', 'inspector')
          .order('first_name');
        
        const inspectorData = (profilesData || []).map(p => ({
          id: p.id,
          first_name: p.first_name,
          last_name: p.last_name,
          email: 'Email não disponível'
        }));
        
        setInspectors(inspectorData);
        setFilteredInspectors(inspectorData);
      }
      
      toast({
        title: "Aviso",
        description: "Alguns dados podem não estar completos",
        variant: "default"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.vehicle_id || !formData.inspector_id || !formData.vehicle_mileage) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha todos os campos obrigatórios: veículo, inspetor e quilometragem",
        variant: "destructive"
      });
      return;
    }

    try {
      // Preparar dados do checklist para salvar
      const checklistData = {
        vehicle_id: formData.vehicle_id,
        inspector_id: formData.inspector_id,
        inspection_date: format(formData.inspection_date, 'yyyy-MM-dd'),
        all_interior_lights: formData.all_interior_lights.status === 'funcionando',
        passenger_seat: formData.passenger_seat.status === 'funcionando',
        fire_extinguisher: formData.fire_extinguisher.status === 'funcionando',
        all_outside_lights: formData.all_outside_lights.status === 'funcionando',
        all_cabinets_latches: formData.all_cabinets_latches.status,
        cigarette_lighter: formData.cigarette_lighter.status,
        overall_condition: formData.overall_condition,
        additional_notes: formData.additional_notes,
        interior_photo_url: formData.interior_photo_url,
        exterior_photo_url: formData.exterior_photo_url,
        inspector_signature: formData.inspector_signature,
        status: 'completed'
      };

      const { error } = await supabase
        .from('checklists')
        .insert(checklistData);

      if (error) throw error;

      toast({
        title: "Sucesso!",
        description: "Checklist salvo com sucesso"
      });

      navigate('/');
    } catch (error) {
      console.error('Error saving checklist:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar checklist",
        variant: "destructive"
      });
    }
  };

  const handleFileUpload = (field: string) => {
    // Simular upload de arquivo
    toast({
      title: "Em desenvolvimento",
      description: "Funcionalidade de upload será implementada em breve"
    });
  };

  const getSelectedInspector = () => {
    return inspectors.find(i => i.id === formData.inspector_id);
  };

  if (loading) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-muted rounded w-1/3"></div>
            <div className="h-64 bg-muted rounded"></div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <Button
            variant="outline"
            size="lg"
            onClick={() => navigate('/')}
            className="gap-2 h-12 px-6 w-full sm:w-auto"
          >
            <ArrowLeft className="h-5 w-5" />
            Voltar
          </Button>
          <div className="flex items-center gap-3">
            <FileText className="h-6 w-6 text-primary" />
            <h1 className="text-2xl sm:text-3xl font-bold">Novo Checklist de Inspeção</h1>
          </div>
        </div>

        <div className="grid gap-8">
          {/* Seção de Identificação */}
          <Card className="shadow-warm">
            <CardHeader className="bg-gradient-secondary text-foreground rounded-t-lg">
              <CardTitle className="text-xl">Identificação do Inspetor e Veículo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 p-4 sm:p-6 lg:p-8">
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <h3 className="font-semibold text-lg">Identificação do Inspetor</h3>
                  {profile?.role === 'admin' && (
                    <div className="space-y-3">
                      <Label className="text-base font-semibold">Inspetor *</Label>
                      <Popover open={inspectorSearchOpen} onOpenChange={setInspectorSearchOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={inspectorSearchOpen}
                            className="w-full justify-between h-12 text-sm sm:text-base px-3"
                          >
                            {formData.inspector_id ? (
                              (() => {
                                const selected = getSelectedInspector();
                                return selected ? `${selected.first_name} ${selected.last_name}` : "Selecionar inspetor...";
                              })()
                            ) : (
                              "Pesquisar inspetor..."
                            )}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-full p-0">
                          <Command>
                            <CommandInput 
                              placeholder="Pesquisar por nome ou email..." 
                              value={inspectorSearch}
                              onValueChange={setInspectorSearch}
                            />
                            <CommandEmpty>Nenhum inspetor encontrado.</CommandEmpty>
                            <CommandGroup className="max-h-64 overflow-auto">
                              {filteredInspectors.map((inspector) => (
                                <CommandItem
                                  key={inspector.id}
                                  value={`${inspector.first_name} ${inspector.last_name} ${inspector.email}`}
                                  onSelect={() => {
                                    setFormData(prev => ({...prev, inspector_id: inspector.id}));
                                    setInspectorSearchOpen(false);
                                    setInspectorSearch('');
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      formData.inspector_id === inspector.id ? "opacity-100" : "opacity-0"
                                    )}
                                  />
                                  <div className="flex flex-col">
                                    <span className="font-medium">
                                      {inspector.first_name} {inspector.last_name}
                                    </span>
                                    <span className="text-sm text-muted-foreground">
                                      {inspector.email}
                                    </span>
                                  </div>
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    </div>
                  )}
                  {profile?.role === 'inspector' && (
                    <div className="p-4 bg-muted rounded-lg">
                      <p className="font-medium text-base">{profile.first_name} {profile.last_name}</p>
                      <p className="text-sm text-muted-foreground">Inspetor</p>
                    </div>
                  )}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <Label className="text-base font-semibold">Data da Inspeção *</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal h-12 text-base",
                              !formData.inspection_date && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-5 w-5" />
                            {formData.inspection_date ? (
                              format(formData.inspection_date, "PPP", { locale: ptBR })
                            ) : (
                              <span>Selecione uma data</span>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={formData.inspection_date}
                            onSelect={(date) => date && setFormData(prev => ({...prev, inspection_date: date}))}
                            initialFocus
                            className="pointer-events-auto"
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div className="space-y-3">
                      <Label className="text-base font-semibold">Quilometragem do Veículo *</Label>
                      <Input
                        type="number"
                        placeholder="Ex: 150000"
                        value={formData.vehicle_mileage}
                        onChange={(e) => setFormData(prev => ({...prev, vehicle_mileage: e.target.value}))}
                        className="h-12 text-base"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <h3 className="font-semibold text-lg">Identificação do Veículo</h3>
                  <div className="space-y-3">
                    <Label className="text-base font-semibold">Veículo *</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          className="w-full justify-between h-12 text-base"
                        >
                          {formData.vehicle_id ? (
                            (() => {
                              const selected = vehicles.find(v => v.id === formData.vehicle_id);
                              return selected ? `Caminhão ${selected.truck_number} - ${selected.customer_name}` : "Selecionar veículo...";
                            })()
                          ) : (
                            "Selecionar veículo..."
                          )}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0">
                        <Command>
                          <CommandInput placeholder="Pesquisar veículo..." />
                          <CommandEmpty>Nenhum veículo encontrado.</CommandEmpty>
                          <CommandGroup className="max-h-64 overflow-auto">
                            {vehicles.map((vehicle) => (
                              <CommandItem
                                key={vehicle.id}
                                value={`${vehicle.truck_number} ${vehicle.customer_name}`}
                                onSelect={() => {
                                  setFormData(prev => ({...prev, vehicle_id: vehicle.id}));
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    formData.vehicle_id === vehicle.id ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                <div className="flex flex-col">
                                  <span className="font-medium">
                                    Caminhão {vehicle.truck_number}
                                  </span>
                                  <span className="text-sm text-muted-foreground">
                                    {vehicle.customer_name}
                                  </span>
                                </div>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>
                  {formData.vehicle_id && (
                    <div className="p-4 bg-muted rounded-lg">
                      {(() => {
                        const selectedVehicle = vehicles.find(v => v.id === formData.vehicle_id);
                        return selectedVehicle ? (
                          <>
                            <p className="font-medium text-base">Caminhão {selectedVehicle.truck_number}</p>
                            <p className="text-sm">Cliente: {selectedVehicle.customer_name}</p>
                            {selectedVehicle.customer_phone && (
                              <p className="text-sm">Telefone: {selectedVehicle.customer_phone}</p>
                            )}
                          </>
                        ) : null;
                      })()}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Seção do Checklist */}
          <Card className="shadow-warm">
            <CardHeader className="bg-gradient-primary text-white rounded-t-lg">
              <CardTitle className="text-xl">Itens de Inspeção</CardTitle>
            </CardHeader>
            <CardContent className="space-y-8 p-8">
              {/* Renderizar itens do checklist */}
              {[
                { key: 'all_cabinets_latches', label: 'Todos os gabinetes/trincos' },
                { key: 'cigarette_lighter', label: 'Acendedor de cigarros' },
                { key: 'all_interior_lights', label: 'Todas as luzes internas' },
                { key: 'passenger_seat', label: 'Assento do passageiro' },
                { key: 'fire_extinguisher', label: 'Extintor de incêndio' },
                { key: 'functional_camera', label: 'Câmera funcional' },
                { key: 'cabin_curtains', label: 'Cortinas da cabine/área de dormir' },
                { key: 'all_outside_lights', label: 'Todas as luzes externas' },
                { key: 'windshield_wipers', label: 'Palhetas do limpador de para-brisa' },
                { key: 'tires', label: 'Pneus' },
                { key: 'chains', label: 'Correntes' },
                { key: 'safety_triangles', label: 'Triângulos de segurança' },
                { key: 'engine_oil', label: 'Óleo motor' },
                { key: 'vehicle_water', label: 'Água do veículo' },
                { key: 'battery', label: 'Bateria' }
              ].map((item, index) => (
                <div key={item.key} className="bg-muted/30 p-4 md:p-6 rounded-lg border border-border hover-lift">
                  {/* Mobile Layout */}
                  <div className="block lg:hidden space-y-4">
                    {/* Nome do item */}
                    <div>
                      <Label className="text-base font-semibold text-foreground">
                        {index + 1}. {item.label}
                      </Label>
                    </div>
                    
                    {/* Status options - Mobile Stack */}
                    <div>
                      <RadioGroup
                        value={(formData[item.key as keyof FormData] as ChecklistItem)?.status || 'funcionando'}
                        onValueChange={(value) => 
                          setFormData(prev => ({
                            ...prev,
                            [item.key]: { 
                              ...(prev[item.key as keyof FormData] as ChecklistItem), 
                              status: value 
                            }
                          }))
                        }
                        className="grid grid-cols-3 gap-3"
                      >
                        <div className="flex flex-col items-center space-y-2 p-3 rounded-lg border-2 border-success/30 bg-success/5">
                          <RadioGroupItem 
                            value="funcionando" 
                            id={`${item.key}_funcionando_mobile`}
                            className="w-5 h-5 border-2 border-success text-success data-[state=checked]:bg-success data-[state=checked]:border-success"
                          />
                          <Label htmlFor={`${item.key}_funcionando_mobile`} className="text-success font-medium text-sm text-center leading-tight">
                            Funcionando
                          </Label>
                        </div>
                        <div className="flex flex-col items-center space-y-2 p-3 rounded-lg border-2 border-warning/30 bg-warning/5">
                          <RadioGroupItem 
                            value="revisao" 
                            id={`${item.key}_revisao_mobile`}
                            className="w-5 h-5 border-2 border-warning text-warning data-[state=checked]:bg-warning data-[state=checked]:border-warning"
                          />
                          <Label htmlFor={`${item.key}_revisao_mobile`} className="text-warning font-medium text-sm text-center leading-tight">
                            Revisão
                          </Label>
                        </div>
                        <div className="flex flex-col items-center space-y-2 p-3 rounded-lg border-2 border-destructive/30 bg-destructive/5">
                          <RadioGroupItem 
                            value="ausente" 
                            id={`${item.key}_ausente_mobile`}
                            className="w-5 h-5 border-2 border-destructive text-destructive data-[state=checked]:bg-destructive data-[state=checked]:border-destructive"
                          />
                          <Label htmlFor={`${item.key}_ausente_mobile`} className="text-destructive font-medium text-sm text-center leading-tight">
                            Ausente
                          </Label>
                        </div>
                      </RadioGroup>
                    </div>
                    
                    {/* Observação - Mobile */}
                    <div>
                      <Input
                        placeholder="Observação..."
                        value={(formData[item.key as keyof FormData] as ChecklistItem)?.observation || ''}
                        onChange={(e) => 
                          setFormData(prev => ({
                            ...prev,
                            [item.key]: { 
                              ...(prev[item.key as keyof FormData] as ChecklistItem), 
                              observation: e.target.value 
                            }
                          }))
                        }
                        className="h-12 text-base"
                      />
                    </div>
                  </div>

                  {/* Desktop Layout */}
                  <div className="hidden lg:grid lg:grid-cols-12 gap-4 items-center">
                    {/* Nome do item */}
                    <div className="lg:col-span-4">
                      <Label className="text-base font-semibold text-foreground">
                        {index + 1}. {item.label}
                      </Label>
                    </div>
                    
                    {/* Status options */}
                    <div className="lg:col-span-6">
                      <RadioGroup
                        value={(formData[item.key as keyof FormData] as ChecklistItem)?.status || 'funcionando'}
                        onValueChange={(value) => 
                          setFormData(prev => ({
                            ...prev,
                            [item.key]: { 
                              ...(prev[item.key as keyof FormData] as ChecklistItem), 
                              status: value 
                            }
                          }))
                        }
                        className="flex flex-row gap-4"
                      >
                        <div className="flex flex-col items-center space-y-2 p-3 rounded-lg border-2 border-success/30 bg-success/5 min-w-[100px]">
                          <RadioGroupItem 
                            value="funcionando" 
                            id={`${item.key}_funcionando`}
                            className="w-5 h-5 border-2 border-success text-success data-[state=checked]:bg-success data-[state=checked]:border-success"
                          />
                          <Label htmlFor={`${item.key}_funcionando`} className="text-success font-medium text-sm text-center leading-tight">
                            Funcionando
                          </Label>
                        </div>
                        <div className="flex flex-col items-center space-y-2 p-3 rounded-lg border-2 border-warning/30 bg-warning/5 min-w-[100px]">
                          <RadioGroupItem 
                            value="revisao" 
                            id={`${item.key}_revisao`}
                            className="w-5 h-5 border-2 border-warning text-warning data-[state=checked]:bg-warning data-[state=checked]:border-warning"
                          />
                          <Label htmlFor={`${item.key}_revisao`} className="text-warning font-medium text-sm text-center leading-tight">
                            Revisão
                          </Label>
                        </div>
                        <div className="flex flex-col items-center space-y-2 p-3 rounded-lg border-2 border-destructive/30 bg-destructive/5 min-w-[100px]">
                          <RadioGroupItem 
                            value="ausente" 
                            id={`${item.key}_ausente`}
                            className="w-5 h-5 border-2 border-destructive text-destructive data-[state=checked]:bg-destructive data-[state=checked]:border-destructive"
                          />
                          <Label htmlFor={`${item.key}_ausente`} className="text-destructive font-medium text-sm text-center leading-tight">
                            Ausente
                          </Label>
                        </div>
                      </RadioGroup>
                    </div>
                    
                    {/* Observação */}
                    <div className="lg:col-span-2">
                      <Input
                        placeholder="Observação..."
                        value={(formData[item.key as keyof FormData] as ChecklistItem)?.observation || ''}
                        onChange={(e) => 
                          setFormData(prev => ({
                            ...prev,
                            [item.key]: { 
                              ...(prev[item.key as keyof FormData] as ChecklistItem), 
                              observation: e.target.value 
                            }
                          }))
                        }
                        className="h-10"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Seção de Mídia e Observações */}
          <Card className="shadow-warm">
            <CardHeader className="bg-gradient-secondary text-foreground rounded-t-lg">
              <CardTitle className="text-xl">Fotos e Observações</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 p-8">
              {/* Upload de Fotos */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">Foto do Interior</h3>
                  <div className="border-2 border-dashed border-primary/30 rounded-lg p-8 text-center hover-lift warm-glow">
                    <Camera className="h-12 w-12 mx-auto mb-4 text-primary" />
                    <p className="text-sm text-muted-foreground mb-4">Clique para adicionar foto do interior</p>
                    <Button 
                      variant="outline" 
                      size="lg"
                      onClick={() => handleFileUpload('interior_photo_url')}
                      className="gap-2 h-12 px-6"
                    >
                      <Upload className="h-5 w-5" />
                      Enviar Foto
                    </Button>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">Foto do Exterior</h3>
                  <div className="border-2 border-dashed border-primary/30 rounded-lg p-8 text-center hover-lift warm-glow">
                    <Camera className="h-12 w-12 mx-auto mb-4 text-primary" />
                    <p className="text-sm text-muted-foreground mb-4">Clique para adicionar foto do exterior</p>
                    <Button 
                      variant="outline" 
                      size="lg"
                      onClick={() => handleFileUpload('exterior_photo_url')}
                      className="gap-2 h-12 px-6"
                    >
                      <Upload className="h-5 w-5" />
                      Enviar Foto
                    </Button>
                  </div>
                </div>
              </div>

              {/* Observações */}
              <div className="space-y-6">
                <div className="space-y-3">
                  <Label htmlFor="overall_condition" className="text-base font-semibold">
                    Condição Geral do Veículo
                  </Label>
                  <Textarea
                    id="overall_condition"
                    placeholder="Descreva a condição geral do veículo..."
                    value={formData.overall_condition}
                    onChange={(e) => setFormData(prev => ({...prev, overall_condition: e.target.value}))}
                    rows={4}
                    className="min-h-[100px] text-base"
                  />
                </div>

                <div className="space-y-3">
                  <Label htmlFor="additional_notes" className="text-base font-semibold">
                    Observações Adicionais
                  </Label>
                  <Textarea
                    id="additional_notes"
                    placeholder="Observações adicionais, problemas encontrados, etc..."
                    value={formData.additional_notes}
                    onChange={(e) => setFormData(prev => ({...prev, additional_notes: e.target.value}))}
                    rows={5}
                    className="min-h-[120px] text-base"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Seção de Finalização */}
          <Card className="shadow-warm">
            <CardHeader className="bg-gradient-warm text-white rounded-t-lg">
              <CardTitle className="text-xl">Finalização</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 p-4 sm:p-6 lg:p-8">
              <SignatureCanvas
                value={formData.inspector_signature}
                onSignatureChange={(signature) => 
                  setFormData(prev => ({...prev, inspector_signature: signature}))
                }
              />

              <div className="flex flex-col sm:flex-row gap-4 pt-6">
                <Button 
                  variant="outline" 
                  size="lg"
                  onClick={() => navigate('/')}
                  className="w-full sm:flex-1 h-14 text-base font-semibold"
                >
                  Cancelar
                </Button>
                <Button 
                  size="lg"
                  onClick={handleSubmit}
                  className="w-full sm:flex-1 gap-3 h-14 text-base font-semibold warm-glow"
                >
                  <Save className="h-5 w-5" />
                  Salvar Checklist
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default NewChecklist;