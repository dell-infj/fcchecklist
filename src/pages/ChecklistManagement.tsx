import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { generateChecklistPDF, downloadPDF } from '@/lib/pdfGenerator';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  ArrowLeft, 
  Home, 
  Download, 
  Trash2, 
  Eye,
  FileText,
  Car,
  User,
  Calendar,
  RefreshCw,
  Upload
} from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { getPDFBlob } from '@/lib/pdfGenerator';

interface ChecklistItem {
  id: string;
  status: string;
  inspection_date: string;
  pdf_url: string | null;
  created_at: string;
  overall_condition: string | null;
  additional_notes: string | null;
  interior_photo_url: string | null;
  exterior_photo_url: string | null;
  inspector_signature: string | null;
  vehicle: {
    license_plate: string;
    vehicle_category: string;
    model: string;
    year: number;
  };
  inspector: {
    first_name: string;
    last_name: string;
  };
  // Campos booleanos do checklist
  all_interior_lights?: boolean;
  passenger_seat?: boolean;
  fire_extinguisher?: boolean;
  all_outside_lights?: boolean;
  cigarette_lighter?: string;
  all_cabinets_latches?: string;
}

export default function ChecklistManagement() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [checklists, setChecklists] = useState<ChecklistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [regeneratingId, setRegeneratingId] = useState<string | null>(null);
  const [regeneratingAll, setRegeneratingAll] = useState(false);

  useEffect(() => {
    fetchChecklists();
  }, []);

  const fetchChecklists = async () => {
    try {
      const { data, error }: any = await supabase
        .from('checklists')
        .select(`
          id,
          status,
          inspection_date,
          pdf_url,
          created_at,
          overall_condition,
          additional_notes,
          interior_photo_url,
          exterior_photo_url,
          inspector_signature,
          all_interior_lights,
          passenger_seat,
          fire_extinguisher,
          all_outside_lights,
          cigarette_lighter,
          all_cabinets_latches,
          checklist_data,
          vehicle_id,
          inspector_id,
          vehicles!inner (
            license_plate,
            vehicle_category,
            model,
            year
          ),
          profiles!inner (
            first_name,
            last_name
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedData = data?.map((item: any) => ({
        id: item.id,
        status: item.status,
        inspection_date: item.inspection_date,
        pdf_url: item.pdf_url,
        created_at: item.created_at,
        overall_condition: item.overall_condition,
        additional_notes: item.additional_notes,
        interior_photo_url: item.interior_photo_url,
        exterior_photo_url: item.exterior_photo_url,
        inspector_signature: item.inspector_signature,
        all_interior_lights: item.all_interior_lights,
        passenger_seat: item.passenger_seat,
        fire_extinguisher: item.fire_extinguisher,
        all_outside_lights: item.all_outside_lights,
        cigarette_lighter: item.cigarette_lighter,
        all_cabinets_latches: item.all_cabinets_latches,
        checklist_data: item.checklist_data,
        vehicle_id: item.vehicle_id,
        inspector_id: item.inspector_id,
        vehicle: {
          license_plate: item.vehicles?.license_plate || '',
          vehicle_category: item.vehicles?.vehicle_category || '',
          model: item.vehicles?.model || '',
          year: item.vehicles?.year || new Date().getFullYear()
        },
        inspector: {
          first_name: item.profiles?.first_name || '',
          last_name: item.profiles?.last_name || ''
        }
      })) || [];

      setChecklists(formattedData);
    } catch (error) {
      console.error('Error fetching checklists:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar checklists",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async (checklist: ChecklistItem) => {
    try {
      toast({
        title: "Gerando PDF...",
        description: "Por favor, aguarde enquanto o PDF é gerado"
      });

      // Buscar dados completos do checklist (igual à página de visualização)
      const { data: fullChecklist, error: checklistError } = await supabase
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
        .eq('id', checklist.id)
        .single();

      if (checklistError) throw checklistError;

      // Buscar itens de checklist
      const vehicleCategory = fullChecklist.vehicles.vehicle_category.toLowerCase();
      const vehicleCategoryUpper = fullChecklist.vehicles.vehicle_category.toUpperCase();
      
      let itemsData;
      
      // Primeira tentativa: buscar por category
      const { data: itemsDataCategory } = await supabase
        .from('checklist_items')
        .select('*')
        .eq('category', vehicleCategory)
        .eq('active', true)
        .order('item_order');

      if (itemsDataCategory && itemsDataCategory.length > 0) {
        itemsData = itemsDataCategory;
      } else {
        // Segunda tentativa: buscar por unique_id
        const { data: itemsDataUnique } = await supabase
          .from('checklist_items')
          .select('*')
          .eq('unique_id', vehicleCategoryUpper)
          .eq('active', true)
          .order('item_order');
        
        itemsData = itemsDataUnique;
      }

      // Criar elemento HTML temporário para renderização (igual à página de visualização)
      const tempElement = document.createElement('div');
      tempElement.className = 'preview-document';
      tempElement.style.position = 'absolute';
      tempElement.style.left = '-9999px';
      tempElement.style.top = '-9999px';
      tempElement.style.width = '800px';
      tempElement.style.fontFamily = 'Arial, sans-serif';
      tempElement.style.fontSize = '14px';
      tempElement.style.lineHeight = '1.4';
      tempElement.style.color = '#000';
      tempElement.style.backgroundColor = '#ffffff';
      tempElement.style.padding = '32px';

      // Função para normalizar nomes de campos
      const getFieldKey = (itemName: string) => {
        return itemName
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-z0-9]/g, '_')
          .replace(/_+/g, '_')
          .replace(/^_|_$/g, '');
      };

      // Construir HTML do documento
      let htmlContent = `
        <!-- Header da Empresa -->
        <div style="text-align: center; margin-bottom: 32px;">
          <h1 style="font-size: 20px; font-weight: bold; margin-bottom: 8px; color: #000;">
            Facilita Serviços e Construções LTDA
          </h1>
          <p style="font-size: 14px; color: #666; margin-bottom: 4px;">
            CNPJ: 05.873.924/0001-80 | Email: contato@fcgestao.com.br
          </p>
          <p style="font-size: 14px; color: #666; margin-bottom: 20px;">
            Rua princesa imperial, 220 - Realengo - RJ
          </p>
          <h2 style="font-size: 18px; font-weight: bold; color: #000;">
            CHECKLIST DE INSPEÇÃO VEICULAR
          </h2>
        </div>

        <!-- Informações em Duas Colunas -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 32px;">
          <div>
            <h3 style="font-size: 16px; font-weight: bold; margin-bottom: 12px; padding-bottom: 8px; border-bottom: 1px solid #ccc; color: #000;">
              Informações Gerais
            </h3>
            <div style="font-size: 14px; line-height: 1.6;">
              <p><strong>Data da Inspeção:</strong> ${new Date(fullChecklist.inspection_date).toLocaleDateString('pt-BR')}</p>
              <p><strong>Inspetor:</strong> ${fullChecklist.profiles.first_name} ${fullChecklist.profiles.last_name}</p>
              <p><strong>Quilometragem:</strong> ${(fullChecklist.checklist_data as any)?.vehicle_mileage && typeof (fullChecklist.checklist_data as any).vehicle_mileage === 'string' ? `${(fullChecklist.checklist_data as any).vehicle_mileage} km` : 'Não informado'}</p>
              <p><strong>Centro de Custo:</strong> ${(fullChecklist.checklist_data as any)?.cost_center && typeof (fullChecklist.checklist_data as any).cost_center === 'string' ? (fullChecklist.checklist_data as any).cost_center : 'Não informado'}</p>
            </div>
          </div>
          
          <div>
            <h3 style="font-size: 16px; font-weight: bold; margin-bottom: 12px; padding-bottom: 8px; border-bottom: 1px solid #ccc; color: #000;">
              Dados do Veículo
            </h3>
            <div style="font-size: 14px; line-height: 1.6;">
              <p><strong>Modelo:</strong> ${fullChecklist.vehicles.model}</p>
              <p><strong>Placa:</strong> ${fullChecklist.vehicles.license_plate}</p>
              <p><strong>Ano:</strong> ${fullChecklist.vehicles.year}</p>
              <p><strong>Categoria:</strong> ${fullChecklist.vehicles.vehicle_category}</p>
            </div>
          </div>
        </div>

        <!-- Itens de Inspeção -->
        <div style="margin-bottom: 24px;">
          <h3 style="font-size: 16px; font-weight: bold; margin-bottom: 12px; padding-bottom: 8px; border-bottom: 1px solid #ccc; color: #000;">
            Itens de Inspeção
          </h3>
          <div style="font-size: 14px;">
      `;

      // Adicionar itens de inspeção
      if (itemsData && itemsData.length > 0) {
        itemsData.forEach((item: any) => {
          const fieldKey = getFieldKey(item.name);
          const itemData = fullChecklist?.checklist_data?.[fieldKey];
          const value = itemData?.status ?? fullChecklist[fieldKey];
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
              return val ? 'background-color: #15803d; color: white;' : 'background-color: #b91c1c; color: white;';
            }
            const v = String(val).toLowerCase();
            switch (v) {
              case 'funcionando':
              case 'sim':
              case 'ok':
                return 'background-color: #15803d; color: white;';
              case 'revisao':
              case 'revisão':
                return 'background-color: #f59e0b; color: white;';
              case 'ausente':
              case 'not_ok':
              case 'nao':
              case 'não':
                return 'background-color: #b91c1c; color: white;';
              case 'not_applicable':
                return 'background-color: #6b7280; color: white;';
              default:
                return 'background-color: #d1d5db; color: #374151;';
            }
          };

          htmlContent += `
            <div style="display: flex; justify-content: space-between; align-items: flex-start; padding: 12px; border: 1px solid #ccc; background: white; margin-bottom: 8px;">
              <div style="flex: 1; padding-right: 12px;">
                <p style="font-weight: bold; font-size: 14px; color: #000; margin-bottom: 4px;">
                  ${item.name}
                </p>
                ${item.description ? `<p style="font-size: 12px; color: #666; margin-bottom: 4px;">${item.description}</p>` : ''}
                ${observation ? `<p style="font-size: 12px; color: #ea580c; margin-top: 4px;"><strong>Observação:</strong> ${observation}</p>` : ''}
              </div>
              <div style="padding: 6px 12px; border-radius: 4px; font-weight: bold; font-size: 14px; min-width: 100px; text-align: center; ${getStatusColor(value)}">
                ${getStatusDisplay(value)}
              </div>
            </div>
          `;
        });
      }

      htmlContent += `
          </div>
        </div>

        <!-- Condição Geral -->
        <div style="margin-bottom: 24px;">
          <h3 style="font-size: 14px; font-weight: bold; margin-bottom: 12px; padding-bottom: 8px; border-bottom: 1px solid #ccc; color: #000;">
            Condição Geral
          </h3>
          <p style="padding: 12px; background-color: #f9fafb; border: 1px solid #ccc; font-size: 12px;">
            ${fullChecklist.overall_condition || 'Não informado'}
          </p>
        </div>

        ${fullChecklist.additional_notes ? `
        <!-- Observações Adicionais -->
        <div style="margin-bottom: 24px;">
          <h3 style="font-size: 14px; font-weight: bold; margin-bottom: 12px; padding-bottom: 8px; border-bottom: 1px solid #ccc; color: #000;">
            Observações Adicionais
          </h3>
          <p style="padding: 12px; background-color: #f9fafb; border: 1px solid #ccc; font-size: 12px; white-space: pre-wrap;">
            ${fullChecklist.additional_notes}
          </p>
        </div>
        ` : ''}
      `;

      tempElement.innerHTML = htmlContent;
      document.body.appendChild(tempElement);

      // Importar bibliotecas e gerar PDF
      const html2canvas = (await import('html2canvas')).default;
      const jsPDF = (await import('jspdf')).default;

      // Aguardar renderização
      await new Promise(resolve => setTimeout(resolve, 100));

      const canvas = await html2canvas(tempElement, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        width: tempElement.scrollWidth,
        height: tempElement.scrollHeight
      });

      // Remover elemento temporário
      document.body.removeChild(tempElement);

      // Criar PDF
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgData = canvas.toDataURL('image/png');

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const marginTop = 5;
      const marginBottom = 5;
      const marginLeft = 5;
      const marginRight = 5;
      const usableWidth = pageWidth - marginLeft - marginRight;
      const usableHeight = pageHeight - marginTop - marginBottom;
      const imgWidth = usableWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let heightLeft = imgHeight;
      pdf.addImage(imgData, 'PNG', marginLeft, marginTop, imgWidth, imgHeight);
      heightLeft -= usableHeight;

      while (heightLeft > 0) {
        pdf.addPage();
        const yOffset = marginTop - (imgHeight - heightLeft);
        pdf.addImage(imgData, 'PNG', marginLeft, yOffset, imgWidth, imgHeight);
        heightLeft -= usableHeight;
      }

      const filename = `checklist_${fullChecklist.vehicles.license_plate}_${fullChecklist.inspection_date}.pdf`;
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

  const handleDeleteChecklist = async (checklistId: string) => {
    try {
      setDeletingId(checklistId);
      
      const { error } = await supabase
        .from('checklists')
        .delete()
        .eq('id', checklistId);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Checklist excluído com sucesso!"
      });

      fetchChecklists();
    } catch (error) {
      console.error('Error deleting checklist:', error);
      toast({
        title: "Erro",
        description: "Erro ao excluir checklist",
        variant: "destructive"
      });
    } finally {
      setDeletingId(null);
    }
  };

  const handleRegeneratePDF = async (checklist: ChecklistItem) => {
    try {
      setRegeneratingId(checklist.id);
      
      // Buscar dados dos itens do checklist pela categoria do veículo
      const { data: checklistItems, error: itemsError } = await supabase
        .from('checklist_items')
        .select('*')
        .eq('category', checklist.vehicle.vehicle_category.toLowerCase())
        .eq('active', true)
        .order('item_order');

      let items = checklistItems;
      
      // Se não encontrou por categoria, tentar por unique_id (fallback)
      if (!items || items.length === 0) {
        const { data: itemsDataUnique } = await supabase
          .from('checklist_items')
          .select('*')
          .eq('unique_id', checklist.vehicle.vehicle_category.toUpperCase())
          .eq('active', true)
          .order('item_order');
        items = itemsDataUnique;
      }

      // Extrair dados do checklist_data se disponível
      const checklistData = (checklist as any).checklist_data || {};
      const vehicleMileage = checklistData.vehicle_mileage || "Não informado";
      const costCenter = checklistData.cost_center || "Não informado";

      // Criar dados completos para o PDF seguindo o modelo do Preview
      const pdfData = {
        vehicleInfo: {
          model: checklist.vehicle.model,
          license_plate: checklist.vehicle.license_plate,
          year: checklist.vehicle.year,
          vehicle_category: checklist.vehicle.vehicle_category
        },
        inspectorInfo: {
          first_name: checklist.inspector.first_name,
          last_name: checklist.inspector.last_name
        },
        companyInfo: {
          name: 'FC GESTÃO EMPRESARIAL LTDA',
          cnpj: '05.873.924/0001-80',
          email: 'contato@fcgestao.com.br',
          address: 'Rua princesa imperial, 220 - Realengo - RJ'
        },
        inspection_date: new Date(checklist.inspection_date),
        vehicle_mileage: vehicleMileage,
        cost_center: costCenter,
        overall_condition: checklist.overall_condition || "Não informado",
        additional_notes: checklist.additional_notes || "",
        interior_photo_url: checklist.interior_photo_url,
        exterior_photo_url: checklist.exterior_photo_url,
        inspector_signature: checklist.inspector_signature,
        // Mapear dados do checklist seguindo a estrutura do Preview
        checklistItems: (() => {
          const mappedItems: Record<string, { status: string; observation?: string }> = {};
          
          // Se tem itens configurados, mapear cada um
          if (items && items.length > 0) {
            items.forEach((item: any) => {
              const fieldKey = item.name
                .toLowerCase()
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '')
                .replace(/[^a-z0-9]/g, '_')
                .replace(/_+/g, '_')
                .replace(/^_|_$/g, '');
              
              // Buscar no checklist_data primeiro
              const itemData = checklistData[fieldKey];
              if (itemData && typeof itemData === 'object') {
                mappedItems[fieldKey] = {
                  status: itemData.status || 'não verificado',
                  observation: itemData.observation
                };
              } else {
                // Fallback para campos diretos do checklist
                const directValue = (checklist as any)[fieldKey];
                if (directValue !== undefined) {
                  let status = 'não verificado';
                  if (typeof directValue === 'boolean') {
                    status = directValue ? 'funcionando' : 'ausente';
                  } else if (typeof directValue === 'string') {
                    status = directValue;
                  }
                  mappedItems[fieldKey] = { status };
                }
              }
            });
          } else {
            // Mapear campos booleanos básicos se não há itens configurados
            const booleanFields = {
              all_interior_lights: checklist.all_interior_lights,
              passenger_seat: checklist.passenger_seat,
              fire_extinguisher: checklist.fire_extinguisher,
              all_outside_lights: checklist.all_outside_lights
            };
            
            Object.entries(booleanFields).forEach(([key, value]) => {
              if (value !== undefined) {
                mappedItems[key] = { 
                  status: typeof value === 'boolean' ? (value ? 'funcionando' : 'ausente') : String(value)
                };
              }
            });
            
            // Campos string
            if (checklist.cigarette_lighter) {
              mappedItems.cigarette_lighter = { status: checklist.cigarette_lighter };
            }
            if (checklist.all_cabinets_latches) {
              mappedItems.all_cabinets_latches = { status: checklist.all_cabinets_latches };
            }
          }
          
          return mappedItems;
        })(),
        checklist_items: items || []
      };

      // Gerar PDF
      const doc = await generateChecklistPDF(pdfData);
      const pdfBlob = getPDFBlob(doc);
      
      // Upload para Supabase Storage
      const filename = `checklist_${checklist.vehicle.license_plate}_${checklist.inspection_date}_${Date.now()}.pdf`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('checklist-pdfs')
        .upload(filename, pdfBlob, {
          contentType: 'application/pdf',
          upsert: true
        });

      if (uploadError) throw uploadError;

      // Atualizar URL do PDF no banco de dados
      const { error: updateError } = await supabase
        .from('checklists')
        .update({ pdf_url: uploadData.path })
        .eq('id', checklist.id);

      if (updateError) throw updateError;

      toast({
        title: "Sucesso",
        description: "PDF regenerado e salvo com sucesso!"
      });

      // Recarregar dados
      fetchChecklists();
    } catch (error) {
      console.error('Error regenerating PDF:', error);
      toast({
        title: "Erro",
        description: "Erro ao regenerar PDF",
        variant: "destructive"
      });
    } finally {
      setRegeneratingId(null);
    }
  };

  const handleRegenerateAllPDFs = async () => {
    try {
      setRegeneratingAll(true);
      
      // Filtrar checklists que não têm PDF ou têm status completed
      const checklistsToRegenerate = checklists.filter(checklist => 
        !checklist.pdf_url || checklist.status === 'completed'
      );

      if (checklistsToRegenerate.length === 0) {
        toast({
          title: "Info",
          description: "Todos os checklists já possuem PDFs atualizados."
        });
        return;
      }

      // Processar em lotes para evitar sobrecarga
      for (let i = 0; i < checklistsToRegenerate.length; i++) {
        await handleRegeneratePDF(checklistsToRegenerate[i]);
        
        // Pequeno delay entre cada regeneração
        if (i < checklistsToRegenerate.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      toast({
        title: "Sucesso",
        description: `${checklistsToRegenerate.length} PDFs regenerados com sucesso!`
      });
    } catch (error) {
      console.error('Error regenerating all PDFs:', error);
      toast({
        title: "Erro",
        description: "Erro ao regenerar PDFs em lote",
        variant: "destructive"
      });
    } finally {
      setRegeneratingAll(false);
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

  if (loading) {
    return <div className="flex justify-center items-center h-64">Carregando...</div>;
  }

  return (
    <div className="container mx-auto p-2 sm:p-4 lg:p-6">
      <div className="mb-3 sm:mb-4 lg:mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 mb-3 sm:mb-4">
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
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-2">
          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold">Gerenciamento de Checklists</h1>
            <p className="text-muted-foreground text-xs sm:text-sm">Visualize, baixe e gerencie os checklists de inspeção</p>
          </div>
          
          {checklists.length > 0 && (
            <Button
              variant="outline"
              onClick={handleRegenerateAllPDFs}
              disabled={regeneratingAll}
              className="gap-2 w-full sm:w-auto"
            >
              {regeneratingAll ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Upload className="w-4 h-4" />
              )}
              {regeneratingAll ? 'Regenerando...' : 'Regenerar Todos PDFs'}
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-3 sm:gap-4 lg:gap-6">
        {checklists.length === 0 ? (
          <Card>
            <CardContent className="p-6 sm:p-8 text-center">
              <FileText className="w-8 h-8 sm:w-12 sm:h-12 mx-auto mb-3 sm:mb-4 text-muted-foreground" />
              <h3 className="text-base sm:text-lg font-semibold mb-2">Nenhum checklist encontrado</h3>
              <p className="text-muted-foreground text-sm">
                Ainda não há checklists registrados no sistema.
              </p>
            </CardContent>
          </Card>
        ) : (
          checklists.map((checklist) => (
            <Card key={checklist.id}>
              <CardHeader>
                <div className="flex flex-col lg:flex-row justify-between items-start gap-3 lg:gap-4">
                  <div className="space-y-2 flex-1 min-w-0">
                    <CardTitle className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <FileText className="w-4 h-4 flex-shrink-0" />
                        <span className="truncate text-sm sm:text-base">Checklist #{checklist.id.slice(0, 8)}</span>
                      </div>
                      {getStatusBadge(checklist.status)}
                    </CardTitle>
                    <CardDescription className="space-y-1 text-xs sm:text-sm">
                      <div className="flex items-start gap-2">
                        <Car className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0 mt-0.5" />
                        <span className="break-words">
                          {checklist.vehicle.vehicle_category} - {checklist.vehicle.license_plate}
                          {checklist.vehicle.model && ` (${checklist.vehicle.model})`}
                        </span>
                      </div>
                      <div className="flex items-start gap-2">
                        <User className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0 mt-0.5" />
                        <span className="break-words">
                          Inspetor: {checklist.inspector.first_name} {checklist.inspector.last_name}
                        </span>
                      </div>
                      <div className="flex items-start gap-2">
                        <Calendar className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0 mt-0.5" />
                        <span>
                          Inspeção: {new Date(checklist.inspection_date).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Criado em: {new Date(checklist.created_at).toLocaleDateString('pt-BR')} às {new Date(checklist.created_at).toLocaleTimeString('pt-BR')}
                      </div>
                    </CardDescription>
                  </div>
                  
                  <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2 w-full lg:w-auto">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/checklist/view/${checklist.id}`)}
                      className="gap-2 text-xs sm:text-sm w-full md:w-auto"
                    >
                      <Eye className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span className="hidden sm:inline">Visualizar</span>
                      <span className="sm:hidden">Ver</span>
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownloadPDF(checklist)}
                      className="gap-2 text-xs sm:text-sm w-full md:w-auto"
                    >
                      <Download className="w-3 h-3 sm:w-4 sm:h-4" />
                      PDF
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRegeneratePDF(checklist)}
                      disabled={regeneratingId === checklist.id}
                      className="gap-2 text-xs sm:text-sm w-full md:w-auto"
                    >
                      {regeneratingId === checklist.id ? (
                        <RefreshCw className="w-3 h-3 sm:w-4 sm:h-4 animate-spin" />
                      ) : (
                        <RefreshCw className="w-3 h-3 sm:w-4 sm:h-4" />
                      )}
                      Regenerar
                    </Button>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-2 text-destructive hover:text-destructive text-xs sm:text-sm w-full md:w-auto"
                          disabled={deletingId === checklist.id}
                        >
                          <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                          <span className="hidden sm:inline">Excluir</span>
                          <span className="sm:hidden">Del</span>
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="max-w-[95vw] sm:max-w-md mx-1 sm:mx-2 lg:mx-auto">
                        <AlertDialogHeader>
                          <AlertDialogTitle className="text-base sm:text-lg">Confirmar exclusão</AlertDialogTitle>
                          <AlertDialogDescription className="text-sm">
                            Tem certeza que deseja excluir este checklist? Esta ação não pode ser desfeita.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter className="flex-col sm:flex-row gap-2">
                          <AlertDialogCancel className="w-full sm:w-auto">Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDeleteChecklist(checklist.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90 w-full sm:w-auto"
                          >
                            Excluir
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}