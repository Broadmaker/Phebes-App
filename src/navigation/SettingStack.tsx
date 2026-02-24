// src/navigation/HomeStack.tsx
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SettingStackParamList } from '../types';

import HomeScreen from '../screens/Setting/SettingScreen';
import SettingScreen from '../screens/Setting/SettingScreen';

const Stack = createNativeStackNavigator<SettingStackParamList>();

export default function SettingStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#f8f8f8' },
        headerTintColor: '#333',
        headerTitleAlign: 'center',
      }}
    >
      <Stack.Screen name="Settings" component={SettingScreen} options={{ title: 'Setting' }} />
     
    </Stack.Navigator>
  );
}
