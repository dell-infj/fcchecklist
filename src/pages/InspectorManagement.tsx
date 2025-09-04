import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Users, Plus, Trash2, ArrowLeft, Mail, User } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import Layout from '@/components/Layout';

const formSchema = z.object({
  firstName: z.string().min(2, { message: "Nome deve ter pelo menos 2 caracteres" }),
  lastName: z.string().min(2, { message: "Sobrenome deve ter pelo menos 2 caracteres" }),
  username: z.string().min(3, { message: "Nome de usuário deve ter pelo menos 3 caracteres" }),
  password: z.string().min(6, { message: "Senha deve ter pelo menos 6 caracteres" }),
});

interface Inspector {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  username?: string;
  phone?: string;
  unique_id?: string;
  created_at: string;
}

export default function InspectorManagement() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [inspectors, setInspectors] = useState<Inspector[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      username: "",
      password: "",
    },
  });

  useEffect(() => {
    if (profile?.role === 'admin') {
      fetchInspectors();
    }
  }, [profile]);

  const fetchInspectors = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'inspector')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setInspectors(data || []);
    } catch (error) {
      console.error('Error fetching inspectors:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar inspetores",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      // Create a unique but valid email for the inspector
      // Using a format that looks like a real email but is unique per inspector
      const tempEmail = `${values.username.toLowerCase()}.${profile?.unique_id?.toLowerCase()}@inspector.local`;
      
      console.log('Creating inspector with email:', tempEmail);
      
      const { error } = await supabase.auth.signUp({
        email: tempEmail,
        password: values.password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            first_name: values.firstName,
            last_name: values.lastName,
            role: 'inspector',
            username: values.username,
            unique_id: profile?.unique_id,
            admin_unique_id: profile?.unique_id
          }
        }
      });

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Inspetor cadastrado com sucesso!",
      });

      form.reset();
      setOpen(false);
      fetchInspectors();
    } catch (error: any) {
      console.error('Error creating inspector:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao criar inspetor",
        variant: "destructive",
      });
    }
  };

  const deleteInspector = async (inspectorId: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', inspectorId);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Inspetor removido com sucesso!",
      });

      fetchInspectors();
    } catch (error) {
      console.error('Error deleting inspector:', error);
      toast({
        title: "Erro",
        description: "Erro ao remover inspetor",
        variant: "destructive",
      });
    }
  };

  if (profile?.role !== 'admin') {
    return (
      <Layout>
        <div className="flex items-center justify-center h-96">
          <p className="text-muted-foreground">Acesso negado. Apenas administradores podem gerenciar inspetores.</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6 px-4">
        <div className="flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/')}
                className="gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Voltar
              </Button>
              <div>
                <h2 className="text-xl font-bold">Gerenciar Inspetores</h2>
                <p className="text-muted-foreground text-sm">Cadastre e gerencie inspetores da equipe</p>
              </div>
            </div>
            
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="w-4 h-4" />
                  Novo Inspetor
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Cadastrar Novo Inspetor</DialogTitle>
                  <DialogDescription>
                    Preencha os dados para criar uma nova conta de inspetor.
                  </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome</FormLabel>
                          <FormControl>
                            <Input placeholder="Digite o nome" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="lastName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Sobrenome</FormLabel>
                          <FormControl>
                            <Input placeholder="Digite o sobrenome" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome de Usuário</FormLabel>
                          <FormControl>
                            <Input placeholder="Digite o nome de usuário" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Senha</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="Digite a senha" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="flex justify-end gap-2">
                      <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                        Cancelar
                      </Button>
                      <Button type="submit">
                        Cadastrar
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Stats Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Inspetores Ativos
            </CardTitle>
            <CardDescription>
              {inspectors.length} inspetores cadastrados
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Inspectors List */}
        <Card>
          <CardHeader>
            <CardTitle>Lista de Inspetores</CardTitle>
            <CardDescription>
              Gerencie os inspetores da sua equipe
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center justify-between p-4 bg-secondary/50 rounded-lg animate-pulse">
                    <div className="space-y-2">
                      <div className="h-4 bg-muted rounded w-48"></div>
                      <div className="h-3 bg-muted rounded w-32"></div>
                    </div>
                    <div className="h-8 bg-muted rounded w-20"></div>
                  </div>
                ))}
              </div>
            ) : inspectors.length === 0 ? (
              <div className="text-center py-8 space-y-3">
                <Users className="w-12 h-12 text-muted-foreground mx-auto" />
                <p className="text-muted-foreground">Nenhum inspetor cadastrado</p>
                <p className="text-sm text-muted-foreground">Clique em "Novo Inspetor" para começar</p>
              </div>
            ) : (
              <div className="space-y-4">
                {inspectors.map((inspector) => (
                  <div key={inspector.id} className="flex items-center justify-between p-4 bg-secondary/50 rounded-lg hover:bg-secondary/70 transition-colors">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-muted-foreground" />
                        <p className="font-medium">
                          {inspector.first_name} {inspector.last_name}
                        </p>
                        <Badge variant="secondary">Inspetor</Badge>
                      </div>
                      {inspector.username && (
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <span>Usuário: {inspector.username}</span>
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        Cadastrado em {new Date(inspector.created_at).toLocaleDateString('pt-BR')}
                      </p>
                      {inspector.unique_id && (
                        <p className="text-xs text-muted-foreground">
                          ID: {inspector.unique_id}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Confirmar remoção</AlertDialogTitle>
                            <AlertDialogDescription>
                              Tem certeza que deseja remover o inspetor {inspector.first_name} {inspector.last_name}? 
                              Esta ação não pode ser desfeita.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deleteInspector(inspector.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Remover
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}