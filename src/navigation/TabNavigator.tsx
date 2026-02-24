/** @jsxImportSource nativewind */
// src/navigation/TabNavigator.tsx
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import HomeStack from './HomeStack';
import SaleStack from './SaleStack';
import SettingStack from './SettingStack';
import DebugDatabaseScreen from '@/screens/DebugDatabaseScreen';
import SaleHistoryStack from './SaleHistoryStack';

// Bottom tabs have no special types by default; you can type if needed
export type TabParamList = {
  HomeTab: undefined;
  SaleTab: undefined;
  SettingTab: undefined;
  HistoryTab: undefined;
  DatabaseTab: undefined;
};

const Tab = createBottomTabNavigator<TabParamList>();

export default function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: string;

          if (route.name === 'HomeTab') iconName = focused ? 'storefront' : 'storefront-outline';
          else if (route.name === 'SaleTab')
            iconName = focused ? 'file-tray-full' : 'file-tray-full-outline';
          else if (route.name === 'HistoryTab') iconName = focused ? 'reader' : 'reader-outline';
          else if (route.name === 'SettingTab')
            iconName = focused ? 'settings' : 'settings-outline';
          else if (route.name === 'DatabaseTab') iconName = focused ? 'server' : 'server-outline';
          else iconName = 'ellipse'; // fallback

          return <Ionicons name={iconName as any} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#1D4ED8',
        tabBarInactiveTintColor: 'gray',
        headerShown: false, // headers handled by stacks
      })}>
      <Tab.Screen name="HomeTab" component={HomeStack} options={{ title: 'Menu' }} />
      <Tab.Screen name="SaleTab" component={SaleStack} options={{ title: 'Sales' }} />
      <Tab.Screen name="HistoryTab" component={SaleHistoryStack} options={{ title: 'History' }} />
      {/*       <Tab.Screen
        name="DatabaseTab"
        component={DebugDatabaseScreen}
        options={{ title: 'Database' }}
      /> */}
      <Tab.Screen name="SettingTab" component={SettingStack} options={{ title: 'Settings' }} />
    </Tab.Navigator>
  );
}
