import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ArrowLeft, Upload, Save, Camera, FileText } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import Layout from '@/components/Layout';

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
}

const NewChecklist = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { toast } = useToast();
  
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [inspectors, setInspectors] = useState<Inspector[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [formData, setFormData] = useState({
    // Identificação
    vehicle_id: '',
    inspector_id: profile?.role === 'inspector' ? profile.id : '',
    inspection_date: new Date().toISOString().split('T')[0],
    
    // Itens do checklist
    all_interior_lights: false,
    passenger_seat: false,
    fire_extinguisher: false,
    all_outside_lights: false,
    all_cabinets_latches: 'working', // working, repaired, missing
    cigarette_lighter: 'working', // working, repaired, missing
    
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
        const { data } = await supabase
          .from('profiles')
          .select('id, first_name, last_name')
          .eq('role', 'inspector')
          .order('first_name');
        inspectorData = data || [];
      }

      setVehicles(vehicleData || []);
      setInspectors(inspectorData);
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar dados",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.vehicle_id || !formData.inspector_id) {
      toast({
        title: "Campos obrigatórios",
        description: "Selecione o veículo e inspetor",
        variant: "destructive"
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('checklists')
        .insert({
          vehicle_id: formData.vehicle_id,
          inspector_id: formData.inspector_id,
          inspection_date: formData.inspection_date,
          all_interior_lights: formData.all_interior_lights,
          passenger_seat: formData.passenger_seat,
          fire_extinguisher: formData.fire_extinguisher,
          all_outside_lights: formData.all_outside_lights,
          all_cabinets_latches: formData.all_cabinets_latches,
          cigarette_lighter: formData.cigarette_lighter,
          overall_condition: formData.overall_condition,
          additional_notes: formData.additional_notes,
          interior_photo_url: formData.interior_photo_url,
          exterior_photo_url: formData.exterior_photo_url,
          inspector_signature: formData.inspector_signature,
          status: 'completed'
        });

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
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/')}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            <h1 className="text-2xl font-bold">Novo Checklist de Inspeção</h1>
          </div>
        </div>

        <div className="grid gap-6">
          {/* Seção de Identificação */}
          <Card>
            <CardHeader>
              <CardTitle>Identificação do Inspetor e Veículo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-4">
                  <h3 className="font-semibold">Identificação do Inspetor</h3>
                  {profile?.role === 'admin' && (
                    <div className="space-y-2">
                      <Label htmlFor="inspector">Inspetor *</Label>
                      <Select 
                        value={formData.inspector_id} 
                        onValueChange={(value) => setFormData(prev => ({...prev, inspector_id: value}))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um inspetor" />
                        </SelectTrigger>
                        <SelectContent>
                          {inspectors.map((inspector) => (
                            <SelectItem key={inspector.id} value={inspector.id}>
                              {inspector.first_name} {inspector.last_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  {profile?.role === 'inspector' && (
                    <div className="p-3 bg-muted rounded-lg">
                      <p className="font-medium">{profile.first_name} {profile.last_name}</p>
                      <p className="text-sm text-muted-foreground">Inspetor</p>
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="inspection_date">Data da Inspeção *</Label>
                    <Input
                      id="inspection_date"
                      type="date"
                      value={formData.inspection_date}
                      onChange={(e) => setFormData(prev => ({...prev, inspection_date: e.target.value}))}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold">Identificação do Veículo</h3>
                  <div className="space-y-2">
                    <Label htmlFor="vehicle">Veículo *</Label>
                    <Select 
                      value={formData.vehicle_id} 
                      onValueChange={(value) => setFormData(prev => ({...prev, vehicle_id: value}))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um veículo" />
                      </SelectTrigger>
                      <SelectContent>
                        {vehicles.map((vehicle) => (
                          <SelectItem key={vehicle.id} value={vehicle.id}>
                            Caminhão {vehicle.truck_number} - {vehicle.customer_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {formData.vehicle_id && (
                    <div className="p-3 bg-muted rounded-lg">
                      {(() => {
                        const selectedVehicle = vehicles.find(v => v.id === formData.vehicle_id);
                        return selectedVehicle ? (
                          <>
                            <p className="font-medium">Caminhão {selectedVehicle.truck_number}</p>
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
          <Card>
            <CardHeader>
              <CardTitle>Itens de Inspeção</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Itens de Verificação Simples */}
              <div className="space-y-4">
                <h3 className="font-semibold">Verificações Básicas</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="all_interior_lights"
                      checked={formData.all_interior_lights}
                      onCheckedChange={(checked) => setFormData(prev => ({...prev, all_interior_lights: checked as boolean}))}
                    />
                    <Label htmlFor="all_interior_lights">Todas as luzes internas</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="passenger_seat"
                      checked={formData.passenger_seat}
                      onCheckedChange={(checked) => setFormData(prev => ({...prev, passenger_seat: checked as boolean}))}
                    />
                    <Label htmlFor="passenger_seat">Assento do passageiro</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="fire_extinguisher"
                      checked={formData.fire_extinguisher}
                      onCheckedChange={(checked) => setFormData(prev => ({...prev, fire_extinguisher: checked as boolean}))}
                    />
                    <Label htmlFor="fire_extinguisher">Extintor de incêndio</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="all_outside_lights"
                      checked={formData.all_outside_lights}
                      onCheckedChange={(checked) => setFormData(prev => ({...prev, all_outside_lights: checked as boolean}))}
                    />
                    <Label htmlFor="all_outside_lights">Todas as luzes externas</Label>
                  </div>
                </div>
              </div>

              {/* Itens com Opções de Status */}
              <div className="space-y-4">
                <h3 className="font-semibold">Verificações Detalhadas</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Label>Todos os gabinetes/trincos</Label>
                    <RadioGroup 
                      value={formData.all_cabinets_latches} 
                      onValueChange={(value) => setFormData(prev => ({...prev, all_cabinets_latches: value}))}
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="working" id="cabinets_working" />
                        <Label htmlFor="cabinets_working">Funcionando</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="repaired" id="cabinets_repaired" />
                        <Label htmlFor="cabinets_repaired">Reparado</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="missing" id="cabinets_missing" />
                        <Label htmlFor="cabinets_missing">Ausente</Label>
                      </div>
                    </RadioGroup>
                  </div>

                  <div className="space-y-3">
                    <Label>Acendedor de cigarro</Label>
                    <RadioGroup 
                      value={formData.cigarette_lighter} 
                      onValueChange={(value) => setFormData(prev => ({...prev, cigarette_lighter: value}))}
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="working" id="lighter_working" />
                        <Label htmlFor="lighter_working">Funcionando</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="repaired" id="lighter_repaired" />
                        <Label htmlFor="lighter_repaired">Reparado</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="missing" id="lighter_missing" />
                        <Label htmlFor="lighter_missing">Ausente</Label>
                      </div>
                    </RadioGroup>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Seção de Mídia e Observações */}
          <Card>
            <CardHeader>
              <CardTitle>Fotos e Observações</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label>Foto do Interior</Label>
                  <div 
                    className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center cursor-pointer hover:border-muted-foreground/50 transition-colors"
                    onClick={() => handleFileUpload('interior_photo_url')}
                  >
                    <Camera className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">Clique para adicionar foto do interior</p>
                    <p className="text-xs text-muted-foreground mt-1">ou arraste e solte aqui</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <Label>Foto do Exterior</Label>
                  <div 
                    className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center cursor-pointer hover:border-muted-foreground/50 transition-colors"
                    onClick={() => handleFileUpload('exterior_photo_url')}
                  >
                    <Camera className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">Clique para adicionar foto do exterior</p>
                    <p className="text-xs text-muted-foreground mt-1">ou arraste e solte aqui</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="overall_condition">Condição Geral do Caminhão</Label>
                  <Textarea
                    id="overall_condition"
                    value={formData.overall_condition}
                    onChange={(e) => setFormData(prev => ({...prev, overall_condition: e.target.value}))}
                    placeholder="Descreva a condição geral do veículo..."
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="additional_notes">Notas Adicionais</Label>
                  <Textarea
                    id="additional_notes"
                    value={formData.additional_notes}
                    onChange={(e) => setFormData(prev => ({...prev, additional_notes: e.target.value}))}
                    placeholder="Observações extras, problemas encontrados, recomendações..."
                    rows={4}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Seção Final */}
          <Card>
            <CardHeader>
              <CardTitle>Finalização</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="inspector_signature">Assinatura do Inspetor</Label>
                <Input
                  id="inspector_signature"
                  value={formData.inspector_signature}
                  onChange={(e) => setFormData(prev => ({...prev, inspector_signature: e.target.value}))}
                  placeholder="Digite seu nome completo como assinatura"
                />
              </div>

              <div className="flex gap-4 pt-4">
                <Button
                  onClick={handleSubmit}
                  className="flex-1 gap-2"
                  disabled={!formData.vehicle_id || !formData.inspector_id}
                >
                  <Save className="h-4 w-4" />
                  Salvar Checklist
                </Button>
                <Button
                  variant="outline"
                  onClick={() => navigate('/')}
                  className="flex-1"
                >
                  Cancelar
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