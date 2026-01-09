import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  HelpCircle, 
  ChevronDown,
  MessageSquare,
  Mail,
  Phone
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

const faqData = [
  {
    category: 'Général',
    questions: [
      {
        q: 'Comment fonctionne AskBring ?',
        a: 'AskBring connecte les clients avec des intervenants de confiance qui effectuent leurs courses. Vous créez une mission avec votre liste de courses, un intervenant l\'accepte, fait les courses et vous les livre.'
      },
      {
        q: 'Quels sont les frais de service ?',
        a: 'Les frais de service sont de 5€ minimum ou 5% du montant des courses. Vous pouvez utiliser vos points de fidélité pour réduire ces frais.'
      },
      {
        q: 'Puis-je suivre ma commande en temps réel ?',
        a: 'Oui ! Dès qu\'un intervenant accepte votre mission, vous pouvez suivre sa position en temps réel sur la carte pendant qu\'il fait vos courses.'
      }
    ]
  },
  {
    category: 'Pour les clients',
    questions: [
      {
        q: 'Comment créer une mission ?',
        a: 'Cliquez sur "Nouvelle Mission", sélectionnez le magasin, ajoutez vos articles, indiquez votre adresse de livraison et validez. Un intervenant prendra en charge votre demande.'
      },
      {
        q: 'Puis-je utiliser ma carte de fidélité ?',
        a: 'Oui ! Ajoutez vos cartes de fidélité dans "Mes Cartes" et sélectionnez-les lors de la création d\'une mission.'
      },
      {
        q: 'Comment fonctionnent les points de fidélité ?',
        a: 'Vous gagnez 1 point par euro dépensé + 10 points par mission complétée. Échangez vos points contre des réductions sur les frais de service.'
      },
      {
        q: 'Que faire si un article est indisponible ?',
        a: 'L\'intervenant vous contactera via le chat pour proposer une alternative ou retirer l\'article de la liste.'
      }
    ]
  },
  {
    category: 'Pour les intervenants',
    questions: [
      {
        q: 'Comment devenir intervenant ?',
        a: 'Inscrivez-vous en tant qu\'intervenant, complétez votre profil et vous pourrez commencer à accepter des missions.'
      },
      {
        q: 'Comment suis-je rémunéré ?',
        a: 'Vous recevez les frais de service de chaque mission plus les pourboires éventuels. Les paiements sont effectués hebdomadairement.'
      },
      {
        q: 'Puis-je refuser une mission ?',
        a: 'Vous choisissez les missions que vous acceptez. Une fois acceptée, nous vous encourageons à la mener à terme.'
      }
    ]
  },
  {
    category: 'Paiement et sécurité',
    questions: [
      {
        q: 'Comment se fait le paiement ?',
        a: 'Le paiement est sécurisé et se fait en ligne. Le montant final est facturé après la livraison avec le coût réel des courses.'
      },
      {
        q: 'Mes données sont-elles sécurisées ?',
        a: 'Oui, toutes vos données personnelles et bancaires sont cryptées et sécurisées selon les normes européennes RGPD.'
      },
      {
        q: 'Puis-je annuler une mission ?',
        a: 'Vous pouvez annuler une mission avant qu\'elle soit acceptée. Après acceptation, contactez l\'intervenant via le chat.'
      }
    ]
  }
];

export default function FAQ() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="text-center mb-12">
          <div className="w-16 h-16 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <HelpCircle className="w-8 h-8 text-emerald-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Centre d'aide</h1>
          <p className="text-gray-600">Trouvez des réponses à vos questions</p>
        </div>

        {/* FAQ Sections */}
        <div className="space-y-6 mb-12">
          {faqData.map((section, idx) => (
            <Card key={idx} className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-emerald-600">{section.category}</CardTitle>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="w-full">
                  {section.questions.map((item, qIdx) => (
                    <AccordionItem key={qIdx} value={`item-${idx}-${qIdx}`}>
                      <AccordionTrigger className="text-left hover:text-emerald-600">
                        {item.q}
                      </AccordionTrigger>
                      <AccordionContent className="text-gray-600">
                        {item.a}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Contact Support */}
        <Card className="border-0 shadow-lg bg-gradient-to-br from-emerald-50 to-teal-50">
          <CardHeader>
            <CardTitle>Besoin d'aide supplémentaire ?</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-6">
              Notre équipe support est là pour vous aider
            </p>
            <div className="grid sm:grid-cols-3 gap-4">
              <Button variant="outline" className="flex items-center gap-2 justify-start">
                <MessageSquare className="w-4 h-4" />
                Chat en direct
              </Button>
              <Button variant="outline" className="flex items-center gap-2 justify-start">
                <Mail className="w-4 h-4" />
                support@askbring.fr
              </Button>
              <Button variant="outline" className="flex items-center gap-2 justify-start">
                <Phone className="w-4 h-4" />
                01 23 45 67 89
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}