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
    if (!checklist) {
      toast({
        title: "Dados não disponíveis",
        description: "Os dados do checklist não estão disponíveis",
        variant: "destructive"
      });
      return;
    }

    try {
      toast({
        title: "Gerando PDF...",
        description: "Por favor, aguarde enquilo o PDF é gerado"
      });

      // Importar as bibliotecas necessárias
      const html2canvas = (await import('html2canvas')).default;
      const jsPDF = (await import('jspdf')).default;

      // Capturar o elemento do documento
      const element = document.querySelector('.preview-document') as HTMLElement;
      if (!element) {
        throw new Error('Elemento do documento não encontrado');
      }

      // Configurações para captura de alta qualidade
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        width: element.scrollWidth,
        height: element.scrollHeight
      });

      // Criar PDF no formato A4
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgData = canvas.toDataURL('image/png');

      // Dimensões da página em mm (não fixar valores para suportar outros formatos)
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      // Margens em mm
      const marginTop = 5;
      const marginBottom = 5;
      const marginLeft = 5;
      const marginRight = 5;

      // Área útil
      const usableWidth = pageWidth - marginLeft - marginRight;
      const usableHeight = pageHeight - marginTop - marginBottom;

      // Calcular dimensões da imagem mantendo proporção para caber na largura útil
      const imgWidth = usableWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      // Adicionar a primeira página respeitando margem superior e inferior
      let heightLeft = imgHeight;
      pdf.addImage(imgData, 'PNG', marginLeft, marginTop, imgWidth, imgHeight);
      heightLeft -= usableHeight;

      // Páginas adicionais – sempre respeitando a área útil (garante margem inferior)
      while (heightLeft > 0) {
        pdf.addPage();
        const yOffset = marginTop - (imgHeight - heightLeft);
        pdf.addImage(imgData, 'PNG', marginLeft, yOffset, imgWidth, imgHeight);
        heightLeft -= usableHeight;
      }

      // Baixar o PDF
      const filename = `checklist_${checklist.vehicle.license_plate}_${checklist.inspection_date}.pdf`;
      pdf.save(filename);

      toast({
        title: "Sucesso",
        description: "PDF gerado e baixado com sucesso!"
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: "Erro",
        description: "Erro ao gerar PDF. Tente novamente.",
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
      <div className="max-w-6xl mx-auto space-y-6 px-4">
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
          
          {checklist.pdf_url && (
            <div className="flex gap-2 justify-end">
              <Button onClick={downloadPDF} className="gap-2">
                <Download className="h-4 w-4" />
                Baixar PDF
              </Button>
              <Button 
                variant="outline" 
                onClick={() => window.open(checklist.pdf_url.startsWith('http') ? checklist.pdf_url : `${supabase.storage.from('checklist-pdfs').getPublicUrl(checklist.pdf_url).data.publicUrl}`, '_blank')}
                className="gap-2"
              >
                <FileText className="h-4 w-4" />
                Visualizar PDF
              </Button>
            </div>
          )}
        </div>

        {/* Document Content - Igual ao Preview do PDF */}
        <Card className="overflow-hidden">
          <CardContent className="p-8 bg-white text-black">
            <div className="preview-document" style={{ 
              fontFamily: 'Arial, sans-serif',
              fontSize: '14px',
              lineHeight: '1.4',
              color: '#000'
            }}>
              
              {/* Header da Empresa */}
              <div className="company-header text-center mb-8">
                <h1 className="text-xl font-bold mb-2 text-black">
                  Facilita Serviços e Construções LTDA
                </h1>
                <p className="text-sm text-gray-600 mb-1">
                  CNPJ: 05.873.924/0001-80 | Email: contato@fcgestao.com.br
                </p>
                <p className="text-sm text-gray-600 mb-5">
                  Rua princesa imperial, 220 - Realengo - RJ
                </p>
                <h2 className="text-lg font-bold text-black">
                  CHECKLIST DE INSPEÇÃO VEICULAR
                </h2>
              </div>

              {/* Informações em Duas Colunas */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div>
                  <h3 className="text-base font-bold mb-3 pb-2 border-b border-gray-300 text-black">
                    Informações Gerais
                  </h3>
                  <div className="space-y-1">
                    <p className="text-sm">
                      <strong>Data da Inspeção:</strong> {new Date(checklist.inspection_date).toLocaleDateString('pt-BR')}
                    </p>
                    <p className="text-sm">
                      <strong>Inspetor:</strong> {checklist.inspector.first_name} {checklist.inspector.last_name}
                    </p>
                    <p className="text-sm">
                      <strong>Quilometragem:</strong> {checklist.checklist_data?.vehicle_mileage && typeof checklist.checklist_data.vehicle_mileage === 'string' ? `${checklist.checklist_data.vehicle_mileage} km` : 'Não informado'}
                    </p>
                    <p className="text-sm">
                      <strong>Centro de Custo:</strong> {checklist.checklist_data?.cost_center && typeof checklist.checklist_data.cost_center === 'string' ? checklist.checklist_data.cost_center : 'Não informado'}
                    </p>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-base font-bold mb-3 pb-2 border-b border-gray-300 text-black">
                    Dados do Veículo
                  </h3>
                  <div className="space-y-1">
                    <p className="text-sm">
                      <strong>Modelo:</strong> {checklist.vehicle.model}
                    </p>
                    <p className="text-sm">
                      <strong>Placa:</strong> {checklist.vehicle.license_plate}
                    </p>
                    <p className="text-sm">
                      <strong>Ano:</strong> {checklist.vehicle.year}
                    </p>
                    <p className="text-sm">
                      <strong>Categoria:</strong> {checklist.vehicle.vehicle_category}
                    </p>
                  </div>
                </div>
              </div>

              {/* Itens de Inspeção */}
              <div className="mb-6">
                <h3 className="text-base font-bold mb-3 pb-2 border-b border-gray-300 text-black">
                  Itens de Inspeção
                </h3>
                <div className="space-y-2">
                  {checklistItems.length > 0 ? (
                    checklistItems.map((item) => {
                      const fieldKey = getFieldKey(item.name);
                      const itemData = (checklist as any)?.checklist_data?.[fieldKey];
                      const value = itemData?.status ?? (checklist as any)[fieldKey];
                      const observation = itemData?.observation;
                      
                      const getStatusDisplay = (val: boolean | string) => {
                        if (typeof val === 'boolean') {
                          return val ? 'CONFORME' : 'NÃO CONFORME';
                        }
                        const v = String(val).toLowerCase();
                        switch (v) {
                          case 'funcionando':
                          case 'sim':
                          case 'ok':
                            return 'CONFORME';
                          case 'revisao':
                          case 'revisão':
                            return 'REVISÃO';
                          case 'ausente':
                            return 'AUSENTE';
                          case 'not_ok':
                          case 'nao':
                          case 'não':
                            return 'NÃO CONFORME';
                          case 'not_applicable':
                            return 'N/A';
                          default:
                            return 'Não verificado';
                        }
                      };

                      const getStatusColor = (val: boolean | string) => {
                        if (typeof val === 'boolean') {
                          return val ? 'bg-green-700 text-white' : 'bg-red-700 text-white';
                        }
                        const v = String(val).toLowerCase();
                        switch (v) {
                          case 'funcionando':
                          case 'sim':
                          case 'ok':
                            return 'bg-green-700 text-white';
                          case 'revisao':
                          case 'revisão':
                            return 'bg-orange-500 text-white';
                          case 'ausente':
                          case 'not_ok':
                          case 'nao':
                          case 'não':
                            return 'bg-red-700 text-white';
                          case 'not_applicable':
                            return 'bg-gray-500 text-white';
                          default:
                            return 'bg-gray-300 text-gray-700';
                        }
                      };

                      return (
                        <div key={item.id} className="flex justify-between items-start p-1 border border-gray-300 bg-white">
                          <div className="flex-1 pr-3">
                            <p className="font-bold text-base text-black mb-1">
                              {item.name}
                            </p>
                            {item.description && (
                              <p className="text-xs text-gray-600 mb-1">
                                {item.description}
                              </p>
                            )}
                            {observation && (
                              <p className="text-xs text-orange-600 mt-1">
                                <strong>Observação:</strong> {observation}
                              </p>
                            )}
                          </div>
                          <div className={`px-3 py-1.5 rounded font-bold text-sm min-w-[100px] text-center ${getStatusColor(value)}`}>
                            {getStatusDisplay(value)}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div>
                      <p className="text-gray-600 mb-4 text-sm">Nenhum item de checklist configurado encontrado para esta categoria de veículo.</p>
                      {checklist.checklist_data && Object.keys(checklist.checklist_data).length > 0 && (
                        <div className="space-y-2">
                          {Object.entries(checklist.checklist_data).map(([key, data]) => {
                            const itemData = data as { status?: string; observation?: string };
                            if (key === 'cost_center' || key === 'vehicle_mileage') return null;
                            if (!itemData || typeof itemData !== 'object' || (!itemData.status && !itemData.observation)) return null;
                            
                            const getStatusDisplay = (status: string) => {
                              const v = status.toLowerCase();
                              switch (v) {
                                case 'funcionando':
                                case 'sim':
                                case 'ok':
                                  return 'CONFORME';
                                case 'revisao':
                                case 'revisão':
                                  return 'REVISÃO';
                                case 'ausente':
                                  return 'AUSENTE';
                                case 'not_ok':
                                case 'nao':
                                case 'não':
                                  return 'NÃO CONFORME';
                                case 'not_applicable':
                                  return 'N/A';
                                default:
                                  return status;
                              }
                            };

                            const getStatusColor = (status: string) => {
                              const v = status.toLowerCase();
                              switch (v) {
                                case 'funcionando':
                                case 'sim':
                                case 'ok':
                                  return 'bg-green-700 text-white';
                                case 'revisao':
                                case 'revisão':
                                  return 'bg-orange-500 text-white';
                                case 'ausente':
                                case 'not_ok':
                                case 'nao':
                                case 'não':
                                  return 'bg-red-700 text-white';
                                case 'not_applicable':
                                  return 'bg-gray-500 text-white';
                                default:
                                  return 'bg-gray-300 text-gray-700';
                              }
                            };

                            return (
                              <div key={key} className="flex justify-between items-start p-3 border border-gray-300 bg-white">
                                <div className="flex-1 pr-3">
                                  <p className="font-bold text-sm text-black mb-1">
                                    {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                  </p>
                                  {itemData.observation && (
                                    <p className="text-xs text-orange-600 mt-1">
                                      <strong>Observação:</strong> {itemData.observation}
                                    </p>
                                  )}
                                </div>
                                {itemData.status && (
                                  <div className={`px-3 py-1.5 rounded font-bold text-sm min-w-[100px] text-center ${getStatusColor(itemData.status)}`}>
                                    {getStatusDisplay(itemData.status)}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Condição Geral */}
              <div className="mb-6">
                <h3 className="text-sm font-bold mb-3 pb-2 border-b border-gray-300 text-black">
                  Condição Geral
                </h3>
                <p className="p-3 bg-gray-50 border border-gray-300 text-xs">
                  {checklist.overall_condition || 'Não informado'}
                </p>
              </div>

              {/* Observações Adicionais */}
              {checklist.additional_notes && (
                <div className="mb-6">
                  <h3 className="text-sm font-bold mb-3 pb-2 border-b border-gray-300 text-black">
                    Observações Adicionais
                  </h3>
                  <p className="p-3 bg-gray-50 border border-gray-300 text-xs whitespace-pre-wrap">
                    {checklist.additional_notes}
                  </p>
                </div>
              )}

              {/* Fotos */}
              {(checklist.interior_photo_url || checklist.exterior_photo_url) && (
                <div className="mb-6">
                  <h3 className="text-sm font-bold mb-3 pb-2 border-b border-gray-300 text-black">
                    Documentação Fotográfica
                  </h3>
                  
                  {checklist.interior_photo_url && (
                    <div className="mb-5">
                      <h4 className="text-xs font-medium mb-2">Fotos Internas</h4>
                      {checklist.interior_photo_url.startsWith('data:') ? (
                        <img 
                          src={checklist.interior_photo_url} 
                          alt="Foto do interior" 
                          className="w-full max-w-md h-40 object-cover border border-gray-300"
                        />
                      ) : (
                        <img 
                          src={checklist.interior_photo_url.startsWith('http') ? 
                            checklist.interior_photo_url : 
                            `https://iotbioxbckuqpbwjjouq.supabase.co/storage/v1/object/public/checklist-photos/${checklist.interior_photo_url}`
                          } 
                          alt="Foto do interior" 
                          className="w-full max-w-md h-40 object-cover border border-gray-300"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            const parent = e.currentTarget.parentElement;
                            if (parent) {
                              const errorMsg = document.createElement('p');
                              errorMsg.textContent = 'Imagem não disponível';
                              errorMsg.className = 'text-xs text-gray-500 italic';
                              parent.appendChild(errorMsg);
                            }
                          }}
                        />
                      )}
                    </div>
                  )}
                  
                  {checklist.exterior_photo_url && (
                    <div>
                      <h4 className="text-xs font-medium mb-2">Fotos Externas</h4>
                      {checklist.exterior_photo_url.startsWith('data:') ? (
                        <img 
                          src={checklist.exterior_photo_url} 
                          alt="Foto do exterior" 
                          className="w-full max-w-md h-40 object-cover border border-gray-300"
                        />
                      ) : (
                        <img 
                          src={checklist.exterior_photo_url.startsWith('http') ? 
                            checklist.exterior_photo_url : 
                            `https://iotbioxbckuqpbwjjouq.supabase.co/storage/v1/object/public/checklist-photos/${checklist.exterior_photo_url}`
                          } 
                          alt="Foto do exterior" 
                          className="w-full max-w-md h-40 object-cover border border-gray-300"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            const parent = e.currentTarget.parentElement;
                            if (parent) {
                              const errorMsg = document.createElement('p');
                              errorMsg.textContent = 'Imagem não disponível';
                              errorMsg.className = 'text-xs text-gray-500 italic';
                              parent.appendChild(errorMsg);
                            }
                          }}
                        />
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Assinatura */}
              {checklist.inspector_signature && (
                <div className="mt-8">
                  <h3 className="text-sm font-bold mb-3 pb-2 border-b border-gray-300 text-black">
                    Assinatura do Inspetor
                  </h3>
                  <img 
                    src={checklist.inspector_signature} 
                    alt="Assinatura do inspetor" 
                    className="max-w-sm h-32 object-contain border border-gray-300"
                  />
                </div>
              )}

            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default ChecklistView;