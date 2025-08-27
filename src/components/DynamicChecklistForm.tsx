import React, { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ChecklistItem {
  id: string;
  name: string;
  description?: string;
  category: 'interior' | 'exterior' | 'safety' | 'mechanical';
  required: boolean;
  order: number;
}

interface DynamicChecklistFormProps {
  formData: Record<string, { status: string; observation: string }>;
  setFormData: (updater: (prev: any) => any) => void;
  vehicleCategory?: string;
}

const DynamicChecklistForm: React.FC<DynamicChecklistFormProps> = ({ formData, setFormData, vehicleCategory }) => {
  const { toast } = useToast();
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([]);
  const [loading, setLoading] = useState(true);

  const categories = [
    { value: 'interior', label: 'Interior', color: 'bg-blue-100 text-blue-800' },
    { value: 'exterior', label: 'Exterior', color: 'bg-green-100 text-green-800' },
    { value: 'safety', label: 'Segurança', color: 'bg-red-100 text-red-800' },
    { value: 'mechanical', label: 'Mecânico', color: 'bg-yellow-100 text-yellow-800' }
  ];

  useEffect(() => {
    loadChecklistItems();
  }, [vehicleCategory]);

  const loadChecklistItems = async () => {
    try {
      // Mapear categorias de veículo para unique_id
      const getUniqueIdByCategory = (category: string) => {
        switch(category?.toLowerCase()) {
          case 'caminhao':
          case 'caminhão':
            return 'CAMINHAO';
          case 'carro':
          case 'moto':
            return 'CARRO';
          case 'retroescavadeira':
            return 'RETROESCAVADEIRA';
          default:
            return 'CARRO'; // Default para carro se não especificado
        }
      };

      const uniqueId = getUniqueIdByCategory(vehicleCategory || '');

      const { data, error } = await supabase
        .from('checklist_items')
        .select('*')
        .eq('active', true)
        .eq('unique_id', uniqueId)
        .order('item_order');

      if (error) throw error;

      const items: ChecklistItem[] = (data || []).map(item => ({
        id: item.id,
        name: item.name,
        description: item.description,
        category: item.category as ChecklistItem['category'],
        required: item.required,
        order: item.item_order
      }));

      setChecklistItems(items);

      // Inicializar formData com valores padrão para novos itens
      setFormData(prev => {
        const newFormData = { ...prev };
        items.forEach(item => {
          const fieldKey = getFieldKey(item.name);
          if (!newFormData[fieldKey]) {
            newFormData[fieldKey] = { status: 'funcionando', observation: '' };
          }
        });
        return newFormData;
      });

    } catch (error) {
      console.error('Error loading checklist items:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar itens do checklist",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getCategoryInfo = (category: string) => {
    return categories.find(c => c.value === category) || categories[0];
  };

  // Função para gerar uma chave consistente para o campo do formulário
  const getFieldKey = (itemName: string) => {
    return itemName
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove acentos
      .replace(/[^\w\s]/g, '') // Remove caracteres especiais
      .replace(/\s+/g, '_') // Substitui espaços por underscore
      .replace(/^_+|_+$/g, ''); // Remove underscores do início e fim
  };

  const updateFormData = (itemName: string, field: 'status' | 'observation', value: string) => {
    const fieldKey = getFieldKey(itemName);
    setFormData(prev => ({
      ...prev,
      [fieldKey]: {
        ...prev[fieldKey],
        [field]: value
      }
    }));
  };

  const getFormValue = (itemName: string, field: 'status' | 'observation') => {
    const fieldKey = getFieldKey(itemName);
    return formData[fieldKey]?.[field] || (field === 'status' ? 'funcionando' : '');
  };

  // Função para obter o nome legível da categoria do veículo
  const getVehicleCategoryDisplayName = (category: string) => {
    switch(category?.toLowerCase()) {
      case 'caminhao':
      case 'caminhão':
        return 'Caminhão/Caminhão-Munck';
      case 'carro':
        return 'Veículos Leves (Carro)';
      case 'moto':
        return 'Veículos Leves (Moto)';
      case 'retroescavadeira':
        return 'Retroescavadeira';
      default:
        return 'Veículos Leves (Carro)';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-6 bg-muted rounded w-1/4 mb-4"></div>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-20 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Agrupar itens por categoria
  const groupedItems = checklistItems.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, ChecklistItem[]>);

  return (
    <div className="space-y-8">
      {/* Mostrar informação sobre a categoria do veículo */}
      {vehicleCategory && (
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <h2 className="text-lg font-semibold text-blue-900 mb-2">
            Checklist para: {getVehicleCategoryDisplayName(vehicleCategory)}
          </h2>
          <p className="text-blue-700 text-sm">
            Os itens abaixo foram selecionados específicamente para esta categoria de veículo.
          </p>
        </div>
      )}

      {checklistItems.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground">
            Nenhum item de checklist encontrado para esta categoria de veículo.
          </p>
        </div>
      ) : (
        Object.entries(groupedItems).map(([category, items]) => (
          <div key={category} className="space-y-4">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold">
                {getCategoryInfo(category).label}
              </h3>
              <Badge 
                variant="outline" 
                className={getCategoryInfo(category).color}
              >
                {items.length} {items.length === 1 ? 'item' : 'itens'}
              </Badge>
            </div>

            <div className="space-y-6">
              {items.map((item) => (
                <div key={item.id} className="space-y-3 p-4 border rounded-lg bg-background">
                  <div className="flex items-start gap-2">
                    <Label className="text-base font-medium flex-1">
                      {item.name}
                      {item.required && (
                        <Badge variant="default" className="ml-2 bg-success text-white text-xs">
                          Obrigatório
                        </Badge>
                      )}
                    </Label>
                  </div>
                  
                  {item.description && (
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  )}

                  <RadioGroup
                    value={getFormValue(item.name, 'status')}
                    onValueChange={(value) => updateFormData(item.name, 'status', value)}
                    className="flex gap-6"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="funcionando" id={`${item.id}-funcionando`} />
                      <Label htmlFor={`${item.id}-funcionando`} className="text-green-600 font-medium">
                        Sim
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="revisao" id={`${item.id}-revisao`} />
                      <Label htmlFor={`${item.id}-revisao`} className="text-yellow-600 font-medium">
                        Revisão
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="ausente" id={`${item.id}-ausente`} />
                      <Label htmlFor={`${item.id}-ausente`} className="text-red-600 font-medium">
                        Ausente
                      </Label>
                    </div>
                  </RadioGroup>

                  <div className="space-y-2">
                    <Label htmlFor={`${item.id}-observation`} className="text-sm font-medium">
                      Observações
                    </Label>
                    <Input
                      id={`${item.id}-observation`}
                      value={getFormValue(item.name, 'observation')}
                      onChange={(e) => updateFormData(item.name, 'observation', e.target.value)}
                      placeholder="Observações adicionais..."
                      className="w-full"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default DynamicChecklistForm;