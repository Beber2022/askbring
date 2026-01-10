import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Star, ThumbsUp, ThumbsDown, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function ClientRating({ onSubmit }) {
  const [rating, setRating] = useState({
    client_rating: 0,
    client_rating_communication: 0,
    client_rating_respect: 0,
    client_rating_clarity: 0,
    client_review: '',
    client_recommendation: null
  });

  const StarRating = ({ value, onChange, label }) => {
    return (
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">{label}</label>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <motion.button
              key={star}
              type="button"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => onChange(star)}
              className="focus:outline-none"
            >
              <Star
                className={`w-8 h-8 transition-colors ${
                  star <= value
                    ? 'fill-yellow-400 text-yellow-400'
                    : 'text-gray-300'
                }`}
              />
            </motion.button>
          ))}
        </div>
      </div>
    );
  };

  const handleSubmit = () => {
    if (rating.client_rating === 0) {
      alert('Veuillez donner une note globale');
      return;
    }
    onSubmit(rating);
  };

  const avgRating = rating.client_rating;

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Star className="w-5 h-5 text-yellow-500" />
          Noter le client
        </CardTitle>
        <p className="text-sm text-gray-600">
          Votre avis aide la communauté et encourage les bonnes interactions
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Global Rating */}
        <div className="p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl">
          <StarRating
            value={rating.client_rating}
            onChange={(val) => setRating({ ...rating, client_rating: val })}
            label="Note globale *"
          />
          {avgRating > 0 && (
            <div className="mt-3">
              <Badge className={
                avgRating >= 4 ? 'bg-green-100 text-green-700' :
                avgRating >= 3 ? 'bg-yellow-100 text-yellow-700' :
                'bg-red-100 text-red-700'
              }>
                {avgRating >= 4 ? 'Excellent client' :
                 avgRating >= 3 ? 'Bon client' :
                 'Client difficile'}
              </Badge>
            </div>
          )}
        </div>

        {/* Detailed Ratings */}
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="p-4 bg-blue-50 rounded-xl">
            <StarRating
              value={rating.client_rating_communication}
              onChange={(val) => setRating({ ...rating, client_rating_communication: val })}
              label="Communication"
            />
            <p className="text-xs text-gray-600 mt-1">
              Réactivité et clarté des messages
            </p>
          </div>

          <div className="p-4 bg-green-50 rounded-xl">
            <StarRating
              value={rating.client_rating_respect}
              onChange={(val) => setRating({ ...rating, client_rating_respect: val })}
              label="Respect"
            />
            <p className="text-xs text-gray-600 mt-1">
              Courtoisie et attitude
            </p>
          </div>

          <div className="p-4 bg-purple-50 rounded-xl sm:col-span-2">
            <StarRating
              value={rating.client_rating_clarity}
              onChange={(val) => setRating({ ...rating, client_rating_clarity: val })}
              label="Clarté des instructions"
            />
            <p className="text-xs text-gray-600 mt-1">
              Précision des demandes et informations fournies
            </p>
          </div>
        </div>

        {/* Recommendation */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
            <ThumbsUp className="w-4 h-4" />
            Recommandez-vous ce client ?
          </label>
          <div className="flex gap-3">
            <Button
              type="button"
              variant={rating.client_recommendation === true ? 'default' : 'outline'}
              className={rating.client_recommendation === true ? 'bg-green-600 hover:bg-green-700' : ''}
              onClick={() => setRating({ ...rating, client_recommendation: true })}
            >
              <ThumbsUp className="w-4 h-4 mr-2" />
              Oui, recommandé
            </Button>
            <Button
              type="button"
              variant={rating.client_recommendation === false ? 'destructive' : 'outline'}
              onClick={() => setRating({ ...rating, client_recommendation: false })}
            >
              <ThumbsDown className="w-4 h-4 mr-2" />
              Non, déconseillé
            </Button>
          </div>
        </div>

        {/* Review */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            Commentaire (optionnel)
          </label>
          <Textarea
            value={rating.client_review}
            onChange={(e) => setRating({ ...rating, client_review: e.target.value })}
            placeholder="Partagez votre expérience avec ce client..."
            className="min-h-[100px]"
          />
          <p className="text-xs text-gray-500">
            Soyez constructif - votre avis aide les autres Bringeurs et encourage de meilleures interactions
          </p>
        </div>

        {/* Submit */}
        <Button
          onClick={handleSubmit}
          className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700"
          disabled={rating.client_rating === 0}
        >
          Envoyer mon évaluation
        </Button>
      </CardContent>
    </Card>
  );
}