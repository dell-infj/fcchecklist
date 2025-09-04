import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Truck, Shield, User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import fleetHeroImage from '@/assets/fleet-hero.jpg';

const Auth = () => {
  const { signIn, signUp, user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [loginForm, setLoginForm] = useState({
    email: '',
    password: '',
    userType: 'inspector',
    uniqueId: ''
  });
  
  const [signupForm, setSignupForm] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    companyName: '',
    uniqueId: ''
  });

  const [loading, setLoading] = useState(false);

  // Redirect if already authenticated
  if (user) {
    navigate('/');
    return null;
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    const { error } = await signIn(loginForm.email, loginForm.password);
    
    if (error) {
      toast({
        title: "Erro no login",
        description: error.message === "Invalid login credentials" 
          ? "Email ou senha incorretos" 
          : "Erro ao fazer login. Tente novamente.",
        variant: "destructive"
      });
    } else {
      toast({
        title: "Login realizado com sucesso!",
        description: "Redirecionando para o painel principal..."
      });
      navigate('/');
    }
    
    setLoading(false);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    const { error } = await signUp(
      signupForm.email, 
      signupForm.password, 
      signupForm.firstName, 
      signupForm.lastName, 
      'admin',
      signupForm.companyName,
      signupForm.uniqueId,
      undefined
    );
    
    if (error) {
      console.log('Signup error details:', error);
      toast({
        title: "Erro no cadastro",
        description: error.message === "User already registered"
          ? "Este email já está cadastrado"
          : `Erro ao criar conta: ${error.message}`,
        variant: "destructive"
      });
    } else {
      toast({
        title: "Conta criada com sucesso!",
        description: "Verifique seu email para confirmar a conta."
      });
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary">
      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-2 gap-8 items-center min-h-screen">
          
          {/* Hero Section */}
          <div className="hidden lg:block">
            <div className="relative overflow-hidden rounded-2xl">
              <img 
                src={fleetHeroImage} 
                alt="Fleet Management System" 
                className="w-full h-[600px] object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-primary/90 to-transparent">
                {/* FC Logo */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <img 
                    src="/lovable-uploads/8ca766ed-435b-41a5-b398-a52b283c8e31.png" 
                    alt="FC Gestão" 
                    className="h-72 w-auto"
                  />
                </div>
                <div className="absolute bottom-8 left-8 text-white">
                  <h1 className="text-4xl font-bold mb-4">
                    FC checklist
                  </h1>
                  <p className="text-xl mb-6 opacity-90">
                    Sistema profissional de checklist para frotas
                  </p>
                  <div className="flex gap-4">
                    <div className="flex items-center gap-2">
                      <Truck className="h-5 w-5" />
                      <span>Gestão de Veículos</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Shield className="h-5 w-5" />
                      <span>Inspeções Seguras</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Auth Forms */}
          <div className="w-full max-w-md mx-auto">
            <div className="text-center mb-8 lg:hidden">
              <div className="mb-4">
                <img 
                  src="/lovable-uploads/8ca766ed-435b-41a5-b398-a52b283c8e31.png" 
                  alt="FC Gestão" 
                  className="h-20 w-auto mx-auto"
                />
              </div>
              <h1 className="text-3xl font-bold text-primary mb-2">
                FC checklist
              </h1>
              <p className="text-muted-foreground">
                Sistema de checklist para frotas
              </p>
            </div>

            <Card className="shadow-fleet">
              <Tabs defaultValue="login" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="login">Login</TabsTrigger>
                  <TabsTrigger value="signup">Cadastro</TabsTrigger>
                </TabsList>
                
                <TabsContent value="login">
                  <CardHeader className="text-center">
                    <CardTitle className="flex items-center gap-2 justify-center">
                      <User className="h-5 w-5 text-primary" />
                      Fazer Login
                    </CardTitle>
                    <CardDescription>
                      Entre com suas credenciais para acessar o sistema
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleLogin} className="space-y-4">
                      <div className="space-y-3">
                        <Label>Tipo de Usuário</Label>
                        <RadioGroup 
                          value={loginForm.userType} 
                          onValueChange={(value) => setLoginForm(prev => ({
                            ...prev,
                            userType: value,
                            uniqueId: ''
                          }))}
                          className="grid grid-cols-2 gap-4"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="inspector" id="inspector" />
                            <Label 
                              htmlFor="inspector" 
                              className="flex-1 p-3 rounded-lg border cursor-pointer hover:bg-accent transition-colors"
                            >
                              <div className="flex items-center gap-2">
                                <User className="w-4 h-4" />
                                <span>Inspetor</span>
                              </div>
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="admin" id="admin" />
                            <Label 
                              htmlFor="admin" 
                              className="flex-1 p-3 rounded-lg border cursor-pointer hover:bg-accent transition-colors"
                            >
                              <div className="flex items-center gap-2">
                                <Shield className="w-4 h-4" />
                                <span>Gestor</span>
                              </div>
                            </Label>
                          </div>
                        </RadioGroup>
                      </div>
                      
                      {loginForm.userType === 'inspector' && (
                        <div className="space-y-2">
                          <Label htmlFor="unique-id">ID Único da Empresa</Label>
                          <Input
                            id="unique-id"
                            placeholder="Digite o ID único da empresa"
                            value={loginForm.uniqueId}
                            onChange={(e) => setLoginForm(prev => ({
                              ...prev,
                              uniqueId: e.target.value.toUpperCase()
                            }))}
                            required
                          />
                          <p className="text-sm text-muted-foreground">
                            Solicite o ID único ao administrador da sua empresa
                          </p>
                        </div>
                      )}
                      <div className="space-y-2">
                        <Label htmlFor="login-email">Email</Label>
                        <Input
                          id="login-email"
                          type="email"
                          placeholder="seu.email@empresa.com"
                          value={loginForm.email}
                          onChange={(e) => setLoginForm(prev => ({
                            ...prev,
                            email: e.target.value
                          }))}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="login-password">Senha</Label>
                        <Input
                          id="login-password"
                          type="password"
                          placeholder="••••••••"
                          value={loginForm.password}
                          onChange={(e) => setLoginForm(prev => ({
                            ...prev,
                            password: e.target.value
                          }))}
                          required
                        />
                      </div>
                      <Button 
                        type="submit" 
                        className="w-full" 
                        disabled={loading || (loginForm.userType === 'inspector' && !loginForm.uniqueId)}
                      >
                        {loading ? 'Entrando...' : 'Entrar'}
                      </Button>
                    </form>
                  </CardContent>
                </TabsContent>
                
                <TabsContent value="signup">
                  <CardHeader className="text-center">
                    <CardTitle className="flex items-center gap-2 justify-center">
                      <Shield className="h-5 w-5 text-primary" />
                      Criar Conta
                    </CardTitle>
                    <CardDescription>
                      Cadastre-se para acessar o sistema de checklist
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleSignup} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="first-name">Primeiro Nome</Label>
                          <Input
                            id="first-name"
                            placeholder="João"
                            value={signupForm.firstName}
                            onChange={(e) => setSignupForm(prev => ({
                              ...prev,
                              firstName: e.target.value
                            }))}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="last-name">Último Nome</Label>
                          <Input
                            id="last-name"
                            placeholder="Silva"
                            value={signupForm.lastName}
                            onChange={(e) => setSignupForm(prev => ({
                              ...prev,
                              lastName: e.target.value
                            }))}
                            required
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="signup-email">Email</Label>
                        <Input
                          id="signup-email"
                          type="email"
                          placeholder="seu.email@empresa.com"
                          value={signupForm.email}
                          onChange={(e) => setSignupForm(prev => ({
                            ...prev,
                            email: e.target.value
                          }))}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="signup-password">Senha</Label>
                        <Input
                          id="signup-password"
                          type="password"
                          placeholder="••••••••"
                          value={signupForm.password}
                          onChange={(e) => setSignupForm(prev => ({
                            ...prev,
                            password: e.target.value
                          }))}
                          required
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="company-name">Nome da Empresa</Label>
                        <Input
                          id="company-name"
                          placeholder="Transportadora ABC Ltda"
                          value={signupForm.companyName}
                          onChange={(e) => setSignupForm(prev => ({
                            ...prev,
                            companyName: e.target.value
                          }))}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="unique-id">ID Único da Empresa</Label>
                        <Input
                          id="unique-id"
                          placeholder="ABCTRANS2024"
                          value={signupForm.uniqueId}
                          onChange={(e) => setSignupForm(prev => ({
                            ...prev,
                            uniqueId: e.target.value.toUpperCase()
                          }))}
                          required
                        />
                        <p className="text-sm text-muted-foreground">
                          Este ID será usado pelos inspetores para se vincularem à sua empresa
                        </p>
                      </div>
                      
                      <Button 
                        type="submit" 
                        className="w-full" 
                        disabled={loading || !signupForm.companyName || !signupForm.uniqueId}
                      >
                        {loading ? 'Criando conta...' : 'Criar Conta'}
                      </Button>
                    </form>
                  </CardContent>
                </TabsContent>
              </Tabs>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;