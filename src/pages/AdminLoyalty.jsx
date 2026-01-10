import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import {
  Star,
  Gift,
  TrendingUp,
  Users,
  Plus,
  Edit,
  Trash2,
  Award,
  DollarSign
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';

const rewardIcons = {
  discount: '💰',
  free_delivery: '🚚',
  priority: '⚡',
  exclusive: '👑'
};

export default function AdminLoyalty() {
  const [rewards, setRewards] = useState([]);
  const [users, setUsers] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingReward, setEditingReward] = useState(null);
  const [showRewardDialog, setShowRewardDialog] = useState(false);
  const { toast } = useToast();

  const [rewardForm, setRewardForm] = useState({
    name: '',
    description: '',
    points_required: 100,
    discount_amount: 5,
    reward_type: 'discount',
    is_active: true
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [rewardsData, usersData, transactionsData] = await Promise.all([
        base44.entities.LoyaltyReward.list('-points_required'),
        base44.entities.User.filter({ user_type: 'client' }),
        base44.entities.LoyaltyTransaction.list('-created_date', 100)
      ]);

      setRewards(rewardsData);
      setUsers(usersData);
      setTransactions(transactionsData);
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de charger les données",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveReward = async () => {
    try {
      if (editingReward) {
        await base44.entities.LoyaltyReward.update(editingReward.id, rewardForm);
        toast({ title: "Récompense mise à jour" });
      } else {
        await base44.entities.LoyaltyReward.create(rewardForm);
        toast({ title: "Récompense créée" });
      }
      setShowRewardDialog(false);
      setEditingReward(null);
      setRewardForm({
        name: '',
        description: '',
        points_required: 100,
        discount_amount: 5,
        reward_type: 'discount',
        is_active: true
      });
      await loadData();
    } catch (error) {
      toast({
        title: "Erreur",
        variant: "destructive"
      });
    }
  };

  const handleDeleteReward = async (rewardId) => {
    if (!confirm('Supprimer cette récompense ?')) return;
    
    try {
      await base44.entities.LoyaltyReward.delete(rewardId);
      toast({ title: "Récompense supprimée" });
      await loadData();
    } catch (error) {
      toast({
        title: "Erreur",
        variant: "destructive"
      });
    }
  };

  const handleEditReward = (reward) => {
    setEditingReward(reward);
    setRewardForm(reward);
    setShowRewardDialog(true);
  };

  const totalPoints = users.reduce((sum, u) => sum + (u.loyalty_points || 0), 0);
  const activeUsers = users.filter(u => (u.loyalty_points || 0) > 0).length;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-3xl font-bold text-gray-900 mb-8 flex items-center gap-2">
          <Gift className="w-8 h-8 text-emerald-600" />
          Gestion du Programme de Fidélité
        </h1>

        {/* Stats */}
        <div className="grid sm:grid-cols-4 gap-6 mb-6">
          <Card className="border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <Star className="w-6 h-6 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Points totaux</p>
                  <p className="text-2xl font-bold text-gray-900">{totalPoints}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Utilisateurs actifs</p>
                  <p className="text-2xl font-bold text-gray-900">{activeUsers}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                  <Gift className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Récompenses</p>
                  <p className="text-2xl font-bold text-gray-900">{rewards.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Transactions</p>
                  <p className="text-2xl font-bold text-gray-900">{transactions.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="rewards">
          <TabsList className="mb-6">
            <TabsTrigger value="rewards">Récompenses</TabsTrigger>
            <TabsTrigger value="users">Utilisateurs</TabsTrigger>
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
          </TabsList>

          {/* Rewards Tab */}
          <TabsContent value="rewards">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Récompenses disponibles</CardTitle>
                  <Dialog open={showRewardDialog} onOpenChange={setShowRewardDialog}>
                    <DialogTrigger asChild>
                      <Button
                        onClick={() => {
                          setEditingReward(null);
                          setRewardForm({
                            name: '',
                            description: '',
                            points_required: 100,
                            discount_amount: 5,
                            reward_type: 'discount',
                            is_active: true
                          });
                        }}
                        className="bg-emerald-600 hover:bg-emerald-700"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Nouvelle récompense
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>
                          {editingReward ? 'Modifier la récompense' : 'Nouvelle récompense'}
                        </DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label>Nom</Label>
                          <Input
                            value={rewardForm.name}
                            onChange={(e) => setRewardForm({ ...rewardForm, name: e.target.value })}
                            placeholder="Réduction 5€"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Description</Label>
                          <Textarea
                            value={rewardForm.description}
                            onChange={(e) => setRewardForm({ ...rewardForm, description: e.target.value })}
                            placeholder="5€ de réduction sur votre prochaine mission"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Points requis</Label>
                            <Input
                              type="number"
                              value={rewardForm.points_required}
                              onChange={(e) => setRewardForm({ ...rewardForm, points_required: parseInt(e.target.value) })}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Montant réduction (€)</Label>
                            <Input
                              type="number"
                              value={rewardForm.discount_amount}
                              onChange={(e) => setRewardForm({ ...rewardForm, discount_amount: parseFloat(e.target.value) })}
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label>Type</Label>
                          <Select
                            value={rewardForm.reward_type}
                            onValueChange={(value) => setRewardForm({ ...rewardForm, reward_type: value })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="discount">💰 Réduction</SelectItem>
                              <SelectItem value="free_delivery">🚚 Livraison gratuite</SelectItem>
                              <SelectItem value="priority">⚡ Priorité</SelectItem>
                              <SelectItem value="exclusive">👑 Avantage exclusif</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <Button onClick={handleSaveReward} className="w-full">
                          {editingReward ? 'Mettre à jour' : 'Créer'}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {rewards.map((reward) => (
                    <div
                      key={reward.id}
                      className="p-4 bg-gray-50 rounded-lg flex items-center justify-between"
                    >
                      <div className="flex items-center gap-4">
                        <div className="text-4xl">{rewardIcons[reward.reward_type]}</div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold text-gray-900">{reward.name}</h4>
                            {!reward.is_active && (
                              <Badge variant="secondary">Désactivée</Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-600">{reward.description}</p>
                          <div className="flex items-center gap-4 mt-1 text-sm">
                            <Badge className="bg-yellow-100 text-yellow-700">
                              <Star className="w-3 h-3 mr-1" />
                              {reward.points_required} points
                            </Badge>
                            {reward.discount_amount > 0 && (
                              <Badge className="bg-emerald-100 text-emerald-700">
                                -{reward.discount_amount}€
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditReward(reward)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteReward(reward.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle>Clients du programme</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {users.sort((a, b) => (b.loyalty_points || 0) - (a.loyalty_points || 0)).slice(0, 50).map((user) => (
                    <div
                      key={user.id}
                      className="p-3 bg-gray-50 rounded-lg flex items-center justify-between"
                    >
                      <div>
                        <p className="font-medium text-gray-900">{user.full_name}</p>
                        <p className="text-sm text-gray-600">{user.email}</p>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-2">
                          <Star className="w-5 h-5 text-yellow-500" />
                          <span className="text-lg font-bold text-gray-900">
                            {user.loyalty_points || 0}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500">points</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Transactions Tab */}
          <TabsContent value="transactions">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle>Historique des transactions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {transactions.map((transaction) => (
                    <div
                      key={transaction.id}
                      className="p-3 bg-gray-50 rounded-lg flex items-center justify-between"
                    >
                      <div>
                        <p className="font-medium text-gray-900">{transaction.user_email}</p>
                        <p className="text-sm text-gray-600">{transaction.description}</p>
                      </div>
                      <div className="text-right">
                        <span className={`text-lg font-bold ${
                          transaction.points > 0 ? 'text-emerald-600' : 'text-red-600'
                        }`}>
                          {transaction.points > 0 ? '+' : ''}{transaction.points}
                        </span>
                        <Badge variant="secondary" className="ml-2">
                          {transaction.transaction_type}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
}