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
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());

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
      // Buscar diretamente pela categoria do veículo na tabela checklist_items
      const { data, error } = await supabase
        .from('checklist_items')
        .select('*')
        .eq('active', true)
        .eq('category', vehicleCategory || '')
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

    // Adicionar animação quando marcar qualquer item (apenas quando mudar status)
    if (field === 'status') {
      setCheckedItems(prev => new Set([...prev, fieldKey]));
      // Remover após animação de 1 segundo
      setTimeout(() => {
        setCheckedItems(prev => {
          const newSet = new Set(prev);
          newSet.delete(fieldKey);
          return newSet;
        });
      }, 1000);
    }
  };

  const getFormValue = (itemName: string, field: 'status' | 'observation') => {
    const fieldKey = getFieldKey(itemName);
    return formData[fieldKey]?.[field] || (field === 'status' ? 'funcionando' : '');
  };

  // Função para obter o nome legível da categoria do veículo
  const getVehicleCategoryDisplayName = async (category: string) => {
    try {
      const { data } = await supabase
        .from('vehicle_categories')
        .select('label')
        .eq('name', category)
        .eq('active', true)
        .single();
      return data?.label || category;
    } catch {
      return category;
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
    <div className="space-y-6 sm:space-y-8">
      {/* Mostrar informação sobre a categoria do veículo */}
      {vehicleCategory && (
        <VehicleCategoryDisplay vehicleCategory={vehicleCategory} />
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

                  <div className="space-y-4 sm:space-y-6">
                {items.map((item) => {
                  const fieldKey = getFieldKey(item.name);
                  const isChecked = checkedItems.has(fieldKey);
                  
                  return (
                    <div key={item.id} className="space-y-3 p-3 sm:p-4 border rounded-lg bg-background relative">
                      {/* Emoji de confirmação animado */}
                      {isChecked && (
                        <div className="absolute -top-2 -right-2 text-2xl animate-scale-in z-10">
                          ✅
                        </div>
                      )}
                      
                      <div className="flex items-start gap-2">
                        <Label className="text-sm sm:text-base font-medium flex-1">
                          {item.name}
                          {item.required && (
                            <Badge variant="default" className="ml-2 bg-success text-white text-xs">
                              Obrigatório
                            </Badge>
                          )}
                        </Label>
                      </div>
                      
                      {item.description && (
                        <p className="text-xs sm:text-sm text-muted-foreground">{item.description}</p>
                      )}

                      <RadioGroup
                        value={getFormValue(item.name, 'status')}
                        onValueChange={(value) => updateFormData(item.name, 'status', value)}
                        className="flex flex-col sm:flex-row gap-4 sm:gap-6"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="funcionando" id={`${item.id}-funcionando`} />
                          <Label htmlFor={`${item.id}-funcionando`} className="text-green-600 font-medium text-sm sm:text-base">
                            Conforme
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="revisao" id={`${item.id}-revisao`} />
                          <Label htmlFor={`${item.id}-revisao`} className="text-yellow-600 font-medium text-sm sm:text-base">
                            Revisão
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="ausente" id={`${item.id}-ausente`} />
                          <Label htmlFor={`${item.id}-ausente`} className="text-red-600 font-medium text-sm sm:text-base">
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
                  );
                })}
              </div>
          </div>
        ))
      )}
    </div>
  );
};

// Componente para exibir informações da categoria do veículo
const VehicleCategoryDisplay: React.FC<{ vehicleCategory: string }> = ({ vehicleCategory }) => {
  const [categoryLabel, setCategoryLabel] = useState(vehicleCategory);

  useEffect(() => {
    const loadCategoryLabel = async () => {
      try {
        const { data } = await supabase
          .from('vehicle_categories')
          .select('label')
          .eq('name', vehicleCategory)
          .eq('active', true)
          .single();
        
        if (data?.label) {
          setCategoryLabel(data.label);
        }
      } catch (error) {
        console.error('Error loading category label:', error);
      }
    };

    loadCategoryLabel();
  }, [vehicleCategory]);

  return (
    <div className="bg-blue-50 p-3 sm:p-4 rounded-lg border border-blue-200">
      <h2 className="text-base sm:text-lg font-semibold text-blue-900 mb-2">
        Checklist para: {categoryLabel}
      </h2>
      <p className="text-blue-700 text-xs sm:text-sm">
        Os itens abaixo foram selecionados específicamente para esta categoria de veículo.
      </p>
    </div>
  );
};

export default DynamicChecklistForm;