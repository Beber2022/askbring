import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bell, 
  MessageSquare, 
  CheckCircle, 
  MapPin,
  Clock,
  Trash2,
  Check
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import moment from 'moment';
import 'moment/locale/fr';
import NotificationSettings from '@/components/notifications/NotificationSettings';

moment.locale('fr');

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      const user = await base44.auth.me();
      
      // Get recent messages
      const myMissions = await base44.entities.Mission.filter({
        $or: [
          { client_email: user.email },
          { intervenant_email: user.email }
        ]
      }, '-updated_date', 20);

      const allNotifications = [];

      for (const mission of myMissions) {
        // Messages notifications
        const messages = await base44.entities.Message.filter(
          { mission_id: mission.id },
          '-created_date',
          3
        );

        messages.forEach(msg => {
          if (msg.sender_email !== user.email) {
            allNotifications.push({
              id: `msg-${msg.id}`,
              type: 'message',
              title: 'Nouveau message',
              description: `${msg.sender_name}: ${msg.content.substring(0, 80)}...`,
              time: msg.created_date,
              missionId: mission.id,
              icon: MessageSquare,
              color: 'text-blue-600',
              bgColor: 'bg-blue-100'
            });
          }
        });

        // Mission acceptance notifications
        if (mission.client_email === user.email && mission.status === 'accepted' && mission.intervenant_name) {
          allNotifications.push({
            id: `accept-${mission.id}`,
            type: 'acceptance',
            title: 'Mission acceptée',
            description: `${mission.intervenant_name} a accepté votre mission au ${mission.store_name}`,
            time: mission.updated_date,
            missionId: mission.id,
            icon: CheckCircle,
            color: 'text-green-600',
            bgColor: 'bg-green-100'
          });
        }

        // New mission notifications (for intervenants)
        if (user.user_type === 'intervenant' && mission.status === 'pending') {
          allNotifications.push({
            id: `mission-${mission.id}`,
            type: 'mission',
            title: 'Nouvelle mission disponible',
            description: `${mission.store_name} - ${mission.shopping_list?.length || 0} articles`,
            time: mission.created_date,
            missionId: mission.id,
            icon: MapPin,
            color: 'text-emerald-600',
            bgColor: 'bg-emerald-100'
          });
        }
      }

      // Sort by time
      allNotifications.sort((a, b) => new Date(b.time) - new Date(a.time));
      setNotifications(allNotifications.slice(0, 20));
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAllAsRead = () => {
    setNotifications([]);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
            <p className="text-gray-600 mt-1">{notifications.length} notification(s)</p>
          </div>
          {notifications.length > 0 && (
            <Button
              variant="outline"
              onClick={markAllAsRead}
              className="flex items-center gap-2"
            >
              <Check className="w-4 h-4" />
              Tout marquer comme lu
            </Button>
          )}
        </div>

        <div className="space-y-6">
          {/* Notification Settings Card */}
          <NotificationSettings />

          {/* Notifications List */}
          <div className="space-y-3">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Récentes</h2>
            
            {notifications.length === 0 ? (
              <Card className="border-0 shadow-lg">
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <Bell className="w-10 h-10 text-gray-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Aucune notification</h3>
                  <p className="text-gray-500 text-center">
                    Vous n'avez pas encore de notifications
                  </p>
                </CardContent>
              </Card>
            ) : (
              <AnimatePresence>
                {notifications.map((notification, index) => {
                  const Icon = notification.icon;
                  return (
                    <motion.div
                      key={notification.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Card className="border-0 shadow-md hover:shadow-lg transition-shadow cursor-pointer">
                        <CardContent className="p-4">
                          <div className="flex items-start gap-4">
                            <div className={`w-12 h-12 ${notification.bgColor} rounded-xl flex items-center justify-center flex-shrink-0`}>
                              <Icon className={`w-6 h-6 ${notification.color}`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2 mb-1">
                                <h3 className="font-semibold text-gray-900">{notification.title}</h3>
                                <span className="text-xs text-gray-500 whitespace-nowrap">
                                  {moment(notification.time).fromNow()}
                                </span>
                              </div>
                              <p className="text-sm text-gray-600 line-clamp-2">
                                {notification.description}
                              </p>
                              {notification.missionId && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="mt-2 h-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                                  onClick={() => {
                                    window.location.href = `/app#/MissionDetails?id=${notification.missionId}`;
                                  }}
                                >
                                  Voir les détails →
                                </Button>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}