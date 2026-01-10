import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion } from 'framer-motion';
import {
  History,
  Camera,
  MapPin,
  Search,
  BarChart3,
  Navigation,
  Package,
  Zap
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const features = [
  {
    id: 1,
    title: 'Historique des missions',
    description: 'Visualisez et analysez toutes vos missions passées avec des filtres avancés, recherche, et statistiques détaillées.',
    icon: History,
    color: 'from-blue-500 to-blue-600',
    link: 'MissionHistory',
    category: 'Missions',
    details: [
      'Filtrer par statut, date, client, intervenant',
      'Recherche avancée',
      'Statistiques et analytiques',
      'Pagination',
      'Visualisation des notes et commentaires'
    ]
  },
  {
    id: 2,
    title: 'Reconnaissance de produits',
    description: 'Photographiez un produit et ajoutez-le automatiquement à votre liste de courses grâce à l\'IA.',
    icon: Camera,
    color: 'from-purple-500 to-purple-600',
    link: 'NewMission',
    category: 'Shopping',
    details: [
      'Capture photo intégrée',
      'Analyse IA automatique',
      'Identification précise des produits',
      'Gestion de quantité',
      'Ajout direct à la liste'
    ]
  },
  {
    id: 3,
    title: 'Suivi des positions en temps réel',
    description: 'Visualisez la localisation de tous vos intervenants sur une carte interactive avec détails de mission.',
    icon: MapPin,
    color: 'from-emerald-500 to-emerald-600',
    link: 'AdminIntervenantMap',
    category: 'Admin',
    details: [
      'Carte interactive Leaflet',
      'Détails mission sur la carte',
      'Markers pour adresses de livraison',
      'Filtrage par statut',
      'Information en temps réel'
    ]
  },
  {
    id: 4,
    title: 'Historique des positions',
    description: 'Consultez l\'historique complet des déplacements d\'un intervenant sur une période donnée.',
    icon: Navigation,
    color: 'from-orange-500 to-orange-600',
    link: 'AdminIntervenantMap',
    category: 'Admin',
    details: [
      'Filtrage par date',
      'Statistiques de distance',
      'Vitesse moyenne calculée',
      'Points de localisation détaillés',
      'Timeline chronologique'
    ]
  },
  {
    id: 5,
    title: 'Notifications de statut de mission',
    description: 'Recevez des notifications automatiques quand une mission démarre ou se termine.',
    icon: Zap,
    color: 'from-red-500 to-red-600',
    link: null,
    category: 'Notifications',
    details: [
      'Notifications au démarrage',
      'Notifications à la fin',
      'Notifications au statut "complété"',
      'Notifications "accepté"',
      'Notifications "en courses" et "en livraison"'
    ]
  },
  {
    id: 6,
    title: 'Recherche et filtres avancés',
    description: 'Trouvez rapidement les missions spécifiques avec une recherche multi-critères et des filtres dynamiques.',
    icon: Search,
    color: 'from-indigo-500 to-indigo-600',
    link: 'MissionHistory',
    category: 'Missions',
    details: [
      'Recherche par texte libre',
      'Filtres par statut',
      'Filtres par date',
      'Filtres par client/intervenant',
      'Filtres par note'
    ]
  }
];

export default function FeaturesHub() {
  const categories = [...new Set(features.map(f => f.category))];

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12 text-center"
        >
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent mb-3">
            Hub des Fonctionnalités
          </h1>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            Découvrez toutes les améliorations apportées à la plateforme AskBring
          </p>
        </motion.div>

        {/* Catégories */}
        {categories.map((category, catIdx) => (
          <motion.div
            key={category}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: catIdx * 0.1 }}
            className="mb-12"
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              {category}
              <span className="text-sm bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full font-medium">
                {features.filter(f => f.category === category).length}
              </span>
            </h2>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.filter(f => f.category === category).map((feature, idx) => {
                const Icon = feature.icon;
                return (
                  <motion.div
                    key={feature.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: (catIdx * 0.1) + (idx * 0.05) }}
                  >
                    <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 h-full flex flex-col">
                      <CardHeader className="pb-3">
                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-3`}>
                          <Icon className="w-6 h-6 text-white" />
                        </div>
                        <CardTitle className="text-xl text-gray-900">
                          {feature.title}
                        </CardTitle>
                        <p className="text-sm text-gray-600 mt-2">
                          {feature.description}
                        </p>
                      </CardHeader>

                      <CardContent className="flex-1 flex flex-col">
                        {/* Détails */}
                        <div className="mb-4 flex-1">
                          <p className="text-xs font-semibold text-gray-500 uppercase mb-3">Fonctionnalités:</p>
                          <ul className="space-y-2">
                            {feature.details.map((detail, i) => (
                              <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
                                <span className="text-emerald-500 mt-1">✓</span>
                                <span>{detail}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Bouton */}
                        {feature.link ? (
                          <Link to={createPageUrl(feature.link)} className="w-full">
                            <Button className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700">
                              Accéder →
                            </Button>
                          </Link>
                        ) : (
                          <div className="w-full px-4 py-2 bg-gray-100 text-gray-600 rounded-lg text-center text-sm font-medium">
                            Intégré dans l'app
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        ))}

        {/* Résumé des améliorations */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-16 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl p-8 text-white"
        >
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <BarChart3 className="w-8 h-8 mb-3" />
              <h3 className="font-bold text-lg mb-2">Analytiques Avancées</h3>
              <p className="text-emerald-50">Visualisez l'historique complet de vos missions avec statistiques détaillées</p>
            </div>
            <div>
              <Package className="w-8 h-8 mb-3" />
              <h3 className="font-bold text-lg mb-2">Gestion Optimisée</h3>
              <p className="text-emerald-50">Organisez mieux vos courses avec la reconnaissance photo de produits</p>
            </div>
            <div>
              <Navigation className="w-8 h-8 mb-3" />
              <h3 className="font-bold text-lg mb-2">Suivi en Temps Réel</h3>
              <p className="text-emerald-50">Suivez vos intervenants et consultez leur historique de déplacements</p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}