import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
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
  vehicle: {
    license_plate: string;
    vehicle_category: string;
    model: string;
  };
  inspector: {
    first_name: string;
    last_name: string;
  };
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
          vehicles!inner (
            license_plate,
            vehicle_category,
            model
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
        vehicle: {
          license_plate: item.vehicles?.license_plate || '',
          vehicle_category: item.vehicles?.vehicle_category || '',
          model: item.vehicles?.model || ''
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

  const handleDownloadPDF = async (checklistId: string, pdfUrl: string | null) => {
    if (!pdfUrl) {
      toast({
        title: "Aviso",
        description: "PDF não disponível para este checklist",
        variant: "destructive"
      });
      return;
    }

    try {
      // Extrair o caminho do arquivo da URL
      const url = new URL(pdfUrl);
      const pathParts = url.pathname.split('/');
      const fileName = pathParts[pathParts.length - 1];
      
      const { data, error } = await supabase.storage
        .from('checklist-pdfs')
        .download(fileName);

      if (error) throw error;

      // Criar blob e fazer download
      const blob = new Blob([data], { type: 'application/pdf' });
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `checklist-${checklistId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);

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
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <div className="flex items-center gap-4 mb-4">
          <Button 
            variant="outline" 
            onClick={() => navigate('/')} 
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar à Dashboard
          </Button>
          <Button 
            variant="outline" 
            onClick={() => navigate('/')} 
            className="gap-2"
          >
            <Home className="w-4 h-4" />
            Início
          </Button>
        </div>
        <h1 className="text-3xl font-bold">Gerenciamento de Checklists</h1>
        <p className="text-muted-foreground">Visualize, baixe e gerencie os checklists de inspeção</p>
      </div>

      <div className="grid gap-6">
        {checklists.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">Nenhum checklist encontrado</h3>
              <p className="text-muted-foreground">
                Ainda não há checklists registrados no sistema.
              </p>
            </CardContent>
          </Card>
        ) : (
          checklists.map((checklist) => (
            <Card key={checklist.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="space-y-2">
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="w-5 h-5" />
                      Checklist #{checklist.id.slice(0, 8)}
                      {getStatusBadge(checklist.status)}
                    </CardTitle>
                    <CardDescription className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Car className="w-4 h-4" />
                        <span>
                          {checklist.vehicle.vehicle_category} - {checklist.vehicle.license_plate}
                          {checklist.vehicle.model && ` (${checklist.vehicle.model})`}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        <span>
                          Inspetor: {checklist.inspector.first_name} {checklist.inspector.last_name}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        <span>
                          Inspeção: {new Date(checklist.inspection_date).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Criado em: {new Date(checklist.created_at).toLocaleDateString('pt-BR')} às {new Date(checklist.created_at).toLocaleTimeString('pt-BR')}
                      </div>
                    </CardDescription>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/checklist/view/${checklist.id}`)}
                      className="gap-2"
                    >
                      <Eye className="w-4 h-4" />
                      Visualizar
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownloadPDF(checklist.id, checklist.pdf_url)}
                      disabled={!checklist.pdf_url}
                      className="gap-2"
                    >
                      <Download className="w-4 h-4" />
                      PDF
                    </Button>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-2 text-destructive hover:text-destructive"
                          disabled={deletingId === checklist.id}
                        >
                          <Trash2 className="w-4 h-4" />
                          Excluir
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                          <AlertDialogDescription>
                            Tem certeza que deseja excluir este checklist? Esta ação não pode ser desfeita.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDeleteChecklist(checklist.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
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