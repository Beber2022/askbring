import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, MessageSquare, Circle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import moment from 'moment';

export default function ChatBox({ mission, user }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const lastMessageCount = useRef(0);

  useEffect(() => {
    loadMessages();
    // Poll every 3 seconds for real-time chat experience
    const interval = setInterval(loadMessages, 3000);
    return () => clearInterval(interval);
  }, [mission?.id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadMessages = async () => {
    if (!mission?.id) return;
    try {
      const missionMessages = await base44.entities.Message.filter(
        { mission_id: mission.id },
        'created_date'
      );
      
      // Play sound if new message arrived from other person
      if (missionMessages.length > lastMessageCount.current) {
        const latestMessage = missionMessages[missionMessages.length - 1];
        if (latestMessage.sender_email !== user?.email && lastMessageCount.current > 0) {
          try {
            const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTGH0fPTgjMGHm7A7+OZSA0PVKzn77BdGAg+mtzyxHInBSl+zPLaizsIGGS57OihUBELTKXh8bllHAU2jdXzzn0vBSd7yvLaizsIGGS57OihUBELTKXh8bllHAU2jdXzzn0vBSd7yvLaizsIGGS57OihUBELTKXh8bllHAU2jdXzzn0vBSd7yvLaizsIGGS57OihUBELTKXh8bllHAU2jdXzzn0vBSd7yvLaizsIGGS57OihUBELTKXh8bllHAU2jdXzzn0vBSd7yvLaizsIGGS57OihUBELTKXh8bllHAU2jdXzzn0vBQ==');
            audio.volume = 0.3;
            audio.play().catch(() => {});
          } catch (error) {}
        }
      }
      
      lastMessageCount.current = missionMessages.length;
      setMessages(missionMessages);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    setSending(true);
    try {
      await base44.entities.Message.create({
        mission_id: mission.id,
        sender_email: user.email,
        sender_name: user.full_name,
        content: newMessage.trim()
      });
      
      // Create notification for recipient
      const recipientEmail = user.email === mission.client_email 
        ? mission.intervenant_email 
        : mission.client_email;
      
      if (recipientEmail) {
        await base44.entities.Notification.create({
          user_email: recipientEmail,
          title: 'Nouveau message',
          message: `${user.full_name}: ${newMessage.trim().substring(0, 50)}${newMessage.length > 50 ? '...' : ''}`,
          type: 'message',
          mission_id: mission.id,
          action_url: `/Messages?mission=${mission.id}`
        });
      }
      
      setNewMessage('');
      await loadMessages();
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  const isMyMessage = (message) => message.sender_email === user?.email;

  return (
    <div className="flex flex-col h-[400px] bg-gray-50 rounded-xl border border-gray-200">
      <div className="flex items-center justify-between p-3 border-b bg-white rounded-t-xl">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-emerald-600" />
          <h3 className="font-semibold text-gray-900">Discussion</h3>
        </div>
        <Badge variant="secondary" className="flex items-center gap-1">
          <Circle className="w-2 h-2 fill-emerald-500 text-emerald-500 animate-pulse" />
          En ligne
        </Badge>
      </div>

      <ScrollArea className="flex-1 p-4">
        {messages.length === 0 ? (
          <div className="text-center py-8">
            <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-2" />
            <p className="text-gray-400 text-sm">Aucun message</p>
          </div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence>
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${isMyMessage(message) ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex items-start gap-2 max-w-[80%] ${isMyMessage(message) ? 'flex-row-reverse' : 'flex-row'}`}>
                    <Avatar className="w-8 h-8 flex-shrink-0">
                      <AvatarFallback className={isMyMessage(message) ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}>
                        {message.sender_name?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className={`px-4 py-2 rounded-2xl ${
                        isMyMessage(message)
                          ? 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white rounded-br-sm'
                          : 'bg-white shadow-sm text-gray-900 rounded-bl-sm'
                      }`}>
                        <p className="text-sm">{message.content}</p>
                      </div>
                      <p className={`text-xs text-gray-400 mt-1 ${isMyMessage(message) ? 'text-right' : 'text-left'}`}>
                        {moment(message.created_date).format('HH:mm')}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            <div ref={messagesEndRef} />
          </div>
        )}
      </ScrollArea>

      <div className="p-3 border-t bg-white rounded-b-xl">
        <div className="flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Écrivez un message..."
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            className="flex-1"
          />
          <Button
            onClick={sendMessage}
            disabled={!newMessage.trim() || sending}
            className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700"
          >
            {sending ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}