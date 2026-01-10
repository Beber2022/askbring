import { base44 } from '@/api/base44Client';

/**
 * Calcule les frais de service dynamiques basés sur plusieurs facteurs
 * @param {Object} params - Paramètres de calcul
 * @param {number} params.distance - Distance en km
 * @param {string} params.category - Catégorie de mission
 * @param {Date} params.scheduledTime - Heure planifiée (optionnel)
 * @param {number} params.estimatedBudget - Budget estimé
 * @returns {Promise<Object>} - { serviceFee, breakdown }
 */
export async function calculateDynamicPricing({
  distance = 0,
  category = 'courses_alimentaires',
  scheduledTime = null,
  estimatedBudget = 0
}) {
  // Tarif de base selon la catégorie
  const baseFees = {
    courses_alimentaires: 5,
    livraison_urgente: 10,
    taches_menageres: 8,
    bricolage: 12,
    jardinage: 10,
    autre: 7
  };
  
  let serviceFee = baseFees[category] || 5;
  const breakdown = {
    base: serviceFee,
    timeMultiplier: 1,
    distanceAdd: 0,
    demandMultiplier: 1,
    budgetPercentage: 0
  };

  // 1. Facteur temporel (heures de pointe)
  const targetTime = scheduledTime ? new Date(scheduledTime) : new Date();
  const hour = targetTime.getHours();
  const day = targetTime.getDay();
  
  // Heures de pointe (7-9h et 17-20h en semaine)
  if (day >= 1 && day <= 5) {
    if ((hour >= 7 && hour < 9) || (hour >= 17 && hour < 20)) {
      breakdown.timeMultiplier = 1.4; // +40%
    } else if (hour >= 12 && hour < 14) {
      breakdown.timeMultiplier = 1.2; // +20% (pause déjeuner)
    }
  }
  
  // Weekend (samedi/dimanche)
  if (day === 0 || day === 6) {
    breakdown.timeMultiplier = 1.3; // +30%
  }
  
  // Nuit (20h-7h)
  if (hour >= 20 || hour < 7) {
    breakdown.timeMultiplier = 1.5; // +50%
  }
  
  serviceFee *= breakdown.timeMultiplier;

  // 2. Facteur distance
  if (distance > 5) {
    breakdown.distanceAdd = (distance - 5) * 0.5; // 0.50€ par km au-delà de 5km
    serviceFee += breakdown.distanceAdd;
  }

  // 3. Facteur demande (ratio intervenants disponibles / missions pendantes)
  try {
    const [availableIntervenants, pendingMissions] = await Promise.all([
      base44.entities.IntervenantLocation.filter({ is_available: true }),
      base44.entities.Mission.filter({ status: 'pending' })
    ]);
    
    const ratio = availableIntervenants.length > 0 
      ? pendingMissions.length / availableIntervenants.length 
      : 2;
    
    // Si ratio > 1.5 (plus de missions que d'intervenants)
    if (ratio > 1.5) {
      breakdown.demandMultiplier = 1.3; // +30%
    } else if (ratio > 1) {
      breakdown.demandMultiplier = 1.15; // +15%
    } else if (ratio < 0.5) {
      breakdown.demandMultiplier = 0.9; // -10% (beaucoup d'intervenants disponibles)
    }
    
    serviceFee *= breakdown.demandMultiplier;
  } catch (error) {
    console.error('Error calculating demand:', error);
  }

  // 4. Pourcentage du budget (minimum 5%, max 15%)
  const budgetFee = Math.max(estimatedBudget * 0.05, 3);
  if (budgetFee > serviceFee) {
    breakdown.budgetPercentage = Math.min(budgetFee, estimatedBudget * 0.15);
    serviceFee = Math.max(serviceFee, breakdown.budgetPercentage);
  }

  // Arrondir à 2 décimales
  serviceFee = Math.round(serviceFee * 100) / 100;
  
  // Minimum 3€, maximum 50€
  serviceFee = Math.max(3, Math.min(50, serviceFee));

  return {
    serviceFee,
    breakdown
  };
}

/**
 * Composant pour afficher la décomposition des frais
 */
export function PricingBreakdown({ breakdown, serviceFee }) {
  const factors = [];
  
  if (breakdown.timeMultiplier > 1) {
    const increase = ((breakdown.timeMultiplier - 1) * 100).toFixed(0);
    factors.push({
      icon: '🕐',
      label: 'Heure de pointe',
      value: `+${increase}%`
    });
  } else if (breakdown.timeMultiplier < 1) {
    const decrease = ((1 - breakdown.timeMultiplier) * 100).toFixed(0);
    factors.push({
      icon: '🕐',
      label: 'Heure creuse',
      value: `-${decrease}%`
    });
  }
  
  if (breakdown.distanceAdd > 0) {
    factors.push({
      icon: '📍',
      label: 'Distance supplémentaire',
      value: `+${breakdown.distanceAdd.toFixed(2)}€`
    });
  }
  
  if (breakdown.demandMultiplier > 1) {
    const increase = ((breakdown.demandMultiplier - 1) * 100).toFixed(0);
    factors.push({
      icon: '📈',
      label: 'Forte demande',
      value: `+${increase}%`
    });
  } else if (breakdown.demandMultiplier < 1) {
    const decrease = ((1 - breakdown.demandMultiplier) * 100).toFixed(0);
    factors.push({
      icon: '📉',
      label: 'Faible demande',
      value: `-${decrease}%`
    });
  }

  if (factors.length === 0) {
    return null;
  }

  return (
    <div className="mt-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
      <p className="text-xs font-medium text-blue-900 mb-2">Tarification dynamique:</p>
      <div className="space-y-1">
        {factors.map((factor, index) => (
          <div key={index} className="flex items-center justify-between text-xs text-blue-800">
            <span className="flex items-center gap-1">
              <span>{factor.icon}</span>
              <span>{factor.label}</span>
            </span>
            <span className="font-medium">{factor.value}</span>
          </div>
        ))}
      </div>
      <div className="mt-2 pt-2 border-t border-blue-300 flex items-center justify-between">
        <span className="text-sm font-semibold text-blue-900">Total frais de service:</span>
        <span className="text-lg font-bold text-blue-900">{serviceFee.toFixed(2)}€</span>
      </div>
    </div>
  );
}