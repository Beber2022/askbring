import React, { useState, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { Camera, Search, Plus, X, Loader } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';

export default function ProductRecognition({ storeName, onProductAdd }) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [stream, setStream] = useState(null);
  const [recognizedProduct, setRecognizedProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const { toast } = useToast();

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (error) {
      toast({
        title: 'Erreur caméra',
        description: 'Impossible d\'accéder à la caméra',
        variant: 'destructive'
      });
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const capturePhoto = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    setLoading(true);
    try {
      const context = canvasRef.current.getContext('2d');
      canvasRef.current.width = videoRef.current.videoWidth;
      canvasRef.current.height = videoRef.current.videoHeight;
      context.drawImage(videoRef.current, 0, 0);
      
      // Convertir en blob
      canvasRef.current.toBlob(async (blob) => {
        try {
          // Upload l'image
          const file = new File([blob], 'product.jpg', { type: 'image/jpeg' });
          const { file_url } = await base44.integrations.Core.UploadFile({ file });

          // Analyser l'image avec l'IA
          const result = await base44.integrations.Core.InvokeLLM({
            prompt: `Identifie le produit visible sur cette image. Fournis:
1. Nom du produit (court et exact)
2. Catégorie (fruits, légumes, viande, produits laitiers, épices, etc.)
3. Caractéristiques principales (couleur, taille estimée, marque si visible)
4. Confiance d'identification (très haute, haute, moyenne, basse)

Réponds en JSON avec les clés: product_name, category, characteristics, confidence`,
            file_urls: [file_url],
            response_json_schema: {
              type: 'object',
              properties: {
                product_name: { type: 'string' },
                category: { type: 'string' },
                characteristics: { type: 'string' },
                confidence: { type: 'string' }
              }
            }
          });

          if (result.product_name) {
            setRecognizedProduct(result);
            stopCamera();
          } else {
            toast({
              title: 'Impossible d\'identifier',
              description: 'Le produit n\'a pas pu être identifié. Essayez une autre photo.',
              variant: 'destructive'
            });
          }
        } catch (error) {
          toast({
            title: 'Erreur',
            description: 'Impossible d\'analyser l\'image',
            variant: 'destructive'
          });
        } finally {
          setLoading(false);
        }
      }, 'image/jpeg');
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Erreur lors de la capture',
        variant: 'destructive'
      });
      setLoading(false);
    }
  };

  const handleAddProduct = () => {
    if (recognizedProduct) {
      onProductAdd({
        item: recognizedProduct.product_name,
        quantity: parseInt(quantity),
        category: recognizedProduct.category,
        characteristics: recognizedProduct.characteristics
      });
      setRecognizedProduct(null);
      setQuantity(1);
      setIsOpen(false);
      toast({
        title: '✅ Produit ajouté',
        description: `${recognizedProduct.product_name} (x${quantity}) ajouté à la liste`
      });
    }
  };

  return (
    <>
      <Button
        onClick={() => {
          setIsOpen(true);
          setTimeout(startCamera, 300);
        }}
        variant="outline"
        className="flex items-center gap-2 border-emerald-200 text-emerald-600 hover:bg-emerald-50"
      >
        <Camera className="w-4 h-4" />
        Photographier un produit
      </Button>

      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
        >
          <Card className="w-full max-w-lg border-0 shadow-xl">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle>Identifier un produit</CardTitle>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setIsOpen(false);
                  stopCamera();
                  setRecognizedProduct(null);
                }}
              >
                <X className="w-4 h-4" />
              </Button>
            </CardHeader>

            <CardContent className="space-y-4">
              {!recognizedProduct ? (
                <>
                  {/* Caméra */}
                  <div className="relative bg-black rounded-lg overflow-hidden">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      className="w-full aspect-video"
                    />
                    <canvas ref={canvasRef} className="hidden" />
                    
                    {/* Overlay avec instructions */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="border-2 border-emerald-400 rounded-lg w-48 h-48 flex items-center justify-center">
                        <Camera className="w-8 h-8 text-emerald-400 opacity-50" />
                      </div>
                    </div>

                    {/* Guide texte */}
                    <div className="absolute bottom-4 left-4 right-4 bg-black/60 text-white rounded p-2 text-xs text-center">
                      Cadrez bien le produit et prenez une photo nette
                    </div>
                  </div>

                  {/* Boutons */}
                  <div className="flex gap-3">
                    <Button
                      onClick={capturePhoto}
                      disabled={!stream || loading}
                      className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700"
                    >
                      {loading ? (
                        <>
                          <Loader className="w-4 h-4 mr-2 animate-spin" />
                          Analyse...
                        </>
                      ) : (
                        <>
                          <Camera className="w-4 h-4 mr-2" />
                          Prendre une photo
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsOpen(false);
                        stopCamera();
                      }}
                    >
                      Annuler
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  {/* Résultat reconnu */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-4"
                  >
                    <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-200 space-y-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-bold text-lg text-gray-900">
                            {recognizedProduct.product_name}
                          </h3>
                          <Badge className="mt-1">{recognizedProduct.category}</Badge>
                        </div>
                        <Badge className={
                          recognizedProduct.confidence === 'très haute' ? 'bg-green-100 text-green-700' :
                          recognizedProduct.confidence === 'haute' ? 'bg-blue-100 text-blue-700' :
                          'bg-yellow-100 text-yellow-700'
                        }>
                          {recognizedProduct.confidence}
                        </Badge>
                      </div>
                      {recognizedProduct.characteristics && (
                        <p className="text-sm text-gray-600">
                          <strong>Caractéristiques:</strong> {recognizedProduct.characteristics}
                        </p>
                      )}
                    </div>

                    {/* Quantité */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Quantité</label>
                      <div className="flex items-center gap-3">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        >
                          −
                        </Button>
                        <span className="text-lg font-bold w-8 text-center">{quantity}</span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setQuantity(quantity + 1)}
                        >
                          +
                        </Button>
                      </div>
                    </div>

                    {/* Boutons */}
                    <div className="flex gap-3 pt-4 border-t">
                      <Button
                        onClick={() => setRecognizedProduct(null)}
                        variant="outline"
                        className="flex-1"
                      >
                        Reprendre une photo
                      </Button>
                      <Button
                        onClick={handleAddProduct}
                        className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Ajouter
                      </Button>
                    </div>
                  </motion.div>
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}
    </>
  );
}