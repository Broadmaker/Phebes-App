/** @jsxImportSource nativewind */
import React, { useState, useMemo } from 'react';
import { View, Text, FlatList, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useProducts } from '@/db/ProductsContext';
import { useSales } from '@/db/SalesContext';
import { printSalesReport } from '@/utils/printUtils';

export default function SaleScreen() {
  const { products } = useProducts();
  const { sales } = useSales();

  const [selectedProductFilter, setSelectedProductFilter] = useState('All');
  const [selectedDateFilter, setSelectedDateFilter] = useState('All Time');
  const [customStartDate, setCustomStartDate] = useState<Date | null>(null);
  const [customEndDate, setCustomEndDate] = useState<Date | null>(null);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  // ⚡ New state: track if printing is in progress
  const [printing, setPrinting] = useState(false);

  const dateFilters = ['All Time', 'Today', 'Yesterday', 'Last 7 Days', 'Custom Range'];

  const filteredSalesByDate = useMemo(() => {
    const now = new Date();
    return sales.filter((sale) => {
      const saleDate = new Date(Number(sale.createdAt));

      if (selectedDateFilter === 'Today') {
        return saleDate.toDateString() === now.toDateString();
      }
      if (selectedDateFilter === 'Yesterday') {
        const yesterday = new Date();
        yesterday.setDate(now.getDate() - 1);
        return saleDate.toDateString() === yesterday.toDateString();
      }
      if (selectedDateFilter === 'Last 7 Days') {
        const weekAgo = new Date();
        weekAgo.setDate(now.getDate() - 7);
        return saleDate >= weekAgo && saleDate <= now;
      }
      if (selectedDateFilter === 'Custom Range' && customStartDate && customEndDate) {
        const start = new Date(customStartDate);
        start.setHours(0, 0, 0, 0);
        const end = new Date(customEndDate);
        end.setHours(23, 59, 59, 999);
        return saleDate >= start && saleDate <= end;
      }
      return true;
    });
  }, [sales, selectedDateFilter, customStartDate, customEndDate]);

  const uniqueProductNames = Array.from(new Set(products.map((p) => p.name))).sort();
  const productFilterOptions = ['All', ...uniqueProductNames];

  const filteredProducts = useMemo(
    () =>
      selectedProductFilter === 'All'
        ? products
        : products.filter((p) => p.name === selectedProductFilter),
    [products, selectedProductFilter]
  );

  const productStats = useMemo(() => {
    const stats: Record<number, { unitsSold: number; total: number }> = {};
    filteredProducts.forEach((p) => {
      const items = filteredSalesByDate.flatMap((s) => s.items.filter((i) => i.productId === p.id));
      stats[p.id] = {
        unitsSold: items.reduce((sum, i) => sum + i.quantity, 0),
        total: items.reduce((sum, i) => sum + i.subtotal, 0),
      };
    });
    return stats;
  }, [filteredProducts, filteredSalesByDate]);

  const totalSales = filteredProducts.reduce((sum, p) => sum + (productStats[p.id]?.total ?? 0), 0);

  const renderProduct = ({ item }: { item: (typeof products)[0] }) => {
    const stats = productStats[item.id] || { unitsSold: 0, total: 0 };
    return (
      <View className="mb-3 flex-row items-center justify-between rounded-2xl bg-white p-4 shadow">
        <MaterialCommunityIcons name="coffee" size={36} color="#1D4ED8" className="mr-4" />
        <View className="flex-1">
          <Text className="font-semibold text-gray-800">{item.name}</Text>
          <Text className="mt-1 text-gray-500">₱{item.price.toFixed(2)}</Text>
        </View>
        <View className="items-end">
          <Text className="text-sm text-gray-500">{stats.unitsSold} units sold</Text>
          <Text className="font-bold text-gray-800">₱{stats.total.toFixed(2)}</Text>
        </View>
      </View>
    );
  };

  // ⚡ New: safe print function
  const handlePrint = async () => {
    if (printing) return; // prevent multiple clicks
    try {
      setPrinting(true);
      await printSalesReport(filteredProducts, productStats, totalSales, selectedDateFilter);
    } catch (err) {
      console.error('Error during printing:', err);
    } finally {
      setPrinting(false);
    }
  };

  return (
    <ScrollView className="flex-1 bg-gray-50 p-4">
      <Text className="mb-4 text-3xl font-bold text-gray-900">Sales Dashboard</Text>

      {/* Date Filter */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
        {dateFilters.map((filter) => (
          <TouchableOpacity
            key={filter}
            onPress={() => setSelectedDateFilter(filter)}
            className={`mr-2 rounded-2xl px-4 py-2 shadow ${
              selectedDateFilter === filter ? 'bg-green-600' : 'bg-white'
            }`}>
            <Text
              className={`font-semibold ${
                selectedDateFilter === filter ? 'text-white' : 'text-gray-800'
              }`}>
              {filter}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Custom Date Pickers */}
      {selectedDateFilter === 'Custom Range' && (
        <View className="mb-4 flex-row">
          <TouchableOpacity
            onPress={() => setShowStartPicker(true)}
            className="mr-2 rounded-2xl bg-white p-3 shadow">
            <Text className="text-gray-800">
              Start: {customStartDate ? customStartDate.toDateString() : 'Select'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setShowEndPicker(true)}
            className="rounded-2xl bg-white p-3 shadow">
            <Text className="text-gray-800">
              End: {customEndDate ? customEndDate.toDateString() : 'Select'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {showStartPicker && (
        <DateTimePicker
          value={customStartDate || new Date()}
          mode="date"
          display="default"
          onChange={(_e, date) => {
            setShowStartPicker(Platform.OS === 'ios');
            if (date) setCustomStartDate(date);
          }}
        />
      )}
      {showEndPicker && (
        <DateTimePicker
          value={customEndDate || new Date()}
          mode="date"
          display="default"
          onChange={(_e, date) => {
            setShowEndPicker(Platform.OS === 'ios');
            if (date) setCustomEndDate(date);
          }}
        />
      )}

      {/* Product Filter */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
        {productFilterOptions.map((filter) => (
          <TouchableOpacity
            key={filter}
            onPress={() => setSelectedProductFilter(filter)}
            className={`mr-2 rounded-2xl px-4 py-2 shadow ${
              selectedProductFilter === filter ? 'bg-blue-600' : 'bg-white'
            }`}>
            <Text
              className={`font-semibold ${
                selectedProductFilter === filter ? 'text-white' : 'text-gray-800'
              }`}>
              {filter}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Product Cards */}
      <FlatList
        data={filteredProducts}
        renderItem={renderProduct}
        keyExtractor={(item) => item.id.toString()}
        scrollEnabled={false}
        contentContainerStyle={{ paddingBottom: 20 }}
      />

      {/* Total Sales */}
      <View className="mt-4 flex-row items-center justify-between rounded-2xl bg-white p-4 shadow">
        <Text className="text-xl font-semibold text-gray-800">Total Sales</Text>
        <Text className="text-xl font-bold text-blue-600">₱{totalSales.toFixed(2)}</Text>
      </View>

      {/* Print Report */}
      <TouchableOpacity
        className={`mt-4 flex-row items-center justify-center rounded-2xl py-3 ${
          printing ? 'bg-gray-400' : 'bg-blue-600'
        }`}
        onPress={handlePrint}
        disabled={printing} // ⚡ disable while printing
      >
        <Ionicons name="print-outline" size={24} color="white" className="mr-2" />
        <Text className="text-lg font-semibold text-white">
          {printing ? 'Printing...' : 'Print Report'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
