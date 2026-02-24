// src/navigation/SaleStack.tsx
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import SaleScreen from '../screens/Sale/SaleScreen';
import { SaleStackParamList } from '../types';
import SaleHistoryScreen from '@/screens/Sale/SaleHistoryScreen';

const Stack = createNativeStackNavigator<SaleStackParamList>();

export default function SaleStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#f8f8f8' },
        headerTintColor: '#333',
        headerTitleAlign: 'center',
      }}>
      <Stack.Screen name="Sale" component={SaleScreen} options={{ title: 'Sales' }} />
      <Stack.Screen
        name="SaleHistory"
        component={SaleHistoryScreen}
        options={{ title: 'Sale History' }}
      />
    </Stack.Navigator>
  );
}
