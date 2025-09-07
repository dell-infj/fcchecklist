import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, UserCheck, Shield, Circle } from 'lucide-react';
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

interface OnlineUser {
  user_id: string;
  online_at: string;
}

const TeamMembers = () => {
  const { profile } = useAuth();
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
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

  // Configurar presença em tempo real
  useEffect(() => {
    if (!profile?.unique_id) return;

    const channel = supabase.channel(`team_${profile.unique_id}`);

    // Configurar tracking de presença
    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const onlineUserIds = new Set<string>();
        
        Object.values(state).forEach((presences: any) => {
          presences.forEach((presence: any) => {
            if (presence.user_id) {
              onlineUserIds.add(presence.user_id);
            }
          });
        });
        
        setOnlineUsers(onlineUserIds);
      })
      .on('presence', { event: 'join' }, ({ newPresences }) => {
        console.log('User joined:', newPresences);
      })
      .on('presence', { event: 'leave' }, ({ leftPresences }) => {
        console.log('User left:', leftPresences);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          // Enviar presença do usuário atual
          await channel.track({
            user_id: profile.id,
            online_at: new Date().toISOString(),
            name: `${profile.first_name} ${profile.last_name}`,
            role: profile.role
          });
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile?.unique_id, profile?.id, profile?.first_name, profile?.last_name, profile?.role]);

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
    <Card className="w-full max-w-full">
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
      <CardContent className="max-w-full overflow-hidden">
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
              const isOnline = onlineUsers.has(member.id);
              return (
                <div
                  key={member.id}
                  className={`flex items-center justify-between p-3 border rounded-lg transition-colors w-full max-w-full ${
                    isCurrentUser 
                      ? 'bg-primary/5 border-primary/30 ring-1 ring-primary/20' 
                      : 'hover:bg-accent/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center relative ${
                      isCurrentUser ? 'bg-primary/20' : 'bg-primary/10'
                    }`}>
                      {member.role === 'admin' ? (
                        <Shield className="h-5 w-5 text-primary" />
                      ) : (
                        <UserCheck className="h-5 w-5 text-primary" />
                      )}
                      {isOnline && (
                        <Circle className="absolute -bottom-1 -right-1 h-3 w-3 fill-green-500 text-green-500" />
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
                        {isOnline && (
                          <Badge variant="outline" className="text-xs text-green-600 border-green-300">
                            Online
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