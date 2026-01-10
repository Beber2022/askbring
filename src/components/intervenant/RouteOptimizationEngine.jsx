// Algorithme d'optimisation de tournée avec prise en compte du trafic
export class RouteOptimizationEngine {
  constructor(missions, currentLocation) {
    this.missions = missions;
    this.currentLocation = currentLocation;
  }

  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  // Facteur de trafic basé sur l'heure de la journée
  getTrafficFactor(time = new Date()) {
    const hour = time.getHours();
    // Peak hours: 8-10, 12-13, 17-19
    if ((hour >= 8 && hour <= 10) || (hour >= 12 && hour <= 13) || (hour >= 17 && hour <= 19)) {
      return 1.5; // 50% slower
    }
    // Moderate traffic: 10-12, 13-17, 19-21
    if ((hour >= 10 && hour <= 12) || (hour >= 13 && hour <= 17) || (hour >= 19 && hour <= 21)) {
      return 1.2; // 20% slower
    }
    // Light traffic: night and early morning
    return 0.9; // 10% faster
  }

  // Calcul du temps de trajet avec facteur de trafic
  calculateTravelTime(distance, time = new Date()) {
    const baseSpeed = 18; // km/h
    const trafficFactor = this.getTrafficFactor(time);
    const adjustedSpeed = baseSpeed / trafficFactor;
    const hours = distance / adjustedSpeed;
    return Math.round(hours * 60); // en minutes
  }

  // Estimation du temps d'exécution pour une mission
  getMissionExecutionTime(mission) {
    // Temps de base selon le nombre d'articles
    const baseTime = Math.max(10, Math.min(30, (mission.shopping_list?.length || 1) * 2));
    return baseTime;
  }

  // Score de priorité d'une mission
  getPriority(mission) {
    let priority = 0;

    // Priorité au statut
    if (mission.status === 'in_progress') priority += 100;
    if (mission.status === 'shopping') priority += 80;
    if (mission.status === 'accepted') priority += 50;

    // Priorité au créneau horaire
    if (mission.scheduled_time === 'morning') priority += 40;
    if (mission.scheduled_time === 'afternoon') priority += 25;
    if (mission.scheduled_time === 'evening') priority += 10;

    // Priorité au budget
    priority += (mission.estimated_budget || 0) * 0.2;

    // Priorité à la complexité (articles)
    priority += (mission.shopping_list?.length || 0) * 2;

    return priority;
  }

  // Algorithme de clustering géographique
  clusterMissions(clusterSize = 3) {
    const validMissions = this.missions.filter(m => m.delivery_lat && m.delivery_lng);
    if (validMissions.length === 0) return [];

    const clusters = [];
    const used = new Set();

    // Pour chaque mission non utilisée
    for (let i = 0; i < validMissions.length; i++) {
      if (used.has(i)) continue;

      const cluster = [validMissions[i]];
      used.add(i);

      // Trouver les missions les plus proches
      const distances = validMissions.map((m, idx) => {
        if (used.has(idx)) return Infinity;
        return {
          idx,
          distance: this.calculateDistance(
            validMissions[i].delivery_lat,
            validMissions[i].delivery_lng,
            m.delivery_lat,
            m.delivery_lng
          )
        };
      });

      // Ajouter les N missions les plus proches au cluster
      distances
        .sort((a, b) => a.distance - b.distance)
        .slice(0, clusterSize - 1)
        .forEach(item => {
          cluster.push(validMissions[item.idx]);
          used.add(item.idx);
        });

      clusters.push(cluster);
    }

    return clusters;
  }

  // Optimisation par cluster avec nearest neighbor
  optimizeCluster(cluster) {
    if (cluster.length === 0) return [];
    if (cluster.length === 1) return cluster;

    const route = [];
    const remaining = [...cluster];
    let current = this.currentLocation;
    let currentTime = new Date();

    while (remaining.length > 0) {
      let bestIndex = 0;
      let bestScore = -Infinity;

      remaining.forEach((mission, index) => {
        const distance = this.calculateDistance(
          current.latitude || current.lat,
          current.longitude || current.lng,
          mission.delivery_lat,
          mission.delivery_lng
        );

        const travelTime = this.calculateTravelTime(distance, currentTime);
        const executionTime = this.getMissionExecutionTime(mission);
        const totalTime = travelTime + executionTime;
        const priority = this.getPriority(mission);

        // Score = priorité - temps total pondéré
        const score = priority - (totalTime * 0.5);

        if (score > bestScore) {
          bestScore = score;
          bestIndex = index;
        }
      });

      const selected = remaining[bestIndex];
      route.push({
        ...selected,
        distanceFromPrevious: this.calculateDistance(
          current.latitude || current.lat,
          current.longitude || current.lng,
          selected.delivery_lat,
          selected.delivery_lng
        ),
        travelTime: this.calculateTravelTime(
          this.calculateDistance(
            current.latitude || current.lat,
            current.longitude || current.lng,
            selected.delivery_lat,
            selected.delivery_lng
          ),
          currentTime
        ),
        executionTime: this.getMissionExecutionTime(selected)
      });

      // Mettre à jour le temps actuel
      currentTime = new Date(currentTime.getTime() + (route[route.length - 1].travelTime + route[route.length - 1].executionTime) * 60000);

      current = {
        latitude: selected.delivery_lat,
        longitude: selected.delivery_lng
      };

      remaining.splice(bestIndex, 1);
    }

    return route;
  }

  // Optimisation complète
  optimize() {
    if (this.missions.length === 0) return { route: [], stats: {} };

    // Clustering
    const clusters = this.clusterMissions(Math.ceil(this.missions.length / 2));

    // Optimiser chaque cluster
    const optimizedClusters = clusters.map(cluster => this.optimizeCluster(cluster));

    // Fusionner les clusters dans un ordre optimal
    const finalRoute = [];
    let totalDistance = 0;
    let totalTime = 0;

    optimizedClusters.forEach(cluster => {
      cluster.forEach(mission => {
        finalRoute.push(mission);
        totalDistance += mission.distanceFromPrevious || 0;
        totalTime += (mission.travelTime || 0) + (mission.executionTime || 0);
      });
    });

    return {
      route: finalRoute,
      stats: {
        totalDistance: totalDistance.toFixed(2),
        totalTime: totalTime,
        estimatedCompletion: new Date(Date.now() + totalTime * 60000).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        averageTimePerMission: Math.round(totalTime / finalRoute.length),
        trafficFactor: this.getTrafficFactor()
      }
    };
  }
}