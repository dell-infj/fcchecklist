import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Plus, Edit, Trash2, GripVertical, Save, Settings, ArrowUp, ArrowDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import Layout from '@/components/Layout';

interface ChecklistItem {
  id: string;
  name: string;
  description?: string;
  category: 'interior' | 'exterior' | 'safety' | 'mechanical';
  required: boolean;
  order: number;
}

const ChecklistEditor = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { profile } = useAuth();
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState<ChecklistItem | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'interior' as ChecklistItem['category'],
    required: false
  });

  useEffect(() => {
    loadChecklistItems();
  }, []);

  const categories = [
    { value: 'interior', label: 'Interior', color: 'bg-blue-100 text-blue-800' },
    { value: 'exterior', label: 'Exterior', color: 'bg-green-100 text-green-800' },
    { value: 'safety', label: 'Segurança', color: 'bg-red-100 text-red-800' },
    { value: 'mechanical', label: 'Mecânico', color: 'bg-yellow-100 text-yellow-800' }
  ];

  const loadChecklistItems = async () => {
    try {
      const { data, error } = await supabase
        .from('checklist_items')
        .select('*')
        .eq('active', true)
        .order('item_order');

      if (error) throw error;

      const checklistItems: ChecklistItem[] = (data || []).map(item => ({
        id: item.id,
        name: item.name,
        description: item.description,
        category: item.category as ChecklistItem['category'],
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
    return categories.find(c => c.value === category) || categories[0];
  };

  const moveItem = async (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= items.length) return;

    const newItems = [...items];
    const [movedItem] = newItems.splice(index, 1);
    newItems.splice(newIndex, 0, movedItem);

    // Atualizar ordem
    const updatedItems = newItems.map((item, idx) => ({
      ...item,
      order: idx + 1
    }));

    try {
      // Atualizar ordem no banco de dados
      const updates = updatedItems.map(item => ({
        id: item.id,
        item_order: item.order
      }));

      for (const update of updates) {
        await supabase
          .from('checklist_items')
          .update({ item_order: update.item_order })
          .eq('id', update.id);
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

  const handleAdd = async () => {
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
          category: formData.category,
          required: formData.required,
          item_order: items.length + 1,
          unique_id: profile?.unique_id
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
      setFormData({ name: '', description: '', category: 'interior', required: false });
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
  };

  const handleEdit = async () => {
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
          category: formData.category,
          required: formData.required
        })
        .eq('id', currentItem.id);

      if (error) throw error;

      setItems(prev => prev.map(item => 
        item.id === currentItem.id 
          ? { ...item, name: formData.name, description: formData.description, category: formData.category, required: formData.required }
          : item
      ));

      setIsEditDialogOpen(false);
      setCurrentItem(null);
      setFormData({ name: '', description: '', category: 'interior', required: false });

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
  };

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
      category: item.category,
      required: item.required
    });
    setIsEditDialogOpen(true);
  };

  const handleSaveChanges = () => {
    toast({
      title: "Configurações salvas",
      description: "As alterações foram sincronizadas automaticamente"
    });
  };

  const resetToDefault = async () => {
    try {
      // Desativar todos os itens atuais
      await supabase
        .from('checklist_items')
        .update({ active: false })
        .eq('unique_id', profile?.unique_id);

      // Recarregar itens do banco (que agora serão os padrão)
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

  const ItemForm = ({ isEdit = false }: { isEdit?: boolean }) => (
    <div className="space-y-4">
      <div>
        <Label htmlFor="name">Nome do Item *</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData(prev => ({...prev, name: e.target.value}))}
          placeholder="Ex: Verificar luzes internas"
        />
      </div>
      <div>
        <Label htmlFor="description">Descrição</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData(prev => ({...prev, description: e.target.value}))}
          placeholder="Descrição detalhada do que verificar"
          rows={3}
        />
      </div>
      <div>
        <Label htmlFor="category">Categoria</Label>
        <select
          id="category"
          value={formData.category}
          onChange={(e) => setFormData(prev => ({...prev, category: e.target.value as ChecklistItem['category']}))}
          className="w-full h-10 px-3 py-2 border border-input bg-background rounded-md text-sm"
        >
          {categories.map(cat => (
            <option key={cat.value} value={cat.value}>{cat.label}</option>
          ))}
        </select>
      </div>
      <div className="flex items-center space-x-2">
        <input
          id="required"
          type="checkbox"
          checked={formData.required}
          onChange={(e) => setFormData(prev => ({...prev, required: e.target.checked}))}
          className="w-4 h-4"
        />
        <Label htmlFor="required">Item obrigatório</Label>
      </div>
      <div className="flex gap-2 pt-4">
        <Button 
          onClick={isEdit ? handleEdit : handleAdd}
          disabled={!formData.name.trim()}
          className="flex-1"
        >
          {isEdit ? 'Atualizar' : 'Adicionar'}
        </Button>
        <Button 
          variant="outline" 
          onClick={() => {
            if (isEdit) {
              setIsEditDialogOpen(false);
            } else {
              setIsAddDialogOpen(false);
            }
            setFormData({ name: '', description: '', category: 'interior', required: false });
          }}
          className="flex-1"
        >
          Cancelar
        </Button>
      </div>
    </div>
  );

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
              <ItemForm />
            </DialogContent>
          </Dialog>

          <Button variant="outline" onClick={handleSaveChanges} className="gap-2">
            <Save className="h-4 w-4" />
            Salvar Alterações
          </Button>

          <Button variant="outline" onClick={resetToDefault} className="gap-2">
            Resetar Padrão
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
                <p className="text-2xl font-bold text-muted-foreground">{new Set(items.map(i => i.category)).size}</p>
                <p className="text-sm text-muted-foreground">Categorias</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Items List */}
        <Card className="shadow-warm">
          <CardHeader>
            <CardTitle>Itens do Checklist</CardTitle>
            <p className="text-sm text-muted-foreground">
              Use os botões de seta para reordenar os itens. Use as ações para editar ou remover.
            </p>
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
                            <Badge variant="outline" className={getCategoryInfo(item.category).color}>
                              {getCategoryInfo(item.category).label}
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
            <ItemForm isEdit />
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default ChecklistEditor;