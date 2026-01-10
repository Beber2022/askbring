import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  X,
  Send,
  Loader2,
  ShoppingCart,
  HelpCircle,
  Lightbulb,
  ArrowRight,
  Calendar,
  MapPin,
  Store
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

const SYSTEM_PROMPT = `Tu es AskAI, l'assistant intelligent de la plateforme AskBring. 

AskBring permet aux clients de créer des missions (courses, livraisons, etc.) et aux Bringeurs (intervenants) de les accepter et les réaliser.

Fonctionnalités principales:
- Clients: Créer des missions, suivre en temps réel, gérer cartes fidélité, points de fidélité, adresses sauvegardées
- Bringeurs: Accepter missions, gérer tournées, gagner des points fidélité magasin
- Tarification dynamique selon heure, distance, demande
- Système de parrainage (50 pts pour filleul, bonus après 1ère mission)
- Missions récurrentes possibles

Tu dois:
1. Répondre clairement et amicalement aux questions
2. Si l'utilisateur veut créer une mission, extraire les détails (magasin, articles, adresse, horaire)
3. Donner des conseils pertinents basés sur leur historique

Réponds toujours en français, de manière concise et utile.`;

export default function AskAI({ user }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [userHistory, setUserHistory] = useState(null);
  const messagesEndRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen && !userHistory) {
      loadUserHistory();
    }
  }, [isOpen]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadUserHistory = async () => {
    try {
      const missions = await base44.entities.Mission.filter({
        $or: [
          { client_email: user.email },
          { intervenant_email: user.email }
        ]
      }, '-created_date', 10);

      const completedCount = missions.filter(m => m.status === 'completed').length;
      const totalSpent = missions
        .filter(m => m.client_email === user.email && m.total_paid)
        .reduce((sum, m) => sum + m.total_paid, 0);

      setUserHistory({
        totalMissions: missions.length,
        completedMissions: completedCount,
        totalSpent,
        recentMissions: missions.slice(0, 5),
        loyaltyPoints: user.loyalty_points || 0,
        userType: user.user_type
      });

      // Proactive suggestions on first open
      if (messages.length === 0) {
        const suggestions = generateProactiveSuggestions(missions);
        if (suggestions) {
          setMessages([{
            role: 'assistant',
            content: suggestions
          }]);
        }
      }
    } catch (error) {
      console.error('Error loading history:', error);
    }
  };

  const generateProactiveSuggestions = (missions) => {
    if (user.user_type === 'client') {
      const completedMissions = missions.filter(m => m.status === 'completed' && m.client_email === user.email);
      
      if (completedMissions.length === 0) {
        return "👋 Bienvenue ! Je suis AskAI, votre assistant personnel. Je peux vous aider à créer une mission, répondre à vos questions ou vous donner des conseils. Comment puis-je vous aider aujourd'hui ?";
      }

      const tips = [];
      
      // Check loyalty points
      if (user.loyalty_points >= 100) {
        tips.push(`💎 Vous avez ${user.loyalty_points} points de fidélité ! Vous pouvez les utiliser pour réduire les frais de votre prochaine mission.`);
      }

      // Check recurring missions
      const hasRecurring = missions.some(m => m.client_email === user.email);
      if (completedMissions.length >= 3 && !hasRecurring) {
        tips.push("🔄 Conseil: Vous commandez régulièrement ? Créez une mission récurrente pour gagner du temps !");
      }

      // Referral reminder
      if (!user.referred_by && (user.total_referrals || 0) === 0) {
        tips.push("🎁 Parrainez vos amis et gagnez 100 points pour chaque inscription + bonus après leur 1ère mission !");
      }

      if (tips.length > 0) {
        return "👋 Bonjour ! Quelques conseils pour vous :\n\n" + tips.join('\n\n') + "\n\nComment puis-je vous aider ?";
      }
    } else {
      // Tips for Bringeurs
      const acceptedMissions = missions.filter(m => m.intervenant_email === user.email);
      if (acceptedMissions.length === 0) {
        return "👋 Bienvenue ! Consultez les missions disponibles pour commencer à gagner. Je peux vous aider à comprendre comment optimiser vos tournées.";
      }
    }

    return "👋 Bonjour ! Comment puis-je vous aider aujourd'hui ?";
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);

    try {
      // Build context
      const context = userHistory ? `
Contexte utilisateur:
- Type: ${userHistory.userType === 'client' ? 'Client' : 'Bringeur'}
- Missions totales: ${userHistory.totalMissions}
- Missions complétées: ${userHistory.completedMissions}
${userHistory.userType === 'client' ? `- Total dépensé: ${userHistory.totalSpent.toFixed(2)}€` : ''}
- Points fidélité: ${userHistory.loyaltyPoints}
      `.trim() : '';

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `${SYSTEM_PROMPT}

${context}

Question de l'utilisateur: ${userMessage}

Si l'utilisateur veut créer une mission, réponds avec JSON suivant ce format EXACT:
{
  "action": "create_mission",
  "mission_data": {
    "store_name": "nom du magasin",
    "shopping_list": ["article 1", "article 2"],
    "delivery_address": "adresse si mentionnée",
    "scheduled_time": "morning/afternoon/evening ou null",
    "category": "courses_alimentaires ou autre catégorie",
    "notes": "notes spéciales si mentionnées"
  }
}

Sinon, réponds normalement en texte.`,
        response_json_schema: null
      });

      // Check if response is mission creation
      let aiResponse = response;
      let missionData = null;

      if (typeof response === 'string' && response.includes('"action"') && response.includes('create_mission')) {
        try {
          const jsonMatch = response.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            if (parsed.action === 'create_mission') {
              missionData = parsed.mission_data;
              aiResponse = "✨ J'ai compris ! Je prépare votre mission...";
            }
          }
        } catch (e) {
          // Not JSON, treat as normal response
        }
      }

      setMessages(prev => [...prev, { role: 'assistant', content: aiResponse, missionData }]);

      // Auto-navigate if mission detected
      if (missionData) {
        setTimeout(() => {
          const params = new URLSearchParams();
          if (missionData.store_name) params.append('store', missionData.store_name);
          if (missionData.delivery_address) params.append('address', missionData.delivery_address);
          if (missionData.scheduled_time) params.append('time', missionData.scheduled_time);
          if (missionData.category) params.append('category', missionData.category);
          if (missionData.shopping_list) params.append('items', JSON.stringify(missionData.shopping_list));
          if (missionData.notes) params.append('notes', missionData.notes);
          
          navigate(createPageUrl('NewMission') + '?' + params.toString());
          setIsOpen(false);
        }, 1500);
      }
    } catch (error) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: "Désolé, je rencontre un problème technique. Réessayez dans un instant."
      }]);
    } finally {
      setLoading(false);
    }
  };

  const quickActions = [
    { icon: ShoppingCart, label: "Créer une mission", prompt: "Je veux créer une mission de courses" },
    { icon: HelpCircle, label: "Comment ça marche ?", prompt: "Comment fonctionne AskBring ?" },
    { icon: Lightbulb, label: "Conseils", prompt: "Donne-moi des conseils pour optimiser mes missions" }
  ];

  return (
    <>
      {/* Floating Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            className="fixed bottom-6 right-6 z-50"
          >
            <Button
              onClick={() => setIsOpen(true)}
              size="lg"
              className="h-14 w-14 rounded-full shadow-2xl bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700"
            >
              <Sparkles className="w-6 h-6" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 right-6 z-50 w-[400px] h-[600px] max-w-[calc(100vw-2rem)] max-h-[calc(100vh-2rem)]"
          >
            <Card className="h-full flex flex-col border-2 border-purple-200 shadow-2xl bg-white overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-500 to-pink-600 text-white">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5" />
                  <div>
                    <h3 className="font-semibold">AskAI</h3>
                    <p className="text-xs opacity-90">Votre assistant intelligent</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsOpen(false)}
                  className="text-white hover:bg-white/20"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

              {/* Messages */}
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  {messages.length === 0 && (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full flex items-center justify-center">
                        <Sparkles className="w-8 h-8 text-purple-600" />
                      </div>
                      <p className="text-gray-500 text-sm mb-4">Comment puis-je vous aider ?</p>
                      <div className="grid gap-2">
                        {quickActions.map((action, idx) => (
                          <Button
                            key={idx}
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setInput(action.prompt);
                              handleSend();
                            }}
                            className="justify-start"
                          >
                            <action.icon className="w-4 h-4 mr-2" />
                            {action.label}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}

                  {messages.map((message, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[85%] rounded-2xl px-4 py-2 ${
                          message.role === 'user'
                            ? 'bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-br-md'
                            : 'bg-gray-100 text-gray-900 rounded-bl-md'
                        }`}
                      >
                        {message.role === 'assistant' && (
                          <Sparkles className="w-4 h-4 inline mr-1 opacity-70" />
                        )}
                        <p className="text-sm whitespace-pre-line">{message.content}</p>
                        
                        {message.missionData && (
                          <div className="mt-3 pt-3 border-t border-gray-200">
                            <div className="space-y-1 text-xs">
                              {message.missionData.store_name && (
                                <div className="flex items-center gap-1">
                                  <Store className="w-3 h-3" />
                                  {message.missionData.store_name}
                                </div>
                              )}
                              {message.missionData.shopping_list && (
                                <div className="flex items-center gap-1">
                                  <ShoppingCart className="w-3 h-3" />
                                  {message.missionData.shopping_list.length} articles
                                </div>
                              )}
                              {message.missionData.delivery_address && (
                                <div className="flex items-center gap-1">
                                  <MapPin className="w-3 h-3" />
                                  {message.missionData.delivery_address}
                                </div>
                              )}
                              {message.missionData.scheduled_time && (
                                <div className="flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  {message.missionData.scheduled_time}
                                </div>
                              )}
                            </div>
                            <Badge className="mt-2 bg-emerald-500">
                              <ArrowRight className="w-3 h-3 mr-1" />
                              Redirection...
                            </Badge>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}

                  {loading && (
                    <div className="flex justify-start">
                      <div className="bg-gray-100 rounded-2xl rounded-bl-md px-4 py-3">
                        <Loader2 className="w-4 h-4 animate-spin text-purple-600" />
                      </div>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              {/* Input */}
              <div className="p-4 border-t bg-gray-50">
                <div className="flex gap-2">
                  <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                    placeholder="Tapez votre message..."
                    disabled={loading}
                    className="flex-1"
                  />
                  <Button
                    onClick={handleSend}
                    disabled={!input.trim() || loading}
                    className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700"
                  >
                    {loading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}