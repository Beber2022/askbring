import React from 'react';
import { useNotifications } from './NotificationProvider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Bell, BellOff, CheckCircle, X } from 'lucide-react';
import { motion } from 'framer-motion';

export default function NotificationSettings() {
  const { permission, requestPermission } = useNotifications();

  const handleEnableNotifications = async () => {
    await requestPermission();
  };

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-emerald-600" />
          Notifications Push
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {permission === 'granted' ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-4 bg-emerald-50 rounded-xl border border-emerald-200"
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center flex-shrink-0">
                <CheckCircle className="w-5 h-5 text-white" />
              </div>
              <div>
                <h4 className="font-medium text-emerald-900 mb-1">Notifications activées</h4>
                <p className="text-sm text-emerald-700">
                  Vous recevrez des notifications pour:
                </p>
                <ul className="text-sm text-emerald-700 mt-2 space-y-1">
                  <li>• Nouveaux messages dans vos missions</li>
                  <li>• Nouvelles missions disponibles (intervenants)</li>
                  <li>• Missions acceptées (clients)</li>
                </ul>
              </div>
            </div>
          </motion.div>
        ) : permission === 'denied' ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-4 bg-red-50 rounded-xl border border-red-200"
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0">
                <X className="w-5 h-5 text-white" />
              </div>
              <div>
                <h4 className="font-medium text-red-900 mb-1">Notifications bloquées</h4>
                <p className="text-sm text-red-700">
                  Les notifications sont bloquées. Pour les réactiver, accédez aux paramètres de votre navigateur.
                </p>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-4 bg-gray-50 rounded-xl border border-gray-200"
          >
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center flex-shrink-0">
                <BellOff className="w-5 h-5 text-gray-600" />
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-1">Notifications désactivées</h4>
                <p className="text-sm text-gray-600">
                  Activez les notifications pour ne rien manquer des événements importants
                </p>
              </div>
            </div>
            <Button 
              onClick={handleEnableNotifications}
              className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700"
            >
              <Bell className="w-4 h-4 mr-2" />
              Activer les notifications
            </Button>
          </motion.div>
        )}

        <div className="pt-4 border-t space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label className="font-medium">Son des notifications</Label>
              <p className="text-xs text-gray-500">Émettre un son pour chaque notification</p>
            </div>
            <Switch defaultChecked />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <Label className="font-medium">Notifications de groupe</Label>
              <p className="text-xs text-gray-500">Grouper les notifications similaires</p>
            </div>
            <Switch defaultChecked />
          </div>
        </div>

        <div className="p-3 bg-blue-50 rounded-lg">
          <p className="text-xs text-blue-700">
            💡 <strong>Astuce:</strong> Les notifications apparaissent même quand l'application n'est pas ouverte
          </p>
        </div>
      </CardContent>
    </Card>
  );
}