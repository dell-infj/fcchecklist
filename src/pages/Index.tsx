import React, { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import Layout from '@/components/Layout';
import AdminDashboard from '@/components/AdminDashboard';
import InspectorDashboard from '@/components/InspectorDashboard';

const Index = () => {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();
  const [showInspectorView, setShowInspectorView] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-sm">CC</span>
          </div>
          <h1 className="text-xl font-semibold mb-2">Carregando...</h1>
          <p className="text-muted-foreground">Verificando autenticação</p>
        </div>
      </div>
    );
  }

  if (!user || !profile) {
    return null;
  }

  return (
    <Layout>
      {profile?.role === 'admin' ? (
        <div className="space-y-6">
          {/* Toggle para administradores */}
          <div className="flex items-center justify-between p-4 bg-secondary/50 rounded-lg">
            <div className="flex items-center space-x-2">
              <Switch
                id="view-toggle"
                checked={showInspectorView}
                onCheckedChange={setShowInspectorView}
              />
              <Label htmlFor="view-toggle" className="font-medium">
                {showInspectorView ? 'Visualização do Inspetor' : 'Visualização do Administrador'}
              </Label>
            </div>
            <p className="text-sm text-muted-foreground">
              Alternar entre visualizações
            </p>
          </div>
          
          {/* Renderizar dashboard baseado na seleção */}
          {showInspectorView ? <InspectorDashboard /> : <AdminDashboard />}
        </div>
      ) : (
        <InspectorDashboard />
      )}
    </Layout>
  );
};

export default Index;
