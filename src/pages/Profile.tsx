import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Plus, X, Save, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import Layout from '@/components/Layout';

const Profile = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    first_name: profile?.first_name || '',
    last_name: profile?.last_name || '',
    phone: profile?.phone || '',
    company_name: profile?.company_name || '',
    address: profile?.address || '',
    cnpj: profile?.cnpj || '',
    company_ids: profile?.company_ids || (profile?.unique_id ? [profile.unique_id] : [])
  });
  
  const [newCompanyId, setNewCompanyId] = useState('');
  const [loading, setLoading] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const addCompanyId = () => {
    if (newCompanyId.trim() && !formData.company_ids.includes(newCompanyId.trim())) {
      setFormData(prev => ({
        ...prev,
        company_ids: [...prev.company_ids, newCompanyId.trim()]
      }));
      setNewCompanyId('');
    }
  };

  const removeCompanyId = (idToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      company_ids: prev.company_ids.filter(id => id !== idToRemove)
    }));
  };

  const handleSave = async () => {
    if (!profile?.id) return;
    
    setLoading(true);
    try {
      // Ensure we include the original unique_id if it exists
      const finalCompanyIds = formData.company_ids.length > 0 
        ? formData.company_ids 
        : (profile.unique_id ? [profile.unique_id] : []);

      const { error } = await supabase
        .from('profiles')
        .update({
          first_name: formData.first_name,
          last_name: formData.last_name,
          phone: formData.phone,
          company_name: formData.company_name,
          address: formData.address,
          cnpj: formData.cnpj,
          company_ids: finalCompanyIds,
        })
        .eq('id', profile.id);

      if (error) throw error;

      toast({
        title: "Perfil atualizado",
        description: "Suas informações foram salvas com sucesso.",
      });
      
      // Refresh the page to update the auth context
      window.location.reload();
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o perfil.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/')}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
          <div className="flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            <h1 className="text-2xl font-bold">Meu Perfil</h1>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Informações Pessoais */}
          <Card>
            <CardHeader>
              <CardTitle>Informações Pessoais</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="first_name">Nome</Label>
                  <Input
                    id="first_name"
                    value={formData.first_name}
                    onChange={(e) => handleInputChange('first_name', e.target.value)}
                    placeholder="Seu nome"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="last_name">Sobrenome</Label>
                  <Input
                    id="last_name"
                    value={formData.last_name}
                    onChange={(e) => handleInputChange('last_name', e.target.value)}
                    placeholder="Seu sobrenome"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="phone">Telefone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder="(11) 99999-9999"
                />
              </div>
            </CardContent>
          </Card>

          {/* Informações da Empresa */}
          <Card>
            <CardHeader>
              <CardTitle>Informações da Empresa</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="company_name">Nome da Empresa</Label>
                <Input
                  id="company_name"
                  value={formData.company_name}
                  onChange={(e) => handleInputChange('company_name', e.target.value)}
                  placeholder="Nome da sua empresa"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="cnpj">CNPJ</Label>
                <Input
                  id="cnpj"
                  value={formData.cnpj}
                  onChange={(e) => handleInputChange('cnpj', e.target.value)}
                  placeholder="00.000.000/0000-00"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="address">Endereço</Label>
                <Textarea
                  id="address"
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  placeholder="Endereço completo da empresa"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* IDs Únicos da Empresa */}
        <Card>
          <CardHeader>
            <CardTitle>IDs Únicos da Empresa</CardTitle>
            <p className="text-sm text-muted-foreground">
              Adicione múltiplos IDs únicos para referenciar nos veículos
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                value={newCompanyId}
                onChange={(e) => setNewCompanyId(e.target.value)}
                placeholder="Digite um ID único"
                onKeyPress={(e) => e.key === 'Enter' && addCompanyId()}
              />
              <Button onClick={addCompanyId} size="sm" className="gap-2">
                <Plus className="h-4 w-4" />
                Adicionar
              </Button>
            </div>
            
            {(formData.company_ids.length > 0 || profile?.unique_id) && (
              <div className="space-y-2">
                <Label>IDs Cadastrados:</Label>
                <div className="flex flex-wrap gap-2">
                  {/* Show current unique_id if not in company_ids */}
                  {profile?.unique_id && !formData.company_ids.includes(profile.unique_id) && (
                    <div className="flex items-center gap-2 bg-primary/10 px-3 py-1 rounded-full text-sm border border-primary/20">
                      <span className="font-medium">{profile.unique_id}</span>
                      <span className="text-xs text-muted-foreground">(Original)</span>
                    </div>
                  )}
                  {/* Show company_ids */}
                  {formData.company_ids.map((id, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 bg-secondary px-3 py-1 rounded-full text-sm"
                    >
                      <span>{id}</span>
                      <button
                        onClick={() => removeCompanyId(id)}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Botão Salvar */}
        <div className="flex justify-end">
          <Button 
            onClick={handleSave} 
            disabled={loading}
            className="gap-2"
          >
            <Save className="h-4 w-4" />
            {loading ? 'Salvando...' : 'Salvar Alterações'}
          </Button>
        </div>
      </div>
    </Layout>
  );
};

export default Profile;