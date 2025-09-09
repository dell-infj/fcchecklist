import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Edit, FileText, Download, ArrowLeft, Home, Plus } from 'lucide-react';

interface Vehicle {
  id: string;
  vehicle_category: string;
  owner_unique_id: string;
  license_plate: string;
  model: string;
  year: number;
  fuel_type: string;
  chassis: string;
  renavam: string;
  crv_number: string;
  crlv_pdf_url: string;
  status: string;
  created_at: string;
  truck_number?: string;
}

export default function VehicleManagement() {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [uploadingPdf, setUploadingPdf] = useState(false);
  const [availableCompanies, setAvailableCompanies] = useState<string[]>([]);
  const [isAddingVehicle, setIsAddingVehicle] = useState(false);
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
    truck_number: '',
    status: 'active' as const
  });

  useEffect(() => {
    fetchVehicles();
    fetchAvailableCompanies();
  }, []);

  const fetchAvailableCompanies = async () => {
    if (!profile) return;
    
    // Usar Set para remover duplicatas
    const companies = [...new Set([profile.unique_id, ...(profile.company_ids || [])].filter(Boolean))];
    setAvailableCompanies(companies);
  };

  useEffect(() => {
    if (profile?.unique_id && !newVehicle.owner_unique_id) {
      setNewVehicle((prev) => ({ ...prev, owner_unique_id: profile.unique_id }));
    }
  }, [profile, newVehicle.owner_unique_id]);

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
        unique_id: newVehicle.owner_unique_id,
        ...(newVehicle.vehicle_category === 'caminhao'
          ? { truck_number: (newVehicle.truck_number?.trim() || newVehicle.license_plate) }
          : {})
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
        truck_number: '',
        status: 'active' as const
      });
      setIsAddingVehicle(false);
      fetchVehicles();
    } catch (error) {
      console.error('Error adding vehicle:', error);
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : 'Erro ao cadastrar veículo',
        variant: "destructive"
      });
    }
  };

  const fetchVehicles = async () => {
    try {
      // Usar any temporariamente para contornar problemas de tipo
      const { data, error }: any = await supabase
        .from('vehicles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setVehicles(data || []);
    } catch (error) {
      console.error('Error fetching vehicles:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar veículos",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePdfUpload = async (file: File, vehicleId: string) => {
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
      const fileName = `${user?.id}/${vehicleId}-${Date.now()}.pdf`;

      const { error: uploadError } = await supabase.storage
        .from('crlv-pdfs')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('crlv-pdfs')
        .getPublicUrl(fileName);

      // Usar any temporariamente para contornar problemas de tipo  
      const { error: updateError }: any = await supabase
        .from('vehicles')
        .update({ crlv_pdf_url: data.publicUrl })
        .eq('id', vehicleId);

      if (updateError) throw updateError;

      toast({
        title: "Sucesso",
        description: "PDF do CRLV atualizado com sucesso!"
      });

      fetchVehicles();
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

  const handleUpdateVehicle = async () => {
    if (!editingVehicle) return;

    try {
      // Usar any temporariamente para contornar problemas de tipo
      const { error }: any = await supabase
        .from('vehicles')
        .update({
          vehicle_category: editingVehicle.vehicle_category,
          owner_unique_id: editingVehicle.owner_unique_id,
          license_plate: editingVehicle.license_plate,
          model: editingVehicle.model,
          year: editingVehicle.year,
          fuel_type: editingVehicle.fuel_type,
          chassis: editingVehicle.chassis,
          renavam: editingVehicle.renavam,
          crv_number: editingVehicle.crv_number,
          truck_number: editingVehicle.truck_number,
          status: editingVehicle.status
        })
        .eq('id', editingVehicle.id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Veículo atualizado com sucesso!"
      });

      setEditingVehicle(null);
      fetchVehicles();
    } catch (error) {
      console.error('Error updating vehicle:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar veículo",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Carregando...</div>;
  }

  return (
    <div className="container mx-auto p-3 sm:p-6">
      <div className="mb-4 sm:mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 w-full sm:w-auto">
            <Button 
              variant="outline" 
              onClick={() => navigate('/')} 
              className="gap-2 w-full sm:w-auto"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Voltar à Dashboard</span>
              <span className="sm:hidden">Dashboard</span>
            </Button>
            <Button 
              variant="outline" 
              onClick={() => navigate('/')} 
              className="gap-2 w-full sm:w-auto"
            >
              <Home className="w-4 h-4" />
              <span className="hidden sm:inline">Início</span>
              <span className="sm:hidden">Home</span>
            </Button>
          </div>
          <Dialog open={isAddingVehicle} onOpenChange={setIsAddingVehicle}>
            <DialogTrigger asChild>
              <Button variant="default" className="gap-2 w-full sm:w-auto">
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Novo Veículo</span>
                <span className="sm:hidden">Novo</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto mx-2 sm:mx-auto">
              <DialogHeader>
                <DialogTitle>Cadastrar Novo Veículo</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

                {newVehicle.vehicle_category === 'caminhao' && (
                  <div>
                    <Label htmlFor="truck_number">Número do Caminhão (único)</Label>
                    <Input
                      id="truck_number"
                      value={newVehicle.truck_number}
                      onChange={(e) => setNewVehicle(prev => ({ ...prev, truck_number: e.target.value }))}
                      placeholder="Ex: CM-001"
                    />
                    <p className="text-xs text-muted-foreground">Se vazio, usaremos a placa como número.</p>
                  </div>
                )}

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
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold">Gerenciamento de Veículos</h1>
        <p className="text-muted-foreground text-sm">Visualize e edite informações dos veículos cadastrados</p>
      </div>

      <div className="grid gap-6">
        {vehicles.map((vehicle) => (
          <Card key={vehicle.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    {vehicle.license_plate}
                    <Badge variant={vehicle.status === 'active' ? 'default' : 'secondary'}>
                      {vehicle.status === 'active' ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </CardTitle>
                  <CardDescription>
                    {vehicle.model} • {vehicle.vehicle_category} • {vehicle.year}
                  </CardDescription>
                </div>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingVehicle(vehicle)}
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      Editar
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Editar Veículo - {vehicle.license_plate}</DialogTitle>
                    </DialogHeader>
                    {editingVehicle && (
                      <div className="grid gap-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>Categoria *</Label>
                            <Select
                              value={editingVehicle.vehicle_category}
                              onValueChange={(value) => setEditingVehicle(prev => prev ? { ...prev, vehicle_category: value } : null)}
                            >
                              <SelectTrigger>
                                <SelectValue />
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
                            <Label>Proprietário *</Label>
                            <Select
                              value={editingVehicle.owner_unique_id}
                              onValueChange={(value) => setEditingVehicle(prev => prev ? { ...prev, owner_unique_id: value } : null)}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {availableCompanies.map((company) => (
                                  <SelectItem key={company} value={company}>
                                    {company}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>Placa *</Label>
                            <Input
                              value={editingVehicle.license_plate}
                              onChange={(e) => setEditingVehicle(prev => prev ? { ...prev, license_plate: e.target.value } : null)}
                            />
                          </div>
                          <div>
                            <Label>Modelo *</Label>
                            <Input
                              value={editingVehicle.model}
                              onChange={(e) => setEditingVehicle(prev => prev ? { ...prev, model: e.target.value } : null)}
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>Ano</Label>
                            <Input
                              type="number"
                              value={editingVehicle.year}
                              onChange={(e) => setEditingVehicle(prev => prev ? { ...prev, year: parseInt(e.target.value) } : null)}
                            />
                          </div>
                          <div>
                            <Label>Combustível</Label>
                            <Select
                              value={editingVehicle.fuel_type}
                              onValueChange={(value) => setEditingVehicle(prev => prev ? { ...prev, fuel_type: value } : null)}
                            >
                              <SelectTrigger>
                                <SelectValue />
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
                            <Label>Chassi</Label>
                            <Input
                              value={editingVehicle.chassis}
                              onChange={(e) => setEditingVehicle(prev => prev ? { ...prev, chassis: e.target.value } : null)}
                            />
                          </div>
                          <div>
                            <Label>Renavam</Label>
                            <Input
                              value={editingVehicle.renavam}
                              onChange={(e) => setEditingVehicle(prev => prev ? { ...prev, renavam: e.target.value } : null)}
                            />
                          </div>
                        </div>

                        <div>
                          <Label>Número CRV</Label>
                          <Input
                            value={editingVehicle.crv_number}
                            onChange={(e) => setEditingVehicle(prev => prev ? { ...prev, crv_number: e.target.value } : null)}
                          />
                        </div>

                        {editingVehicle.vehicle_category === 'caminhao' && (
                          <div>
                            <Label>Número do Caminhão (único)</Label>
                            <Input
                              value={editingVehicle.truck_number || ''}
                              onChange={(e) => setEditingVehicle(prev => prev ? { ...prev, truck_number: e.target.value } : null)}
                            />
                            <p className="text-xs text-muted-foreground">Se vazio, usaremos a placa como número.</p>
                          </div>
                        )}


                        <div>
                          <Label>Status</Label>
                          <Select
                            value={editingVehicle.status}
                            onValueChange={(value) => setEditingVehicle(prev => prev ? { ...prev, status: value } : null)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="active">Ativo</SelectItem>
                              <SelectItem value="inactive">Inativo</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label>Atualizar PDF do CRLV</Label>
                          <Input
                            type="file"
                            accept=".pdf"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handlePdfUpload(file, editingVehicle.id);
                            }}
                            disabled={uploadingPdf}
                          />
                          {uploadingPdf && <p className="text-sm text-muted-foreground">Enviando PDF...</p>}
                        </div>

                        <div className="flex justify-end gap-2">
                          <Button variant="outline" onClick={() => setEditingVehicle(null)}>
                            Cancelar
                          </Button>
                          <Button onClick={handleUpdateVehicle}>
                            Salvar Alterações
                          </Button>
                        </div>
                      </div>
                    )}
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="font-medium">Proprietário:</span>
                  <p className="text-muted-foreground">{vehicle.owner_unique_id}</p>
                </div>
                <div>
                  <span className="font-medium">Combustível:</span>
                  <p className="text-muted-foreground">{vehicle.fuel_type || 'N/A'}</p>
                </div>
                <div>
                  <span className="font-medium">Chassi:</span>
                  <p className="text-muted-foreground">{vehicle.chassis || 'N/A'}</p>
                </div>
                <div>
                  <span className="font-medium">Renavam:</span>
                  <p className="text-muted-foreground">{vehicle.renavam || 'N/A'}</p>
                </div>
                <div>
                  <span className="font-medium">CRV:</span>
                  <p className="text-muted-foreground">{vehicle.crv_number || 'N/A'}</p>
                </div>
                <div>
                  <span className="font-medium">CRLV:</span>
                  {vehicle.crlv_pdf_url ? (
                    <a 
                      href={vehicle.crlv_pdf_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-primary hover:underline"
                    >
                      <FileText className="w-4 h-4" />
                      Ver PDF
                    </a>
                  ) : (
                    <p className="text-muted-foreground">Não anexado</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {vehicles.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-muted-foreground">Nenhum veículo cadastrado ainda.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}