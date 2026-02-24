// src/navigation/HomeStack.tsx
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { HomeStackParamList } from '../types';

import HomeScreen from '../screens/Home/HomeScreen';

const Stack = createNativeStackNavigator<HomeStackParamList>();

export default function HomeStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#f8f8f8' },
        headerTintColor: '#333',
        headerTitleAlign: 'center',
      }}>
      <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'Home' }} />
    </Stack.Navigator>
  );
}
