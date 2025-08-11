import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Camera, Upload, X, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ImageCaptureProps {
  onImageCapture: (imageData: string) => void;
  value?: string;
  placeholder: string;
  className?: string;
}

const ImageCapture: React.FC<ImageCaptureProps> = ({
  onImageCapture,
  value,
  placeholder,
  className
}) => {
  const [isCapturing, setIsCapturing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const MAX_WIDTH = 400;
  const MAX_HEIGHT = 300;
  const QUALITY = 0.7;

  const resizeImage = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          resolve('');
          return;
        }

        // Calculate new dimensions
        let { width, height } = img;
        
        if (width > height) {
          if (width > MAX_WIDTH) {
            height = (height * MAX_WIDTH) / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width = (width * MAX_HEIGHT) / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;

        // Draw and compress
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', QUALITY);
        resolve(dataUrl);
      };
      
      img.src = URL.createObjectURL(file);
    });
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const resizedImage = await resizeImage(file);
      onImageCapture(resizedImage);
    }
  };

  const startCamera = async () => {
    try {
      setIsCapturing(true);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });
      
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      setIsCapturing(false);
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) return;

      // Set canvas size to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      // Draw video frame to canvas
      ctx.drawImage(video, 0, 0);
      
      // Resize and compress
      const tempCanvas = document.createElement('canvas');
      const tempCtx = tempCanvas.getContext('2d');
      
      if (!tempCtx) return;

      let { width, height } = { width: canvas.width, height: canvas.height };
      
      if (width > height) {
        if (width > MAX_WIDTH) {
          height = (height * MAX_WIDTH) / width;
          width = MAX_WIDTH;
        }
      } else {
        if (height > MAX_HEIGHT) {
          width = (width * MAX_HEIGHT) / height;
          height = MAX_HEIGHT;
        }
      }

      tempCanvas.width = width;
      tempCanvas.height = height;
      tempCtx.drawImage(canvas, 0, 0, width, height);
      
      const dataUrl = tempCanvas.toDataURL('image/jpeg', QUALITY);
      onImageCapture(dataUrl);
      stopCamera();
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCapturing(false);
  };

  const removeImage = () => {
    onImageCapture('');
  };

  const resetCapture = () => {
    removeImage();
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  if (isCapturing) {
    return (
      <div className={cn("border-2 border-dashed border-primary/30 rounded-lg p-4", className)}>
        <div className="space-y-4">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="w-full max-w-sm mx-auto rounded-lg bg-black"
          />
          <canvas ref={canvasRef} className="hidden" />
          <div className="flex gap-2 justify-center">
            <Button
              onClick={capturePhoto}
              className="gap-2"
              size="sm"
            >
              <Camera className="h-4 w-4" />
              Capturar
            </Button>
            <Button
              onClick={stopCamera}
              variant="outline"
              size="sm"
            >
              Cancelar
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (value) {
    return (
      <div className={cn("border-2 border-dashed border-primary/30 rounded-lg p-4", className)}>
        <div className="space-y-3">
          <img
            src={value}
            alt="Foto capturada"
            className="w-full max-w-sm mx-auto rounded-lg object-cover"
            style={{ maxHeight: MAX_HEIGHT }}
          />
          <div className="flex gap-2 justify-center">
            <Button
              onClick={resetCapture}
              variant="outline"
              size="sm"
              className="gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              Trocar Foto
            </Button>
            <Button
              onClick={removeImage}
              variant="destructive"
              size="sm"
              className="gap-2"
            >
              <X className="h-4 w-4" />
              Remover
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("border-2 border-dashed border-primary/30 rounded-lg p-4 text-center", className)}>
      <Camera className="h-8 w-8 mx-auto mb-2 text-primary" />
      <p className="text-xs text-muted-foreground mb-3">{placeholder}</p>
      <div className="flex flex-col gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />
        <Button
          onClick={() => fileInputRef.current?.click()}
          variant="outline"
          size="sm"
          className="gap-2 w-full h-10"
        >
          <Upload className="h-4 w-4" />
          Selecionar da Galeria
        </Button>
        <Button
          onClick={startCamera}
          variant="default"
          size="sm"
          className="gap-2 w-full h-10"
        >
          <Camera className="h-4 w-4" />
          Abrir Câmera
        </Button>
      </div>
    </div>
  );
};

export default ImageCapture;