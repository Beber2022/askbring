import React from 'react';
import { motion } from 'framer-motion';
import { Clock, Zap, Heart, TrendingUp, Users, Star, Moon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

const missionTypes = [
  {
    id: 'benevole',
    name: 'Le Bénévole',
    icon: Heart,
    fee: 0,
    deliveryTime: 'Pas de limite',
    itemsRange: '5-10 articles',
    description: 'Pour les courses simples, sans urgence',
    color: 'from-gray-400 to-gray-500',
    bgColor: 'bg-gray-50',
    borderColor: 'border-gray-200',
    bringeurEarning: '0€ + points fidélité magasin',
    features: ['Livraison flexible', 'Idéal petites courses', 'Bringeur bénévole']
  },
  {
    id: 'motive',
    name: 'Le Motivé',
    icon: TrendingUp,
    fee: 1.5,
    deliveryTime: 'Sous 3h',
    itemsRange: '5-10 articles',
    description: 'Livraison dans la demi-journée',
    color: 'from-blue-400 to-blue-500',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    bringeurEarning: '1.50€ + points fidélité',
    features: ['Livraison rapide', 'Prix raisonnable', 'Service motivé']
  },
  {
    id: 'rapide',
    name: 'Le Rapide',
    icon: Zap,
    fee: 3,
    deliveryTime: 'Sous 2h',
    itemsRange: '5-10 articles',
    description: 'Service express pour vos besoins urgents',
    color: 'from-orange-400 to-orange-500',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200',
    bringeurEarning: '3€ + points fidélité',
    features: ['Priorité haute', 'Livraison garantie 2h', 'Service express'],
    popular: true
  },
  {
    id: 'urgent',
    name: "L'Urgent",
    icon: Clock,
    fee: 5,
    deliveryTime: 'Sous 1h',
    itemsRange: '10-20 articles',
    description: 'Livraison immédiate, priorité maximale',
    color: 'from-red-500 to-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    bringeurEarning: '5€ + points fidélité',
    features: ['Priorité maximale', 'Livraison immédiate', 'Course importante']
  },
  {
    id: 'groupe',
    name: 'Le Groupé',
    icon: Users,
    fee: 2,
    deliveryTime: 'Sous 4h',
    itemsRange: '5-15 articles',
    description: 'Livraison partagée, tarif réduit',
    color: 'from-green-400 to-green-500',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    bringeurEarning: '2-4€ (selon nb clients) + points',
    features: ['Tarif économique', 'Livraison groupée', 'Éco-responsable']
  },
  {
    id: 'premium',
    name: 'Le Premium',
    icon: Star,
    fee: 7,
    deliveryTime: 'Sous 1h30',
    itemsRange: 'Illimité',
    description: 'Service VIP avec Bringeur expert',
    color: 'from-purple-500 to-pink-600',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
    bringeurEarning: '7€ + bonus qualité + points',
    features: ['Bringeur 5⭐', 'Service personnalisé', 'Sans limite articles']
  },
  {
    id: 'nuit',
    name: 'Le Nuit',
    icon: Moon,
    fee: 6,
    deliveryTime: '21h-7h (sous 2h)',
    itemsRange: '5-15 articles',
    description: 'Livraison nocturne avec supplément',
    color: 'from-indigo-500 to-indigo-600',
    bgColor: 'bg-indigo-50',
    borderColor: 'border-indigo-200',
    bringeurEarning: '6€ + prime nuit + points',
    features: ['Service nocturne', 'Créneau 21h-7h', 'Supplément inclus']
  }
];

export default function MissionTypeSelector({ selected, onSelect, itemCount }) {
  const getRecommendation = () => {
    if (itemCount <= 10) return 'rapide';
    if (itemCount <= 15) return 'groupe';
    return 'premium';
  };

  const recommended = getRecommendation();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium text-gray-700">Choisissez votre type de mission</h3>
        {itemCount > 0 && (
          <Badge variant="secondary" className="text-xs">
            {itemCount} articles
          </Badge>
        )}
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {missionTypes.map((type) => {
          const Icon = type.icon;
          const isSelected = selected === type.id;
          const isRecommended = type.id === recommended && itemCount > 0;

          return (
            <motion.div
              key={type.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Card
                onClick={() => onSelect(type.id)}
                className={`relative p-4 cursor-pointer transition-all border-2 ${
                  isSelected
                    ? `${type.borderColor} shadow-lg`
                    : 'border-gray-200 hover:border-gray-300'
                } ${isSelected ? type.bgColor : 'bg-white'}`}
              >
                {type.popular && (
                  <Badge className="absolute -top-2 -right-2 bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs">
                    Populaire
                  </Badge>
                )}
                {isRecommended && !isSelected && (
                  <Badge className="absolute -top-2 -right-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-xs">
                    Recommandé
                  </Badge>
                )}

                <div className="flex items-start gap-3 mb-3">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${type.color} flex items-center justify-center flex-shrink-0`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-gray-900">{type.name}</h4>
                    <p className="text-sm text-gray-600 line-clamp-2">{type.description}</p>
                  </div>
                </div>

                <div className="space-y-2 mb-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Livraison</span>
                    <span className="font-medium text-gray-900">{type.deliveryTime}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Articles</span>
                    <span className="font-medium text-gray-900">{type.itemsRange}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Frais</span>
                    <span className={`font-bold ${type.fee === 0 ? 'text-gray-900' : 'text-emerald-600'}`}>
                      {type.fee === 0 ? 'Gratuit' : `${type.fee.toFixed(2)}€`}
                    </span>
                  </div>
                </div>

                <div className="pt-3 border-t border-gray-200">
                  <p className="text-xs text-gray-500 mb-2">Pour le Bringeur:</p>
                  <p className="text-xs font-medium text-emerald-600">{type.bringeurEarning}</p>
                </div>

                <div className="mt-3 flex flex-wrap gap-1">
                  {type.features.map((feature, idx) => (
                    <Badge key={idx} variant="outline" className="text-xs">
                      {feature}
                    </Badge>
                  ))}
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {selected && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl"
        >
          <p className="text-sm text-emerald-800">
            ✓ <strong>{missionTypes.find(t => t.id === selected)?.name}</strong> sélectionné
          </p>
        </motion.div>
      )}
    </div>
  );
}

export { missionTypes };