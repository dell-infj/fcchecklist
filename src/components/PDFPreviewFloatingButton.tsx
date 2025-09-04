import React, { useState } from 'react';
import { FileText, Eye, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import { ChecklistPreview } from '@/components/ChecklistPreview';

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

  const handlePreview = () => {
    // Verificar se o veículo foi selecionado
    if (!formData.vehicle_id) {
      toast({
        title: "Informações incompletas",
        description: "Selecione um veículo para visualizar o preview",
        variant: "destructive"
      });
      return;
    }

    // Se o usuário for inspetor, identificar automaticamente
    const currentInspectorId = formData.inspector_id || 
      (profile?.role === 'inspector' ? 
        inspectors.find(inspector => 
          inspector.email === profile.user_id || 
          inspector.id === profile.id ||
          inspector.first_name === profile.first_name && inspector.last_name === profile.last_name
        )?.id : null);

    // Verificar se tem inspetor (selecionado ou identificado automaticamente)
    if (!currentInspectorId) {
      toast({
        title: "Informações incompletas",
        description: profile?.role === 'inspector' ? 
          "Não foi possível identificar o inspetor automaticamente" :
          "Selecione um inspetor para visualizar o preview",
        variant: "destructive"
      });
      return;
    }

    setIsOpen(true);
  };

  const handleClose = () => {
    setIsOpen(false);
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
          <DrawerContent className="h-[90vh]">
            <DrawerHeader className="flex items-center justify-between">
              <DrawerTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Preview do Checklist
              </DrawerTitle>
              <Button variant="ghost" size="icon" onClick={handleClose}>
                <X className="h-4 w-4" />
              </Button>
            </DrawerHeader>
            <div className="flex-1 overflow-auto">
              <ChecklistPreview 
                formData={formData}
                vehicles={vehicles}
                inspectors={inspectors}
                checklistItems={checklistItems}
                profile={profile}
              />
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
        <DialogContent className="max-w-6xl w-full h-[90vh] p-0">
          <DialogHeader className="p-6 pb-4">
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Preview do Checklist - Inspeção Veicular
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-auto">
            <ChecklistPreview 
              formData={formData}
              vehicles={vehicles}
              inspectors={inspectors}
              checklistItems={checklistItems}
              profile={profile}
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};