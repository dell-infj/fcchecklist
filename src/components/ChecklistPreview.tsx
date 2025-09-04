import React from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Printer, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ChecklistPreviewProps {
  formData: any;
  vehicles: any[];
  inspectors: any[];
  checklistItems: any[];
  profile: any;
}

export const ChecklistPreview: React.FC<ChecklistPreviewProps> = ({
  formData,
  vehicles,
  inspectors,
  checklistItems,
  profile
}) => {
  const { toast } = useToast();

  const selectedVehicle = vehicles.find(v => v.id === formData.vehicle_id);
  const selectedInspector = inspectors.find(i => i.id === formData.inspector_id);

  const getRelevantCategories = (vehicleCategory: string): string[] => {
    const categoryMap: Record<string, string[]> = {
      'carro': ['interior', 'exterior', 'safety', 'mechanical'],
      'moto': ['exterior', 'safety', 'mechanical'],
      'caminhao': ['interior', 'exterior', 'safety', 'mechanical', 'cargo'],
      'onibus': ['interior', 'exterior', 'safety', 'mechanical', 'passenger'],
      'van': ['interior', 'exterior', 'safety', 'mechanical']
    };
    return categoryMap[vehicleCategory?.toLowerCase()] || ['interior', 'exterior', 'safety', 'mechanical'];
  };

  const getCategoryTitle = (category: string): string => {
    const titles: Record<string, string> = {
      'interior': 'Interior do Veículo',
      'exterior': 'Exterior do Veículo',
      'safety': 'Itens de Segurança',
      'mechanical': 'Componentes Mecânicos',
      'cargo': 'Área de Carga',
      'passenger': 'Área de Passageiros'
    };
    return titles[category] || category;
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'ok': return 'text-green-600 bg-green-50';
      case 'not_ok': return 'text-red-600 bg-red-50';
      case 'not_applicable': return 'text-gray-600 bg-gray-50';
      default: return 'text-gray-400 bg-gray-50';
    }
  };

  const getStatusText = (status: string): string => {
    switch (status) {
      case 'ok': return 'OK';
      case 'not_ok': return 'NÃO OK';
      case 'not_applicable': return 'N/A';
      default: return 'Não verificado';
    }
  };

  const handlePrint = () => {
    window.print();
    toast({
      title: "Imprimindo checklist",
      description: "Use as opções do navegador para salvar como PDF"
    });
  };

  const handleDownloadPDF = async () => {
    try {
      // Implementar usando html2canvas + jsPDF se necessário
      toast({
        title: "Use a impressão",
        description: "Use Ctrl+P ou o botão Imprimir para gerar o PDF"
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao gerar PDF. Use a função de impressão.",
        variant: "destructive"
      });
    }
  };

  if (!selectedVehicle || !selectedInspector) {
    return (
      <div className="text-center p-8 text-muted-foreground">
        <p>Selecione um veículo e inspetor para visualizar o preview</p>
      </div>
    );
  }

  const relevantCategories = getRelevantCategories(selectedVehicle.vehicle_category);
  const filteredChecklistItems = checklistItems.filter(item => 
    relevantCategories.includes(item.category)
  );

  return (
    <div className="max-w-4xl mx-auto bg-background">
      {/* Print Actions - Hidden in print */}
      <div className="print:hidden mb-6 flex gap-2 justify-center">
        <Button onClick={handlePrint} className="flex items-center gap-2">
          <Printer className="h-4 w-4" />
          Imprimir / Salvar PDF
        </Button>
      </div>

      {/* Document Content */}
      <div className="p-8 bg-white text-black print:p-4 print:text-black">
        <style dangerouslySetInnerHTML={{
          __html: `
            @media print {
              body { margin: 0 !important; font-size: 12px !important; }
              .print\\:hidden { display: none !important; }
              .page-break { page-break-before: always !important; }
              .no-page-break { page-break-inside: avoid !important; }
              * { color: black !important; }
              .bg-muted { background-color: #f5f5f5 !important; }
              .text-muted-foreground { color: #666 !important; }
              .text-primary { color: #000 !important; }
              .border { border: 1px solid #ddd !important; }
            }
          `
        }} />
        {/* Header */}
        <div className="text-center mb-8 no-page-break">
          <h1 className="text-2xl font-bold text-primary mb-2">
            {profile?.company_name || 'FC GESTÃO EMPRESARIAL LTDA'}
          </h1>
          <p className="text-sm text-muted-foreground">
            CNPJ: {profile?.cnpj || '05.873.924/0001-80'} | Email: contato@fcgestao.com.br
          </p>
          <p className="text-sm text-muted-foreground">
            {profile?.address || 'Rua princesa imperial, 220 - Realengo - RJ'}
          </p>
          <div className="mt-6">
            <h2 className="text-xl font-semibold">CHECKLIST DE INSPEÇÃO VEICULAR</h2>
          </div>
        </div>

        {/* General Information */}
        <div className="grid grid-cols-2 gap-6 mb-8 no-page-break">
          <div>
            <h3 className="font-semibold text-lg mb-4 border-b pb-2">Informações Gerais</h3>
            <div className="space-y-2">
              <p><strong>Data da Inspeção:</strong> {format(new Date(formData.inspection_date || new Date()), 'dd/MM/yyyy', { locale: ptBR })}</p>
              <p><strong>Inspetor:</strong> {selectedInspector.first_name} {selectedInspector.last_name}</p>
              <p><strong>Quilometragem:</strong> {formData.vehicle_mileage || 'Não informado'} km</p>
            </div>
          </div>
          <div>
            <h3 className="font-semibold text-lg mb-4 border-b pb-2">Dados do Veículo</h3>
            <div className="space-y-2">
              <p><strong>Modelo:</strong> {selectedVehicle.model || 'Não informado'}</p>
              <p><strong>Placa:</strong> {selectedVehicle.license_plate || 'Não informado'}</p>
              <p><strong>Ano:</strong> {selectedVehicle.year || 'Não informado'}</p>
              <p><strong>Categoria:</strong> {selectedVehicle.vehicle_category}</p>
            </div>
          </div>
        </div>

        {/* Checklist Items by Category */}
        {relevantCategories.map((category) => {
          const categoryItems = filteredChecklistItems.filter(item => item.category === category);
          
          if (categoryItems.length === 0) return null;

          return (
            <div key={category} className="mb-8 no-page-break">
              <h3 className="font-semibold text-lg mb-4 border-b pb-2 text-primary">
                {getCategoryTitle(category)}
              </h3>
              <div className="space-y-3">
                {categoryItems.map((item) => {
                  const itemData = formData[item.name] || {};
                  const status = itemData.status || 'not_checked';
                  const observation = itemData.observation || '';

                  return (
                    <div key={item.name} className="flex justify-between items-start p-3 border rounded">
                      <div className="flex-1">
                        <p className="font-medium">{item.name}</p>
                        {item.description && (
                          <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
                        )}
                        {observation && (
                          <p className="text-sm text-orange-600 mt-1">
                            <strong>Observação:</strong> {observation}
                          </p>
                        )}
                      </div>
                      <div className={`px-3 py-1 rounded text-sm font-medium ${getStatusColor(status)}`}>
                        {getStatusText(status)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {/* Overall Condition */}
        <div className="mb-8 no-page-break">
          <h3 className="font-semibold text-lg mb-4 border-b pb-2">Condição Geral</h3>
          <p className="p-3 bg-muted rounded">
            {formData.overall_condition || 'Não informado'}
          </p>
        </div>

        {/* Additional Notes */}
        {formData.additional_notes && (
          <div className="mb-8 no-page-break">
            <h3 className="font-semibold text-lg mb-4 border-b pb-2">Observações Adicionais</h3>
            <p className="p-3 bg-muted rounded whitespace-pre-wrap">
              {formData.additional_notes}
            </p>
          </div>
        )}

        {/* Photos */}
        <div className="page-break">
          <h3 className="font-semibold text-lg mb-4 border-b pb-2">Documentação Fotográfica</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {formData.exterior_photo_url && (
              <div className="no-page-break">
                <h4 className="font-medium mb-2">Foto Externa</h4>
                <img 
                  src={formData.exterior_photo_url} 
                  alt="Foto Externa do Veículo"
                  className="w-full h-64 object-cover rounded border"
                />
              </div>
            )}
            {formData.interior_photo_url && (
              <div className="no-page-break">
                <h4 className="font-medium mb-2">Foto Interna</h4>
                <img 
                  src={formData.interior_photo_url} 
                  alt="Foto Interna do Veículo"
                  className="w-full h-64 object-cover rounded border"
                />
              </div>
            )}
          </div>
        </div>

        {/* Signature */}
        {formData.inspector_signature && (
          <div className="mt-8 no-page-break">
            <h3 className="font-semibold text-lg mb-4 border-b pb-2">Assinatura do Inspetor</h3>
            <div className="flex justify-center">
              <div className="text-center">
                <img 
                  src={formData.inspector_signature} 
                  alt="Assinatura do Inspetor"
                  className="w-64 h-32 object-contain border rounded mb-2"
                />
                <p className="text-sm border-t pt-2">
                  {selectedInspector.first_name} {selectedInspector.last_name}
                </p>
                <p className="text-xs text-muted-foreground">
                  Inspetor Responsável
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-12 text-center text-xs text-muted-foreground border-t pt-4">
          <p>Documento gerado em {format(new Date(), 'dd/MM/yyyy \'às\' HH:mm', { locale: ptBR })}</p>
          <p>Sistema de Gestão de Checklists - FC Gestão Empresarial</p>
        </div>
      </div>
    </div>
  );
};