import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Ban, Heart, Trash2, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';

export default function IntervenantPreferences() {
  const [preferences, setPreferences] = useState([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      const user = await base44.auth.me();
      const prefs = await base44.entities.IntervenantPreference.filter(
        { client_email: user.email },
        '-created_date'
      );
      setPreferences(prefs);
    } catch (error) {
      console.error('Error loading preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const removePreference = async (prefId) => {
    try {
      await base44.entities.IntervenantPreference.delete(prefId);
      setPreferences(prev => prev.filter(p => p.id !== prefId));
      toast({
        title: "Préférence supprimée",
        description: "L'intervenant a été retiré de votre liste"
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer cette préférence",
        variant: "destructive"
      });
    }
  };

  const favorites = preferences.filter(p => p.preference_type === 'favorite');
  const blocked = preferences.filter(p => p.preference_type === 'blocked');

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Mes Intervenants</h1>
        <p className="text-gray-600 mb-8">Gérez vos intervenants favoris et bloqués</p>

        <Tabs defaultValue="favorites" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="favorites" className="flex items-center gap-2">
              <Heart className="w-4 h-4" />
              Favoris ({favorites.length})
            </TabsTrigger>
            <TabsTrigger value="blocked" className="flex items-center gap-2">
              <Ban className="w-4 h-4" />
              Bloqués ({blocked.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="favorites">
            {favorites.length === 0 ? (
              <Card className="border-0 shadow-lg">
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <Heart className="w-16 h-16 text-gray-300 mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Aucun favori</h3>
                  <p className="text-gray-500 text-center">
                    Ajoutez des intervenants à vos favoris après une mission réussie
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                <AnimatePresence>
                  {favorites.map((pref) => (
                    <motion.div
                      key={pref.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -100 }}
                    >
                      <Card className="border-0 shadow-lg hover:shadow-xl transition-all">
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <Avatar className="w-16 h-16">
                                <AvatarFallback className="bg-emerald-100 text-emerald-700 text-xl">
                                  {pref.intervenant_name?.charAt(0) || 'I'}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <h3 className="font-semibold text-gray-900 text-lg">
                                  {pref.intervenant_name}
                                </h3>
                                <Badge className="bg-yellow-100 text-yellow-700 mt-1">
                                  <Star className="w-3 h-3 mr-1 fill-yellow-500" />
                                  Favori
                                </Badge>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => removePreference(pref.id)}
                              className="text-gray-400 hover:text-red-500"
                            >
                              <Trash2 className="w-5 h-5" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </TabsContent>

          <TabsContent value="blocked">
            {blocked.length === 0 ? (
              <Card className="border-0 shadow-lg">
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <Ban className="w-16 h-16 text-gray-300 mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Aucun intervenant bloqué</h3>
                  <p className="text-gray-500 text-center">
                    Vous pouvez bloquer des intervenants depuis l'évaluation de mission
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                <AnimatePresence>
                  {blocked.map((pref) => (
                    <motion.div
                      key={pref.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -100 }}
                    >
                      <Card className="border-0 shadow-lg">
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <Avatar className="w-16 h-16">
                                <AvatarFallback className="bg-red-100 text-red-700 text-xl">
                                  {pref.intervenant_name?.charAt(0) || 'I'}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <h3 className="font-semibold text-gray-900 text-lg">
                                  {pref.intervenant_name}
                                </h3>
                                <Badge className="bg-red-100 text-red-700 mt-1">
                                  <Ban className="w-3 h-3 mr-1" />
                                  Bloqué
                                </Badge>
                                {pref.reason && (
                                  <p className="text-sm text-gray-500 mt-2">
                                    Raison: {pref.reason}
                                  </p>
                                )}
                              </div>
                            </div>
                            <Button
                              variant="outline"
                              onClick={() => removePreference(pref.id)}
                            >
                              Débloquer
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
}