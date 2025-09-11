import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { AlertTriangle } from 'lucide-react';

interface CategoryValidationAlertProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CategoryValidationAlert: React.FC<CategoryValidationAlertProps> = ({ open, onOpenChange }) => {
  const navigate = useNavigate();

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            Categoria sem Checklist
          </AlertDialogTitle>
          <AlertDialogDescription>
            O veículo selecionado possui uma categoria que não tem itens de checklist associados ou a categoria não está definida corretamente.
            <br /><br />
            É necessário verificar e corrigir a categoria do veículo no painel de gerenciamento de veículos.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction
            onClick={() => {
              onOpenChange(false);
              navigate('/vehicle-management');
            }}
            className="bg-primary hover:bg-primary/90"
          >
            Verificar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default CategoryValidationAlert;