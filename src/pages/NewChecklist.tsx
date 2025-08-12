import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import DynamicChecklistForm from '@/components/DynamicChecklistForm';
import ImageCapture from '@/components/ImageCapture';

interface Vehicle {
  id: string;
  vehicle_category: string;
  owner_unique_id: string;
  license_plate?: string;
  model?: string;
}

interface Inspector {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
}

interface FormData {
  vehicle_id: string;
  inspector_id: string;
  inspection_date: Date;
  vehicle_mileage: string;
  overall_condition: string;
  additional_notes: string;
  interior_photo_url: string;
  exterior_photo_url: string;
  inspector_signature: string;
  // Campos dinâmicos para checklist serão adicionados automaticamente
  [key: string]: any;
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
      // Carregar veículos - usar any temporariamente
      const { data: vehicleData }: any = await supabase
        .from('vehicles')
        .select('id, vehicle_category, owner_unique_id, license_plate, model')
        .eq('status', 'active')
        .order('vehicle_category');

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
        overall_condition: formData.overall_condition,
        additional_notes: formData.additional_notes,
        interior_photo_url: formData.interior_photo_url,
        exterior_photo_url: formData.exterior_photo_url,
        inspector_signature: formData.inspector_signature,
        status: 'completed',
        unique_id: profile?.unique_id
      };

      // Adicionar dados dinâmicos do checklist
      Object.keys(formData).forEach(key => {
        if (key !== 'vehicle_id' && key !== 'inspector_id' && key !== 'inspection_date' && 
            key !== 'vehicle_mileage' && key !== 'overall_condition' && key !== 'additional_notes' &&
            key !== 'interior_photo_url' && key !== 'exterior_photo_url' && key !== 'inspector_signature') {
          
          const itemData = formData[key];
          if (itemData && typeof itemData === 'object' && 'status' in itemData) {
            // Mapear campos conhecidos para o banco de dados
            if (key === 'todas_as_luzes_internas_funcionando') {
              (checklistData as any).all_interior_lights = itemData.status === 'funcionando';
            } else if (key === 'banco_do_passageiro') {
              (checklistData as any).passenger_seat = itemData.status === 'funcionando';
            } else if (key === 'extintor_de_incendio') {
              (checklistData as any).fire_extinguisher = itemData.status === 'funcionando';
            } else if (key === 'todas_as_luzes_externas_funcionando') {
              (checklistData as any).all_outside_lights = itemData.status === 'funcionando';
            } else if (key === 'fechaduras_de_todos_os_armarios') {
              (checklistData as any).all_cabinets_latches = itemData.status;
            } else if (key === 'acendedor_de_cigarro') {
              (checklistData as any).cigarette_lighter = itemData.status;
            }
          }
        }
      });

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
      <div className="max-w-4xl mx-auto space-y-4 px-4">
        {/* Header */}
        <div className="flex flex-col gap-3">
          <Button
            variant="outline"
            size="lg"
            onClick={() => navigate('/')}
            className="gap-2 h-12 px-4 w-full"
          >
            <ArrowLeft className="h-5 w-5" />
            Voltar
          </Button>
          <div className="flex items-center gap-3">
            <FileText className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold">Novo Checklist de Inspeção</h1>
          </div>
        </div>

        <div className="grid gap-6">
          {/* Seção de Identificação */}
          <Card className="shadow-warm">
            <CardHeader className="bg-gradient-secondary text-foreground rounded-t-lg">
              <CardTitle className="text-lg">Identificação do Inspetor e Veículo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 p-4">
              <div className="grid grid-cols-1 gap-6">
                <div className="space-y-4">
                  <h3 className="font-semibold text-base">Identificação do Inspetor</h3>
                  {profile?.role === 'admin' && (
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold">Inspetor *</Label>
                      <Popover open={inspectorSearchOpen} onOpenChange={setInspectorSearchOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={inspectorSearchOpen}
                            className="w-full justify-between h-10 text-sm px-3"
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
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold">Data da Inspeção *</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal h-10 text-sm",
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
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold text-base">Identificação do Veículo</h3>
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold">Veículo *</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          className="w-full justify-between h-10 text-sm"
                        >
                          {formData.vehicle_id ? (
                            (() => {
                              const selected = vehicles.find(v => v.id === formData.vehicle_id);
                              return selected ? `${selected.vehicle_category} - ${selected.license_plate || 'Sem placa'} - ${selected.owner_unique_id}` : "Selecionar veículo...";
                            })()
                          ) : (
                            "Selecionar veículo..."
                          )}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                        <PopoverContent className="w-[300px] p-0">
                        <Command>
                          <CommandInput placeholder="Pesquisar veículo..." />
                          <CommandEmpty>Nenhum veículo encontrado.</CommandEmpty>
                          <CommandGroup className="max-h-64 overflow-auto">
                            {vehicles.map((vehicle) => (
                              <CommandItem
                                key={vehicle.id}
                                value={`${vehicle.vehicle_category} ${vehicle.license_plate} ${vehicle.owner_unique_id}`}
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
                                    {vehicle.vehicle_category} - {vehicle.license_plate || 'Sem placa'}
                                  </span>
                                  <span className="text-sm text-muted-foreground">
                                    {vehicle.owner_unique_id} {vehicle.model && `- ${vehicle.model}`}
                                  </span>
                                </div>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold">Quilometragem *</Label>
                    <Input
                      type="number"
                      placeholder="Ex: 150000"
                      value={formData.vehicle_mileage}
                      onChange={(e) => setFormData(prev => ({...prev, vehicle_mileage: e.target.value}))}
                      className="h-10 text-sm"
                    />
                  </div>
                  {formData.vehicle_id && (
                    <div className="p-4 bg-muted rounded-lg">
                      {(() => {
                        const selectedVehicle = vehicles.find(v => v.id === formData.vehicle_id);
                        return selectedVehicle ? (
                          <>
                            <p className="font-medium text-base">{selectedVehicle.vehicle_category} - {selectedVehicle.license_plate}</p>
                            <p className="text-sm">Proprietário: {selectedVehicle.owner_unique_id}</p>
                            {selectedVehicle.model && (
                              <p className="text-sm">Modelo: {selectedVehicle.model}</p>
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
              <CardTitle className="text-lg">Itens de Inspeção</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 p-4">
              <DynamicChecklistForm 
                formData={formData}
                setFormData={setFormData}
              />
            </CardContent>
          </Card>

          {/* Seção de Mídia e Observações */}
          <Card className="shadow-warm">
            <CardHeader className="bg-gradient-secondary text-foreground rounded-t-lg">
              <CardTitle className="text-lg">Fotos e Observações</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-4">
              {/* Upload de Fotos */}
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-3">
                  <h3 className="font-semibold text-base">Foto do Interior</h3>
                  <ImageCapture
                    value={formData.interior_photo_url}
                    onImageCapture={(imageData) => 
                      setFormData(prev => ({...prev, interior_photo_url: imageData}))
                    }
                    placeholder="Clique para adicionar foto do interior"
                    className="hover-lift warm-glow"
                  />
                </div>

                <div className="space-y-3">
                  <h3 className="font-semibold text-base">Foto do Exterior</h3>
                  <ImageCapture
                    value={formData.exterior_photo_url}
                    onImageCapture={(imageData) => 
                      setFormData(prev => ({...prev, exterior_photo_url: imageData}))
                    }
                    placeholder="Clique para adicionar foto do exterior"
                    className="hover-lift warm-glow"
                  />
                </div>
              </div>

              {/* Observações */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="overall_condition" className="text-sm font-semibold">
                    Condição Geral do Veículo
                  </Label>
                  <Textarea
                    id="overall_condition"
                    placeholder="Descreva a condição geral do veículo..."
                    value={formData.overall_condition}
                    onChange={(e) => setFormData(prev => ({...prev, overall_condition: e.target.value}))}
                    rows={3}
                    className="min-h-[80px] text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="additional_notes" className="text-sm font-semibold">
                    Observações Adicionais
                  </Label>
                  <Textarea
                    id="additional_notes"
                    placeholder="Observações adicionais, problemas encontrados, etc..."
                    value={formData.additional_notes}
                    onChange={(e) => setFormData(prev => ({...prev, additional_notes: e.target.value}))}
                    rows={4}
                    className="min-h-[100px] text-sm"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Seção de Finalização */}
          <Card className="shadow-warm">
            <CardHeader className="bg-gradient-warm text-white rounded-t-lg">
              <CardTitle className="text-lg">Finalização</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-4">
              <SignatureCanvas
                value={formData.inspector_signature}
                onSignatureChange={(signature) => 
                  setFormData(prev => ({...prev, inspector_signature: signature}))
                }
              />

              <div className="flex flex-col gap-3 pt-4">
                <Button 
                  variant="outline" 
                  size="lg"
                  onClick={() => navigate('/')}
                  className="w-full h-12 text-sm font-semibold"
                >
                  Cancelar
                </Button>
                <Button 
                  size="lg"
                  onClick={handleSubmit}
                  className="w-full gap-2 h-12 text-sm font-semibold warm-glow"
                >
                  <Save className="h-4 w-4" />
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