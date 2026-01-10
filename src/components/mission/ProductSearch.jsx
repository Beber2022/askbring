import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Search, Plus, Loader2, ShoppingCart, Euro } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';

export default function ProductSearch({ storeName, onAddProduct }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const searchProducts = async () => {
    if (!searchQuery.trim()) return;

    setLoading(true);
    setSearched(true);
    try {
      const prompt = `Recherche les produits disponibles chez ${storeName} correspondant à "${searchQuery}". 
      Pour chaque produit trouvé, donne:
      - Le nom exact du produit
      - Le prix actuel (si disponible)
      - La marque (si applicable)
      - La taille/quantité standard
      - La disponibilité (en stock ou non)
      
      Limite la recherche à 8 produits maximum, les plus pertinents.`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            products: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  price: { type: "number" },
                  brand: { type: "string" },
                  size: { type: "string" },
                  available: { type: "boolean" }
                }
              }
            }
          }
        }
      });

      setProducts(response.products || []);
    } catch (error) {
      console.error('Error searching products:', error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddProduct = (product) => {
    onAddProduct({
      item: `${product.name}${product.brand ? ` (${product.brand})` : ''}${product.size ? ` - ${product.size}` : ''}`,
      quantity: 1,
      estimatedPrice: product.price || 0
    });
  };

  return (
    <div className="space-y-4">
      <Card className="border-2 border-emerald-200 bg-emerald-50">
        <CardContent className="p-4">
          <h3 className="text-sm font-semibold text-emerald-900 mb-3 flex items-center gap-2">
            <Search className="w-4 h-4" />
            Recherche de produits en temps réel
          </h3>
          <div className="flex gap-2">
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Rechercher chez ${storeName}...`}
              onKeyPress={(e) => e.key === 'Enter' && searchProducts()}
              className="flex-1"
            />
            <Button
              onClick={searchProducts}
              disabled={!searchQuery.trim() || loading}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Search className="w-4 h-4" />
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {loading && (
        <div className="text-center py-8">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mx-auto mb-2" />
          <p className="text-sm text-gray-600">Recherche en cours chez {storeName}...</p>
        </div>
      )}

      <AnimatePresence>
        {!loading && searched && products.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-2"
          >
            <p className="text-sm font-medium text-gray-700">
              {products.length} produit(s) trouvé(s)
            </p>
            {products.map((product, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className={`border-0 shadow-sm ${!product.available ? 'opacity-50' : ''}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <ShoppingCart className="w-4 h-4 text-gray-400" />
                          <h4 className="font-medium text-gray-900">{product.name}</h4>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                          {product.brand && (
                            <Badge variant="outline" className="text-xs">
                              {product.brand}
                            </Badge>
                          )}
                          {product.size && (
                            <span className="text-xs">{product.size}</span>
                          )}
                          {!product.available && (
                            <Badge variant="destructive" className="text-xs">
                              Rupture de stock
                            </Badge>
                          )}
                        </div>
                        {product.price > 0 && (
                          <div className="flex items-center gap-1 text-emerald-600 font-semibold">
                            <Euro className="w-4 h-4" />
                            {product.price.toFixed(2)}€
                          </div>
                        )}
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleAddProduct(product)}
                        disabled={!product.available}
                        className="bg-emerald-600 hover:bg-emerald-700"
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {!loading && searched && products.length === 0 && (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-8 text-center">
            <p className="text-gray-500">Aucun produit trouvé pour "{searchQuery}"</p>
            <p className="text-sm text-gray-400 mt-1">Essayez avec un autre terme de recherche</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}