import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { 
  MapPin, 
  Clock, 
  ShoppingCart,
  Store,
  MessageSquare,
  Phone,
  CreditCard,
  FileText,
  CheckCircle,
  User,
  ArrowLeft,
  Wallet
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/components/ui/use-toast';
import MissionMap from '@/components/mission/MissionMap';
import { useLiveLocationTracking } from '@/components/mission/LiveLocationTracker';
import moment from 'moment';
import 'moment/locale/fr';

moment.locale('fr');

const statusConfig = {
  pending: { label: 'En attente', color: 'bg-yellow-100 text-yellow-700' },
  accepted: { label: 'Acceptée', color: 'bg-blue-100 text-blue-700' },
  in_progress: { label: 'En cours', color: 'bg-purple-100 text-purple-700' },
  shopping: { label: 'En courses', color: 'bg-indigo-100 text-indigo-700' },
  delivering: { label: 'En livraison', color: 'bg-emerald-100 text-emerald-700' },
  completed: { label: 'Terminée', color: 'bg-green-100 text-green-700' },
  cancelled: { label: 'Annulée', color: 'bg-red-100 text-red-700' },
};

export default function MissionDetails() {
  const [mission, setMission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [storeCard, setStoreCard] = useState(null);
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const params = new URLSearchParams(window.location.search);
    const missionId = params.get('id');

    try {
      const userData = await base44.auth.me();
      setUser(userData);

      const missions = await base44.entities.Mission.filter({ id: missionId });
      if (missions.length > 0) {
        setMission(missions[0]);
        
        // Load store card if exists
        if (missions[0].store_card_id) {
          const cards = await base44.entities.StoreCard.filter({ id: missions[0].store_card_id });
          if (cards.length > 0) {
            setStoreCard(cards[0]);
          }
        }
      }
    } catch (error) {
      console.error('Error loading mission:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleItemChecked = async (index) => {
    if (user.email !== mission.intervenant_email) return;
    
    const updatedList = mission.shopping_list.map((item, i) => 
      i === index ? { ...item, checked: !item.checked } : item
    );
    
    try {
      await base44.entities.Mission.update(mission.id, { shopping_list: updatedList });
      setMission({ ...mission, shopping_list: updatedList });
    } catch (error) {
      toast({ title: "Erreur", variant: "destructive" });
    }
  };

  const isIntervenant = user?.email === mission?.intervenant_email;
  const isClient = user?.email === mission?.client_email;

  // Track intervenant location in real-time if active mission
  const activeMissionId = isIntervenant && ['in_progress', 'shopping', 'delivering'].includes(mission?.status) 
    ? mission?.id 
    : null;
  useLiveLocationTracking(user, activeMissionId);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!mission) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 text-center">
        <p className="text-gray-500">Mission non trouvée</p>
        <Link to={createPageUrl('Home')}>
          <Button variant="outline" className="mt-4">Retour à l'accueil</Button>
        </Link>
      </div>
    );
  }

  const status = statusConfig[mission.status];
  const checkedItems = mission.shopping_list?.filter(i => i.checked).length || 0;
  const totalItems = mission.shopping_list?.length || 0;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link to={createPageUrl(isIntervenant ? 'IntervenantMissions' : 'ClientMissions')}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900">Détails de la mission</h1>
            <p className="text-gray-500 text-sm">
              Créée {moment(mission.created_date).format('DD MMM YYYY à HH:mm')}
            </p>
          </div>
          <Badge className={status.color}>{status.label}</Badge>
        </div>

        {/* Live Map for active missions */}
        {['in_progress', 'shopping', 'delivering'].includes(mission.status) && mission.intervenant_name && (
          <div className="mb-6">
            <MissionMap mission={mission} height="350px" />
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Store Info */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Store className="w-5 h-5 text-emerald-600" />
                  Magasin
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-xl flex items-center justify-center">
                    <Store className="w-8 h-8 text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 text-lg">{mission.store_name}</h3>
                    {mission.store_address && (
                      <p className="text-gray-500 text-sm">{mission.store_address}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Shopping List */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="flex items-center gap-2">
                    <ShoppingCart className="w-5 h-5 text-emerald-600" />
                    Liste de courses
                  </CardTitle>
                  <Badge variant="secondary">
                    {checkedItems}/{totalItems} complété(s)
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {mission.shopping_list?.map((item, index) => (
                    <li
                      key={index}
                      className={`flex items-center justify-between p-3 rounded-xl transition-colors ${
                        item.checked ? 'bg-emerald-50' : 'bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {isIntervenant && ['shopping', 'in_progress'].includes(mission.status) ? (
                          <Checkbox
                            checked={item.checked}
                            onCheckedChange={() => toggleItemChecked(index)}
                          />
                        ) : (
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                            item.checked ? 'bg-emerald-500' : 'bg-gray-200'
                          }`}>
                            {item.checked && <CheckCircle className="w-4 h-4 text-white" />}
                          </div>
                        )}
                        <span className={item.checked ? 'line-through text-gray-400' : 'text-gray-700'}>
                          {item.item}
                        </span>
                      </div>
                      <Badge variant="outline">x{item.quantity}</Badge>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Delivery Info */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-emerald-600" />
                  Livraison
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="p-4 bg-gray-50 rounded-xl">
                  <p className="text-gray-700">{mission.delivery_address}</p>
                </div>
                {mission.notes && (
                  <div className="mt-4 p-4 bg-yellow-50 rounded-xl border border-yellow-200">
                    <p className="text-sm font-medium text-yellow-800 mb-1">Notes:</p>
                    <p className="text-sm text-yellow-700">{mission.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Contact Card */}
            {isClient && mission.intervenant_name && (
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-lg">Votre intervenant</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-3 mb-4">
                    <Avatar className="w-12 h-12">
                      <AvatarFallback className="bg-emerald-100 text-emerald-700">
                        {mission.intervenant_name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{mission.intervenant_name}</p>
                      <p className="text-sm text-gray-500">Intervenant</p>
                    </div>
                  </div>
                  <Link to={createPageUrl('Messages') + `?mission=${mission.id}`}>
                    <Button className="w-full" variant="outline">
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Envoyer un message
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )}

            {isIntervenant && (
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-lg">Client</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-3 mb-4">
                    <Avatar className="w-12 h-12">
                      <AvatarFallback className="bg-blue-100 text-blue-700">
                        {mission.client_name?.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{mission.client_name}</p>
                      <p className="text-sm text-gray-500">Client</p>
                    </div>
                  </div>
                  <Link to={createPageUrl('Messages') + `?mission=${mission.id}`}>
                    <Button className="w-full" variant="outline">
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Envoyer un message
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )}

            {/* Store Card */}
            {storeCard && (
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <CreditCard className="w-5 h-5" />
                    Carte fidélité
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="p-4 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl text-white">
                    <p className="text-sm opacity-80">{storeCard.store_name}</p>
                    <p className="font-mono text-lg tracking-wider mt-2">
                      {storeCard.card_number}
                    </p>
                    {storeCard.barcode && (
                      <p className="text-xs mt-2 opacity-70">Code: {storeCard.barcode}</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Pricing */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Wallet className="w-5 h-5" />
                  Récapitulatif
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Budget estimé</span>
                  <span>{(mission.estimated_budget || 0).toFixed(2)}€</span>
                </div>
                {mission.actual_cost > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Coût réel</span>
                    <span>{mission.actual_cost.toFixed(2)}€</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Frais de service</span>
                  <span>{(mission.service_fee || 0).toFixed(2)}€</span>
                </div>
                {mission.tip > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Pourboire</span>
                    <span className="text-emerald-600">+{mission.tip.toFixed(2)}€</span>
                  </div>
                )}
                <div className="flex justify-between pt-3 border-t font-semibold">
                  <span>Total</span>
                  <span className="text-emerald-600">
                    {((mission.actual_cost || mission.estimated_budget || 0) + (mission.service_fee || 0) + (mission.tip || 0)).toFixed(2)}€
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Track button for active missions */}
            {['in_progress', 'shopping', 'delivering'].includes(mission.status) && (
              <Link to={createPageUrl('TrackMission') + `?id=${mission.id}`}>
                <Button className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700">
                  <MapPin className="w-4 h-4 mr-2" />
                  Suivre en temps réel
                </Button>
              </Link>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}