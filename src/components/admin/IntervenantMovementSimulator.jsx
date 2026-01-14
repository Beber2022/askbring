import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Play, Pause, RotateCcw, MapPin, Navigation, Zap } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

export default function IntervenantMovementSimulator() {
  const [intervenants, setIntervenants] = useState([]);
  const [selectedIntervenant, setSelectedIntervenant] = useState(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [currentPosition, setCurrentPosition] = useState(null);
  const [speed, setSpeed] = useState(30); // km/h
  const [direction, setDirection] = useState(0); // degrees
  const intervalRef = useRef(null);
  const { toast } = useToast();

  useEffect(() => {
    loadIntervenants();
  }, []);

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const loadIntervenants = async () => {
    try {
      const users = await base44.entities.User.list();
      const interventants = users.filter(u => u.user_type === 'intervenant');
      setIntervenants(interventants);
    } catch (error) {
      console.error('Error loading intervenants:', error);
    }
  };

  const startSimulation = async () => {
    if (!selectedIntervenant) {
      toast({
        title: 'Erreur',
        description: 'Sélectionnez un intervenant',
        variant: 'destructive'
      });
      return;
    }

    try {
      // Get or create initial position
      const locations = await base44.entities.IntervenantLocation.filter({
        user_email: selectedIntervenant.email
      });

      let initialPos;
      if (locations.length > 0) {
        initialPos = {
          latitude: locations[0].latitude,
          longitude: locations[0].longitude
        };
      } else {
        // Default position (Paris center)
        initialPos = {
          latitude: 48.8566,
          longitude: 2.3522
        };
        await base44.entities.IntervenantLocation.create({
          user_email: selectedIntervenant.email,
          user_name: selectedIntervenant.full_name,
          latitude: initialPos.latitude,
          longitude: initialPos.longitude,
          is_available: true
        });
      }

      setCurrentPosition(initialPos);
      setIsSimulating(true);

      // Update position every 2 seconds
      intervalRef.current = setInterval(() => {
        updatePosition();
      }, 2000);

      toast({
        title: '✅ Simulation démarrée',
        description: `${selectedIntervenant.full_name} se déplace à ${speed} km/h`
      });
    } catch (error) {
      console.error('Error starting simulation:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de démarrer la simulation',
        variant: 'destructive'
      });
    }
  };

  const stopSimulation = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsSimulating(false);
    toast({
      title: '⏸️ Simulation arrêtée',
      description: 'Le déplacement a été mis en pause'
    });
  };

  const resetPosition = async () => {
    if (!selectedIntervenant) return;

    try {
      const initialPos = {
        latitude: 48.8566,
        longitude: 2.3522
      };

      const locations = await base44.entities.IntervenantLocation.filter({
        user_email: selectedIntervenant.email
      });

      if (locations.length > 0) {
        await base44.entities.IntervenantLocation.update(locations[0].id, {
          latitude: initialPos.latitude,
          longitude: initialPos.longitude
        });
      }

      setCurrentPosition(initialPos);
      setDirection(0);

      toast({
        title: '🔄 Position réinitialisée',
        description: 'Retour au point de départ'
      });
    } catch (error) {
      console.error('Error resetting position:', error);
    }
  };

  const updatePosition = async () => {
    if (!currentPosition || !selectedIntervenant) return;

    try {
      // Calculate new position based on speed and direction
      const speedMs = (speed * 1000) / 3600; // m/s
      const distanceKm = (speedMs * 2) / 1000; // distance in 2 seconds in km

      // Add some randomness to direction (±15 degrees)
      const randomTurn = (Math.random() - 0.5) * 30;
      const newDirection = (direction + randomTurn + 360) % 360;

      // Calculate new lat/lng
      const R = 6371; // Earth radius in km
      const bearing = newDirection * (Math.PI / 180);
      const lat1 = currentPosition.latitude * (Math.PI / 180);
      const lon1 = currentPosition.longitude * (Math.PI / 180);

      const lat2 = Math.asin(
        Math.sin(lat1) * Math.cos(distanceKm / R) +
        Math.cos(lat1) * Math.sin(distanceKm / R) * Math.cos(bearing)
      );

      const lon2 = lon1 + Math.atan2(
        Math.sin(bearing) * Math.sin(distanceKm / R) * Math.cos(lat1),
        Math.cos(distanceKm / R) - Math.sin(lat1) * Math.sin(lat2)
      );

      const newPosition = {
        latitude: lat2 * (180 / Math.PI),
        longitude: lon2 * (180 / Math.PI)
      };

      // Update in database
      const locations = await base44.entities.IntervenantLocation.filter({
        user_email: selectedIntervenant.email
      });

      if (locations.length > 0) {
        await base44.entities.IntervenantLocation.update(locations[0].id, {
          latitude: newPosition.latitude,
          longitude: newPosition.longitude,
          is_available: true
        });

        // Also save to history
        await base44.entities.LocationHistory.create({
          user_email: selectedIntervenant.email,
          latitude: newPosition.latitude,
          longitude: newPosition.longitude,
          accuracy: 10,
          speed: speedMs,
          heading: newDirection
        });
      }

      setCurrentPosition(newPosition);
      setDirection(newDirection);
    } catch (error) {
      console.error('Error updating position:', error);
    }
  };

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Navigation className="w-5 h-5 text-blue-600" />
          Simulateur de déplacement
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Intervenant Selection */}
        <div>
          <label className="text-sm font-medium text-gray-700 mb-2 block">
            Sélectionner un bringeur
          </label>
          <Select
            value={selectedIntervenant?.email}
            onValueChange={(email) => {
              const intervenant = intervenants.find(i => i.email === email);
              setSelectedIntervenant(intervenant);
              setIsSimulating(false);
              if (intervalRef.current) {
                clearInterval(intervalRef.current);
              }
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Choisir un intervenant..." />
            </SelectTrigger>
            <SelectContent>
              {intervenants.map((intervenant) => (
                <SelectItem key={intervenant.email} value={intervenant.email}>
                  {intervenant.full_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Speed Control */}
        <div>
          <label className="text-sm font-medium text-gray-700 mb-2 block">
            Vitesse: {speed} km/h
          </label>
          <div className="flex gap-2">
            {[10, 20, 30, 50, 80].map((s) => (
              <Button
                key={s}
                variant={speed === s ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSpeed(s)}
                disabled={isSimulating}
              >
                {s} km/h
              </Button>
            ))}
          </div>
        </div>

        {/* Current Status */}
        {currentPosition && (
          <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Position actuelle</span>
              <Badge className={isSimulating ? 'bg-green-500' : 'bg-gray-500'}>
                {isSimulating ? (
                  <>
                    <Zap className="w-3 h-3 mr-1" />
                    En mouvement
                  </>
                ) : (
                  'Arrêté'
                )}
              </Badge>
            </div>
            <div className="space-y-1 text-xs text-gray-600">
              <div className="flex items-center gap-2">
                <MapPin className="w-3 h-3" />
                <span>Lat: {currentPosition.latitude.toFixed(6)}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-3 h-3" />
                <span>Lng: {currentPosition.longitude.toFixed(6)}</span>
              </div>
              <div className="flex items-center gap-2">
                <Navigation className="w-3 h-3" style={{ transform: `rotate(${direction}deg)` }} />
                <span>Direction: {Math.round(direction)}°</span>
              </div>
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="flex gap-2">
          {!isSimulating ? (
            <Button
              onClick={startSimulation}
              disabled={!selectedIntervenant}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              <Play className="w-4 h-4 mr-2" />
              Démarrer
            </Button>
          ) : (
            <Button
              onClick={stopSimulation}
              variant="destructive"
              className="flex-1"
            >
              <Pause className="w-4 h-4 mr-2" />
              Arrêter
            </Button>
          )}
          <Button
            onClick={resetPosition}
            variant="outline"
            disabled={!selectedIntervenant || isSimulating}
          >
            <RotateCcw className="w-4 h-4" />
          </Button>
        </div>

        <p className="text-xs text-gray-500 text-center">
          La position est mise à jour toutes les 2 secondes
        </p>
      </CardContent>
    </Card>
  );
}