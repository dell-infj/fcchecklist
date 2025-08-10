import React, { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import AdminDashboard from '@/components/AdminDashboard';
import InspectorDashboard from '@/components/InspectorDashboard';

const Index = () => {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();

  // Debug logs
  console.log('Index Component State:', { user: !!user, profile: !!profile, loading, profileRole: profile?.role });

  useEffect(() => {
    console.log('Index useEffect:', { loading, user: !!user });
    if (!loading && !user) {
      console.log('Redirecting to auth');
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  if (loading) {
    console.log('Showing loading screen');
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
    console.log('No user or profile, returning null');
    return null;
  }

  return (
    <Layout>
      {profile.role === 'admin' ? <AdminDashboard /> : <InspectorDashboard />}
    </Layout>
  );
};

export default Index;
