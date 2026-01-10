import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Clock, Navigation, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export default function AdminLocationAlerts({ alerts }) {
  const [dismissedAlerts, setDismissedAlerts] = useState([]);

  const activeAlerts = alerts.filter(a => !dismissedAlerts.includes(a.id));

  if (activeAlerts.length === 0) {
    return null;
  }

  const dismissAlert = (alertId) => {
    setDismissedAlerts([...dismissedAlerts, alertId]);
  };

  const inactivityAlerts = activeAlerts.filter(a => a.type === 'inactivity');
  const deviationAlerts = activeAlerts.filter(a => a.type === 'deviation');

  return (
    <div className="space-y-4">
      <AnimatePresence>
        {deviationAlerts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Card className="border-2 border-red-200 bg-gradient-to-r from-red-50 to-orange-50 shadow-lg">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-red-700">
                    <AlertTriangle className="w-5 h-5" />
                    Alertes Critiques ({deviationAlerts.length})
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {deviationAlerts.map((alert) => (
                  <div
                    key={alert.id}
                    className="p-4 bg-white rounded-lg border border-red-100 flex items-start justify-between gap-3"
                  >
                    <div className="flex-1 flex items-start gap-3">
                      <div className="mt-1">
                        <Navigation className="w-5 h-5 text-red-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{alert.intervenant_name}</p>
                        <p className="text-sm text-red-700 mt-1">{alert.message}</p>
                        <p className="text-xs text-gray-500 mt-2">
                          {alert.timestamp.toLocaleTimeString('fr-FR')}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => dismissAlert(alert.id)}
                      className="text-gray-400 hover:text-red-600"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {inactivityAlerts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Card className="border-2 border-yellow-200 bg-gradient-to-r from-yellow-50 to-orange-50 shadow-lg">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-yellow-700">
                  <Clock className="w-5 h-5" />
                  Alertes d'Inactivité ({inactivityAlerts.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {inactivityAlerts.map((alert) => (
                  <div
                    key={alert.id}
                    className="p-4 bg-white rounded-lg border border-yellow-100 flex items-start justify-between gap-3"
                  >
                    <div className="flex-1 flex items-start gap-3">
                      <div className="mt-1">
                        <Clock className="w-5 h-5 text-yellow-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{alert.intervenant_name}</p>
                        <p className="text-sm text-yellow-700 mt-1">{alert.message}</p>
                        <p className="text-xs text-gray-500 mt-2">
                          {alert.timestamp.toLocaleTimeString('fr-FR')}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => dismissAlert(alert.id)}
                      className="text-gray-400 hover:text-yellow-600"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}