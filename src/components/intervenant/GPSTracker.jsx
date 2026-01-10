import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';

export default function GPSTracker({ user, mission, interval = 10000 }) {
  const [tracking, setTracking] = useState(false);

  useEffect(() => {
    if (!user || !mission || !['in_progress', 'shopping', 'delivering'].includes(mission.status)) {
      setTracking(false);
      return;
    }

    setTracking(true);
    let watchId = null;
    let updateInterval = null;

    const startTracking = () => {
      if (navigator.geolocation) {
        watchId = navigator.geolocation.watchPosition(
          (position) => {
            const location = {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              accuracy: position.coords.accuracy,
              speed: position.coords.speed,
              heading: position.coords.heading
            };

            // Update location history every 10 seconds
            updateLocationHistory(location);
          },
          (error) => console.error('GPS Error:', error),
          {
            enableHighAccuracy: true,
            maximumAge: 0,
            timeout: 5000
          }
        );
      }
    };

    const updateLocationHistory = async (location) => {
      try {
        await base44.entities.LocationHistory.create({
          user_email: user.email,
          mission_id: mission.id,
          latitude: location.latitude,
          longitude: location.longitude,
          accuracy: location.accuracy,
          speed: location.speed,
          heading: location.heading
        });
      } catch (error) {
        console.error('Error logging location:', error);
      }
    };

    const updateIntervenantLocation = async (location) => {
      try {
        const existing = await base44.entities.IntervenantLocation.filter({
          user_email: user.email
        });

        if (existing.length > 0) {
          await base44.entities.IntervenantLocation.update(existing[0].id, {
            latitude: location.latitude,
            longitude: location.longitude,
            current_mission_id: mission.id
          });
        }
      } catch (error) {
        console.error('Error updating intervenant location:', error);
      }
    };

    // Update intervenant location every interval
    updateInterval = setInterval(async () => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const location = {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              accuracy: position.coords.accuracy,
              speed: position.coords.speed,
              heading: position.coords.heading
            };
            await updateIntervenantLocation(location);
          }
        );
      }
    }, interval);

    startTracking();

    return () => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
      }
      if (updateInterval) {
        clearInterval(updateInterval);
      }
    };
  }, [user, mission]);

  return null; // Silent tracker component
}