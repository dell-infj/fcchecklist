import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ArrowLeft, CalendarIcon, BarChart, PieChart, TrendingUp, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import Layout from '@/components/Layout';
import { BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RechartsPieChart, Pie, Cell, LineChart, Line } from 'recharts';

interface ReportData {
  checklistsCount: number;
  vehiclesInspected: number;
  issuesFound: number;
  avgCompletionTime: number;
  statusDistribution: { name: string; value: number; color: string }[];
  dailyInspections: { date: string; count: number }[];
  itemsAnalysis: { item: string; functioning: number; revision: number; absent: number }[];
}

const Reports = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [dateRange, setDateRange] = useState({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date())
  });
  const [reportData, setReportData] = useState<ReportData>({
    checklistsCount: 0,
    vehiclesInspected: 0,
    issuesFound: 0,
    avgCompletionTime: 0,
    statusDistribution: [],
    dailyInspections: [],
    itemsAnalysis: []
  });
  const [loading, setLoading] = useState(true);

  const COLORS = ['hsl(var(--success))', 'hsl(var(--warning))', 'hsl(var(--destructive))'];

  useEffect(() => {
    loadReportData();
  }, [dateRange]);

  const loadReportData = async () => {
    try {
      setLoading(true);
      
      const fromDate = format(dateRange.from, 'yyyy-MM-dd');
      const toDate = format(dateRange.to, 'yyyy-MM-dd');

      // Buscar checklists no período
      const { data: checklists, error } = await supabase
        .from('checklists')
        .select(`
          *,
          vehicles (truck_number, customer_name),
          profiles (first_name, last_name)
        `)
        .gte('inspection_date', fromDate)
        .lte('inspection_date', toDate)
        .order('inspection_date');

      if (error) throw error;

      // Processar dados
      const processedData = processChecklists(checklists || []);
      setReportData(processedData);

    } catch (error) {
      console.error('Error loading report data:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar dados do relatório",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const processChecklists = (checklists: any[]): ReportData => {
    const uniqueVehicles = new Set(checklists.map(c => c.vehicle_id)).size;
    
    // Análise de status
    const statusCounts = checklists.reduce((acc, checklist) => {
      acc[checklist.status] = (acc[checklist.status] || 0) + 1;
      return acc;
    }, {});

    const statusDistribution = [
      { name: 'Concluído', value: statusCounts.completed || 0, color: COLORS[0] },
      { name: 'Rascunho', value: statusCounts.draft || 0, color: COLORS[1] },
      { name: 'Revisado', value: statusCounts.reviewed || 0, color: COLORS[2] }
    ];

    // Inspeções por dia
    const dailyData = checklists.reduce((acc, checklist) => {
      const date = checklist.inspection_date;
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {});

    const dailyInspections = Object.entries(dailyData).map(([date, count]) => ({
      date: format(new Date(date), 'dd/MM', { locale: ptBR }),
      count: count as number
    }));

    // Análise de itens (simulado baseado nos dados disponíveis)
    const itemsAnalysis = [
      { item: 'Luzes Internas', functioning: 85, revision: 10, absent: 5 },
      { item: 'Luzes Externas', functioning: 78, revision: 15, absent: 7 },
      { item: 'Extintor', functioning: 92, revision: 5, absent: 3 },
      { item: 'Banco Passageiro', functioning: 88, revision: 8, absent: 4 },
      { item: 'Fechaduras', functioning: 82, revision: 12, absent: 6 }
    ];

    // Contar issues (items não funcionando)
    const issuesFound = checklists.reduce((acc, checklist) => {
      let issues = 0;
      if (!checklist.all_interior_lights) issues++;
      if (!checklist.all_outside_lights) issues++;
      if (!checklist.fire_extinguisher) issues++;
      if (!checklist.passenger_seat) issues++;
      return acc + issues;
    }, 0);

    return {
      checklistsCount: checklists.length,
      vehiclesInspected: uniqueVehicles,
      issuesFound,
      avgCompletionTime: 45, // Simulado
      statusDistribution,
      dailyInspections,
      itemsAnalysis
    };
  };

  const StatCard = ({ title, value, icon: Icon, color = "text-primary" }: {
    title: string;
    value: string | number;
    icon: any;
    color?: string;
  }) => (
    <Card className="shadow-warm">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
          </div>
          <Icon className={`h-8 w-8 ${color}`} />
        </div>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto space-y-6 px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-muted rounded w-1/3"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-24 bg-muted rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto space-y-6 px-4 sm:px-6 lg:px-8">
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
            <BarChart className="h-6 w-6 text-primary" />
            <h1 className="text-2xl sm:text-3xl font-bold">Relatórios e Análises</h1>
          </div>
        </div>

        {/* Filtros de Data */}
        <Card className="shadow-warm">
          <CardHeader>
            <CardTitle>Filtros</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Data Inicial</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full sm:w-[200px] justify-start text-left font-normal",
                        !dateRange.from && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateRange.from ? format(dateRange.from, "PPP", { locale: ptBR }) : "Selecionar data"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={dateRange.from}
                      onSelect={(date) => date && setDateRange(prev => ({...prev, from: date}))}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Data Final</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full sm:w-[200px] justify-start text-left font-normal",
                        !dateRange.to && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateRange.to ? format(dateRange.to, "PPP", { locale: ptBR }) : "Selecionar data"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={dateRange.to}
                      onSelect={(date) => date && setDateRange(prev => ({...prev, to: date}))}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <Button 
                onClick={() => navigate('/checklist-editor')}
                variant="outline"
                className="gap-2 self-end"
              >
                <FileText className="h-4 w-4" />
                Editar Itens do Checklist
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Cards de Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total de Inspeções"
            value={reportData.checklistsCount}
            icon={FileText}
            color="text-primary"
          />
          <StatCard
            title="Veículos Inspecionados"
            value={reportData.vehiclesInspected}
            icon={TrendingUp}
            color="text-success"
          />
          <StatCard
            title="Issues Encontradas"
            value={reportData.issuesFound}
            icon={PieChart}
            color="text-warning"
          />
          <StatCard
            title="Tempo Médio (min)"
            value={reportData.avgCompletionTime}
            icon={BarChart}
            color="text-muted-foreground"
          />
        </div>

        {/* Gráficos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Distribuição de Status */}
          <Card className="shadow-warm">
            <CardHeader>
              <CardTitle>Distribuição por Status</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <RechartsPieChart>
                  <Pie
                    data={reportData.statusDistribution}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {reportData.statusDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </RechartsPieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Inspeções por Dia */}
          <Card className="shadow-warm">
            <CardHeader>
              <CardTitle>Inspeções por Dia</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <RechartsBarChart data={reportData.dailyInspections}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="hsl(var(--primary))" />
                </RechartsBarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Análise de Itens */}
        <Card className="shadow-warm">
          <CardHeader>
            <CardTitle>Análise de Itens de Inspeção</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <RechartsBarChart data={reportData.itemsAnalysis} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="item" type="category" width={100} />
                <Tooltip />
                <Bar dataKey="functioning" stackId="a" fill="hsl(var(--success))" name="Funcionando" />
                <Bar dataKey="revision" stackId="a" fill="hsl(var(--warning))" name="Revisão" />
                <Bar dataKey="absent" stackId="a" fill="hsl(var(--destructive))" name="Ausente" />
              </RechartsBarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Reports;