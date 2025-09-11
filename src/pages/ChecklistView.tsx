import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Download, FileText } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import Layout from '@/components/Layout';

interface ChecklistItem {
  id: string;
  name: string;
  description: string;
  category: string;
  required: boolean;
  item_order: number;
}

interface ChecklistDetail {
  id: string;
  status: string;
  inspection_date: string;
  overall_condition: string;
  additional_notes: string;
  interior_photo_url: string;
  exterior_photo_url: string;
  inspector_signature: string;
  pdf_url: string;
  created_at: string;
  updated_at: string;
  all_interior_lights: boolean;
  passenger_seat: boolean;
  fire_extinguisher: boolean;
  all_outside_lights: boolean;
  all_cabinets_latches: string;
  cigarette_lighter: string;
  checklist_data?: Record<string, { status?: string; observation?: string } | string>;
  [key: string]: any; // Para acessar os campos dinâmicos dos itens
  vehicle: {
    vehicle_category: string;
    license_plate: string;
    model: string;
    year: number;
    owner_unique_id: string;
  };
  inspector: {
    first_name: string;
    last_name: string;
  };
}

const ChecklistView = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { toast } = useToast();
  const [checklist, setChecklist] = useState<ChecklistDetail | null>(null);
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadChecklist();
    }
  }, [id]);

  const loadChecklist = async () => {
    try {
      const { data, error }: any = await supabase
        .from('checklists')
        .select(`
          *,
          vehicles!inner (
            vehicle_category,
            license_plate,
            model,
            year,
            owner_unique_id
          ),
          profiles!inner (
            first_name,
            last_name
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;

      // Carregar os itens de checklist baseados na categoria do veículo
      // Tentar primeiro por category, depois por unique_id
      const vehicleCategory = data.vehicles.vehicle_category.toLowerCase();
      const vehicleCategoryUpper = data.vehicles.vehicle_category.toUpperCase();
      
      let itemsData;
      let itemsError;
      
      // Primeira tentativa: buscar por category
      const { data: itemsDataCategory, error: itemsErrorCategory } = await supabase
        .from('checklist_items')
        .select('*')
        .eq('category', vehicleCategory)
        .eq('active', true)
        .order('item_order');

      if (itemsDataCategory && itemsDataCategory.length > 0) {
        itemsData = itemsDataCategory;
        itemsError = itemsErrorCategory;
      } else {
        // Segunda tentativa: buscar por unique_id em maiúscula
        const { data: itemsDataUnique, error: itemsErrorUnique } = await supabase
          .from('checklist_items')
          .select('*')
          .eq('unique_id', vehicleCategoryUpper)
          .eq('active', true)
          .order('item_order');
        
        itemsData = itemsDataUnique;
        itemsError = itemsErrorUnique;
      }

      if (itemsError) throw itemsError;

      setChecklistItems(itemsData || []);
      setChecklist({
        ...data,
        vehicle: data.vehicles,
        inspector: data.profiles
      });
    } catch (error) {
      console.error('Error loading checklist:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar dados do checklist",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const downloadPDF = async () => {
    if (!checklist?.pdf_url) {
      toast({
        title: "PDF não disponível",
        description: "O PDF deste checklist não está disponível",
        variant: "destructive"
      });
      return;
    }

    try {
      // Tentar baixar diretamente pelo URL se for um URL público
      if (checklist.pdf_url.startsWith('http')) {
        const a = document.createElement('a');
        a.href = checklist.pdf_url;
        a.download = `checklist_${checklist.vehicle.license_plate}_${checklist.inspection_date}.pdf`;
        a.target = '_blank';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        toast({
          title: "Sucesso",
          description: "PDF baixado com sucesso!"
        });
        return;
      }

      // Caso contrário, tentar baixar do storage
      const { data, error } = await supabase.storage
        .from('checklist-pdfs')
        .download(checklist.pdf_url);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `checklist_${checklist.vehicle.license_plate}_${checklist.inspection_date}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Sucesso",
        description: "PDF baixado com sucesso!"
      });
    } catch (error) {
      console.error('Error downloading PDF:', error);
      toast({
        title: "Erro",
        description: "Erro ao baixar PDF",
        variant: "destructive"
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="default" className="bg-success">Concluído</Badge>;
      case 'draft':
        return <Badge variant="secondary">Em Andamento</Badge>;
      case 'reviewed':
        return <Badge variant="outline">Revisado</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getItemStatusLabel = (value: boolean | string) => {
    if (typeof value === 'boolean') {
      return value ? 'SIM' : 'NÃO';
    }
    if (!value) return 'Não verificado';
    const v = String(value).toLowerCase();
    switch (v) {
      case 'funcionando':
      case 'sim':
      case 'ok':
        return 'SIM';
      case 'revisao':
      case 'revisão':
        return 'REVISÃO';
      case 'ausente':
        return 'AUSENTE';
      case 'not_ok':
      case 'nao':
      case 'não':
        return 'NÃO';
      case 'not_applicable':
        return 'N/A';
      default:
        return value as string;
    }
  };

  const getItemBadgeVariant = (value: boolean | string): 'default' | 'secondary' | 'destructive' | 'outline' => {
    if (typeof value === 'boolean') {
      return value ? 'default' : 'destructive';
    }
    const v = String(value).toLowerCase();
    switch (v) {
      case 'funcionando':
      case 'sim':
      case 'ok':
        return 'default';
      case 'revisao':
      case 'revisão':
        return 'secondary';
      case 'ausente':
      case 'not_ok':
      case 'nao':
      case 'não':
        return 'destructive';
      case 'not_applicable':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  // Função para normalizar nomes de campos (igual ao DynamicChecklistForm)
  const getFieldKey = (itemName: string) => {
    return itemName
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '');
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

  if (!checklist) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto text-center py-12">
          <h1 className="text-2xl font-bold mb-4">Checklist não encontrado</h1>
          <Button onClick={() => navigate('/')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar ao Dashboard
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6 px-4">
        {/* Header */}
        <div className="flex flex-col gap-4">
          <Button
            variant="outline"
            onClick={() => navigate('/checklists')}
            className="gap-2 w-fit"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar ao Histórico
          </Button>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileText className="h-6 w-6 text-primary" />
              <h1 className="text-2xl font-bold">Relatório de Inspeção</h1>
            </div>
            <div className="flex gap-2">
              {checklist.pdf_url && (
                <Button onClick={downloadPDF} className="gap-2">
                  <Download className="h-4 w-4" />
                  Baixar PDF
                </Button>
              )}
              {checklist.pdf_url && (
                <Button 
                  variant="outline" 
                  onClick={() => window.open(checklist.pdf_url.startsWith('http') ? checklist.pdf_url : `${supabase.storage.from('checklist-pdfs').getPublicUrl(checklist.pdf_url).data.publicUrl}`, '_blank')}
                  className="gap-2"
                >
                  <FileText className="h-4 w-4" />
                  Visualizar PDF
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Status e Informações Básicas */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Informações Gerais</CardTitle>
              {getStatusBadge(checklist.status)}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <h3 className="font-semibold mb-2">Veículo</h3>
                <p><strong>Categoria:</strong> {checklist.vehicle.vehicle_category}</p>
                <p><strong>Placa:</strong> {checklist.vehicle.license_plate}</p>
                <p><strong>Modelo:</strong> {checklist.vehicle.model}</p>
                <p><strong>Ano:</strong> {checklist.vehicle.year}</p>
                <p><strong>Proprietário:</strong> {checklist.vehicle.owner_unique_id}</p>
                {checklist.checklist_data?.vehicle_mileage && typeof checklist.checklist_data.vehicle_mileage === 'string' && (
                  <p><strong>Quilometragem:</strong> {checklist.checklist_data.vehicle_mileage} km</p>
                )}
              </div>
              <div>
                <h3 className="font-semibold mb-2">Inspeção</h3>
                <p><strong>Inspetor:</strong> {checklist.inspector.first_name} {checklist.inspector.last_name}</p>
                <p><strong>Data:</strong> {new Date(checklist.inspection_date).toLocaleDateString('pt-BR')}</p>
                <p><strong>Status:</strong> {checklist.status}</p>
                {checklist.checklist_data?.cost_center && typeof checklist.checklist_data.cost_center === 'string' && (
                  <p><strong>Centro de Custo:</strong> {checklist.checklist_data.cost_center}</p>
                )}
              </div>
              <div>
                <h3 className="font-semibold mb-2">Resumo</h3>
                <p><strong>Itens Verificados:</strong> {checklistItems.length || Object.keys(checklist.checklist_data || {}).filter(k => k !== 'cost_center' && k !== 'vehicle_mileage').length}</p>
                <p><strong>Data de Criação:</strong> {new Date(checklist.created_at).toLocaleDateString('pt-BR')}</p>
                <p><strong>Última Atualização:</strong> {new Date(checklist.updated_at).toLocaleDateString('pt-BR')}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Itens de Inspeção */}
        <Card>
          <CardHeader>
            <CardTitle>Itens Verificados ({checklistItems.length} itens)</CardTitle>
          </CardHeader>
          <CardContent>
            {checklistItems.length > 0 ? (
              <div className="space-y-4">
                {checklistItems.map((item) => {
                  const fieldKey = getFieldKey(item.name);
                  const itemData = (checklist as any)?.checklist_data?.[fieldKey];
                  const value = itemData?.status ?? (checklist as any)[fieldKey];
                  const observation = itemData?.observation;
                  
                  return (
                    <div key={item.id} className="border rounded-lg p-4 space-y-2">
                      <div className="flex justify-between items-start">
                        <div className="flex-1 pr-2">
                          <span className="font-medium">{item.name}</span>
                          {item.required && <span className="text-red-500 ml-1">*</span>}
                          {item.description && (
                            <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
                          )}
                        </div>
                        <Badge variant={getItemBadgeVariant(value)} className="shrink-0">
                          {getItemStatusLabel(value)}
                        </Badge>
                      </div>
                      {observation && (
                        <div className="mt-2">
                          <p className="text-sm text-muted-foreground">
                            <strong>Observação:</strong> {observation}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-muted-foreground mb-4">Nenhum item de checklist configurado encontrado para esta categoria de veículo.</p>
                {checklist.checklist_data && Object.keys(checklist.checklist_data).length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-3">Dados da Inspeção Realizada:</h4>
                    <div className="space-y-3">
                      {Object.entries(checklist.checklist_data).map(([key, data]) => {
                        const itemData = data as { status?: string; observation?: string };
                        if (key === 'cost_center' || key === 'vehicle_mileage') return null;
                        if (!itemData || typeof itemData !== 'object' || (!itemData.status && !itemData.observation)) return null;
                        
                        return (
                          <div key={key} className="border rounded-lg p-4 space-y-2">
                            <div className="flex justify-between items-start">
                              <div className="flex-1 pr-2">
                                <span className="font-medium">{key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
                              </div>
                              {itemData.status && (
                                <Badge variant={getItemBadgeVariant(itemData.status)} className="shrink-0">
                                  {getItemStatusLabel(itemData.status)}
                                </Badge>
                              )}
                            </div>
                            {itemData.observation && (
                              <div className="mt-2">
                                <p className="text-sm text-muted-foreground">
                                  <strong>Observação:</strong> {itemData.observation}
                                </p>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Fotos */}
        {(checklist.interior_photo_url || checklist.exterior_photo_url) && (
          <Card>
            <CardHeader>
              <CardTitle>Fotos da Inspeção</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {checklist.interior_photo_url && (
                  <div>
                    <h3 className="font-semibold mb-2">Interior</h3>
                    <img 
                      src={checklist.interior_photo_url} 
                      alt="Foto do interior" 
                      className="w-full h-64 object-cover rounded-lg border"
                    />
                  </div>
                )}
                {checklist.exterior_photo_url && (
                  <div>
                    <h3 className="font-semibold mb-2">Exterior</h3>
                    <img 
                      src={checklist.exterior_photo_url} 
                      alt="Foto do exterior" 
                      className="w-full h-64 object-cover rounded-lg border"
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Observações */}
        <Card>
          <CardHeader>
            <CardTitle>Observações</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Condição Geral</h3>
              <p className="text-muted-foreground">
                {checklist.overall_condition || 'Nenhuma observação sobre a condição geral.'}
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Observações Adicionais</h3>
              <p className="text-muted-foreground">
                {checklist.additional_notes || 'Nenhuma observação adicional.'}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Assinatura */}
        {checklist.inspector_signature && (
          <Card>
            <CardHeader>
              <CardTitle>Assinatura do Inspetor</CardTitle>
            </CardHeader>
            <CardContent>
              <img 
                src={checklist.inspector_signature} 
                alt="Assinatura do inspetor" 
                className="max-w-md h-32 object-contain border rounded-lg"
              />
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
};

export default ChecklistView;