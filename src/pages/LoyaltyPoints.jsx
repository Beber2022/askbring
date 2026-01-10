import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { 
  Star, 
  Gift, 
  TrendingUp,
  Award,
  ShoppingCart,
  Check,
  Sparkles,
  Trophy
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/components/ui/use-toast';

const rewardIcons = {
  discount: Gift,
  free_delivery: ShoppingCart,
  priority: TrendingUp,
  exclusive: Trophy
};

const rewardColors = {
  discount: 'from-blue-500 to-blue-600',
  free_delivery: 'from-purple-500 to-purple-600',
  priority: 'from-orange-500 to-orange-600',
  exclusive: 'from-emerald-500 to-teal-600'
};

export default function LoyaltyPoints() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [redeeming, setRedeeming] = useState(null);
  const [rewards, setRewards] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const { toast } = useToast();

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const userData = await base44.auth.me();
      setUser(userData);
      
      // Load available rewards
      const rewardsData = await base44.entities.LoyaltyReward.filter({ is_active: true }, 'points_required');
      setRewards(rewardsData);
      
      // Load user transactions
      const transData = await base44.entities.LoyaltyTransaction.filter(
        { user_email: userData.email },
        '-created_date',
        20
      );
      setTransactions(transData);
    } catch (error) {
      console.error('Error loading user:', error);
    } finally {
      setLoading(false);
    }
  };

  const redeemReward = async (reward) => {
    if (user.loyalty_points < reward.points_required) {
      toast({
        title: "Points insuffisants",
        description: `Il vous faut ${reward.points_required} points pour cette récompense`,
        variant: "destructive"
      });
      return;
    }

    setRedeeming(reward.id);
    try {
      const newPoints = user.loyalty_points - reward.points_required;
      await base44.auth.updateMe({ loyalty_points: newPoints });
      
      // Log transaction
      await base44.entities.LoyaltyTransaction.create({
        user_email: user.email,
        points: -reward.points_required,
        description: `Échange: ${reward.name}`,
        transaction_type: 'spent'
      });
      
      setUser({ ...user, loyalty_points: newPoints });
      
      toast({
        title: "Récompense échangée !",
        description: `Vous avez reçu ${reward.name}`
      });
      
      await loadUser();
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible d'échanger cette récompense",
        variant: "destructive"
      });
    } finally {
      setRedeeming(null);
    }
  };

  const getLoyaltyTier = (points) => {
    if (points >= 500) return { name: 'Diamant', color: 'text-cyan-600', icon: '💎' };
    if (points >= 300) return { name: 'Or', color: 'text-yellow-600', icon: '🏆' };
    if (points >= 150) return { name: 'Argent', color: 'text-gray-600', icon: '🥈' };
    return { name: 'Bronze', color: 'text-orange-600', icon: '🥉' };
  };

  const tier = getLoyaltyTier(user?.total_points_earned || 0);
  const nextReward = rewards.find(r => r.points_required > (user?.loyalty_points || 0));
  const progressToNext = nextReward ? ((user?.loyalty_points || 0) / nextReward.points_required) * 100 : 100;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Sparkles className="w-8 h-8 text-emerald-600" />
            Programme de Fidélité
          </h1>
          <p className="text-gray-600 mt-1">Gagnez des points et débloquez des récompenses</p>
        </div>

        {/* Points Summary Card */}
        <Card className="border-0 shadow-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white mb-8 overflow-hidden relative">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full -ml-24 -mb-24" />
          <CardContent className="p-8 relative">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Badge className="bg-white/20 text-white border-0">
                    <span className="mr-1">{tier.icon}</span>
                    Niveau {tier.name}
                  </Badge>
                </div>
                <p className="text-white/80 text-sm mb-2">Vos points disponibles</p>
                <p className="text-5xl font-bold mb-1">{user?.loyalty_points || 0}</p>
                <p className="text-white/70 text-sm">
                  {user?.total_points_earned || 0} points gagnés au total
                </p>
              </div>
              <div className="text-center">
                <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center mb-2">
                  <ShoppingCart className="w-12 h-12 text-white" />
                </div>
                <p className="text-sm text-white/80">{user?.missions_completed || 0} missions</p>
              </div>
            </div>

            {nextReward && (
              <div className="mt-6 pt-6 border-t border-white/20">
                <div className="flex justify-between items-center mb-2">
                  <p className="text-sm text-white/90">Prochaine récompense</p>
                  <p className="text-sm font-semibold">{nextReward.points_required} points</p>
                </div>
                <Progress value={progressToNext} className="h-2 bg-white/20" />
                <p className="text-xs text-white/70 mt-2">
                  Plus que {nextReward.points_required - (user?.loyalty_points || 0)} points pour {nextReward.name}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* How it works */}
        <Card className="border-0 shadow-lg mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
              Comment gagner des points ?
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-3 gap-4">
              <div className="flex items-start gap-3 p-4 bg-emerald-50 rounded-xl">
                <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <Star className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">10 points</p>
                  <p className="text-sm text-gray-600">Par mission complétée</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-xl">
                <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <Gift className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">1 point</p>
                  <p className="text-sm text-gray-600">Par euro dépensé</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 bg-purple-50 rounded-xl">
                <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <Trophy className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">50 points</p>
                  <p className="text-sm text-gray-600">Bonus parrainage</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Rewards */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Récompenses disponibles</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {rewards.map((reward) => {
              const Icon = rewardIcons[reward.reward_type] || Gift;
              const color = rewardColors[reward.reward_type] || 'from-blue-500 to-blue-600';
              const canRedeem = (user?.loyalty_points || 0) >= reward.points_required;
              
              return (
                <motion.div
                  key={reward.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  whileHover={{ scale: 1.02 }}
                >
                  <Card className={`border-0 shadow-lg overflow-hidden ${!canRedeem && 'opacity-60'}`}>
                    <div className={`h-2 bg-gradient-to-r ${color}`} />
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className={`w-14 h-14 bg-gradient-to-br ${color} rounded-xl flex items-center justify-center`}>
                          <Icon className="w-7 h-7 text-white" />
                        </div>
                        <Badge variant={canRedeem ? "default" : "secondary"} className="bg-emerald-100 text-emerald-700">
                          {reward.points_required} pts
                        </Badge>
                      </div>
                      <h3 className="font-semibold text-gray-900 text-lg mb-2">{reward.name}</h3>
                      <p className="text-sm text-gray-600 mb-4">{reward.description}</p>
                      {reward.discount_amount > 0 && (
                        <Badge className="mb-4 bg-emerald-50 text-emerald-700">
                          -{reward.discount_amount}€
                        </Badge>
                      )}
                      <Button
                        onClick={() => redeemReward(reward)}
                        disabled={!canRedeem || redeeming === reward.id}
                        className={`w-full ${canRedeem ? `bg-gradient-to-r ${color} hover:opacity-90` : ''}`}
                      >
                        {redeeming === reward.id ? (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : canRedeem ? (
                          <>
                            <Check className="w-4 h-4 mr-2" />
                            Échanger
                          </>
                        ) : (
                          `${reward.points_required - (user?.loyalty_points || 0)} pts manquants`
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Transactions History */}
        {transactions.length > 0 && (
          <Card className="border-0 shadow-lg mb-8">
            <CardHeader>
              <CardTitle>Historique des points</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {transactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-900">{transaction.description}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(transaction.created_date).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric'
                        })}
                      </p>
                    </div>
                    <span className={`text-lg font-bold ${
                      transaction.points > 0 ? 'text-emerald-600' : 'text-red-600'
                    }`}>
                      {transaction.points > 0 ? '+' : ''}{transaction.points}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle>Votre activité</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-3 gap-6">
              <div className="text-center p-4 bg-gray-50 rounded-xl">
                <p className="text-3xl font-bold text-emerald-600">{user?.missions_completed || 0}</p>
                <p className="text-sm text-gray-600 mt-1">Missions complétées</p>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-xl">
                <p className="text-3xl font-bold text-blue-600">{user?.loyalty_points || 0}</p>
                <p className="text-sm text-gray-600 mt-1">Points disponibles</p>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-xl">
                <p className="text-3xl font-bold text-purple-600">{user?.total_points_earned || 0}</p>
                <p className="text-sm text-gray-600 mt-1">Total points gagnés</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}