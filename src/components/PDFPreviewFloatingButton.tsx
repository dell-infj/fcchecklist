import React, { useState } from 'react';
import { FileText, Eye, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import { generateChecklistPDF } from '@/lib/pdfGenerator';

interface PDFPreviewFloatingButtonProps {
  formData: any;
  vehicles: any[];
  inspectors: any[];
  checklistItems: any[];
  profile: any;
}

export const PDFPreviewFloatingButton: React.FC<PDFPreviewFloatingButtonProps> = ({
  formData,
  vehicles,
  inspectors,
  checklistItems,
  profile
}) => {
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [isOpen, setIsOpen] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const handlePreview = async () => {
    if (!formData.vehicle_id || !formData.inspector_id) {
      toast({
        title: "Informações incompletas",
        description: "Selecione um veículo e inspetor para gerar o preview",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    setIsOpen(true);

    try {
      const selectedVehicle = vehicles.find(v => v.id === formData.vehicle_id);
      const selectedInspector = inspectors.find(i => i.id === formData.inspector_id);

      if (!selectedVehicle || !selectedInspector) {
        throw new Error('Veículo ou inspetor não encontrado');
      }

      // Filtrar apenas os campos que são checklist items do formData
      const checklistItemsData: Record<string, any> = {};
      Object.keys(formData).forEach(key => {
        if (typeof formData[key] === 'object' && formData[key] !== null && 'status' in formData[key]) {
          checklistItemsData[key] = formData[key];
        }
      });

      const pdfData = {
        vehicleInfo: {
          model: selectedVehicle.model || 'Não informado',
          license_plate: selectedVehicle.license_plate || 'Não informado',
          year: selectedVehicle.year || 0,
          vehicle_category: selectedVehicle.vehicle_category
        },
        inspectorInfo: {
          first_name: selectedInspector.first_name,
          last_name: selectedInspector.last_name
        },
        companyInfo: {
          name: profile?.company_name || 'FC GESTÃO EMPRESARIAL LTDA',
          cnpj: profile?.cnpj || '05.873.924/0001-80',
          email: 'contato@fcgestao.com.br',
          address: profile?.address || 'Rua princesa imperial, 220 - Realengo - RJ'
        },
        inspection_date: formData.inspection_date || new Date(),
        vehicle_mileage: formData.vehicle_mileage || '',
        overall_condition: formData.overall_condition || 'Não informado',
        additional_notes: formData.additional_notes || '',
        interior_photo_url: formData.interior_photo_url || null,
        exterior_photo_url: formData.exterior_photo_url || null,
        inspector_signature: formData.inspector_signature || null,
        checklistItems: checklistItemsData,
        checklist_items: checklistItems || []
      };

      console.log('PDF Data:', pdfData); // Debug log
      const pdfDoc = await generateChecklistPDF(pdfData);
      const pdfDataUri = pdfDoc.output('datauristring');
      setPdfUrl(pdfDataUri);
    } catch (error) {
      console.error('Error generating PDF preview:', error);
      toast({
        title: "Erro ao gerar PDF",
        description: error instanceof Error ? error.message : "Erro desconhecido ao gerar preview do PDF",
        variant: "destructive"
      });
      setIsOpen(false);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setPdfUrl(null);
  };

  const FloatingButton = (
    <Button
      onClick={handlePreview}
      className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg bg-primary hover:bg-primary/90 z-50 transition-all duration-200 hover:scale-105"
      size="icon"
    >
      <Eye className="h-6 w-6 text-primary-foreground" />
    </Button>
  );

  if (isMobile) {
    return (
      <>
        {FloatingButton}
        <Drawer open={isOpen} onOpenChange={setIsOpen}>
          <DrawerContent className="h-[85vh]">
            <DrawerHeader className="flex items-center justify-between">
              <DrawerTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Preview do PDF
              </DrawerTitle>
              <Button variant="ghost" size="icon" onClick={handleClose}>
                <X className="h-4 w-4" />
              </Button>
            </DrawerHeader>
            <div className="flex-1 p-4">
              {isGenerating ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center space-y-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                    <p className="text-muted-foreground">Gerando preview...</p>
                  </div>
                </div>
              ) : pdfUrl ? (
                <iframe
                  src={pdfUrl}
                  className="w-full h-full border-0 rounded-lg"
                  title="PDF Preview"
                />
              ) : null}
            </div>
          </DrawerContent>
        </Drawer>
      </>
    );
  }

  return (
    <>
      {FloatingButton}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-4xl w-full h-[85vh] p-0">
          <DialogHeader className="p-6 pb-4">
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Preview do PDF - Checklist de Inspeção
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 px-6 pb-6">
            {isGenerating ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center space-y-4">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                  <p className="text-muted-foreground">Gerando preview do PDF...</p>
                </div>
              </div>
            ) : pdfUrl ? (
              <iframe
                src={pdfUrl}
                className="w-full h-full border-0 rounded-lg shadow-inner"
                title="PDF Preview"
              />
            ) : null}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};