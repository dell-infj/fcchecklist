import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, UserCheck, Shield } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface TeamMember {
  id: string;
  first_name: string;
  last_name: string;
  role: string;
  phone?: string;
  company_name?: string;
  unique_id?: string;
}

const TeamMembers = () => {
  const { profile } = useAuth();
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTeamMembers = async () => {
      if (!profile?.unique_id) {
        setLoading(false);
        return;
      }

      try {
        // Buscar todos os profiles com o mesmo unique_id ou que tenham este unique_id em company_ids
        // INCLUINDO o próprio usuário para mostrar a equipe completa
        const { data, error } = await supabase
          .from('profiles')
          .select('id, first_name, last_name, role, phone, company_name, unique_id')
          .or(`unique_id.eq.${profile.unique_id},company_ids.cs.{${profile.unique_id}}`);

        if (error) throw error;

        setTeamMembers(data || []);
      } catch (error) {
        console.error('Error fetching team members:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTeamMembers();
  }, [profile?.unique_id, profile?.id]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Carregando colaboradores...
          </CardTitle>
        </CardHeader>
      </Card>
    );
  }

  if (!profile?.unique_id) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Quadro de Colaboradores
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            Configure um ID único para ver os colaboradores da sua equipe.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Equipe Conectada
          <Badge variant="default" className="ml-auto bg-primary">
            ID Principal: {profile.unique_id}
          </Badge>
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Todos os usuários cadastrados com este ID único
        </p>
      </CardHeader>
      <CardContent>
        {teamMembers.length === 0 ? (
          <div className="text-center py-6">
            <UserCheck className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">
              Nenhum usuário encontrado com este ID único.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {teamMembers.map((member) => {
              const isCurrentUser = member.id === profile.id;
              return (
                <div
                  key={member.id}
                  className={`flex items-center justify-between p-3 border rounded-lg transition-colors ${
                    isCurrentUser 
                      ? 'bg-primary/5 border-primary/30 ring-1 ring-primary/20' 
                      : 'hover:bg-accent/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      isCurrentUser ? 'bg-primary/20' : 'bg-primary/10'
                    }`}>
                      {member.role === 'admin' ? (
                        <Shield className="h-5 w-5 text-primary" />
                      ) : (
                        <UserCheck className="h-5 w-5 text-primary" />
                      )}
                    </div>
                    <div>
                      <div className="font-medium flex items-center gap-2">
                        {member.first_name} {member.last_name}
                        {isCurrentUser && (
                          <Badge variant="outline" className="text-xs">
                            Você
                          </Badge>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {member.phone || 'Telefone não informado'}
                      </div>
                      {member.company_name && (
                        <div className="text-xs text-muted-foreground">
                          {member.company_name}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <Badge variant={member.role === 'admin' ? 'default' : 'secondary'}>
                      {member.role === 'admin' ? 'Administrador' : 'Inspetor'}
                    </Badge>
                    {member.unique_id === profile.unique_id ? (
                      <Badge variant="default" className="text-xs bg-primary">
                        ID Principal
                      </Badge>
                    ) : member.unique_id ? (
                      <Badge variant="outline" className="text-xs">
                        ID: {member.unique_id}
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-xs">
                        ID Vinculado
                      </Badge>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TeamMembers;