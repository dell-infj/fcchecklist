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
  Calendar
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
      // Buscar dados dos itens do checklist para gerar o PDF
      const { data: checklistItems, error: itemsError } = await supabase
        .from('checklist_items')
        .select('*')
        .eq('unique_id', checklist.id.slice(0, 8)); // Usar parte do ID como referência

      if (itemsError) {
        console.warn('Não foi possível carregar itens personalizados:', itemsError);
      }

      // Criar dados para o PDF
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
        inspection_date: new Date(checklist.inspection_date),
        vehicle_mileage: "Não informado",
        overall_condition: checklist.overall_condition || "Não informado",
        additional_notes: checklist.additional_notes || "",
        interior_photo_url: checklist.interior_photo_url,
        exterior_photo_url: checklist.exterior_photo_url,
        inspector_signature: checklist.inspector_signature,
        checklistItems: {
          // Mapear campos booleanos para formato esperado
          all_interior_lights: { 
            status: checklist.all_interior_lights ? 'funcionando' : 'ausente'
          },
          passenger_seat: { 
            status: checklist.passenger_seat ? 'funcionando' : 'ausente'
          },
          fire_extinguisher: { 
            status: checklist.fire_extinguisher ? 'funcionando' : 'ausente'
          },
          all_outside_lights: { 
            status: checklist.all_outside_lights ? 'funcionando' : 'ausente'
          },
          cigarette_lighter: { 
            status: checklist.cigarette_lighter || 'não verificado'
          },
          all_cabinets_latches: { 
            status: checklist.all_cabinets_latches || 'não verificado'
          }
        },
        checklist_items: checklistItems || [
          { name: 'Luzes Internas', category: 'interior', description: 'Verificação das luzes internas', required: true },
          { name: 'Assento do Passageiro', category: 'interior', description: 'Condição do assento', required: true },
          { name: 'Extintor de Incêndio', category: 'safety', description: 'Presença e validade do extintor', required: true },
          { name: 'Luzes Externas', category: 'exterior', description: 'Faróis, lanternas e setas', required: true },
          { name: 'Acendedor de Cigarros', category: 'interior', description: 'Funcionamento do acendedor', required: false },
          { name: 'Travas dos Armários', category: 'interior', description: 'Funcionamento das travas', required: false }
        ]
      };

      // Gerar PDF (agora é assíncrono)
      const doc = await generateChecklistPDF(pdfData);
      
      // Fazer download
      const filename = `checklist_${checklist.vehicle.license_plate}_${checklist.inspection_date}.pdf`;
      await downloadPDF(doc, filename);

      toast({
        title: "Sucesso",
        description: "PDF gerado e baixado com sucesso!"
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: "Erro",
        description: "Erro ao gerar PDF",
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
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold">Gerenciamento de Checklists</h1>
        <p className="text-muted-foreground text-xs sm:text-sm">Visualize, baixe e gerencie os checklists de inspeção</p>
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