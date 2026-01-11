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

    // Check for notifications every 5 seconds for more real-time feel
    const interval = setInterval(() => {
      checkForNewMessages();
      if (user.user_type === 'intervenant') {
        checkForSmartMissionNotifications();
        checkForMissionStatusChanges();
        checkForUpcomingMissions();
        checkForMissionDeadlines();
      }
      if (user.user_type === 'client') {
        checkForMissionAcceptance();
        checkForMissionStatusUpdates();
        checkForIntervenantDelay();
        checkIntervenantProximity();
      }
    }, 5000);

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
    // Play notification sound
    if (options.playSound !== false) {
      try {
        const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTGH0fPTgjMGHm7A7+OZSA0PVKzn77BdGAg+mtzyxHInBSl+zPLaizsIGGS57OihUBELTKXh8bllHAU2jdXzzn0vBSd7yvLaizsIGGS57OihUBELTKXh8bllHAU2jdXzzn0vBSd7yvLaizsIGGS57OihUBELTKXh8bllHAU2jdXzzn0vBSd7yvLaizsIGGS57OihUBELTKXh8bllHAU2jdXzzn0vBSd7yvLaizsIGGS57OihUBELTKXh8bllHAU2jdXzzn0vBSd7yvLaizsIGGS57OihUBELTKXh8bllHAU2jdXzzn0vBSd7yvLaizsIGGS57OihUBELTKXh8bllHAU2jdXzzn0vBQ==');
        audio.volume = 0.3;
        audio.play().catch(() => {});
      } catch (error) {}
    }

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
    if (!user?.notification_preferences?.messages) return;
    
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

  const checkForSmartMissionNotifications = async () => {
    if (!user?.notification_preferences?.new_missions) return;

    try {
      const pendingMissions = await base44.entities.Mission.filter(
        { status: 'pending' },
        '-created_date',
        20
      );

      // Check if there are new missions since last check
      const newMissions = pendingMissions.filter(mission => {
        const missionTime = new Date(mission.created_date).getTime();
        return missionTime > lastChecked.missions;
      });

      if (newMissions.length > 0 && intervenantLocation) {
        // Score missions by distance and other factors
        const scoredMissions = newMissions
          .filter(mission => mission.delivery_lat && mission.delivery_lng)
          .map(mission => {
            const distance = calculateDistance(
              intervenantLocation.latitude,
              intervenantLocation.longitude,
              mission.delivery_lat,
              mission.delivery_lng
            );
            // Score: lower distance = higher score, higher fee = higher score
            const distanceScore = Math.max(0, 10 - distance);
            const feeScore = (mission.service_fee || 0) / 10;
            const itemsScore = (mission.shopping_list?.length || 0) / 5;
            const totalScore = (distanceScore * 0.5) + (feeScore * 0.3) + (itemsScore * 0.2);

            return {
              ...mission,
              distance,
              totalScore
            };
          })
          .sort((a, b) => b.totalScore - a.totalScore)
          .slice(0, 3); // Top 3 best missions

        // Notify about best mission
        if (scoredMissions.length > 0) {
          const topMission = scoredMissions[0];

          // Only notify if within reasonable distance
          if (topMission.distance <= 15) {
            const urgencyLevel = topMission.distance < 2 ? '🔥 TRÈS PROCHE' : topMission.distance < 5 ? '🔔 Proche' : '📍 Disponible';

            await base44.entities.Notification.create({
              user_email: user.email,
              title: `${urgencyLevel} - Nouvelle mission !`,
              message: `${topMission.store_name} • ${topMission.distance.toFixed(1)}km • ${topMission.shopping_list?.length || 0} articles • ${(topMission.service_fee || 0).toFixed(2)}€`,
              type: 'new_mission',
              mission_id: topMission.id,
              action_url: '/AvailableMissions'
            });

            showNotification(`${urgencyLevel} - Nouvelle mission !`, {
              body: `${topMission.store_name} • ${topMission.distance.toFixed(1)}km • ${(topMission.service_fee || 0).toFixed(2)}€`,
              type: 'mission',
              tag: `smart-mission-${topMission.id}`,
              onClick: () => {
                window.location.href = '/app#/AvailableMissions';
              }
            });
          }
        }

        setLastChecked(prev => ({
          ...prev,
          missions: Date.now()
        }));
      }
    } catch (error) {
      console.error('Error checking for smart missions:', error);
    }
  };

  const checkForMissionAcceptance = async () => {
    if (!user?.notification_preferences?.mission_accepted) return;
    
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
    if (!user?.notification_preferences?.mission_status) return;

    try {
      const myMissions = await base44.entities.Mission.filter(
        { client_email: user.email },
        '-updated_date',
        10
      );

      const statusMessages = {
        'in_progress': { title: '🚀 Mission démarrée', body: 'Votre intervenant a commencé la mission', emoji: '🚀' },
        'shopping': { title: '🛒 Courses en cours', body: 'Votre intervenant fait vos courses', emoji: '🛒' },
        'delivering': { title: '🚗 En livraison', body: 'Votre intervenant est en route !', emoji: '🚗' },
        'completed': { title: '✅ Mission terminée', body: 'Votre mission a été livrée avec succès', emoji: '✅' }
      };

      for (const mission of myMissions) {
        if (!mission.id || mission.status === 'pending' || mission.status === 'cancelled') continue;

        const lastCheckTime = lastChecked.missionStatusUpdates[mission.id] || 0;
        const updateTime = new Date(mission.updated_date).getTime();

        if (updateTime > lastCheckTime && statusMessages[mission.status]) {
          const statusMsg = statusMessages[mission.status];

          // Create persistent notification
          await base44.entities.Notification.create({
            user_email: user.email,
            title: statusMsg.title,
            message: `${statusMsg.body} - ${mission.store_name}`,
            type: 'mission_update',
            mission_id: mission.id,
            action_url: `/MissionDetails?id=${mission.id}`
          });

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

  const checkForMissionStatusChanges = async () => {
    try {
      const myMissions = await base44.entities.Mission.filter({
        intervenant_email: user.email,
        status: { $in: ['accepted', 'in_progress', 'shopping', 'delivering', 'completed'] }
      }, '-updated_date', 15);

      const statusMessages = {
        'accepted': { title: '✅ Mission acceptée', body: 'Vous avez accepté une nouvelle mission', icon: '✅' },
        'in_progress': { title: '🛒 Courses en cours', body: 'Vous avez démarré vos courses', icon: '🛒' },
        'shopping': { title: '🛒 Courses en cours', body: 'Vous faites les courses', icon: '🛒' },
        'delivering': { title: '🚗 En livraison', body: 'Vous êtes en route pour livrer', icon: '🚗' },
        'completed': { title: '✅ Mission terminée', body: 'Vous avez terminé votre mission avec succès!', icon: '✅' },
        'cancelled': { title: '❌ Mission annulée', body: 'Le client a annulé la mission', severity: 'high' }
      };

      for (const mission of myMissions) {
        if (!mission.id) continue;

        const lastCheckTime = lastChecked[`missionChange_${mission.id}`] || 0;
        const updateTime = new Date(mission.updated_date).getTime();

        if (updateTime > lastCheckTime && statusMessages[mission.status]) {
          const statusMsg = statusMessages[mission.status];

          await base44.entities.Notification.create({
            user_email: user.email,
            title: statusMsg.title,
            message: `${statusMsg.body} - ${mission.store_name}`,
            type: mission.status === 'cancelled' ? 'urgent' : 'mission_update',
            mission_id: mission.id,
            action_url: `/IntervenantMissions`
          });

          showNotification(statusMsg.title, {
            body: `${statusMsg.body} - ${mission.store_name}`,
            type: 'alert',
            tag: `status-${mission.id}`,
            onClick: () => {
              window.location.href = `/app#/IntervenantMissions`;
            }
          });

          setLastChecked(prev => ({
            ...prev,
            [`missionChange_${mission.id}`]: updateTime
          }));
        }
      }

      // Check for client help requests
      const allMyMissions = await base44.entities.Mission.filter({
        intervenant_email: user.email
      }, '-updated_date', 5);

      for (const mission of allMyMissions) {
        if (!mission.id) continue;

        const lastCheckTime = lastChecked[`helpRequest_${mission.id}`] || 0;
        const updateTime = new Date(mission.updated_date).getTime();

        // Check if notes contain help keywords
        if (updateTime > lastCheckTime && mission.notes && 
            (mission.notes.toLowerCase().includes('aide') || 
             mission.notes.toLowerCase().includes('urgent') ||
             mission.notes.toLowerCase().includes('problème'))) {

          await base44.entities.Notification.create({
            user_email: user.email,
            title: '🆘 Le client a besoin d\'aide',
            message: `${mission.client_name} a un message important pour vous`,
            type: 'urgent',
            mission_id: mission.id,
            action_url: `/MissionDetails?id=${mission.id}`
          });

          showNotification('🆘 Le client a besoin d\'aide', {
            body: `${mission.client_name} a un message important`,
            type: 'alert',
            tag: `help-${mission.id}`,
            onClick: () => {
              window.location.href = `/app#/MissionDetails?id=${mission.id}`;
            }
          });

          setLastChecked(prev => ({
            ...prev,
            [`helpRequest_${mission.id}`]: updateTime
          }));
        }
      }
    } catch (error) {
      console.error('Error checking for mission status changes:', error);
    }
  };

  const checkForIntervenantDelay = async () => {
    try {
      const activeMissions = await base44.entities.Mission.filter({
        client_email: user.email,
        status: { $in: ['delivering', 'in_progress', 'shopping'] }
      });

      for (const mission of activeMissions) {
        if (!mission.intervenant_email || !mission.delivery_lat || !mission.delivery_lng) continue;

        const locations = await base44.entities.IntervenantLocation.filter({
          user_email: mission.intervenant_email
        }, '-updated_date', 1);

        if (locations.length > 0) {
          const location = locations[0];
          const distance = calculateDistance(
            location.latitude,
            location.longitude,
            mission.delivery_lat,
            mission.delivery_lng
          );

          // Estimate time based on distance and speed
          const estimatedMinutes = Math.round((distance / 5) * 60) + 10;
          const missionAge = (Date.now() - new Date(mission.created_date).getTime()) / 60000;
          const isLate = missionAge > 60 && estimatedMinutes > 20; // Over 1h and still far away

          if (isLate) {
            const lastDelayNotif = lastChecked[`delay_${mission.id}`] || 0;
            if (Date.now() - lastDelayNotif > 600000) { // Max once per 10 min
              await base44.entities.Notification.create({
                user_email: user.email,
                title: '⚠️ Votre intervenant est en retard',
                message: `${mission.intervenant_name} devrait arriver dans ~${estimatedMinutes} minutes`,
                type: 'urgent',
                mission_id: mission.id,
                action_url: `/MissionDetails?id=${mission.id}`
              });

              showNotification('⚠️ Votre intervenant est en retard', {
                body: `${mission.intervenant_name} devrait arriver dans ~${estimatedMinutes} minutes`,
                type: 'alert',
                tag: `delay-${mission.id}`,
                onClick: () => {
                  window.location.href = `/app#/MissionDetails?id=${mission.id}`;
                }
              });

              setLastChecked(prev => ({
                ...prev,
                [`delay_${mission.id}`]: Date.now()
              }));
            }
          }
        }
      }
    } catch (error) {
      console.error('Error checking for delays:', error);
    }
  };

  const checkIntervenantProximity = async () => {
    try {
      const activeMissions = await base44.entities.Mission.filter({
        client_email: user.email,
        status: { $in: ['delivering', 'in_progress'] }
      });

      for (const mission of activeMissions) {
        if (!mission.intervenant_email || !mission.delivery_lat || !mission.delivery_lng) continue;

        const locations = await base44.entities.IntervenantLocation.filter({
          user_email: mission.intervenant_email
        }, '-updated_date', 1);

        if (locations.length > 0) {
          const location = locations[0];
          const distance = calculateDistance(
            location.latitude,
            location.longitude,
            mission.delivery_lat,
            mission.delivery_lng
          );

          // Notify when within 500m
          if (distance < 0.5) {
            const lastProximityNotif = lastChecked[`proximity_${mission.id}`] || 0;
            if (Date.now() - lastProximityNotif > 300000) { // Max once per 5 min
              await base44.entities.Notification.create({
                user_email: user.email,
                title: '🎉 Votre intervenant arrive !',
                message: `${mission.intervenant_name} est à moins de 500m de chez vous`,
                type: 'proximity',
                mission_id: mission.id,
                action_url: `/MissionDetails?id=${mission.id}`
              });

              showNotification('🎉 Votre intervenant arrive !', {
                body: `${mission.intervenant_name} est à moins de 500m`,
                type: 'alert',
                tag: `proximity-${mission.id}`,
                onClick: () => {
                  window.location.href = `/app#/MissionDetails?id=${mission.id}`;
                }
              });

              setLastChecked(prev => ({
                ...prev,
                [`proximity_${mission.id}`]: Date.now()
              }));
            }
          }
        }
      }
    } catch (error) {
      console.error('Error checking proximity:', error);
    }
  };

  const checkForUpcomingMissions = async () => {
    if (!user?.user_type === 'intervenant') return;

    try {
      const now = Date.now();
      const thirtyMinFromNow = now + (30 * 60 * 1000);
      const oneHourFromNow = now + (60 * 60 * 1000);

      const upcomingMissions = await base44.entities.Mission.filter({
        intervenant_email: user.email,
        status: { $in: ['accepted', 'in_progress'] }
      }, '-scheduled_time', 10);

      for (const mission of upcomingMissions) {
        if (!mission.id || !mission.scheduled_time) continue;

        const scheduledTime = new Date(mission.scheduled_time).getTime();
        const timeUntilMission = scheduledTime - now;

        // Alert 30 min before scheduled time
        if (timeUntilMission > 0 && timeUntilMission <= (30 * 60 * 1000)) {
          const lastAlertTime = lastChecked[`upcoming_30_${mission.id}`] || 0;
          if (now - lastAlertTime > 1800000) { // Max once per 30min
            await base44.entities.Notification.create({
              user_email: user.email,
              title: '⏰ Mission dans 30 minutes',
              message: `${mission.store_name} - ${mission.client_name}`,
              type: 'mission_update',
              mission_id: mission.id,
              action_url: `/MissionDetails?id=${mission.id}`
            });

            showNotification('⏰ Mission dans 30 minutes', {
              body: `${mission.store_name} - Préparez-vous !`,
              type: 'alert',
              tag: `upcoming-30-${mission.id}`,
              onClick: () => {
                window.location.href = `/app#/MissionDetails?id=${mission.id}`;
              }
            });

            setLastChecked(prev => ({
              ...prev,
              [`upcoming_30_${mission.id}`]: now
            }));
          }
        }

        // Alert 1h before for preparation
        if (timeUntilMission > 0 && timeUntilMission <= (60 * 60 * 1000) && timeUntilMission > (30 * 60 * 1000)) {
          const lastAlertTime = lastChecked[`upcoming_60_${mission.id}`] || 0;
          if (now - lastAlertTime > 3600000) { // Max once per hour
            await base44.entities.Notification.create({
              user_email: user.email,
              title: '📋 Prochaine mission dans 1h',
              message: `${mission.store_name} - ${mission.shopping_list?.length || 0} articles`,
              type: 'mission_update',
              mission_id: mission.id,
              action_url: `/IntervenantDashboard`
            });

            showNotification('📋 Prochaine mission dans 1h', {
              body: `${mission.store_name} - ${mission.shopping_list?.length || 0} articles`,
              type: 'mission',
              tag: `upcoming-60-${mission.id}`
            });

            setLastChecked(prev => ({
              ...prev,
              [`upcoming_60_${mission.id}`]: now
            }));
          }
        }
      }
    } catch (error) {
      console.error('Error checking upcoming missions:', error);
    }
  };

  const checkForMissionDeadlines = async () => {
    if (!user?.user_type === 'intervenant') return;

    try {
      const activeMissions = await base44.entities.Mission.filter({
        intervenant_email: user.email,
        status: { $in: ['accepted', 'in_progress', 'shopping'] }
      }, '-created_date', 10);

      const now = Date.now();

      for (const mission of activeMissions) {
        if (!mission.id) continue;

        const missionAge = now - new Date(mission.created_date).getTime();
        const missionAgeHours = missionAge / (60 * 60 * 1000);

        // Alert if mission is taking too long
        if (missionAgeHours > 2 && mission.status !== 'delivering') {
          const lastAlertTime = lastChecked[`deadline_${mission.id}`] || 0;
          if (now - lastAlertTime > 1800000) { // Max once per 30min
            await base44.entities.Notification.create({
              user_email: user.email,
              title: '⚠️ Mission en attente depuis longtemps',
              message: `${mission.store_name} - ${Math.round(missionAgeHours)}h écoulées`,
              type: 'urgent',
              mission_id: mission.id,
              action_url: `/MissionDetails?id=${mission.id}`
            });

            showNotification('⚠️ Mission en attente', {
              body: `${mission.store_name} - ${Math.round(missionAgeHours)}h écoulées`,
              type: 'alert',
              tag: `deadline-${mission.id}`,
              onClick: () => {
                window.location.href = `/app#/MissionDetails?id=${mission.id}`;
              }
            });

            setLastChecked(prev => ({
              ...prev,
              [`deadline_${mission.id}`]: now
            }));
          }
        }

        // Encourage to update status if stuck in one phase
        const statusAge = now - new Date(mission.updated_date).getTime();
        const statusAgeMinutes = statusAge / (60 * 1000);

        if (statusAgeMinutes > 20 && mission.status === 'in_progress') {
          const lastAlertTime = lastChecked[`status_stuck_${mission.id}`] || 0;
          if (now - lastAlertTime > 1200000) { // Max once per 20min
            showNotification('💡 N\'oubliez pas de mettre à jour', {
              body: `${mission.store_name} - Marquez "En courses" si vous avez commencé`,
              type: 'mission',
              tag: `stuck-${mission.id}`,
              playSound: false
            });

            setLastChecked(prev => ({
              ...prev,
              [`status_stuck_${mission.id}`]: now
            }));
          }
        }
      }
    } catch (error) {
      console.error('Error checking mission deadlines:', error);
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