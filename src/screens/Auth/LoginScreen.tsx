/** @jsxImportSource nativewind */
import React, { useRef, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Keyboard, Animated, Image } from 'react-native';

export default function LoginScreen({ navigation }: any) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const inputRef = useRef<TextInput>(null);
  const shakeAnim = useRef(new Animated.Value(0)).current;

  const STATIC_PIN = '233444';

  const triggerShake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 6, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();
  };

  const handleChange = (text: string) => {
    const cleaned = text.replace(/[^0-9]/g, '');
    if (cleaned.length <= 6) {
      setPin(cleaned);

      if (cleaned.length === 6) {
        Keyboard.dismiss();
        handleSubmit(cleaned);
      }
    }
  };

  const handleSubmit = (enteredPin: string) => {
    if (enteredPin === STATIC_PIN) {
      navigation.replace('MainTabs');
    } else {
      setError(true);
      triggerShake();
      setPin('');
      setTimeout(() => setError(false), 800);
    }
  };

  return (
    <TouchableOpacity
      activeOpacity={1}
      onPress={() => inputRef.current?.focus()}
      className="flex-1 items-center justify-center bg-white px-6">
      {/* 🔷 LOGO SECTION */}
      {/* Replace the require() path below with your asset */}
      <Image
        source={require('../../../assets/phebes.png')}
        style={{ width: 120, height: 120, resizeMode: 'contain' }}
      />
      {/* 🔼 CHANGE THIS FILE:
          Put your logo inside /assets
          Then change:
          require("../../assets/logo.png")
      */}

      <Text className="mb-2 mt-10 text-2xl font-bold">Enter PIN</Text>
      <Text className="mb-8 text-gray-500">Enter your 6-digit access code</Text>

      {/* Hidden Input */}
      <TextInput
        ref={inputRef}
        value={pin}
        onChangeText={handleChange}
        keyboardType="number-pad"
        maxLength={6}
        className="absolute opacity-0"
        autoFocus
      />

      {/* PIN Boxes */}
      <Animated.View
        style={{ transform: [{ translateX: shakeAnim }] }}
        className="w-full max-w-xs flex-row justify-between">
        {[...Array(6)].map((_, index) => {
          const filled = index < pin.length;
          return (
            <View
              key={index}
              className={`h-14 w-12 items-center justify-center rounded-xl border-2 ${
                error ? 'border-red-500' : filled ? 'border-blue-600' : 'border-gray-300'
              }`}>
              <Text className="text-xl font-bold">{filled ? '•' : ''}</Text>
            </View>
          );
        })}
      </Animated.View>

      {error && <Text className="mt-4 text-red-500">Incorrect PIN</Text>}
    </TouchableOpacity>
  );
}
