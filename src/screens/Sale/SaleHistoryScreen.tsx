/** @jsxImportSource nativewind */
import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Platform,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import type { SaleWithItems } from '../../db/types';
import { useSales } from '../../db/SalesContext';

/**
 * SaleHistoryScreen with Infinite Scroll
 * --------------------------------------
 * Features:
 * - Date filters (Today, Yesterday, Last 7 Days, Custom Range)
 * - Custom date range pickers
 * - Pull-to-refresh
 * - Infinite scroll: load more sales as user scrolls
 * - Auto-refresh at midnight
 */
export default function SaleHistoryScreen() {
  // ----------------------------
  // Context
  // ----------------------------
  const { sales, loading, error, refreshSales } = useSales();

  // ----------------------------
  // State for filters, date pickers, pull-to-refresh, infinite scroll
  // ----------------------------
  const [selectedDateFilter, setSelectedDateFilter] = useState('All Time');
  const [customStartDate, setCustomStartDate] = useState<Date | null>(null);
  const [customEndDate, setCustomEndDate] = useState<Date | null>(null);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [visibleCount, setVisibleCount] = useState(10); // Sales currently visible
  const [loadingMore, setLoadingMore] = useState(false); // For infinite scroll spinner
  const dateFilters = ['All Time', 'Today', 'Yesterday', 'Last 7 Days', 'Custom Range'];

  // ----------------------------
  // Pull-to-refresh handler
  // ----------------------------
  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshSales();
      setVisibleCount(10); // Reset visible count after refresh
    } catch (err) {
      console.error('Refresh failed:', err);
    } finally {
      setRefreshing(false);
    }
  };

  // ----------------------------
  // Auto-refresh at midnight
  // ----------------------------
  useEffect(() => {
    const getMsUntilNextMidnight = () => {
      const now = new Date();
      const nextMidnight = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() + 1,
        0,
        0,
        0,
        0
      );
      return nextMidnight.getTime() - now.getTime();
    };

    const scheduleMidnightRefresh = () => {
      const ms = getMsUntilNextMidnight();
      const timeout = setTimeout(async () => {
        await refreshSales();
        scheduleMidnightRefresh();
      }, ms);
      return timeout;
    };

    const timeoutId = scheduleMidnightRefresh();
    return () => clearTimeout(timeoutId);
  }, []);

  // ----------------------------
  // Filter and sort sales
  // ----------------------------
  const filteredSales = useMemo(() => {
    const now = new Date();
    return sales
      .filter((sale) => {
        const saleDate = new Date(sale.createdAt);
        switch (selectedDateFilter) {
          case 'Today':
            return saleDate.toDateString() === now.toDateString();
          case 'Yesterday': {
            const yesterday = new Date();
            yesterday.setDate(now.getDate() - 1);
            return saleDate.toDateString() === yesterday.toDateString();
          }
          case 'Last 7 Days': {
            const weekAgo = new Date();
            weekAgo.setDate(now.getDate() - 7);
            return saleDate >= weekAgo && saleDate <= now;
          }
          case 'Custom Range':
            if (customStartDate && customEndDate) {
              const start = new Date(customStartDate);
              start.setHours(0, 0, 0, 0);
              const end = new Date(customEndDate);
              end.setHours(23, 59, 59, 999);
              return saleDate >= start && saleDate <= end;
            }
            return true;
          default:
            return true;
        }
      })
      .sort((a, b) => b.createdAt - a.createdAt); // newest first
  }, [sales, selectedDateFilter, customStartDate, customEndDate]);

  // ----------------------------
  // Reset pagination when filter changes
  // ----------------------------
  useEffect(() => {
    setVisibleCount(10);
  }, [selectedDateFilter, customStartDate, customEndDate]);

  // ----------------------------
  // Load more sales for infinite scroll
  // ----------------------------
  const loadMoreSales = () => {
    if (loadingMore) return;
    if (visibleCount >= filteredSales.length) return;

    setLoadingMore(true);
    // Simulate small delay for UX
    setTimeout(() => {
      setVisibleCount((prev) => prev + 10);
      setLoadingMore(false);
    }, 300);
  };

  // ----------------------------
  // Date picker handlers
  // ----------------------------
  const onStartDateChange = (_event: any, selectedDate?: Date) => {
    setShowStartPicker(Platform.OS === 'ios');
    if (selectedDate) setCustomStartDate(selectedDate);
  };

  const onEndDateChange = (_event: any, selectedDate?: Date) => {
    setShowEndPicker(Platform.OS === 'ios');
    if (selectedDate) setCustomEndDate(selectedDate);
  };

  // ----------------------------
  // Render single sale card
  // ----------------------------
  const renderSale = ({ item }: { item: SaleWithItems & { saleNumber: number } }) => {
    const saleDate = new Date(item.createdAt);
    const total = item.items.reduce((sum, i) => sum + i.subtotal, 0);

    return (
      <View className="mb-3 rounded-2xl bg-white p-4 shadow">
        <View className="mb-2 flex-row items-center justify-between">
          <Text className="font-semibold text-gray-800">Sale #{item.saleNumber}</Text>
          <Text className="text-gray-500">
            {saleDate.toLocaleDateString(undefined, {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            })}{' '}
            • {saleDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>

        <View className="mb-2">
          {item.items.map((i) => (
            <View key={i.productId} className="flex-row justify-between">
              <Text className="text-gray-700">
                {i.productName} x{i.quantity}
              </Text>
              <Text className="text-gray-700">₱{i.subtotal.toFixed(2)}</Text>
            </View>
          ))}
        </View>

        <View className="flex-row justify-between border-t border-gray-200 pt-2">
          <Text className="font-semibold text-gray-800">Total</Text>
          <Text className="font-bold text-blue-600">₱{total.toFixed(2)}</Text>
        </View>
      </View>
    );
  };

  // ----------------------------
  // Handle loading and error states
  // ----------------------------
  if (loading) {
    return (
      <View className="flex-1 items-center justify-center">
        <Text>Loading sales...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 items-center justify-center">
        <Text className="text-red-600">{error}</Text>
      </View>
    );
  }

  // ----------------------------
  // Render main FlatList with infinite scroll
  // ----------------------------
  return (
    <FlatList
      data={filteredSales.slice(0, visibleCount)}
      renderItem={renderSale}
      keyExtractor={(item) => item.id.toString()}
      onEndReached={loadMoreSales}
      onEndReachedThreshold={0.5} // Trigger loadMore when 50% from bottom
      ListHeaderComponent={
        <>
          {/* Screen title */}
          <Text className="mb-4 text-3xl font-bold text-gray-900">Sales History</Text>

          {/* Date Filters */}
          <FlatList
            data={dateFilters}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => item}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => setSelectedDateFilter(item)}
                className={`mr-2 rounded-2xl px-4 py-2 shadow ${
                  selectedDateFilter === item ? 'bg-green-600' : 'bg-white'
                }`}>
                <Text
                  className={`font-semibold ${
                    selectedDateFilter === item ? 'text-white' : 'text-gray-800'
                  }`}>
                  {item}
                </Text>
              </TouchableOpacity>
            )}
            className="mb-4"
          />

          {/* Custom Range Pickers */}
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

          {/* Date pickers */}
          {showStartPicker && (
            <DateTimePicker
              value={customStartDate || new Date()}
              mode="date"
              display="default"
              onChange={onStartDateChange}
            />
          )}
          {showEndPicker && (
            <DateTimePicker
              value={customEndDate || new Date()}
              mode="date"
              display="default"
              onChange={onEndDateChange}
            />
          )}
        </>
      }
      contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      ListFooterComponent={
        loadingMore ? (
          <View className="my-4 items-center justify-center">
            <ActivityIndicator size="small" color="#16a34a" />
          </View>
        ) : null
      }
    />
  );
}
