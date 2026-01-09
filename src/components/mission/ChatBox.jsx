import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import moment from 'moment';

export default function ChatBox({ mission, user }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    loadMessages();
    const interval = setInterval(loadMessages, 5000);
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
      <div className="flex items-center gap-2 p-3 border-b bg-white rounded-t-xl">
        <MessageSquare className="w-5 h-5 text-emerald-600" />
        <h3 className="font-semibold text-gray-900">Discussion</h3>
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