import React, { useState, useEffect } from 'react';
import { Plus, Trash2, ShoppingBag, ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import ProductSearch from './ProductSearch';
import ProductRecognition from './ProductRecognition';

export default function ShoppingListEditor({ items, onChange, storeName }) {
  const [newItem, setNewItem] = useState('');
  const [newQuantity, setNewQuantity] = useState(1);
  const [itemImages, setItemImages] = useState({});

  useEffect(() => {
    // Generate images for new items
    items.forEach((item, index) => {
      if (!itemImages[index] && item.item) {
        generateImage(item.item, index);
      }
    });
  }, [items]);

  const generateImage = async (itemName, index) => {
    try {
      const prompt = `Photo de produit alimentaire en haute qualité: ${itemName}. Vue de face, fond blanc, style catalogue supermarché.`;
      const { url } = await base44.integrations.Core.GenerateImage({ prompt });
      setItemImages(prev => ({ ...prev, [index]: url }));
    } catch (error) {
      console.error('Error generating image:', error);
    }
  };

  const addItem = () => {
    if (!newItem.trim()) return;
    const updatedItems = [
      ...items,
      { item: newItem.trim(), quantity: newQuantity, checked: false }
    ];
    onChange(updatedItems);
    setNewItem('');
    setNewQuantity(1);
  };

  const addProductFromSearch = (product) => {
    const updatedItems = [
      ...items,
      { item: product.item, quantity: product.quantity, checked: false }
    ];
    onChange(updatedItems);
  };

  const addProductFromPhoto = (product) => {
    const updatedItems = [
      ...items,
      { item: product.item, quantity: product.quantity, checked: false }
    ];
    onChange(updatedItems);
  };

  const removeItem = (index) => {
    const updatedItems = items.filter((_, i) => i !== index);
    onChange(updatedItems);
  };

  const updateQuantity = (index, quantity) => {
    const updatedItems = items.map((item, i) =>
      i === index ? { ...item, quantity: parseInt(quantity) || 1 } : item
    );
    onChange(updatedItems);
  };

  return (
    <div className="space-y-4">
      {/* Product Search and Recognition */}
      {storeName && (
        <div className="flex gap-2">
          <div className="flex-1">
            <ProductSearch 
              storeName={storeName} 
              onAddProduct={addProductFromSearch}
            />
          </div>
          <ProductRecognition 
            storeName={storeName}
            onProductAdd={addProductFromPhoto}
          />
        </div>
      )}

      {/* Add item form */}
      <div className="flex gap-2">
        <div className="flex-1">
          <Input
            value={newItem}
            onChange={(e) => setNewItem(e.target.value)}
            placeholder="Ou ajouter manuellement un article..."
            onKeyPress={(e) => e.key === 'Enter' && addItem()}
            className="h-12"
          />
        </div>
        <Input
          type="number"
          value={newQuantity}
          onChange={(e) => setNewQuantity(parseInt(e.target.value) || 1)}
          min={1}
          className="w-20 h-12 text-center"
        />
        <Button 
          onClick={addItem}
          className="h-12 px-4 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700"
        >
          <Plus className="w-5 h-5" />
        </Button>
      </div>

      {/* Items list */}
      <Card className="border-0 shadow-md">
        <CardContent className="p-4">
          {items.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <ShoppingBag className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Aucun article dans la liste</p>
              <p className="text-sm">Commencez à ajouter des articles</p>
            </div>
          ) : (
            <AnimatePresence>
              <ul className="space-y-2">
                {items.map((item, index) => (
                  <motion.li
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      {itemImages[index] ? (
                        <img 
                          src={itemImages[index]} 
                          alt={item.item}
                          className="w-12 h-12 object-cover rounded-lg border border-gray-200"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                          <ImageIcon className="w-5 h-5 text-gray-400 animate-pulse" />
                        </div>
                      )}
                      <div className="flex-1">
                        <p className="text-gray-700 font-medium">{item.item}</p>
                        <p className="text-xs text-gray-500">{item.quantity} unité{item.quantity > 1 ? 's' : ''}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => updateQuantity(index, e.target.value)}
                        min={1}
                        className="w-16 h-8 text-center text-sm"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeItem(index)}
                        className="h-8 w-8 text-red-400 hover:text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </motion.li>
                ))}
              </ul>
            </AnimatePresence>
          )}
        </CardContent>
      </Card>

      {items.length > 0 && (
        <p className="text-sm text-gray-500 text-center">
          {items.length} article{items.length > 1 ? 's' : ''} • {items.reduce((sum, item) => sum + item.quantity, 0)} unités au total
        </p>
      )}
    </div>
  );
}