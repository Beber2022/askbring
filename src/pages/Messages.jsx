import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, 
  Send,
  User,
  Store
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import moment from 'moment';
import 'moment/locale/fr';

moment.locale('fr');

export default function Messages() {
  const [messages, setMessages] = useState([]);
  const [mission, setMission] = useState(null);
  const [user, setUser] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    loadData();
    // Poll for new messages every 5 seconds
    const interval = setInterval(loadMessages, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadData = async () => {
    const params = new URLSearchParams(window.location.search);
    const missionId = params.get('mission');

    try {
      const userData = await base44.auth.me();
      setUser(userData);

      if (missionId) {
        const missions = await base44.entities.Mission.filter({ id: missionId });
        if (missions.length > 0) {
          setMission(missions[0]);
        }
        await loadMessages(missionId);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (missionId) => {
    const params = new URLSearchParams(window.location.search);
    const id = missionId || params.get('mission');
    
    if (!id) return;

    try {
      const missionMessages = await base44.entities.Message.filter(
        { mission_id: id },
        'created_date'
      );
      setMessages(missionMessages);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !mission) return;

    setSending(true);
    try {
      await base44.entities.Message.create({
        mission_id: mission.id,
        sender_email: user.email,
        sender_name: user.full_name,
        content: newMessage.trim()
      });
      setNewMessage('');
      await loadMessages();
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  const isMyMessage = (message) => message.sender_email === user?.email;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm px-4 py-3 flex items-center gap-3 sticky top-0 z-10">
        <Link to={createPageUrl('MissionDetails') + `?id=${mission?.id}`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div className="flex items-center gap-3 flex-1">
          <Avatar className="w-10 h-10">
            <AvatarFallback className="bg-emerald-100 text-emerald-700">
              {user?.email === mission?.client_email 
                ? mission?.intervenant_name?.charAt(0) || 'I'
                : mission?.client_name?.charAt(0) || 'C'
              }
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-semibold text-gray-900">
              {user?.email === mission?.client_email 
                ? mission?.intervenant_name || 'Intervenant'
                : mission?.client_name || 'Client'
              }
            </p>
            <p className="text-xs text-gray-500">
              Mission: {mission?.store_name}
            </p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 px-4 py-4">
        <div className="space-y-4 max-w-2xl mx-auto">
          {/* Mission info card */}
          <Card className="border-0 shadow-sm bg-emerald-50 mb-6">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                  <Store className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">{mission?.store_name}</p>
                  <p className="text-sm text-gray-500">
                    {mission?.shopping_list?.length || 0} articles
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {messages.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Send className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-500">Aucun message</p>
              <p className="text-sm text-gray-400">Envoyez le premier message</p>
            </div>
          ) : (
            <AnimatePresence>
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${isMyMessage(message) ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[80%] ${isMyMessage(message) ? 'order-2' : 'order-1'}`}>
                    <div
                      className={`px-4 py-3 rounded-2xl ${
                        isMyMessage(message)
                          ? 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white rounded-br-md'
                          : 'bg-white shadow-sm text-gray-900 rounded-bl-md'
                      }`}
                    >
                      {!isMyMessage(message) && (
                        <p className="text-xs font-medium text-emerald-600 mb-1">
                          {message.sender_name}
                        </p>
                      )}
                      <p className="text-sm">{message.content}</p>
                    </div>
                    <p className={`text-xs text-gray-400 mt-1 ${isMyMessage(message) ? 'text-right' : 'text-left'}`}>
                      {moment(message.created_date).format('HH:mm')}
                    </p>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="bg-white border-t p-4">
        <div className="max-w-2xl mx-auto flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Écrivez votre message..."
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            className="flex-1"
          />
          <Button
            onClick={sendMessage}
            disabled={!newMessage.trim() || sending}
            className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700"
          >
            {sending ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}