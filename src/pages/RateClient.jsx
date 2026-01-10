import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { Star, ArrowLeft, Send, User, ThumbsUp, ThumbsDown, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useToast } from '@/components/ui/use-toast';
import { Label } from '@/components/ui/label';

export default function RateClient() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [mission, setMission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [ratings, setRatings] = useState({
    overall: 0,
    communication: 0,
    respect: 0,
    clarity: 0
  });
  const [review, setReview] = useState('');
  const [recommendation, setRecommendation] = useState(null);

  useEffect(() => {
    loadMission();
  }, []);

  const loadMission = async () => {
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

  const handleRatingChange = (category, value) => {
    setRatings({ ...ratings, [category]: value });
  };

  const handleSubmit = async () => {
    if (ratings.overall === 0) {
      toast({
        title: "Note requise",
        description: "Veuillez donner une note globale",
        variant: "destructive"
      });
      return;
    }

    setSubmitting(true);
    try {
      // Update mission with client rating
      await base44.entities.Mission.update(mission.id, {
        client_rating: ratings.overall,
        client_rating_communication: ratings.communication,
        client_rating_respect: ratings.respect,
        client_rating_clarity: ratings.clarity,
        client_review: review,
        client_recommendation: recommendation
      });

      // Update client statistics
      const clientUser = await base44.entities.User.filter({ email: mission.client_email });
      if (clientUser.length > 0) {
        const client = clientUser[0];
        const totalRatings = (client.total_client_ratings || 0) + 1;
        const currentAverage = client.average_client_rating || 0;
        const newAverage = ((currentAverage * (totalRatings - 1)) + ratings.overall) / totalRatings;

        await base44.entities.User.update(client.id, {
          average_client_rating: newAverage,
          total_client_ratings: totalRatings
        });
      }

      toast({
        title: "Merci pour votre évaluation !",
        description: "Votre avis a été enregistré"
      });

      navigate(createPageUrl('IntervenantMissions'));
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible d'enregistrer l'évaluation",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  const RatingStars = ({ category, label }) => (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => handleRatingChange(category, star)}
            className="transition-transform hover:scale-110"
          >
            <Star
              className={`w-8 h-8 ${
                star <= ratings[category]
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'text-gray-300'
              }`}
            />
          </button>
        ))}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!mission) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8 text-center">
        <p className="text-gray-500">Mission non trouvée</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Button
          variant="ghost"
          onClick={() => navigate(createPageUrl('IntervenantMissions'))}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour
        </Button>

        <h1 className="text-3xl font-bold text-gray-900 mb-2">Évaluer le client</h1>
        <p className="text-gray-600 mb-8">Partagez votre expérience avec ce client</p>

        <Card className="border-0 shadow-lg mb-6">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <Avatar className="w-16 h-16">
                <AvatarFallback className="bg-blue-100 text-blue-700 text-xl">
                  {mission.client_name?.charAt(0) || 'C'}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-semibold text-lg">{mission.client_name}</h3>
                <p className="text-gray-500">{mission.store_name}</p>
                <p className="text-sm text-gray-400">{mission.shopping_list?.length || 0} articles</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle>Votre évaluation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <RatingStars category="overall" label="Note globale *" />
            <RatingStars category="communication" label="Communication" />
            <RatingStars category="respect" label="Respect et politesse" />
            <RatingStars category="clarity" label="Clarté des instructions" />

            <div className="space-y-2">
              <Label>Votre avis (optionnel)</Label>
              <Textarea
                value={review}
                onChange={(e) => setReview(e.target.value)}
                placeholder="Partagez votre expérience avec ce client..."
                className="min-h-[100px]"
              />
            </div>

            <div className="space-y-2">
              <Label>Recommanderiez-vous ce client ?</Label>
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant={recommendation === true ? "default" : "outline"}
                  onClick={() => setRecommendation(true)}
                  className={recommendation === true ? "bg-emerald-500" : ""}
                >
                  <ThumbsUp className="w-4 h-4 mr-2" />
                  Oui
                </Button>
                <Button
                  type="button"
                  variant={recommendation === false ? "default" : "outline"}
                  onClick={() => setRecommendation(false)}
                  className={recommendation === false ? "bg-red-500" : ""}
                >
                  <ThumbsDown className="w-4 h-4 mr-2" />
                  Non
                </Button>
              </div>
            </div>

            <Button
              onClick={handleSubmit}
              disabled={submitting || ratings.overall === 0}
              className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700"
            >
              {submitting ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Envoyer l'évaluation
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}