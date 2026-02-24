/** @jsxImportSource nativewind */
import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, FlatList } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getAllProducts } from '../db/products';
import { getAllSalesWithItems } from '../db/sales';
import type { Product, SaleWithItems } from '../db/types';

/**
 * DebugDatabaseScreen
 * ----------------
 * Simple screen to display everything in the database for debugging.
 */
export default function DebugDatabaseScreen() {
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<SaleWithItems[]>([]);

  useFocusEffect(
    useCallback(() => {
      async function fetchData() {
        try {
          const dbProducts = await getAllProducts();
          setProducts(dbProducts);

          const dbSales = await getAllSalesWithItems();
          setSales(dbSales);
        } catch (err) {
          console.error('Failed to load data:', err);
        }
      }
      fetchData();
    }, [])
  );

const renderProduct = ({ item }: { item: Product }) => (
  <View className="p-3 bg-white rounded-xl mb-2 shadow">
    <Text className="font-semibold text-gray-800">
      {item.id}: {item.name} - ₱{item.price.toFixed(2)}
    </Text>
    <Text className="text-gray-500 text-sm">
      Created (UTC): {new Date(item.createdAt).toISOString()}
    </Text>
    <Text className="text-gray-500 text-sm">
      Created (Local): {new Date(item.createdAt).toLocaleString()}
    </Text>
    <Text className="text-gray-500 text-sm">
      Updated (UTC): {new Date(item.updatedAt).toISOString()}
    </Text>
    <Text className="text-gray-500 text-sm">
      Updated (Local): {new Date(item.updatedAt).toLocaleString()}
    </Text>
  </View>
);

const renderSale = ({ item }: { item: SaleWithItems }) => (
  <View className="p-3 bg-white rounded-xl mb-2 shadow">
    <Text className="font-semibold text-gray-800">
      Sale {item.id} - Total: ₱{item.total.toFixed(2)}
    </Text>
    <Text className="text-gray-500 text-sm">
      Payment: {item.paymentMethod ?? 'N/A'} | Note: {item.note ?? 'N/A'}
    </Text>
    <Text className="text-gray-500 text-sm">
      Created (UTC): {new Date(item.createdAt).toISOString()}
    </Text>
    <Text className="text-gray-500 text-sm">
      Created (Local): {new Date(item.createdAt).toLocaleString()}
    </Text>
    <Text className="text-gray-500 text-sm">
      Updated (UTC): {new Date(item.updatedAt).toISOString()}
    </Text>
    <Text className="text-gray-500 text-sm">
      Updated (Local): {new Date(item.updatedAt).toLocaleString()}
    </Text>

    <Text className="font-semibold mt-2">Items:</Text>
    {item.items.map((i, index) => (
      <Text key={index} className="text-gray-700 text-sm">
        Product ID: {i.productId}, Name: {i.productName}, Quantity: {i.quantity}, Subtotal: ₱{i.subtotal.toFixed(2)}
      </Text>
    ))}
  </View>
);


  return (
    <ScrollView className="flex-1 bg-gray-50 p-4">
      <Text className="text-2xl font-bold text-gray-900 mb-4">Debug Database Viewer</Text>

      <Text className="text-xl font-semibold text-gray-800 mb-2">Products:</Text>
      <FlatList
        data={products}
        renderItem={renderProduct}
        keyExtractor={(item) => item.id.toString()}
        scrollEnabled={false}
      />

      <Text className="text-xl font-semibold text-gray-800 mt-4 mb-2">Sales:</Text>
      <FlatList
        data={sales}
        renderItem={renderSale}
        keyExtractor={(item) => item.id.toString()}
        scrollEnabled={false}
      />
    </ScrollView>
  );
}
