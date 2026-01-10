import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { 
  Gift, 
  Copy, 
  Check, 
  Users, 
  TrendingUp,
  Share2,
  Sparkles
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';

export default function ReferralSection({ user }) {
  const [copied, setCopied] = useState(false);
  const [referralCode, setReferralCode] = useState(user?.referral_code || '');
  const [stats, setStats] = useState({
    total: user?.total_referrals || 0,
    successful: user?.successful_referrals || 0,
    earnings: user?.referral_earnings || 0
  });
  const { toast } = useToast();

  useEffect(() => {
    generateCodeIfNeeded();
  }, []);

  const generateCodeIfNeeded = async () => {
    if (!user?.referral_code) {
      const code = generateReferralCode();
      setReferralCode(code);
      try {
        await base44.auth.updateMe({ referral_code: code });
      } catch (error) {
        console.error('Error saving referral code:', error);
      }
    }
  };

  const generateReferralCode = () => {
    const name = user?.full_name?.split(' ')[0]?.toUpperCase() || 'USER';
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${name}${random}`;
  };

  const copyToClipboard = async () => {
    const referralLink = `${window.location.origin}/#/Home?ref=${referralCode}`;
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      toast({
        title: "Lien copié !",
        description: "Le lien de parrainage a été copié dans le presse-papier"
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de copier le lien",
        variant: "destructive"
      });
    }
  };

  const shareReferral = async () => {
    const referralLink = `${window.location.origin}/#/Home?ref=${referralCode}`;
    const text = `Rejoignez AskBring avec mon code de parrainage ${referralCode} et gagnez 50 points ! ${referralLink}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Rejoignez AskBring',
          text: text,
          url: referralLink
        });
      } catch (error) {
        copyToClipboard();
      }
    } else {
      copyToClipboard();
    }
  };

  return (
    <Card className="border-0 shadow-lg overflow-hidden">
      <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-6 text-white">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
            <Gift className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-2xl font-bold">Parrainage</h3>
            <p className="text-white/90 text-sm">Invitez vos amis et gagnez ensemble</p>
          </div>
        </div>
      </div>

      <CardContent className="p-6 space-y-6">
        {/* Referral Code */}
        <div>
          <label className="text-sm font-medium text-gray-700 mb-2 block">
            Votre code de parrainage
          </label>
          <div className="flex gap-2">
            <Input
              value={referralCode}
              readOnly
              className="font-mono text-lg font-bold text-center bg-gray-50"
            />
            <Button
              onClick={copyToClipboard}
              variant="outline"
              className="flex-shrink-0"
            >
              {copied ? (
                <Check className="w-4 h-4 text-green-600" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </Button>
            <Button
              onClick={shareReferral}
              className="flex-shrink-0 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
            >
              <Share2 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* How it works */}
        <div className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border border-purple-200">
          <div className="flex items-start gap-3 mb-3">
            <Sparkles className="w-5 h-5 text-purple-600 mt-0.5" />
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Comment ça marche ?</h4>
              <ol className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="font-bold text-purple-600">1.</span>
                  <span>Partagez votre code avec vos amis</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold text-purple-600">2.</span>
                  <span>Ils s'inscrivent avec votre code et reçoivent <strong>50 points</strong></span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold text-purple-600">3.</span>
                  <span>Quand ils complètent leur première mission, vous recevez <strong>100 points</strong> !</span>
                </li>
              </ol>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="p-4 bg-blue-50 rounded-xl text-center"
          >
            <Users className="w-6 h-6 text-blue-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-blue-900">{stats.total}</p>
            <p className="text-xs text-blue-700">Filleuls</p>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.05 }}
            className="p-4 bg-green-50 rounded-xl text-center"
          >
            <TrendingUp className="w-6 h-6 text-green-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-green-900">{stats.successful}</p>
            <p className="text-xs text-green-700">Actifs</p>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.05 }}
            className="p-4 bg-purple-50 rounded-xl text-center"
          >
            <Gift className="w-6 h-6 text-purple-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-purple-900">{stats.earnings}</p>
            <p className="text-xs text-purple-700">Points gagnés</p>
          </motion.div>
        </div>

        {/* Referred by badge */}
        {user?.referred_by && (
          <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200 flex items-center gap-2">
            <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
              Parrainé
            </Badge>
            <span className="text-sm text-yellow-900">
              Vous avez été parrainé avec le code <strong>{user.referred_by}</strong>
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}