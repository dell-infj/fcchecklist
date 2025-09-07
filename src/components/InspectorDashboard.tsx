import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ClipboardList, Truck, CheckCircle, Clock, Plus, Download, ChevronLeft, ChevronRight, X } from 'lucide-react';
import useEmblaCarousel from 'embla-carousel-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface Vehicle {
  id: string;
  vehicle_category: string;
  owner_unique_id: string;
  license_plate?: string;
  model?: string;
  status: string;
}

interface MyChecklist {
  id: string;
  status: string;
  inspection_date: string;
  pdf_url?: string;
  vehicle: {
    vehicle_category: string;
    owner_unique_id: string;
    license_plate?: string;
  };
}

// Componente VehiclesCarousel
interface VehiclesCarouselProps {
  vehicles: Vehicle[];
  onStartInspection: (vehicleId: string) => void;
}

const VehiclesCarousel = ({ vehicles, onStartInspection }: VehiclesCarouselProps) => {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: 'start',
    dragFree: true,
    containScroll: 'trimSnaps'
  });

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  const [prevBtnEnabled, setPrevBtnEnabled] = useState(false);
  const [nextBtnEnabled, setNextBtnEnabled] = useState(false);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setPrevBtnEnabled(emblaApi.canScrollPrev());
    setNextBtnEnabled(emblaApi.canScrollNext());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on('select', onSelect);
    emblaApi.on('reInit', onSelect);
  }, [emblaApi, onSelect]);

  return (
    <Card className="shadow-card" data-vehicles-section>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5" />
            Veículos Disponíveis
          </CardTitle>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={scrollPrev}
              disabled={!prevBtnEnabled}
              className="h-8 w-8 p-0"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={scrollNext}
              disabled={!nextBtnEnabled}
              className="h-8 w-8 p-0"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {vehicles.length === 0 ? (
          <p className="text-muted-foreground text-center py-6">
            Nenhum veículo disponível para inspeção
          </p>
        ) : (
          <div className="embla overflow-hidden" ref={emblaRef}>
            <div className="embla__container flex gap-4">
              {vehicles.map((vehicle) => (
                <div key={vehicle.id} className="embla__slide flex-none w-72 min-w-0">
                  <Card className="border h-full">
                    <CardContent className="p-4">
                      <div className="flex flex-col gap-3 h-full">
                        <div className="flex-1 space-y-2">
                          <div className="p-3 bg-primary/10 rounded-lg flex items-center justify-center">
                            <Truck className="h-8 w-8 text-primary" />
                          </div>
                          <h3 className="font-semibold text-base">
                            {vehicle.vehicle_category}
                          </h3>
                          <div className="space-y-1">
                            <p className="text-sm text-muted-foreground">
                              <span className="font-medium">Placa:</span> {vehicle.license_plate || 'Sem placa'}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              <span className="font-medium">Empresa:</span> {vehicle.owner_unique_id}
                            </p>
                            {vehicle.model && (
                              <p className="text-sm text-muted-foreground">
                                <span className="font-medium">Modelo:</span> {vehicle.model}
                              </p>
                            )}
                          </div>
                        </div>
                        <Button 
                          size="sm" 
                          onClick={() => onStartInspection(vehicle.id)}
                          variant="safety"
                          className="gap-2 w-full h-10"
                        >
                          <Plus className="h-4 w-4" />
                          Iniciar Inspeção
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const InspectorDashboard = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [myChecklists, setMyChecklists] = useState<MyChecklist[]>([]);
  const [stats, setStats] = useState({
    cancelled: 0,
    completed: 0,
    todayCompleted: 0
  });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (profile) {
      loadInspectorData();
    }
  }, [profile]);

  const loadInspectorData = async () => {
    try {
      // Get all active vehicles
      // Usar any temporariamente para contornar problemas de tipo
      const { data: vehicleData }: any = await supabase
        .from('vehicles')
        .select('id, vehicle_category, owner_unique_id, license_plate, model, status')
        .eq('status', 'active')
        .order('vehicle_category');

      // Get my checklists
      // Usar any temporariamente para contornar problemas de tipo
      const { data: checklistData }: any = await supabase
        .from('checklists')
        .select(`
          id,
          status,
          inspection_date,
          pdf_url,
          vehicles (
            vehicle_category,
            owner_unique_id,
            license_plate
          )
        `)
        .eq('inspector_id', profile?.id)
        .order('created_at', { ascending: false })
        .limit(10);

      // Calculate stats
      const today = new Date().toISOString().split('T')[0];
      const cancelled = checklistData?.filter(c => c.status === 'cancelled').length || 0;
      const completed = checklistData?.filter(c => c.status === 'completed').length || 0;
      const todayCompleted = checklistData?.filter(
        c => c.status === 'completed' && c.inspection_date === today
      ).length || 0;

      setVehicles(vehicleData || []);
      setMyChecklists(checklistData?.map(item => ({
        id: item.id,
        status: item.status,
        inspection_date: item.inspection_date,
        pdf_url: item.pdf_url,
        vehicle: {
          vehicle_category: item.vehicles?.vehicle_category || '',
          owner_unique_id: item.vehicles?.owner_unique_id || '',
          license_plate: item.vehicles?.license_plate || ''
        }
      })) || []);
      setStats({ cancelled, completed, todayCompleted });

    } catch (error) {
      console.error('Error loading inspector data:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar dados do inspetor",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const downloadChecklistPDF = async (checklist: MyChecklist) => {
    if (!checklist.pdf_url) {
      toast({
        title: "PDF não disponível",
        description: "O PDF deste checklist não está disponível",
        variant: "destructive"
      });
      return;
    }

    try {
      const { data, error } = await supabase.storage
        .from('checklist-pdfs')
        .download(checklist.pdf_url);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `checklist_${checklist.vehicle.license_plate || 'sem_placa'}_${checklist.inspection_date}.pdf`;
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

  const startNewInspection = async (vehicleId: string) => {
    try {
      // Navegar diretamente para a página de novo checklist com o veículo selecionado
      navigate(`/checklist/new?vehicle=${vehicleId}`);
    } catch (error) {
      console.error('Error starting inspection:', error);
      toast({
        title: "Erro",
        description: "Erro ao iniciar nova inspeção",
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
      case 'cancelled':
        return <Badge variant="destructive">Cancelada</Badge>;
      case 'reviewed':
        return <Badge variant="outline">Revisado</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[...Array(3)].map((_, i) => (
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
    <div className="space-y-4 sm:space-y-6 px-2 sm:px-4">
      <div className="flex flex-col gap-2 sm:gap-3">
        <div>
          <h2 className="text-lg sm:text-xl font-bold">Painel do Inspetor</h2>
          <p className="text-muted-foreground text-xs sm:text-sm">
            Bem-vindo, {profile?.first_name}! Gerencie suas inspeções aqui.
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <Card className="shadow-card">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-2 bg-destructive/10 rounded-lg">
                <X className="h-4 w-4 sm:h-5 sm:w-5 text-destructive" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Canceladas</p>
                <p className="text-lg sm:text-xl font-bold">{stats.cancelled}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-2 bg-success/10 rounded-lg">
                <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-success" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Concluídas</p>
                <p className="text-lg sm:text-xl font-bold">{stats.completed}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <ClipboardList className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Hoje</p>
                <p className="text-lg sm:text-xl font-bold">{stats.todayCompleted}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Vehicles Carousel */}
      <VehiclesCarousel 
        vehicles={vehicles}
        onStartInspection={startNewInspection}
      />

      {/* My Checklists */}
      <Card className="shadow-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5" />
              Minhas Inspeções
            </CardTitle>
            {myChecklists.length > 0 && (
              <div className="flex flex-col gap-2">
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="gap-2 w-full h-8 sm:h-10 text-xs sm:text-sm"
                  onClick={() => toast({
                    title: "Em desenvolvimento",
                    description: "Funcionalidade de filtros será implementada em breve"
                  })}
                >
                  <ClipboardList className="h-3 w-3 sm:h-4 sm:w-4" />
                  Ver Todas
                </Button>
                 <Button 
                   size="sm" 
                   variant="default" 
                   className="gap-2 w-full h-8 sm:h-10 text-xs sm:text-sm"
                   onClick={() => navigate('/checklist/new')}
                 >
                   <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
                   Nova Inspeção
                 </Button>
                 <Button 
                   size="sm" 
                   variant="outline" 
                   className="gap-2 w-full h-8 sm:h-10 text-xs sm:text-sm"
                   onClick={() => navigate('/vehicles')}
                 >
                   <Truck className="h-3 w-3 sm:h-4 sm:w-4" />
                   Ver Veículos
                 </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {myChecklists.length === 0 ? (
            <div className="text-center py-12">
              <div className="mx-auto w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-4">
                <ClipboardList className="h-12 w-12 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium mb-2">Nenhuma inspeção encontrada</h3>
              <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                Comece selecionando um veículo acima para criar sua primeira inspeção.
              </p>
              <Button 
                variant="default" 
                className="gap-2"
                onClick={() => navigate('/checklist/new')}
              >
                <Plus className="h-4 w-4" />
                Criar Primeira Inspeção
              </Button>
            </div>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              {myChecklists.map((checklist) => (
                <div key={checklist.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 sm:p-4 bg-secondary/50 rounded-lg gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm sm:text-base truncate">
                      {checklist.vehicle.vehicle_category}
                      {checklist.vehicle.license_plate && ` - ${checklist.vehicle.license_plate}`}
                    </p>
                    <p className="text-xs sm:text-sm text-muted-foreground truncate">
                      {checklist.vehicle.owner_unique_id}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(checklist.inspection_date).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
                    {getStatusBadge(checklist.status)}
                    <div className="flex flex-col gap-1 w-full sm:w-auto">
                      {checklist.status === 'draft' && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => navigate(`/checklist/edit/${checklist.id}`)}
                          className="w-full text-xs sm:text-sm h-8"
                        >
                          Continuar
                        </Button>
                      )}
                      {checklist.status === 'completed' && (
                        <>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => navigate(`/checklist/view/${checklist.id}`)}
                            className="w-full text-xs sm:text-sm h-8"
                          >
                            Ver Relatório
                          </Button>
                          {checklist.pdf_url && (
                            <Button 
                              size="sm" 
                              variant="secondary"
                              onClick={() => downloadChecklistPDF(checklist)}
                              className="w-full gap-1 text-xs sm:text-sm h-8"
                            >
                              <Download className="h-3 w-3" />
                              PDF
                            </Button>
                          )}
                        </>
                      )}
                    </div>
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

export default InspectorDashboard;