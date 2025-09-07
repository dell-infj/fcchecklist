import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { User, LogOut, Plus, X, Save, Phone, Building2, MapPin, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import TeamMembers from './TeamMembers';
import TeamPresence from './TeamPresence';

const ProfileDrawer = () => {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  
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

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
    setOpen(false);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className="gap-2 hover:scale-105 transition-all duration-300 hover:shadow-md hover:bg-accent/50 p-3 rounded-full"
        >
          <div className="w-8 h-8 bg-gradient-primary rounded-full flex items-center justify-center">
            <User className="h-4 w-4 text-white" />
          </div>
          <div className="hidden md:block text-left">
            <div className="text-sm font-medium">
              {profile?.first_name} {profile?.last_name}
            </div>
            <div className="text-xs text-muted-foreground capitalize">
              {profile?.role === 'admin' ? 'Administrador' : 'Inspetor'}
            </div>
          </div>
        </Button>
      </SheetTrigger>
      
      <SheetContent side="right" className="w-full sm:w-full md:w-[820px] lg:w-[1000px] xl:w-[1200px] max-w-[100vw] p-0 sm:rounded-none">
        <ScrollArea className="h-full w-full">
          <div className="p-2 sm:p-4 space-y-3 max-w-full overflow-hidden text-sm">
            <SheetHeader>
              <SheetTitle className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-primary rounded-full flex items-center justify-center">
                    <User className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">Meu Perfil</h2>
                    <p className="text-sm text-muted-foreground">
                      {profile?.role === 'admin' ? 'Administrador' : 'Inspetor'}
                    </p>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleSignOut}
                  className="gap-2 hover:scale-105 transition-all duration-300"
                >
                  <LogOut className="h-4 w-4" />
                  Sair
                </Button>
              </SheetTitle>
            </SheetHeader>

            <Separator />

            {/* Informações Pessoais */}
            <Card>
              <CardHeader className="py-3">
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5 text-primary" />
                  Informações Pessoais
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  <Label htmlFor="phone" className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    Telefone
                  </Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    placeholder="(11) 99999-9999"
                  />
                </div>
              </CardContent>
            </Card>

            {/* ID Único Principal */}
            <Card className="border-primary/20 bg-primary/5">
              <CardHeader className="py-3">
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-primary" />
                  ID Único Principal
                  <Badge variant="default" className="bg-primary">
                    {profile?.unique_id || 'Não definido'}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 p-4">
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
                  <Label htmlFor="cnpj" className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    CNPJ
                  </Label>
                  <Input
                    id="cnpj"
                    value={formData.cnpj}
                    onChange={(e) => handleInputChange('cnpj', e.target.value)}
                    placeholder="00.000.000/0000-00"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="address" className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Endereço
                  </Label>
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

            {/* IDs Únicos Adicionais */}
            <Card>
              <CardHeader className="py-3">
                <CardTitle>IDs Únicos Adicionais</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Adicione IDs únicos de outras empresas
                </p>
              </CardHeader>
              <CardContent className="space-y-3 p-4">
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
                
                {formData.company_ids.length > 0 && (
                  <div className="space-y-2">
                    {formData.company_ids.map((id, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-secondary/20 rounded-lg">
                        <Badge variant="secondary">{id}</Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeCompanyId(id)}
                          className="h-6 w-6 p-0 hover:text-destructive"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Equipe e Presença */}
            <TeamPresence />

            {/* Gerenciamento de Equipe para Admins */}
            {profile?.role === 'admin' && <TeamMembers />}

            {/* Botão Salvar */}
            <div className="flex justify-end pt-3 border-t">
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
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
};

export default ProfileDrawer;