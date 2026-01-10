import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bell, 
  MessageSquare, 
  CheckCircle, 
  MapPin,
  AlertCircle,
  Trash2,
  Package
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import moment from 'moment';
import 'moment/locale/fr';
import NotificationSettings from '@/components/notifications/NotificationSettings';

moment.locale('fr');

export default function Notifications() {
  const [user, setUser] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const { toast } = useToast();

  useEffect(() => {
    loadNotifications();
    // Refresh every 30 seconds
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadNotifications = async () => {
    try {
      const userData = await base44.auth.me();
      setUser(userData);

      // Get persistent notifications
      const dbNotifications = await base44.entities.Notification.filter(
        { user_email: userData.email },
        '-created_date',
        50
      );

      setNotifications(dbNotifications);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      await base44.entities.Notification.update(notificationId, { is_read: true });
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
      );
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id);
      for (const id of unreadIds) {
        await base44.entities.Notification.update(id, { is_read: true });
      }
      await loadNotifications();
      toast({ title: "Toutes les notifications marquées comme lues" });
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const deleteNotification = async (notificationId) => {
    try {
      await base44.entities.Notification.delete(notificationId);
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      toast({ title: "Notification supprimée" });
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'message':
        return MessageSquare;
      case 'mission_update':
        return CheckCircle;
      case 'proximity':
        return MapPin;
      case 'new_mission':
        return Package;
      case 'urgent':
        return AlertCircle;
      default:
        return Bell;
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case 'message':
        return 'text-blue-600 bg-blue-100';
      case 'mission_update':
        return 'text-emerald-600 bg-emerald-100';
      case 'proximity':
        return 'text-orange-600 bg-orange-100';
      case 'new_mission':
        return 'text-purple-600 bg-purple-100';
      case 'urgent':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const filteredNotifications = notifications.filter(n => {
    if (filter === 'all') return true;
    if (filter === 'unread') return !n.is_read;
    return n.type === filter;
  });

  const unreadCount = notifications.filter(n => !n.is_read).length;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Bell className="w-8 h-8 text-emerald-600" />
              Notifications
            </h1>
            <p className="text-gray-500 mt-1">
              {unreadCount > 0 ? `${unreadCount} non lue(s)` : 'Tout est à jour'}
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={loadNotifications} variant="outline" size="icon">
              <Bell className="w-4 h-4" />
            </Button>
            {unreadCount > 0 && (
              <Button onClick={markAllAsRead} variant="outline">
                <CheckCircle className="w-4 h-4 mr-2" />
                Tout marquer comme lu
              </Button>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('all')}
            className={filter === 'all' ? 'bg-emerald-500' : ''}
          >
            Toutes ({notifications.length})
          </Button>
          <Button
            variant={filter === 'unread' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('unread')}
            className={filter === 'unread' ? 'bg-emerald-500' : ''}
          >
            Non lues ({unreadCount})
          </Button>
          <Button
            variant={filter === 'message' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('message')}
            className={filter === 'message' ? 'bg-blue-500' : ''}
          >
            <MessageSquare className="w-3 h-3 mr-1" />
            Messages
          </Button>
          <Button
            variant={filter === 'mission_update' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('mission_update')}
            className={filter === 'mission_update' ? 'bg-emerald-500' : ''}
          >
            <CheckCircle className="w-3 h-3 mr-1" />
            Missions
          </Button>
          <Button
            variant={filter === 'proximity' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('proximity')}
            className={filter === 'proximity' ? 'bg-orange-500' : ''}
          >
            <MapPin className="w-3 h-3 mr-1" />
            Proximité
          </Button>
        </div>

        <div className="space-y-6">
          {/* Notification Settings */}
          <NotificationSettings />

          {/* Notifications List */}
          {filteredNotifications.length === 0 ? (
            <Card className="border-0 shadow-lg text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Bell className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {filter === 'all' ? 'Aucune notification' : 'Aucune notification dans cette catégorie'}
              </h3>
              <p className="text-gray-500">
                {filter === 'all' ? 'Vous êtes à jour !' : 'Changez de filtre pour voir plus'}
              </p>
            </Card>
          ) : (
            <div className="space-y-3">
              <AnimatePresence>
                {filteredNotifications.map((notification, index) => {
                  const Icon = getNotificationIcon(notification.type);
                  const colorClass = getNotificationColor(notification.type);
                  return (
                    <motion.div
                      key={notification.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -100 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Card className={`border-0 shadow-lg hover:shadow-xl transition-all ${notification.is_read ? 'opacity-60' : ''}`}>
                        <CardContent className="p-4">
                          <div className="flex items-start gap-4">
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${colorClass}`}>
                              <Icon className="w-6 h-6" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2 mb-2">
                                <div className="flex-1">
                                  <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                                    {notification.title}
                                    {!notification.is_read && (
                                      <span className="w-2 h-2 bg-emerald-500 rounded-full" />
                                    )}
                                  </h3>
                                  <p className="text-sm text-gray-600 mt-1">
                                    {notification.message}
                                  </p>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    deleteNotification(notification.id);
                                  }}
                                >
                                  <Trash2 className="w-4 h-4 text-gray-400" />
                                </Button>
                              </div>
                              <div className="flex items-center justify-between">
                                <p className="text-xs text-gray-400">
                                  {moment(notification.created_date).fromNow()}
                                </p>
                                <div className="flex gap-2">
                                  {!notification.is_read && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => markAsRead(notification.id)}
                                    >
                                      <CheckCircle className="w-3 h-3 mr-1" />
                                      Marquer comme lu
                                    </Button>
                                  )}
                                  {notification.action_url && (
                                    <Link to={createPageUrl(notification.action_url.split('?')[0]) + (notification.action_url.includes('?') ? '?' + notification.action_url.split('?')[1] : '')}>
                                      <Button size="sm" variant="outline">
                                        Voir
                                      </Button>
                                    </Link>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}