import React, { createContext, useContext, useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useToast } from '@/components/ui/use-toast';
import { Bell, MessageSquare, CheckCircle, MapPin, ShoppingCart, Truck, AlertCircle } from 'lucide-react';

const NotificationContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
};

export default function NotificationProvider({ children }) {
  const [user, setUser] = useState(null);
  const [permission, setPermission] = useState(Notification.permission);
  const [lastChecked, setLastChecked] = useState({
    messages: {},
    missions: Date.now(),
    missionAcceptance: {},
    missionStatusUpdates: {}
  });
  const [intervenantLocation, setIntervenantLocation] = useState(null);
  const { toast } = useToast();

  useEffect(() => {
    loadUser();
  }, []);

  useEffect(() => {
    // Get intervenant location if user is intervenant
    if (user && user.user_type === 'intervenant' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setIntervenantLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
        },
        (error) => console.log('Geolocation error:', error)
      );
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;

    // Check for notifications every 10 seconds
    const interval = setInterval(() => {
      checkForNewMessages();
      if (user.user_type === 'intervenant') {
        checkForNewMissions();
      }
      if (user.user_type === 'client') {
        checkForMissionAcceptance();
        checkForMissionStatusUpdates();
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [user, lastChecked]);

  const loadUser = async () => {
    try {
      const authenticated = await base44.auth.isAuthenticated();
      if (authenticated) {
        const userData = await base44.auth.me();
        setUser(userData);
      }
    } catch (error) {
      console.log('User not authenticated');
    }
  };

  const requestPermission = async () => {
    if (!('Notification' in window)) {
      console.log('This browser does not support notifications');
      return false;
    }

    if (Notification.permission === 'granted') {
      setPermission('granted');
      return true;
    }

    if (Notification.permission !== 'denied') {
      const result = await Notification.requestPermission();
      setPermission(result);
      return result === 'granted';
    }

    return false;
  };

  const showNotification = (title, options = {}) => {
    // Show toast notification
    const icons = {
      message: MessageSquare,
      mission: MapPin,
      acceptance: CheckCircle,
      statusUpdate: Truck,
      alert: AlertCircle
    };
    
    const Icon = icons[options.type] || Bell;
    
    toast({
      title: (
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4" />
          {title}
        </div>
      ),
      description: options.body,
      duration: 5000,
    });

    // Show browser notification if permission granted
    if (permission === 'granted' && document.hidden) {
      try {
        const notification = new Notification(title, {
          body: options.body,
          icon: '/logo.png',
          badge: '/logo.png',
          tag: options.tag || 'askbring-notification',
          ...options
        });

        notification.onclick = () => {
          window.focus();
          if (options.onClick) {
            options.onClick();
          }
          notification.close();
        };
      } catch (error) {
        console.error('Error showing notification:', error);
      }
    }
  };

  const checkForNewMessages = async () => {
    try {
      // Get all missions where user is involved
      const myMissions = await base44.entities.Mission.filter({
        $or: [
          { client_email: user.email },
          { intervenant_email: user.email }
        ]
      });

      for (const mission of myMissions) {
        if (!mission.id) continue;

        // Get messages for this mission
        const messages = await base44.entities.Message.filter(
          { mission_id: mission.id },
          '-created_date',
          1
        );

        if (messages.length === 0) continue;

        const latestMessage = messages[0];
        const lastCheckTime = lastChecked.messages[mission.id] || 0;

        // Check if message is new and not from current user
        const messageTime = new Date(latestMessage.created_date).getTime();
        if (messageTime > lastCheckTime && latestMessage.sender_email !== user.email) {
          showNotification('Nouveau message', {
            body: `${latestMessage.sender_name}: ${latestMessage.content.substring(0, 50)}${latestMessage.content.length > 50 ? '...' : ''}`,
            type: 'message',
            tag: `message-${mission.id}`,
            onClick: () => {
              window.location.href = `/app#/Messages?mission=${mission.id}`;
            }
          });

          // Update last checked time for this mission
          setLastChecked(prev => ({
            ...prev,
            messages: {
              ...prev.messages,
              [mission.id]: Date.now()
            }
          }));
        }
      }
    } catch (error) {
      console.error('Error checking for new messages:', error);
    }
  };

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const checkForNewMissions = async () => {
    try {
      const pendingMissions = await base44.entities.Mission.filter(
        { status: 'pending' },
        '-created_date',
        10
      );

      // Check if there are new missions since last check
      const newMissions = pendingMissions.filter(mission => {
        const missionTime = new Date(mission.created_date).getTime();
        return missionTime > lastChecked.missions;
      });

      if (newMissions.length > 0) {
        // Filter by location if available
        const relevantMissions = intervenantLocation
          ? newMissions.filter(mission => {
              if (!mission.delivery_lat || !mission.delivery_lng) return true;
              const distance = calculateDistance(
                intervenantLocation.latitude,
                intervenantLocation.longitude,
                mission.delivery_lat,
                mission.delivery_lng
              );
              return distance <= 10; // Within 10km
            })
          : newMissions;

        if (relevantMissions.length > 0) {
          const mission = relevantMissions[0];
          const distance = intervenantLocation && mission.delivery_lat && mission.delivery_lng
            ? calculateDistance(
                intervenantLocation.latitude,
                intervenantLocation.longitude,
                mission.delivery_lat,
                mission.delivery_lng
              ).toFixed(1)
            : null;

          showNotification('Nouvelle mission près de vous !', {
            body: `${mission.store_name} - ${mission.shopping_list?.length || 0} articles (${(mission.service_fee || 0).toFixed(2)}€)${distance ? ` • ${distance} km` : ''}`,
            type: 'mission',
            tag: 'new-mission',
            onClick: () => {
              window.location.href = '/app#/AvailableMissions';
            }
          });
        }

        setLastChecked(prev => ({
          ...prev,
          missions: Date.now()
        }));
      }
    } catch (error) {
      console.error('Error checking for new missions:', error);
    }
  };

  const checkForMissionAcceptance = async () => {
    try {
      const myMissions = await base44.entities.Mission.filter(
        { client_email: user.email },
        '-updated_date',
        10
      );

      for (const mission of myMissions) {
        if (!mission.id || mission.status === 'pending') continue;

        const lastCheckTime = lastChecked.missionAcceptance[mission.id] || 0;
        const updateTime = new Date(mission.updated_date).getTime();

        // Check if mission was recently accepted
        if (updateTime > lastCheckTime && mission.status === 'accepted' && mission.intervenant_name) {
          showNotification('Mission acceptée !', {
            body: `${mission.intervenant_name} a accepté votre mission au ${mission.store_name}`,
            type: 'acceptance',
            tag: `acceptance-${mission.id}`,
            onClick: () => {
              window.location.href = `/app#/MissionDetails?id=${mission.id}`;
            }
          });

          setLastChecked(prev => ({
            ...prev,
            missionAcceptance: {
              ...prev.missionAcceptance,
              [mission.id]: Date.now()
            }
          }));
        }
      }
    } catch (error) {
      console.error('Error checking for mission acceptance:', error);
    }
  };

  const checkForMissionStatusUpdates = async () => {
    try {
      const myMissions = await base44.entities.Mission.filter(
        { client_email: user.email },
        '-updated_date',
        10
      );

      const statusMessages = {
        'in_progress': { title: 'Mission démarrée', body: 'Votre intervenant a commencé la mission' },
        'shopping': { title: 'Courses en cours', body: 'Votre intervenant fait vos courses' },
        'delivering': { title: 'En livraison', body: 'Votre intervenant est en route !' },
        'completed': { title: 'Mission terminée', body: 'Votre mission a été livrée avec succès' }
      };

      for (const mission of myMissions) {
        if (!mission.id || mission.status === 'pending' || mission.status === 'cancelled') continue;

        const lastCheckTime = lastChecked.missionStatusUpdates[mission.id] || 0;
        const updateTime = new Date(mission.updated_date).getTime();

        if (updateTime > lastCheckTime && statusMessages[mission.status]) {
          const statusMsg = statusMessages[mission.status];
          showNotification(statusMsg.title, {
            body: `${statusMsg.body} - ${mission.store_name}`,
            type: 'statusUpdate',
            tag: `status-${mission.id}`,
            onClick: () => {
              window.location.href = `/app#/MissionDetails?id=${mission.id}`;
            }
          });

          setLastChecked(prev => ({
            ...prev,
            missionStatusUpdates: {
              ...prev.missionStatusUpdates,
              [mission.id]: updateTime
            }
          }));
        }
      }
    } catch (error) {
      console.error('Error checking for mission status updates:', error);
    }
  };

  const value = {
    permission,
    requestPermission,
    showNotification,
    user
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}