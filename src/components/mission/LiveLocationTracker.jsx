import { useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';

// Hook to track intervenant location in real-time
export function useLiveLocationTracking(user, activeMissionId) {
  const intervalRef = useRef(null);
  const watchIdRef = useRef(null);

  useEffect(() => {
    if (!user || user.user_type !== 'intervenant' || !activeMissionId) {
      return;
    }

    // Function to update location
    const updateLocation = async (position) => {
      try {
        const { latitude, longitude, accuracy, speed, heading } = position.coords;
        
        // Update or create location record
        const existingLocations = await base44.entities.IntervenantLocation.filter({
          user_email: user.email
        });

        if (existingLocations.length > 0) {
          await base44.entities.IntervenantLocation.update(existingLocations[0].id, {
            latitude,
            longitude,
            current_mission_id: activeMissionId
          });
        } else {
          await base44.entities.IntervenantLocation.create({
            user_email: user.email,
            user_name: user.full_name,
            latitude,
            longitude,
            is_available: false,
            current_mission_id: activeMissionId
          });
        }

        // Save to location history
        await base44.entities.LocationHistory.create({
          user_email: user.email,
          mission_id: activeMissionId,
          latitude,
          longitude,
          accuracy: accuracy || 0,
          speed: speed || 0,
          heading: heading || 0
        });
      } catch (error) {
        console.error('Error updating location:', error);
      }
    };

    // Get initial position
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        updateLocation,
        (error) => console.error('Geolocation error:', error),
        { enableHighAccuracy: true }
      );

      // Watch position changes and update every 15 seconds
      let lastUpdate = Date.now();
      watchIdRef.current = navigator.geolocation.watchPosition(
        (position) => {
          const now = Date.now();
          if (now - lastUpdate >= 15000) { // 15 seconds
            updateLocation(position);
            lastUpdate = now;
          }
        },
        (error) => console.error('Geolocation watch error:', error),
        { enableHighAccuracy: true, maximumAge: 10000 }
      );

      // Also set interval as backup (every 15 seconds)
      intervalRef.current = setInterval(() => {
        navigator.geolocation.getCurrentPosition(
          updateLocation,
          (error) => console.error('Geolocation error:', error),
          { enableHighAccuracy: true }
        );
      }, 15000);
    }

    // Cleanup
    return () => {
      if (watchIdRef.current) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [user, activeMissionId]);
}

export default useLiveLocationTracking;