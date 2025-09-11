import React from 'react';
import { Plus, X } from 'lucide-react';
import ImageCapture from './ImageCapture';
import { Button } from './ui/button';

interface MultipleImageCaptureProps {
  title: string;
  images: string[];
  onImagesChange: (images: string[]) => void;
  maxImages?: number;
  placeholder?: string;
}

export const MultipleImageCapture: React.FC<MultipleImageCaptureProps> = ({
  title,
  images,
  onImagesChange,
  maxImages = 7,
  placeholder = "Clique para adicionar foto"
}) => {
  const addImage = (imageData: string) => {
    if (images.length < maxImages) {
      onImagesChange([...images, imageData]);
    }
  };

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    onImagesChange(newImages);
  };

  const updateImage = (index: number, imageData: string) => {
    const newImages = [...images];
    newImages[index] = imageData;
    onImagesChange(newImages);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-base">{title}</h3>
        <span className="text-sm text-muted-foreground">
          {images.length}/{maxImages} fotos
        </span>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Existing Images */}
        {images.map((image, index) => (
          <div key={index} className="relative">
            <ImageCapture
              value={image}
              onImageCapture={(imageData) => updateImage(index, imageData)}
              placeholder={`Foto ${index + 1}`}
              className="hover-lift warm-glow"
            />
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="absolute top-2 right-2 h-6 w-6 rounded-full"
              onClick={() => removeImage(index)}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        ))}
        
        {/* Add New Image Button */}
        {images.length < maxImages && (
          <div className="border-2 border-dashed border-muted-foreground/30 rounded-lg p-8 flex flex-col items-center justify-center space-y-2 hover:border-primary/50 transition-colors cursor-pointer hover-lift warm-glow">
            <ImageCapture
              value=""
              onImageCapture={addImage}
              placeholder={placeholder}
              className="w-full h-full border-none bg-transparent"
            />
          </div>
        )}
      </div>
    </div>
  );
};
