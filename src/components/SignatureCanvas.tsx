import React, { useRef, useState, useEffect } from 'react';
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
  const [isDrawing, setIsDrawing] = useState(false);
  const [isEmpty, setIsEmpty] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = 400;
    canvas.height = 200;

    // Set drawing style
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Fill with white background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Load existing signature if provided
    if (value && value.trim() !== '') {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0);
        setIsEmpty(false);
      };
      img.src = value;
    }
  }, [value]);

  const getMousePosition = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    };
  };

  const getTouchPosition = (e: React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const touch = e.touches[0];

    return {
      x: (touch.clientX - rect.left) * scaleX,
      y: (touch.clientY - rect.top) * scaleY
    };
  };

  const startDrawing = (x: number, y: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsDrawing(true);
    setIsEmpty(false);
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (x: number, y: number) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    
    // Save signature
    const canvas = canvasRef.current;
    if (canvas) {
      const signature = canvas.toDataURL('image/png');
      onSignatureChange(signature);
    }
  };

  // Mouse events
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const { x, y } = getMousePosition(e);
    startDrawing(x, y);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const { x, y } = getMousePosition(e);
    draw(x, y);
  };

  const handleMouseUp = () => {
    stopDrawing();
  };

  // Touch events
  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const { x, y } = getTouchPosition(e);
    startDrawing(x, y);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const { x, y } = getTouchPosition(e);
    draw(x, y);
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    stopDrawing();
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear and fill with white background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    setIsEmpty(true);
    onSignatureChange('');
    
    toast({
      title: "Assinatura limpa",
      description: "O campo de assinatura foi limpo"
    });
  };

  const handleSave = () => {
    if (isEmpty) {
      toast({
        title: "Assinatura vazia",
        description: "Por favor, desenhe sua assinatura antes de salvar",
        variant: "destructive"
      });
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    const signature = canvas.toDataURL('image/png');
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
            className="w-full h-auto cursor-crosshair touch-none"
            style={{ 
              touchAction: 'none',
              maxWidth: '100%',
              height: 'auto'
            }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
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