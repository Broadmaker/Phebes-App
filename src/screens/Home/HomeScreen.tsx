/** @jsxImportSource nativewind */
import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Dimensions,
  TextInput,
  ScrollView,
  Image,
  StyleSheet,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useProducts, ProductType } from '@/db/ProductsContext';
import { useSales } from '../../db/SalesContext';
import type { NewSale, NewSaleItem, SaleWithItems } from '../../db/types';
import Toast from 'react-native-toast-message';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');
const isTablet = width >= 768;

const PLACEHOLDER_IMAGE = 'https://placehold.co/150x150.png';
const CARD_MARGIN = 8;
const NUM_COLUMNS = isTablet ? 3 : 2;
const CARD_WIDTH = (width - (NUM_COLUMNS + 1) * CARD_MARGIN * 2) / NUM_COLUMNS;

export const showErrorToast = (message: string) => {
  Toast.show({
    type: 'error',
    text1: 'Error',
    text2: message,
    visibilityTime: 3000,
    position: 'top',
  });
};

export const showSuccessToast = (message: string, title = 'Success') => {
  Toast.show({
    type: 'success',
    text1: title,
    text2: message,
    visibilityTime: 3000,
    position: 'top',
  });
};

export default function HomeScreen() {
  const { products, loading, error } = useProducts();
  const { addSale } = useSales();

  const [cart, setCart] = useState<{ productId: string; quantity: number }[]>([]);
  const [cashReceived, setCashReceived] = useState('');
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    const checkFirstLaunch = async () => {
      const hasOpened = await AsyncStorage.getItem('hasOpenedApp');
      if (!hasOpened) {
        setShowOnboarding(true);
        await AsyncStorage.setItem('hasOpenedApp', 'true');
      }
    };
    checkFirstLaunch();
  }, []);

  const productMap = useMemo(() => {
    const map: Record<string, ProductType> = {};
    products.forEach((p) => (map[p.id.toString()] = p));
    return map;
  }, [products]);

  const totalPrice = cart.reduce((sum, c) => {
    const product = productMap[c.productId];
    return sum + (product ? product.price * c.quantity : 0);
  }, 0);

  const cashNum = parseFloat(cashReceived) || 0;
  const change = cashNum - totalPrice;

  /** Add product to cart */
  const addToCart = (productId: string) => {
    const existing = cart.find((c) => c.productId === productId);
    if (existing) {
      setCart(
        cart.map((c) => (c.productId === productId ? { ...c, quantity: c.quantity + 1 } : c))
      );
    } else {
      setCart([...cart, { productId, quantity: 1 }]);
    }
  };

  /** Remove product from cart */
  const removeFromCart = (productId: string) => {
    setCart(cart.filter((c) => c.productId !== productId));
  };

  /** Handle checkout */
  const handleCheckout = async () => {
    console.log('--- Checkout Debug Start ---');
    console.log('Cart contents:', cart);
    console.log('Cash received:', cashNum);
    console.log('Total price:', totalPrice);

    if (cart.length === 0) {
      showErrorToast('Cart is empty');

      return;
    }

    if (cashNum < totalPrice) {
      showErrorToast('Insufficient cash received');
      return;
    }

    try {
      const saleData: NewSale = {
        total: totalPrice,
        paymentMethod: 'Cash',
      };

      const saleItems: NewSaleItem[] = cart.map((c) => {
        const product = productMap[c.productId];
        if (!product) throw new Error(`Product not found: ${c.productId}`);
        return {
          productId: product.id,
          quantity: c.quantity,
          unitPrice: product.price,
          subtotal: product.price * c.quantity,
        };
      });

      console.log('Sale data to be saved:', saleData);
      console.log('Sale items to be saved:', saleItems);

      // Save to DB
      const newSale: (SaleWithItems & { saleNumber: number }) | null = await addSale(
        saleData,
        saleItems
      );

      console.log('Sale returned from addSale:', newSale);

      if (newSale) {
        // Ensure saleNumber is always set
        const saleWithNumber: SaleWithItems & { saleNumber: number } = {
          ...newSale,
          saleNumber:
            newSale.saleNumber ??
            (global.SALES_CACHE?.data.length
              ? Math.max(...global.SALES_CACHE.data.map((s) => s.saleNumber)) + 1
              : 1),
        };

        console.log('Before adding to SALES_CACHE:', global.SALES_CACHE.data);

        // Add new sale
        global.SALES_CACHE.add(saleWithNumber);

        console.log('After adding to SALES_CACHE:', global.SALES_CACHE.data);

        showSuccessToast('Sale completed and saved!');

        setCart([]);
        setCashReceived('');
      } else {
        showErrorToast('Sale failed ❌ Check console logs');
      }
    } catch (err) {
      console.error('Checkout error:', err);
      showErrorToast('Failed to complete sale ❌');
    }

    console.log('--- Checkout Debug End ---');
  };

  /** Render product card */
  const renderProduct = ({ item }: { item: ProductType }) => {
    if (!item) return null;

    return (
      <TouchableOpacity
        onPress={() => addToCart(item.id.toString())}
        className="rounded-2xl bg-white p-4 shadow"
        style={[styles.card, { width: CARD_WIDTH }]}>
        <Image source={{ uri: item.image || PLACEHOLDER_IMAGE }} style={styles.productImage} />
        <Text className="mt-2 text-center text-lg font-semibold text-gray-800">{item.name}</Text>
        <Text className="text-center text-gray-500">₱{item.price.toFixed(2)}</Text>
      </TouchableOpacity>
    );
  };

  // ------------------------
  // Onboarding Tip Carousel
  // ------------------------
  const onboardingTips = [
    {
      title: "👋 Welcome to Phebe's!",
      message:
        "Thank you for choosing Phebe's app! We’re truly grateful for your support. Tap a product to add it to your cart, and checkout easily below. Enjoy exploring and happy shopping! 🎉",
    },
    {
      title: '🛒 Add Products',
      message:
        'Simply tap a product to add it to your cart. You can adjust quantities anytime before checkout. Every tap helps us serve you better!',
    },
    {
      title: '💳 Checkout',
      message:
        "When your cart is ready, tap checkout to complete your purchase quickly and securely. Thank you for trusting Phebe's with your shopping!",
    },
    {
      title: '📦 Track Orders',
      message:
        'After checkout, you can view your sales history and track all your orders. We’re happy to make managing your purchases easy and smooth!',
    },
  ];

  const [currentOnboardingIndex, setCurrentOnboardingIndex] = useState(0);

  const handleOnboardingScroll = (event: any) => {
    const index = Math.round(event.nativeEvent.contentOffset.x / width);
    setCurrentOnboardingIndex(index);
  };

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-gray-50">
      {/* Onboarding Modal */}
      <Modal transparent visible={showOnboarding} animationType="fade">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <FlatList
              data={onboardingTips}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onScroll={handleOnboardingScroll}
              scrollEventThrottle={16}
              keyExtractor={(_, index) => index.toString()}
              renderItem={({ item }) => (
                <View
                  style={{
                    width,
                    paddingHorizontal: 16,
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}>
                  <Text className="mb-2 text-center text-xl font-bold">{item.title}</Text>
                  <Text className="text-center">{item.message}</Text>
                </View>
              )}
            />

            {/* Dots Indicator */}
            <View className="mt-4 flex-row justify-center">
              {onboardingTips.map((_, i) => (
                <View
                  key={i}
                  className={`mx-1 h-2 w-2 rounded-full ${
                    currentOnboardingIndex === i ? 'bg-blue-600' : 'bg-gray-300'
                  }`}
                />
              ))}
            </View>

            {/* Close Button */}
            <TouchableOpacity
              onPress={() => setShowOnboarding(false)}
              className="mt-6 rounded-xl bg-blue-600 px-6 py-3">
              <Text className="text-center font-semibold text-white">Got it! 🙌</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 24 }}
        nestedScrollEnabled>
        <Text className="mb-6 text-3xl font-bold text-gray-900">POS Dashboard</Text>

        {loading ? (
          <Text>Loading products...</Text>
        ) : error ? (
          <Text className="text-red-500">{error}</Text>
        ) : products.length === 0 ? (
          <Text className="text-gray-400">No products available</Text>
        ) : (
          <FlatList
            data={products}
            renderItem={renderProduct}
            keyExtractor={(item) => item.id.toString()}
            numColumns={NUM_COLUMNS}
            scrollEnabled={false}
            contentContainerStyle={{ paddingBottom: 20 }}
            nestedScrollEnabled
          />
        )}

        {/* Cart Summary */}
        <View className="mt-6 rounded-2xl bg-white p-4 shadow">
          <Text className="mb-2 text-xl font-semibold text-gray-900">Cart Summary</Text>

          {cart.length === 0 ? (
            <Text className="text-gray-400">No items selected</Text>
          ) : (
            <View>
              {cart.map((c) => {
                const product = productMap[c.productId];
                if (!product) return null;
                return (
                  <View key={c.productId} className="mb-2 flex-row items-center justify-between">
                    <Text className="text-gray-800">
                      {product.name} x {c.quantity}
                    </Text>
                    <View className="flex-row items-center">
                      <Text className="mr-2 font-semibold text-gray-800">
                        ₱{(product.price * c.quantity).toFixed(2)}
                      </Text>
                      <TouchableOpacity onPress={() => removeFromCart(c.productId)}>
                        <Ionicons name="close-circle-outline" size={20} color="#EF4444" />
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}
            </View>
          )}

          <View className="border-t border-gray-200 pt-3">
            <Text className="mb-2 text-lg font-semibold text-gray-900">
              Total: ₱{totalPrice.toFixed(2)}
            </Text>
            <View className="mb-2 flex-row items-center">
              <Text className="mr-2 text-gray-700">Cash:</Text>
              <TextInput
                className="flex-1 rounded-xl border border-gray-300 px-3 py-1"
                placeholder="Enter cash received"
                keyboardType="numeric"
                value={cashReceived}
                onChangeText={setCashReceived}
              />
            </View>
            <Text className="font-semibold text-gray-900">
              Change: ₱{change >= 0 ? change.toFixed(2) : '0.00'}
            </Text>

            <TouchableOpacity
              onPress={handleCheckout}
              className={`mt-4 flex-row items-center justify-center rounded-2xl py-3 ${
                cart.length === 0 ? 'bg-gray-400' : 'bg-blue-600'
              }`}
              disabled={cart.length === 0}>
              <Ionicons name="card-outline" size={24} color="white" className="mr-2" />
              <Text className="text-lg font-semibold text-white">Checkout</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  card: {
    margin: 8,
    borderRadius: 16,
    padding: 12,
  },
  productImage: {
    width: '100%',
    height: 120,
    borderRadius: 12,
    resizeMode: 'contain',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: { backgroundColor: 'white', padding: 20, borderRadius: 12, width: '80%' },
});

/// i have included async storage , need to rebuild once again! for the onboarding!
