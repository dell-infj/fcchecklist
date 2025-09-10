import React, { useState } from 'react';
import { createPortal } from 'react-dom';
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
    console.log('Preview - formData:', { 
      vehicle_id: formData.vehicle_id, 
      inspector_id: formData.inspector_id 
    });
    console.log('Preview - vehicles:', vehicles);
    console.log('Preview - inspectors:', inspectors);
    console.log('Preview - profile:', profile);

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
    let currentInspectorId = formData.inspector_id;
    
    // Se não há inspetor selecionado e o usuário é inspetor, tentar identificar automaticamente
    if (!currentInspectorId && profile?.role === 'inspector') {
      const autoInspector = inspectors.find(inspector => 
        inspector.id === profile.id || 
        (inspector.first_name === profile.first_name && inspector.last_name === profile.last_name)
      );
      
      if (autoInspector) {
        currentInspectorId = autoInspector.id;
        console.log('Auto-identificado inspetor:', autoInspector);
      }
    }

    console.log('Preview - currentInspectorId:', currentInspectorId);

    // Verificar se tem inspetor (selecionado ou identificado automaticamente)
    if (!currentInspectorId) {
      if (profile?.role === 'inspector') {
        console.log('Abrindo preview usando o perfil do inspetor logado');
        setIsOpen(true);
        return;
      }
      toast({
        title: "Informações incompletas",
        description: "Selecione um inspetor para visualizar o preview",
        variant: "destructive"
      });
      return;
    }

    setIsOpen(true);
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  const FloatingButton = createPortal(
    <Button
      onClick={handlePreview}
      className="fixed bottom-6 right-6 h-16 w-16 rounded-full shadow-glow bg-gradient-warm hover:bg-gradient-sunset transition-all duration-300 hover:scale-110 hover:shadow-elegant"
      style={{ 
        position: 'fixed !important' as any,
        zIndex: 99999,
        top: 'auto',
        bottom: '1.5rem',
        right: '1.5rem'
      }}
      size="icon"
    >
      <Eye className="h-8 w-8 text-white" strokeWidth={2.5} />
    </Button>,
    document.body
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
                Preview em Tempo Real - Resultado Final do PDF
              </DrawerTitle>
              <Button variant="ghost" size="icon" onClick={handleClose}>
                <X className="h-4 w-4" />
              </Button>
            </DrawerHeader>
            <div className="flex-1 overflow-auto bg-gray-100 p-4">
              <div className="shadow-lg rounded-lg overflow-hidden">
                <ChecklistPreview 
                  formData={formData}
                  vehicles={vehicles}
                  inspectors={inspectors}
                  checklistItems={checklistItems}
                  profile={profile}
                />
              </div>
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
              Preview em Tempo Real - Resultado Final do PDF
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-auto bg-gray-100 p-4">
            <div className="shadow-lg rounded-lg overflow-hidden">
              <ChecklistPreview 
                formData={formData}
                vehicles={vehicles}
                inspectors={inspectors}
                checklistItems={checklistItems}
                profile={profile}
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};