import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, Circle, Clock } from 'lucide-react';

interface TeamMember {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  role: string;
  unique_id: string;
  phone?: string;
  created_at: string;
  isOnline: boolean;
  lastSeen?: string;
}

interface OnlineUser {
  user_id: string;
  first_name: string;
  last_name: string;
  role: string;
  unique_id: string;
  online_at: string;
}

export const TeamPresence = () => {
  const { profile } = useAuth();
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [channel, setChannel] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Fetch all team members based on unique_id and company_ids
  const fetchTeamMembers = async () => {
    if (!profile) return;

    try {
      // Build the filter for unique_id and company_ids
      let query = supabase
        .from('profiles')
        .select('id, user_id, first_name, last_name, role, unique_id, phone, created_at');

      // Include users with the same unique_id or in company_ids
      const idsToMatch = [profile.unique_id, ...(profile.company_ids || [])].filter(Boolean);
      
      if (idsToMatch.length > 0) {
        query = query.or(
          idsToMatch.map(id => `unique_id.eq.${id}`).join(',')
        );
      }

      const { data, error } = await query.order('first_name');

      if (error) {
        console.error('Error fetching team members:', error);
        return;
      }

      if (data) {
        const members: TeamMember[] = data.map(member => ({
          ...member,
          isOnline: false,
          lastSeen: undefined
        }));
        setTeamMembers(members);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Set up presence tracking
  useEffect(() => {
    if (!profile) return;

    fetchTeamMembers();

    // Create a channel for tracking online users
    const presenceChannel = supabase.channel('team_presence');

    // Track current user presence
    const userStatus = {
      user_id: profile.user_id,
      first_name: profile.first_name,
      last_name: profile.last_name,
      role: profile.role,
      unique_id: profile.unique_id,
      online_at: new Date().toISOString(),
    };

    presenceChannel
      .on('presence', { event: 'sync' }, () => {
        const presenceState = presenceChannel.presenceState();
        const users: OnlineUser[] = [];
        
        for (const key in presenceState) {
          const presences = presenceState[key];
          if (presences && presences.length > 0) {
            presences.forEach((presence: any) => {
              if (presence && presence.user_id) {
                users.push({
                  user_id: presence.user_id,
                  first_name: presence.first_name || 'Usuário',
                  last_name: presence.last_name || '',
                  role: presence.role || 'inspector',
                  unique_id: presence.unique_id || '',
                  online_at: presence.online_at || new Date().toISOString(),
                });
              }
            });
          }
        }
        
        // Remove duplicates based on user_id
        const uniqueUsers = users.filter((user, index, self) => 
          index === self.findIndex(u => u.user_id === user.user_id)
        );
        
        setOnlineUsers(uniqueUsers);
      })
      .on('presence', { event: 'join' }, ({ newPresences }) => {
        console.log('User joined:', newPresences);
      })
      .on('presence', { event: 'leave' }, ({ leftPresences }) => {
        console.log('User left:', leftPresences);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await presenceChannel.track(userStatus);
        }
      });

    setChannel(presenceChannel);

    return () => {
      if (presenceChannel) {
        presenceChannel.unsubscribe();
      }
    };
  }, [profile]);

  // Update team members with online status
  useEffect(() => {
    if (teamMembers.length === 0) return;

    const updatedMembers = teamMembers.map(member => {
      const onlineUser = onlineUsers.find(user => user.user_id === member.user_id);
      return {
        ...member,
        isOnline: !!onlineUser,
        lastSeen: onlineUser?.online_at
      };
    });

    setTeamMembers(updatedMembers);
  }, [onlineUsers]);

  // Update presence every 30 seconds
  useEffect(() => {
    if (!channel || !profile) return;

    const interval = setInterval(async () => {
      const userStatus = {
        user_id: profile.user_id,
        first_name: profile.first_name,
        last_name: profile.last_name,
        role: profile.role,
        unique_id: profile.unique_id,
        online_at: new Date().toISOString(),
      };
      
      await channel.track(userStatus);
    }, 30000);

    return () => clearInterval(interval);
  }, [channel, profile]);

  if (!profile || loading) {
    return (
      <Card className="shadow-warm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Users className="h-5 w-5 text-primary" />
            Carregando equipe...
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-muted rounded-lg"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (teamMembers.length === 0) {
    return (
      <Card className="shadow-warm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Users className="h-5 w-5 text-primary" />
            Equipe ({profile.unique_id})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center">
            Nenhum membro da equipe encontrado para este ID único.
          </p>
        </CardContent>
      </Card>
    );
  }

  const onlineCount = teamMembers.filter(member => member.isOnline).length;

  return (
    <Card className="shadow-warm w-full max-w-full text-sm">
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-base">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Equipe ({profile.unique_id})
          </div>
          <Badge variant="outline" className="text-sm">
            {onlineCount}/{teamMembers.length} online
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 p-4 max-w-full overflow-hidden">
        {teamMembers.map((member) => (
          <div
            key={member.id}
            className={`flex items-center justify-between p-2 rounded-lg border transition-all w-full max-w-full ${
              member.isOnline 
                ? 'bg-success/5 border-success/30' 
                : 'bg-muted/30 border-border'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Circle 
                  className={`h-3 w-3 ${
                    member.isOnline 
                      ? 'fill-success text-success animate-pulse' 
                      : 'fill-muted-foreground text-muted-foreground'
                  }`} 
                />
                <div>
                  <span className="font-medium">
                    {member.first_name} {member.last_name}
                  </span>
                  {member.user_id === profile.user_id && (
                    <span className="text-xs text-muted-foreground ml-2">(Você)</span>
                  )}
                  <div className="flex items-center gap-2 mt-1">
                    <Badge 
                      variant={member.role === 'admin' ? 'default' : 'secondary'}
                      className="text-xs"
                    >
                      {member.role === 'admin' ? 'Administrador' : 'Inspetor'}
                    </Badge>
                    
                    {!member.isOnline && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        Offline
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="text-right">
              {member.phone && (
                <div className="text-xs text-muted-foreground">
                  {member.phone}
                </div>
              )}
              <div className="text-xs text-muted-foreground">
                Membro desde {new Date(member.created_at).toLocaleDateString('pt-BR')}
              </div>
              {member.isOnline && member.lastSeen && (
                <div className="text-xs text-success">
                  Online desde {new Date(member.lastSeen).toLocaleTimeString('pt-BR')}
                </div>
              )}
            </div>
          </div>
        ))}
        
        <div className="text-xs text-muted-foreground text-center mt-4 pt-3 border-t">
          Status atualizado em tempo real • Última atualização: {new Date().toLocaleTimeString('pt-BR')}
        </div>
      </CardContent>
    </Card>
  );
};

export default TeamPresence;