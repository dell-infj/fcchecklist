import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { UserPlus, Plus, Trash2, ArrowLeft, Mail, User } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import Layout from '@/components/Layout';

const formSchema = z.object({
  firstName: z.string().min(2, { message: "Nome deve ter pelo menos 2 caracteres" }),
  lastName: z.string().min(2, { message: "Sobrenome deve ter pelo menos 2 caracteres" }),
  email: z.string().email({ message: "Email inválido" }),
  password: z.string().min(6, { message: "Senha deve ter pelo menos 6 caracteres" }),
});

interface Coordinator {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  unique_id?: string;
  created_at: string;
}

export default function CoordinatorManagement() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [coordinators, setCoordinators] = useState<Coordinator[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
    },
  });

  useEffect(() => {
    if (profile?.role === 'admin') {
      fetchCoordinators();
    }
  }, [profile]);

  const fetchCoordinators = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'admin')
        .eq('managed_by', profile?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCoordinators(data || []);
    } catch (error) {
      console.error('Error fetching coordinators:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar coordenadores",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      // Save current admin session
      const currentSession = await supabase.auth.getSession();
      
      console.log('Creating coordinator with email:', values.email);
      
      const { data: authData, error } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            first_name: values.firstName,
            last_name: values.lastName,
            role: 'admin',
            unique_id: profile?.unique_id, // Herdar o unique_id do administrador pai
            company_ids: profile?.company_ids || []
          }
        }
      });

      if (error) throw error;

      if (authData.user) {
        // Update the profile to mark it as managed by current admin and ensure proper setup
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ 
            managed_by: profile?.id,
            unique_id: profile?.unique_id, // Garantir que herda o unique_id
            company_ids: profile?.company_ids || []
          })
          .eq('user_id', authData.user.id);

        if (updateError) throw updateError;
      }

      // Immediately sign out the new coordinator and restore admin session
      await supabase.auth.signOut();
      
      // Restore admin session if it existed
      if (currentSession.data.session) {
        await supabase.auth.setSession(currentSession.data.session);
      }

      toast({
        title: "Sucesso",
        description: "Coordenador cadastrado com sucesso!",
      });

      form.reset();
      setOpen(false);
      fetchCoordinators();
    } catch (error: any) {
      console.error('Error creating coordinator:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao criar coordenador",
        variant: "destructive",
      });
    }
  };

  const deleteCoordinator = async (coordinatorId: string, userId: string) => {
    try {
      // Delete the user from auth (this will cascade to profile via trigger)
      const { error: deleteError } = await supabase.auth.admin.deleteUser(userId);
      
      if (deleteError) throw deleteError;

      toast({
        title: "Sucesso",
        description: "Coordenador removido com sucesso!",
      });

      fetchCoordinators();
    } catch (error: any) {
      console.error('Error deleting coordinator:', error);
      toast({
        title: "Erro",
        description: "Erro ao remover coordenador",
        variant: "destructive",
      });
    }
  };

  if (profile?.role !== 'admin') {
    return (
      <Layout>
        <div className="flex items-center justify-center h-96">
          <p className="text-muted-foreground">Acesso negado. Apenas administradores podem gerenciar coordenadores.</p>
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
                <h2 className="text-xl font-bold">Gerenciar Coordenadores</h2>
                <p className="text-muted-foreground text-sm">Cadastre e gerencie coordenadores da equipe</p>
              </div>
            </div>
            
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="w-4 h-4" />
                  Novo Coordenador
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Cadastrar Novo Coordenador</DialogTitle>
                  <DialogDescription>
                    Preencha os dados para criar uma nova conta de coordenador com privilégios administrativos.
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
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="Digite o email" {...field} />
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
              <UserPlus className="w-5 h-5" />
              Coordenadores Ativos
            </CardTitle>
            <CardDescription>
              {coordinators.length} coordenadores cadastrados
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Coordinators List */}
        <Card>
          <CardHeader>
            <CardTitle>Lista de Coordenadores</CardTitle>
            <CardDescription>
              Gerencie os coordenadores criados por você
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
            ) : coordinators.length === 0 ? (
              <div className="text-center py-8 space-y-3">
                <UserPlus className="w-12 h-12 text-muted-foreground mx-auto" />
                <p className="text-muted-foreground">Nenhum coordenador cadastrado</p>
                <p className="text-sm text-muted-foreground">Clique em "Novo Coordenador" para começar</p>
              </div>
            ) : (
              <div className="space-y-4">
                {coordinators.map((coordinator) => (
                  <div key={coordinator.id} className="flex items-center justify-between p-4 bg-secondary/50 rounded-lg hover:bg-secondary/70 transition-colors">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-muted-foreground" />
                        <p className="font-medium">
                          {coordinator.first_name} {coordinator.last_name}
                        </p>
                        <Badge variant="default">Coordenador</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Cadastrado em {new Date(coordinator.created_at).toLocaleDateString('pt-BR')}
                      </p>
                      {coordinator.unique_id && (
                        <p className="text-xs text-muted-foreground">
                          ID: {coordinator.unique_id}
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
                              Tem certeza que deseja remover o coordenador {coordinator.first_name} {coordinator.last_name}? 
                              Esta ação não pode ser desfeita e removerá todos os dados associados.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deleteCoordinator(coordinator.id, coordinator.user_id)}
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