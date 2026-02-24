/** @jsxImportSource nativewind */
import React, { useEffect, useState } from 'react';
import { View, Text, Image } from 'react-native';
import * as ExpoSplashScreen from 'expo-splash-screen';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types';
import { getAllSalesWithItems } from '../../db/sales';
import { generateDailySaleNumbers } from '../../utils/salesUtils';
import { db } from '../../db/client';
import { products as productsTable } from '../../db/schema';
import type { ProductType } from '../../db/ProductsContext';

type Props = NativeStackScreenProps<RootStackParamList, 'Splash'> & {
  onFinish: (isAuthenticated: boolean) => void;
};

// Keep splash visible until we hide manually
ExpoSplashScreen.preventAutoHideAsync();

export default function SplashScreen({ navigation, onFinish }: Props) {
  const [ready, setReady] = useState(false);
  const MIN_SPLASH_TIME = 2000; // milliseconds (1.5s)

  useEffect(() => {
    async function prepareApp() {
      const startTime = Date.now();

      try {
        console.log('🚀 Preloading app data...');

        // Load Sales
        const salesFromDB = await getAllSalesWithItems();
        const numberedSales = generateDailySaleNumbers(salesFromDB);
        global.SALES_CACHE.clear();
        numberedSales.forEach((sale) => global.SALES_CACHE.add(sale));

        // Load Products
        const productRows = await db.select().from(productsTable).all();
        const formattedProducts: ProductType[] = productRows.map((p) => ({
          ...p,
          createdAt: p.createdAt instanceof Date ? p.createdAt.getTime() : p.createdAt,
          updatedAt: p.updatedAt instanceof Date ? p.updatedAt.getTime() : p.updatedAt,
        }));
        global.PRODUCTS_CACHE.clear();
        formattedProducts.forEach((product) => global.PRODUCTS_CACHE.add(product));

        console.log('✅ Data preloaded successfully');
      } catch (error) {
        console.error('Splash preload error:', error);
      } finally {
        // Ensure minimum splash time
        const elapsed = Date.now() - startTime;
        const remainingTime = MIN_SPLASH_TIME - elapsed;
        if (remainingTime > 0) {
          await new Promise((resolve) => setTimeout(resolve, remainingTime));
        }

        setReady(true);
      }
    }

    prepareApp();
  }, []);

  // Hide splash and navigate when ready
  useEffect(() => {
    async function hideSplash() {
      if (ready) {
        try {
          await ExpoSplashScreen.hideAsync();
          onFinish(false); // or true if user is authenticated
        } catch (e) {
          console.error('Error hiding splash:', e);
        }
      }
    }
    hideSplash();
  }, [ready, navigation]);

  return (
    <View className="flex-1 items-center justify-center bg-white">
      <Image
        source={require('../../../assets/phebes.png')}
        className="mb-4 h-40 w-40 rounded-full"
        resizeMode="contain"
      />
      <Text className="text-2xl font-bold text-gray-700">Phebe's Korean Shop</Text>
    </View>
  );
}
