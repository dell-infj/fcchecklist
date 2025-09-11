import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Plus, Edit, Trash2, Save, Settings, ArrowUp, ArrowDown, Car, Truck, Construction, X, Bike, HardHat, Bus, Wrench, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import Layout from '@/components/Layout';
import * as LucideIcons from 'lucide-react';

interface ChecklistItem {
  id: string;
  name: string;
  description?: string;
  category: string;
  required: boolean;
  order: number;
}

interface VehicleCategory {
  id: string;
  name: string;
  label: string;
  icon_name: string;
  active: boolean;
}

// Componente separado para o formulário
const ItemForm = React.memo(({ 
  isEdit = false, 
  formData, 
  setFormData, 
  onSubmit, 
  onCancel,
  selectedVehicleCategory 
}: { 
  isEdit?: boolean;
  formData: any;
  setFormData: (data: any) => void;
  onSubmit: () => void;
  onCancel: () => void;
  selectedVehicleCategory: string;
}) => {
  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="name">Nome do Item *</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({...formData, name: e.target.value})}
          placeholder="Ex: Verificar luzes internas"
        />
      </div>
      <div>
        <Label htmlFor="description">Descrição</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({...formData, description: e.target.value})}
          placeholder="Descrição detalhada do que verificar"
          rows={3}
        />
      </div>
      <div>
        <Label>Categoria do Veículo</Label>
        <div className="p-2 border rounded-md bg-muted">
          {selectedVehicleCategory || 'Nenhuma categoria selecionada'}
        </div>
      </div>
      <div className="flex items-center space-x-2">
        <input
          id="required"
          type="checkbox"
          checked={formData.required}
          onChange={(e) => setFormData({...formData, required: e.target.checked})}
          className="w-4 h-4"
        />
        <Label htmlFor="required">Item obrigatório</Label>
      </div>
      <div className="flex gap-2 pt-4">
        <Button 
          onClick={onSubmit}
          disabled={!formData.name.trim()}
          className="flex-1"
        >
          {isEdit ? 'Atualizar' : 'Adicionar'}
        </Button>
        <Button 
          variant="outline" 
          onClick={onCancel}
          className="flex-1"
        >
          Cancelar
        </Button>
      </div>
    </div>
  );
});

const getIconComponent = (iconName: string) => {
  const icons: { [key: string]: any } = {
    Car: Car,
    Truck: Truck,
    Construction: Construction,
    Bike: Bike,
    HardHat: HardHat,
    Bus: Bus,
    Wrench: Wrench,
  };
  return icons[iconName] || Car;
};

