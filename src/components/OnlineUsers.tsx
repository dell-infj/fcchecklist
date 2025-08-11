import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, Circle } from 'lucide-react';

interface OnlineUser {
  user_id: string;
  first_name: string;
  last_name: string;
  role: string;
  unique_id: string;
  online_at: string;
}

export const OnlineUsers = () => {
  const { profile } = useAuth();
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [channel, setChannel] = useState<any>(null);

  useEffect(() => {
    if (!profile) return;

    // Create a channel for tracking online users
    const presenceChannel = supabase.channel('online_users');

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
            // Extract user data from the presence payload
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
          // Track this user's presence
          await presenceChannel.track(userStatus);
        }
      });

    setChannel(presenceChannel);

    // Cleanup on unmount
    return () => {
      if (presenceChannel) {
        presenceChannel.unsubscribe();
      }
    };
  }, [profile]);

  // Update presence every 30 seconds to keep user active
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
    }, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, [channel, profile]);

  if (!profile || onlineUsers.length === 0) {
    return null;
  }

  return (
    <Card className="shadow-warm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Users className="h-5 w-5 text-primary" />
          Usuários Online ({onlineUsers.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {onlineUsers.map((user) => (
          <div
            key={user.user_id}
            className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border"
          >
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Circle className="h-3 w-3 fill-success text-success animate-pulse" />
                <span className="font-medium">
                  {user.first_name} {user.last_name}
                </span>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Badge 
                variant={user.role === 'admin' ? 'default' : 'secondary'}
                className="text-xs"
              >
                {user.role === 'admin' ? 'Administrador' : 'Inspetor'}
              </Badge>
              
              {user.unique_id && (
                <Badge variant="outline" className="text-xs">
                  {user.unique_id}
                </Badge>
              )}
            </div>
          </div>
        ))}
        
        <div className="text-xs text-muted-foreground text-center mt-4">
          Atualizado em tempo real • Última atualização: {new Date().toLocaleTimeString('pt-BR')}
        </div>
      </CardContent>
    </Card>
  );
};

export default OnlineUsers;
