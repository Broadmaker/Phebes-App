/** @jsxImportSource nativewind */
import './src/cache/initGlobalCache';
import './global.css';

import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import RootStack from './src/navigation/RootStack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

import { migrateIfNeeded } from '@/db/migrate';
import { ProductsProvider } from '@/db/ProductsContext';
import { SalesProvider } from '@/db/SalesContext';

export default function App() {
  useEffect(() => {
    (async () => {
      try {
        await migrateIfNeeded();
        console.log('✅ Database ready');
      } catch (err) {
        console.error('❌ Database migration failed', err);
      }
    })();
  }, []);

  return (
    <>
      <SafeAreaProvider>
        <ProductsProvider>
          <SalesProvider>
            <NavigationContainer>
              <RootStack />
            </NavigationContainer>
            <StatusBar style="dark" translucent={false} />
          </SalesProvider>
        </ProductsProvider>
      </SafeAreaProvider>
      <Toast />
    </>
  );
}