const ChecklistEditor = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { profile } = useAuth();
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [vehicleCategories, setVehicleCategories] = useState<VehicleCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVehicleCategory, setSelectedVehicleCategory] = useState<string>('');

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState<ChecklistItem | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    required: false
  });

  // Estados para gerenciar categorias de veículos
  const [isAddCategoryDialogOpen, setIsAddCategoryDialogOpen] = useState(false);
  const [isEditCategoryDialogOpen, setIsEditCategoryDialogOpen] = useState(false);
  const [currentCategory, setCurrentCategory] = useState<VehicleCategory | null>(null);
  const [categoryFormData, setCategoryFormData] = useState({
    name: '',
    label: '',
    icon_name: 'Car'
  });

  // Gerar categorias dinâmicas baseadas nos itens carregados
  const getItemCategories = () => {
    const uniqueCategories = Array.from(new Set(items.map(item => item.category)));
    return uniqueCategories.map((cat, index) => ({
      value: cat,
      label: cat.charAt(0).toUpperCase() + cat.slice(1),
      color: `bg-${['blue', 'green', 'red', 'yellow', 'purple', 'indigo'][index % 6]}-100 text-${['blue', 'green', 'red', 'yellow', 'purple', 'indigo'][index % 6]}-800`
    }));
  };

  useEffect(() => {
    loadVehicleCategories();
  }, []);

  useEffect(() => {
    if (selectedVehicleCategory) {
      loadChecklistItems();
    }
  }, [selectedVehicleCategory, profile?.unique_id]);

  const loadVehicleCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('vehicle_categories')
        .select('*')
        .eq('active', true)
        .order('name');

      if (error) throw error;

      const categories: VehicleCategory[] = data || [];
      setVehicleCategories(categories);
      
      // Auto-selecionar primeira categoria se nenhuma selecionada
      if (categories.length > 0 && !selectedVehicleCategory) {
        setSelectedVehicleCategory(categories[0].name);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error loading vehicle categories:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar categorias de veículos",
        variant: "destructive"
      });
    }
  };

  const loadChecklistItems = async () => {
    if (!selectedVehicleCategory) return;
    
    try {
      const { data, error } = await supabase
        .from('checklist_items')
        .select('*')
        .eq('active', true)
        .eq('category', selectedVehicleCategory)
        .order('item_order');

      if (error) throw error;

      const checklistItems: ChecklistItem[] = (data || []).map(item => ({
        id: item.id,
        name: item.name,
        description: item.description,
        category: selectedVehicleCategory as ChecklistItem['category'],
        required: item.required,
        order: item.item_order
      }));

      setItems(checklistItems);
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
    const itemCategories = getItemCategories();
    return itemCategories.find(c => c.value === category) || { value: category, label: category, color: 'bg-gray-100 text-gray-800' };
  };

  const moveItem = async (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= items.length) return;

    const newItems = [...items];
    const [movedItem] = newItems.splice(index, 1);
    newItems.splice(newIndex, 0, movedItem);

    const updatedItems = newItems.map((item, idx) => ({
      ...item,
      order: idx + 1
    }));

    try {
      for (const [idx, item] of updatedItems.entries()) {
        await supabase
          .from('checklist_items')
          .update({ item_order: idx + 1 })
          .eq('id', item.id);
      }

      setItems(updatedItems);
      
      toast({
        title: "Ordem atualizada",
        description: "A ordem dos itens foi alterada com sucesso"
      });
    } catch (error) {
      console.error('Error updating order:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar ordem dos itens",
        variant: "destructive"
      });
    }
  };

  const handleAdd = useCallback(async () => {
    if (!formData.name.trim()) {
      toast({
        title: "Nome obrigatório",
        description: "Digite um nome para o item",
        variant: "destructive"
      });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('checklist_items')
        .insert({
          name: formData.name,
          description: formData.description,
          category: selectedVehicleCategory,
          required: formData.required,
          item_order: items.length + 1,
          unique_id: 'default'
        })
        .select()
        .single();

      if (error) throw error;

      const newItem: ChecklistItem = {
        id: data.id,
        name: data.name,
        description: data.description,
        category: data.category as ChecklistItem['category'],
        required: data.required,
        order: data.item_order
      };

      setItems(prev => [...prev, newItem]);
      setFormData({ name: '', description: '', category: '', required: false });
      setIsAddDialogOpen(false);

      toast({
        title: "Item adicionado",
        description: "Novo item foi adicionado ao checklist"
      });
    } catch (error) {
      console.error('Error adding item:', error);
      toast({
        title: "Erro",
        description: "Erro ao adicionar item",
        variant: "destructive"
      });
    }
  }, [formData, items.length, profile?.unique_id, toast]);

  const handleEdit = useCallback(async () => {
    if (!currentItem || !formData.name.trim()) {
      toast({
        title: "Nome obrigatório",
        description: "Digite um nome para o item",
        variant: "destructive"
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('checklist_items')
        .update({
          name: formData.name,
          description: formData.description,
          required: formData.required
        })
        .eq('id', currentItem.id);

      if (error) throw error;

      setItems(prev => prev.map(item => 
        item.id === currentItem.id 
          ? { ...item, name: formData.name, description: formData.description, required: formData.required }
          : item
      ));

      setIsEditDialogOpen(false);
      setCurrentItem(null);
      setFormData({ name: '', description: '', category: '', required: false });

      toast({
        title: "Item atualizado",
        description: "Item foi atualizado com sucesso"
      });
    } catch (error) {
      console.error('Error updating item:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar item",
        variant: "destructive"
      });
    }
  }, [currentItem, formData, toast]);

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('checklist_items')
        .update({ active: false })
        .eq('id', id);

      if (error) throw error;

      setItems(prev => prev.filter(item => item.id !== id));
      
      toast({
        title: "Item removido",
        description: "Item foi removido do checklist"
      });
    } catch (error) {
      console.error('Error deleting item:', error);
      toast({
        title: "Erro",
        description: "Erro ao remover item",
        variant: "destructive"
      });
    }
  };

  const openEditDialog = (item: ChecklistItem) => {
    setCurrentItem(item);
    setFormData({
      name: item.name,
      description: item.description || '',
      category: '',
      required: item.required
    });
    setIsEditDialogOpen(true);
  };

  const handleCancelAdd = useCallback(() => {
    setIsAddDialogOpen(false);
    setFormData({ name: '', description: '', category: '', required: false });
  }, []);

  const handleCancelEdit = useCallback(() => {
    setIsEditDialogOpen(false);
    setCurrentItem(null);
    setFormData({ name: '', description: '', category: '', required: false });
  }, []);

  const resetToDefault = async () => {
    if (!selectedVehicleCategory) {
      toast({
        title: "Erro",
        description: "Selecione uma categoria de veículo primeiro",
        variant: "destructive"
      });
      return;
    }

    try {
      // Remove itens customizados da categoria selecionada
      await supabase
        .from('checklist_items')
        .update({ active: false })
        .eq('category', selectedVehicleCategory)
        .neq('unique_id', 'default');

      await loadChecklistItems();
      
      toast({
        title: "Checklist resetado",
        description: "Checklist foi resetado para configuração padrão"
      });
    } catch (error) {
      console.error('Error resetting to default:', error);
      toast({
        title: "Erro",
        description: "Erro ao resetar checklist",
        variant: "destructive"
      });
    }
  };

  // Funções para gerenciar categorias de veículos
  const handleAddCategory = async () => {
    if (!categoryFormData.name.trim() || !categoryFormData.label.trim()) {
      toast({
        title: "Campos obrigatórios",
        description: "Digite o nome e rótulo para a categoria",
        variant: "destructive"
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('vehicle_categories')
        .insert({
          name: categoryFormData.name.toUpperCase(),
          label: categoryFormData.label,
          icon_name: categoryFormData.icon_name,
          unique_id: profile?.unique_id
        });

      if (error) throw error;

      setCategoryFormData({ name: '', label: '', icon_name: 'Car' });
      setIsAddCategoryDialogOpen(false);
      await loadVehicleCategories();
      
      toast({
        title: "Categoria adicionada",
        description: "Nova categoria foi adicionada com sucesso"
      });
    } catch (error) {
      console.error('Error adding category:', error);
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao adicionar categoria",
        variant: "destructive"
      });
    }
  };

  const handleEditCategory = async () => {
    if (!currentCategory || !categoryFormData.name.trim() || !categoryFormData.label.trim()) {
      toast({
        title: "Campos obrigatórios",
        description: "Digite o nome e rótulo para a categoria",
        variant: "destructive"
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('vehicle_categories')
        .update({
          name: categoryFormData.name.toUpperCase(),
          label: categoryFormData.label,
          icon_name: categoryFormData.icon_name
        })
        .eq('id', currentCategory.id);

      if (error) throw error;

      setIsEditCategoryDialogOpen(false);
      setCurrentCategory(null);
      setCategoryFormData({ name: '', label: '', icon_name: 'Car' });
      await loadVehicleCategories();
      
      toast({
        title: "Categoria atualizada",
        description: "Categoria foi atualizada com sucesso"
      });
    } catch (error) {
      console.error('Error updating category:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar categoria",
        variant: "destructive"
      });
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    try {
      const { error } = await supabase
        .from('vehicle_categories')
        .update({ active: false })
        .eq('id', categoryId);

      if (error) throw error;

      await loadVehicleCategories();
      
      // Se a categoria deletada era a selecionada, selecionar a primeira disponível
      if (vehicleCategories.find(c => c.id === categoryId)?.name === selectedVehicleCategory) {
        const remainingCategories = vehicleCategories.filter(c => c.id !== categoryId);
        if (remainingCategories.length > 0) {
          setSelectedVehicleCategory(remainingCategories[0].name);
        }
      }
      
      toast({
        title: "Categoria removida",
        description: "Categoria foi removida com sucesso"
      });
    } catch (error) {
      console.error('Error deleting category:', error);
      toast({
        title: "Erro",
        description: "Erro ao remover categoria",
        variant: "destructive"
      });
    }
  };

  const openEditCategoryDialog = (category: VehicleCategory) => {
    setCurrentCategory(category);
    setCategoryFormData({
      name: category.name,
      label: category.label,
      icon_name: category.icon_name
    });
    setIsEditCategoryDialogOpen(true);
  };

  if (loading) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-muted rounded w-1/3"></div>
            <div className="h-64 bg-muted rounded"></div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <Button
            variant="outline"
            size="lg"
            onClick={() => navigate('/')}
            className="gap-2 h-12 px-6 w-full sm:w-auto"
          >
            <ArrowLeft className="h-5 w-5" />
            Voltar
          </Button>
          <div className="flex items-center gap-3">
            <Settings className="h-6 w-6 text-primary" />
            <h1 className="text-2xl sm:text-3xl font-bold">Editor de Checklist</h1>
          </div>
        </div>

        {/* Vehicle Category Selector */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Categoria de Veículo</CardTitle>
              <p className="text-sm text-muted-foreground">
                Selecione a categoria de veículo para editar os itens de checklist específicos
              </p>
            </div>
            {profile?.role === 'admin' && (
              <Dialog open={isAddCategoryDialogOpen} onOpenChange={setIsAddCategoryDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="gap-2">
                    <Plus className="h-4 w-4" />
                    Nova Categoria
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Adicionar Nova Categoria</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="category-name">Nome da Categoria *</Label>
                      <Input
                        id="category-name"
                        value={categoryFormData.name}
                        onChange={(e) => setCategoryFormData({...categoryFormData, name: e.target.value})}
                        placeholder="Ex: CAMINHAO"
                      />
                    </div>
                    <div>
                      <Label htmlFor="category-label">Rótulo de Exibição *</Label>
                      <Input
                        id="category-label"
                        value={categoryFormData.label}
                        onChange={(e) => setCategoryFormData({...categoryFormData, label: e.target.value})}
                        placeholder="Ex: Caminhão/Caminhão-Munck"
                      />
                    </div>
                    <div>
                      <Label htmlFor="category-icon">Ícone</Label>
                      <Select value={categoryFormData.icon_name} onValueChange={(value) => setCategoryFormData({...categoryFormData, icon_name: value})}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Car">Carro</SelectItem>
                          <SelectItem value="Truck">Caminhão</SelectItem>
                          <SelectItem value="Bike">Moto</SelectItem>
                          <SelectItem value="Construction">Retroescavadeira</SelectItem>
                          <SelectItem value="HardHat">Escavadeira</SelectItem>
                          <SelectItem value="Bus">Ônibus</SelectItem>
                          <SelectItem value="Wrench">Outros</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={handleAddCategory} className="flex-1">
                        Adicionar
                      </Button>
                      <Button variant="outline" onClick={() => setIsAddCategoryDialogOpen(false)} className="flex-1">
                        Cancelar
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {vehicleCategories.map(category => {
                const IconComponent = getIconComponent(category.icon_name);
                return (
                  <div key={category.id} className="relative">
                    <Button
                      variant={selectedVehicleCategory === category.name ? "default" : "outline"}
                      className="h-auto p-4 flex flex-col items-center gap-2 w-full"
                      onClick={() => setSelectedVehicleCategory(category.name)}
                    >
                      <IconComponent className="w-8 h-8" />
                      <span className="text-sm font-medium text-center">{category.label}</span>
                    </Button>
                    {profile?.role === 'admin' && (
                      <div className="absolute -top-2 -right-2 flex gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-6 w-6 p-0 rounded-full"
                          onClick={() => openEditCategoryDialog(category)}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-6 w-6 p-0 rounded-full text-red-500 hover:text-red-700"
                          onClick={() => handleDeleteCategory(category.id)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Dialog para editar categoria */}
        <Dialog open={isEditCategoryDialogOpen} onOpenChange={setIsEditCategoryDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Categoria</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-category-name">Nome da Categoria *</Label>
                <Input
                  id="edit-category-name"
                  value={categoryFormData.name}
                  onChange={(e) => setCategoryFormData({...categoryFormData, name: e.target.value})}
                  placeholder="Ex: CAMINHAO"
                />
              </div>
              <div>
                <Label htmlFor="edit-category-label">Rótulo de Exibição *</Label>
                <Input
                  id="edit-category-label"
                  value={categoryFormData.label}
                  onChange={(e) => setCategoryFormData({...categoryFormData, label: e.target.value})}
                  placeholder="Ex: Caminhão/Caminhão-Munck"
                />
              </div>
              <div>
                <Label htmlFor="edit-category-icon">Ícone</Label>
                <Select value={categoryFormData.icon_name} onValueChange={(value) => setCategoryFormData({...categoryFormData, icon_name: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Car">Carro</SelectItem>
                    <SelectItem value="Truck">Caminhão</SelectItem>
                    <SelectItem value="Bike">Moto</SelectItem>
                    <SelectItem value="Construction">Retroescavadeira</SelectItem>
                    <SelectItem value="HardHat">Escavadeira</SelectItem>
                    <SelectItem value="Bus">Ônibus</SelectItem>
                    <SelectItem value="Wrench">Outros</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleEditCategory} className="flex-1">
                  Atualizar
                </Button>
                <Button variant="outline" onClick={() => setIsEditCategoryDialogOpen(false)} className="flex-1">
                  Cancelar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Adicionar Item
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Adicionar Novo Item</DialogTitle>
              </DialogHeader>
              <ItemForm
                formData={formData}
                setFormData={setFormData}
                onSubmit={handleAdd}
                onCancel={handleCancelAdd}
                selectedVehicleCategory={selectedVehicleCategory}
              />
            </DialogContent>
          </Dialog>

          <Button variant="outline" onClick={resetToDefault} className="gap-2">
            Resetar Padrão
          </Button>

          <Button 
            variant="secondary" 
            onClick={() => navigate('/checklist/new')} 
            className="gap-2"
          >
            <FileText className="h-4 w-4" />
            Criar Checklist
          </Button>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-primary">{items.length}</p>
                <p className="text-sm text-muted-foreground">Total de Itens</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-success">{items.filter(i => i.required).length}</p>
                <p className="text-sm text-muted-foreground">Obrigatórios</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-warning">{items.filter(i => !i.required).length}</p>
                <p className="text-sm text-muted-foreground">Opcionais</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-muted-foreground">{vehicleCategories.length}</p>
                <p className="text-sm text-muted-foreground">Categorias</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Items List */}
        <Card className="shadow-warm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Itens do Checklist</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Use os botões de seta para reordenar os itens. Use as ações para editar ou remover.
                </p>
              </div>
              <Badge variant="outline">
                {vehicleCategories.find(c => c.name === selectedVehicleCategory)?.label}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {items.map((item, index) => (
                <div
                  key={item.id}
                  className="p-4 border rounded-lg bg-background shadow-sm"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex flex-col gap-1 mt-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => moveItem(index, 'up')}
                        disabled={index === 0}
                        className="p-1 h-6 w-6"
                      >
                        <ArrowUp className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => moveItem(index, 'down')}
                        disabled={index === items.length - 1}
                        className="p-1 h-6 w-6"
                      >
                        <ArrowDown className="h-3 w-3" />
                      </Button>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <h4 className="font-medium">{item.name}</h4>
                          {item.description && (
                            <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
                          )}
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant="outline">
                              {vehicleCategories.find(c => c.name === selectedVehicleCategory)?.label || selectedVehicleCategory}
                            </Badge>
                            {item.required && (
                              <Badge variant="default" className="bg-success text-white">
                                Obrigatório
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditDialog(item)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(item.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Editar Item</DialogTitle>
            </DialogHeader>
            <ItemForm
              isEdit
              formData={formData}
              setFormData={setFormData}
              onSubmit={handleEdit}
              onCancel={handleCancelEdit}
              selectedVehicleCategory={selectedVehicleCategory}
            />
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default ChecklistEditor;