import React, { useEffect, useRef, useState } from 'react';
import { Canvas as FabricCanvas } from 'fabric';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RotateCcw, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface SignatureCanvasProps {
  onSignatureChange: (signature: string) => void;
  value?: string;
}

export const SignatureCanvas: React.FC<SignatureCanvasProps> = ({ 
  onSignatureChange, 
  value 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [fabricCanvas, setFabricCanvas] = useState<FabricCanvas | null>(null);
  const [isEmpty, setIsEmpty] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = new FabricCanvas(canvasRef.current, {
      width: 400,
      height: 200,
      backgroundColor: "#ffffff",
      isDrawingMode: true,
    });

    // Configure brush for signature
    canvas.freeDrawingBrush.color = "#000000";
    canvas.freeDrawingBrush.width = 2;

    // Handle path creation (when user finishes drawing)
    canvas.on('path:created', () => {
      setIsEmpty(false);
      // Convert canvas to data URL for saving
      const signature = canvas.toDataURL({
        format: 'png',
        quality: 1,
        multiplier: 1
      });
      onSignatureChange(signature);
    });

    // Handle object modifications
    canvas.on('object:modified', () => {
      const signature = canvas.toDataURL({
        format: 'png',
        quality: 1,
        multiplier: 1
      });
      onSignatureChange(signature);
    });

    setFabricCanvas(canvas);

    // Load existing signature if provided
    if (value && value.trim() !== '') {
      canvas.loadFromJSON(value, () => {
        canvas.renderAll();
        setIsEmpty(false);
      });
    }

    return () => {
      canvas.dispose();
    };
  }, [onSignatureChange]);

  const handleClear = () => {
    if (!fabricCanvas) return;
    
    fabricCanvas.clear();
    fabricCanvas.backgroundColor = "#ffffff";
    fabricCanvas.renderAll();
    setIsEmpty(true);
    onSignatureChange('');
    
    toast({
      title: "Assinatura limpa",
      description: "O campo de assinatura foi limpo"
    });
  };

  const handleSave = () => {
    if (!fabricCanvas || isEmpty) {
      toast({
        title: "Assinatura vazia",
        description: "Por favor, desenhe sua assinatura antes de salvar",
        variant: "destructive"
      });
      return;
    }

    const signature = fabricCanvas.toDataURL({
      format: 'png',
      quality: 1,
      multiplier: 1
    });
    
    onSignatureChange(signature);
    
    toast({
      title: "Assinatura salva",
      description: "Sua assinatura foi capturada com sucesso"
    });
  };

  return (
    <div className="space-y-4">
      <Label className="text-base font-semibold">
        Assinatura Digital do Inspetor *
      </Label>
      
      <div className="bg-muted/20 p-4 rounded-lg border-2 border-dashed border-primary/30">
        <div className="bg-white rounded-lg border border-border overflow-hidden shadow-sm">
          <canvas 
            ref={canvasRef} 
            className="w-full h-auto touch-none"
            style={{ touchAction: 'none' }}
          />
        </div>
        
        <div className="flex gap-3 mt-4 justify-center">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleClear}
            className="gap-2 h-10 px-4"
          >
            <RotateCcw className="h-4 w-4" />
            Limpar
          </Button>
          
          <Button
            type="button"
            variant="default"
            size="sm"
            onClick={handleSave}
            className="gap-2 h-10 px-4"
            disabled={isEmpty}
          >
            <Check className="h-4 w-4" />
            Confirmar
          </Button>
        </div>
      </div>
      
      <p className="text-sm text-muted-foreground text-center">
        {isEmpty 
          ? "Desenhe sua assinatura no quadro acima usando o dedo ou mouse" 
          : "Assinatura capturada ✓"
        }
      </p>
    </div>
  );
};

export default SignatureCanvas;