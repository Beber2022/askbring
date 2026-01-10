import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { 
  Star, 
  ArrowLeft,
  Send,
  CheckCircle,
  Gift,
  Heart,
  Ban,
  Clock,
  Smile,
  Award
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/components/ui/use-toast';

export default function RateMission() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [mission, setMission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [review, setReview] = useState('');
  const [tip, setTip] = useState(0);
  const [ratingPunctuality, setRatingPunctuality] = useState(0);
  const [ratingCourtesy, setRatingCourtesy] = useState(0);
  const [ratingQuality, setRatingQuality] = useState(0);
  const [addToFavorites, setAddToFavorites] = useState(false);
  const [blockIntervenant, setBlockIntervenant] = useState(false);
  const [blockReason, setBlockReason] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const params = new URLSearchParams(window.location.search);
    const missionId = params.get('id');

    try {
      const missions = await base44.entities.Mission.filter({ id: missionId });
      if (missions.length > 0) {
        setMission(missions[0]);
      }
    } catch (error) {
      console.error('Error loading mission:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (rating === 0) {
      toast({ title: "Veuillez donner une note", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    try {
      await base44.entities.Mission.update(mission.id, {
        rating,
        review,
        tip: parseFloat(tip) || 0,
        rating_punctuality: ratingPunctuality,
        rating_courtesy: ratingCourtesy,
        rating_quality: ratingQuality
      });

      // Award loyalty points to client
      const user = await base44.auth.me();
      const totalAmount = (mission.actual_cost || mission.estimated_budget || 0) + (mission.service_fee || 0);
      const pointsEarned = Math.floor(totalAmount) + 10; // 1 point per euro + 10 bonus per mission
      
      // Check if this is the first completed mission and user was referred
      let bonusPoints = 0;
      if (user.referred_by && !user.referral_reward_claimed) {
        bonusPoints = 100; // Bonus for referrer
        await base44.auth.updateMe({ referral_reward_claimed: true });
        
        // Find and reward the referrer
        const referrers = await base44.entities.User.filter({ referral_code: user.referred_by });
        if (referrers.length > 0) {
          const referrer = referrers[0];
          await base44.entities.User.update(referrer.id, {
            loyalty_points: (referrer.loyalty_points || 0) + 100,
            successful_referrals: (referrer.successful_referrals || 0) + 1,
            referral_earnings: (referrer.referral_earnings || 0) + 100
          });
        }
      }
      
      await base44.auth.updateMe({
        loyalty_points: (user.loyalty_points || 0) + pointsEarned,
        total_points_earned: (user.total_points_earned || 0) + pointsEarned,
        missions_completed: (user.missions_completed || 0) + 1
      });

      // Handle favorites/block
      if (mission.intervenant_email) {
        const user = await base44.auth.me();
        
        // Check if preference already exists
        const existingPrefs = await base44.entities.IntervenantPreference.filter({
          client_email: user.email,
          intervenant_email: mission.intervenant_email
        });

        if (addToFavorites && existingPrefs.length === 0) {
          await base44.entities.IntervenantPreference.create({
            client_email: user.email,
            intervenant_email: mission.intervenant_email,
            intervenant_name: mission.intervenant_name,
            preference_type: 'favorite'
          });
        } else if (blockIntervenant) {
          // Remove from favorites if exists
          if (existingPrefs.length > 0) {
            for (const pref of existingPrefs) {
              await base44.entities.IntervenantPreference.delete(pref.id);
            }
          }
          // Add to blocked
          await base44.entities.IntervenantPreference.create({
            client_email: user.email,
            intervenant_email: mission.intervenant_email,
            intervenant_name: mission.intervenant_name,
            preference_type: 'blocked',
            reason: blockReason
          });
        }
      }

      // Update intervenant stats
      if (mission.intervenant_email) {
        const users = await base44.entities.User.filter({ email: mission.intervenant_email });
        if (users.length > 0) {
          const intervenant = users[0];
          const newTotalMissions = (intervenant.total_missions || 0) + 1;
          const currentAvg = intervenant.average_rating || 0;
          const newAvg = ((currentAvg * (intervenant.total_missions || 0)) + rating) / newTotalMissions;
          
          await base44.entities.User.update(intervenant.id, {
            average_rating: newAvg,
            total_missions: newTotalMissions,
            total_earnings: (intervenant.total_earnings || 0) + (mission.service_fee || 0) + (parseFloat(tip) || 0)
          });
        }
      }

      toast({ 
        title: "Merci pour votre évaluation !",
        description: `+${pointsEarned} points de fidélité gagnés ! 🎉`
      });
      navigate(createPageUrl('ClientMissions'));
    } catch (error) {
      toast({ title: "Erreur", description: "Impossible d'envoyer l'évaluation", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

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
      </div>
    );
  }

  const tipPresets = [0, 2, 5, 10];

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link to={createPageUrl('ClientMissions')}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Évaluer la mission</h1>
            <p className="text-gray-500 text-sm">{mission.store_name}</p>
          </div>
        </div>

        {/* Intervenant Card */}
        <Card className="border-0 shadow-lg mb-6">
          <CardContent className="p-6 text-center">
            <Avatar className="w-20 h-20 mx-auto mb-4">
              <AvatarFallback className="bg-emerald-100 text-emerald-700 text-2xl">
                {mission.intervenant_name?.charAt(0) || 'I'}
              </AvatarFallback>
            </Avatar>
            <h3 className="font-semibold text-gray-900 text-lg">{mission.intervenant_name}</h3>
            <p className="text-sm text-gray-500">Votre intervenant</p>

            <div className="flex items-center justify-center gap-2 mt-4 p-3 bg-emerald-50 rounded-xl">
              <CheckCircle className="w-5 h-5 text-emerald-600" />
              <span className="text-emerald-700 font-medium">Mission terminée avec succès</span>
            </div>
          </CardContent>
        </Card>

        {/* Rating Card */}
        <Card className="border-0 shadow-lg mb-6">
          <CardHeader>
            <CardTitle className="text-center">Comment était votre expérience ?</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <div className="flex justify-center gap-2 mb-4">
              {[1, 2, 3, 4, 5].map((star) => (
                <motion.button
                  key={star}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  className="focus:outline-none"
                >
                  <Star
                    className={`w-10 h-10 transition-colors ${
                      star <= (hoveredRating || rating)
                        ? 'text-yellow-400 fill-yellow-400'
                        : 'text-gray-300'
                    }`}
                  />
                </motion.button>
              ))}
            </div>
            <p className="text-gray-500 text-sm">
              {rating === 0 && 'Touchez pour noter'}
              {rating === 1 && 'Très mauvais'}
              {rating === 2 && 'Mauvais'}
              {rating === 3 && 'Correct'}
              {rating === 4 && 'Bien'}
              {rating === 5 && 'Excellent !'}
            </p>
          </CardContent>
        </Card>

        {/* Detailed Ratings */}
        <Card className="border-0 shadow-lg mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Évaluation détaillée</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Punctuality */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-5 h-5 text-emerald-600" />
                <Label>Ponctualité</Label>
              </div>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setRatingPunctuality(star)}
                    className="focus:outline-none"
                  >
                    <Star
                      className={`w-8 h-8 transition-colors ${
                        star <= ratingPunctuality
                          ? 'text-yellow-400 fill-yellow-400'
                          : 'text-gray-300'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Courtesy */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Smile className="w-5 h-5 text-emerald-600" />
                <Label>Courtoisie</Label>
              </div>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setRatingCourtesy(star)}
                    className="focus:outline-none"
                  >
                    <Star
                      className={`w-8 h-8 transition-colors ${
                        star <= ratingCourtesy
                          ? 'text-yellow-400 fill-yellow-400'
                          : 'text-gray-300'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Quality */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Award className="w-5 h-5 text-emerald-600" />
                <Label>Qualité du travail</Label>
              </div>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setRatingQuality(star)}
                    className="focus:outline-none"
                  >
                    <Star
                      className={`w-8 h-8 transition-colors ${
                        star <= ratingQuality
                          ? 'text-yellow-400 fill-yellow-400'
                          : 'text-gray-300'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Review */}
        <Card className="border-0 shadow-lg mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Laissez un commentaire (optionnel)</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={review}
              onChange={(e) => setReview(e.target.value)}
              placeholder="Partagez votre expérience..."
              className="min-h-[100px]"
            />
          </CardContent>
        </Card>

        {/* Preferences */}
        <Card className="border-0 shadow-lg mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Préférences</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="favorite"
                checked={addToFavorites}
                onCheckedChange={setAddToFavorites}
              />
              <label
                htmlFor="favorite"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-2"
              >
                <Heart className="w-4 h-4 text-red-500" />
                Ajouter aux favoris
              </label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="block"
                checked={blockIntervenant}
                onCheckedChange={setBlockIntervenant}
              />
              <label
                htmlFor="block"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-2"
              >
                <Ban className="w-4 h-4 text-red-500" />
                Bloquer cet intervenant
              </label>
            </div>

            {blockIntervenant && (
              <Input
                value={blockReason}
                onChange={(e) => setBlockReason(e.target.value)}
                placeholder="Raison du blocage (optionnel)"
                className="mt-2"
              />
            )}
          </CardContent>
        </Card>

        {/* Tip */}
        <Card className="border-0 shadow-lg mb-8">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Gift className="w-5 h-5 text-emerald-600" />
              Ajouter un pourboire (optionnel)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-2 mb-4">
              {tipPresets.map((preset) => (
                <Button
                  key={preset}
                  variant={tip === preset ? 'default' : 'outline'}
                  onClick={() => setTip(preset)}
                  className={tip === preset ? 'bg-emerald-500 hover:bg-emerald-600' : ''}
                >
                  {preset === 0 ? 'Non' : `${preset}€`}
                </Button>
              ))}
            </div>
            <div className="space-y-2">
              <Label>Ou montant personnalisé</Label>
              <Input
                type="number"
                value={tip}
                onChange={(e) => setTip(e.target.value)}
                placeholder="0"
                min={0}
                className="text-center text-lg"
              />
            </div>
          </CardContent>
        </Card>

        {/* Submit Button */}
        <Button
          onClick={handleSubmit}
          disabled={submitting || rating === 0}
          className="w-full h-14 text-lg bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700"
        >
          {submitting ? (
            <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <Send className="w-5 h-5 mr-2" />
              Envoyer l'évaluation
            </>
          )}
        </Button>
      </motion.div>
    </div>
  );
}