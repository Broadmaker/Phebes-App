import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useProducts, ProductType } from '@/db/ProductsContext';

const ADMIN_PASSWORD = '1234';
const PLACEHOLDER_IMAGE = 'https://via.placeholder.com/50x50.png?text=No+Image';

export default function SettingsScreen() {
  const { products, loading, error, addProduct, updateProduct, deleteProduct } = useProducts();

  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState('');

  // Add product form state
  const [showForm, setShowForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [newImage, setNewImage] = useState<string | null>(null);

  // Edit product state
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [editImage, setEditImage] = useState<string | null>(null);

  /** Password login */
  /*   const handlePasswordSubmit = () => {
    if (password === ADMIN_PASSWORD) {
      setAuthenticated(true);
      setPassword('');
    } else {
      Alert.alert('Access Denied', 'Incorrect password!');
      setPassword('');
    }
  };
 */
  /** Pick image from gallery */
  const pickImage = async (): Promise<string | undefined> => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.7,
    });
    if (!result.canceled) return result.assets[0].uri;
  };

  /** Add new product */
  const handleAddProductSubmit = async () => {
    if (!newName || !newPrice) return Alert.alert('Validation', 'Enter name and price');

    const priceNum = parseFloat(newPrice);
    if (isNaN(priceNum) || priceNum <= 0)
      return Alert.alert('Validation', 'Price must be positive');

    // ✅ Check for duplicate by product name (case-insensitive)
    const duplicate = products.some(
      (p) => p.name.toLowerCase().trim() === newName.toLowerCase().trim()
    );
    if (duplicate) return Alert.alert('Duplicate', 'This product already exists!');

    try {
      await addProduct({ name: newName, price: priceNum, image: newImage || undefined });

      // Clear form
      setNewName('');
      setNewPrice('');
      setNewImage(null);
      setShowForm(false);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to add product');
    }
  };

  /** Start editing product */
  const handleEditProduct = (product: ProductType) => {
    setEditingId(product.id);
    setEditName(product.name);
    setEditPrice(product.price.toString());
    setEditImage(product.image ?? null);
  };

  /** Submit edited product */
  const handleEditSubmit = async () => {
    if (!editName || !editPrice) return Alert.alert('Validation', 'Enter name and price');
    const priceNum = parseFloat(editPrice);
    if (isNaN(priceNum) || priceNum <= 0)
      return Alert.alert('Validation', 'Price must be positive');

    const updatedImage = editImage && editImage !== PLACEHOLDER_IMAGE ? editImage : undefined;

    if (editingId !== null) {
      await updateProduct(editingId, { name: editName, price: priceNum, image: updatedImage });
      setEditingId(null);
      setEditName('');
      setEditPrice('');
      setEditImage(null);
    }
  };

  type DeleteResult = {
    success: boolean;
    message?: string;
  };

  /** Delete product */
  const handleDeleteProduct = (id: number) => {
    Alert.alert('Confirm Delete', 'Are you sure you want to delete this product?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            // Call context delete function
            const result = await deleteProduct(id);

            // If deletion failed (e.g., foreign key constraint)
            if (!result.success) {
              Alert.alert('Cannot Delete Product', result.message || 'Product cannot be deleted');
            }
          } catch (err) {
            // Catch any unexpected errors (native layer or JS)
            console.error('Unexpected error deleting product', err);
            Alert.alert(
              'Delete Failed',
              'An unexpected error occurred while deleting the product.'
            );
          }
        },
      },
    ]);
  };

  /** Render each product */
  const renderProduct = ({ item, index }: { item: ProductType; index: number }) => (
    <View className="mb-3 flex-row items-center justify-between rounded-2xl bg-white p-4 shadow">
      {editingId === item.id ? (
        <View className="flex-1">
          <TextInput
            value={editName}
            onChangeText={setEditName}
            placeholder="Product Name"
            className="mb-1 rounded bg-gray-50 px-2 py-1"
          />
          <TextInput
            value={editPrice}
            onChangeText={setEditPrice}
            placeholder="Price"
            keyboardType="decimal-pad"
            className="mb-1 rounded bg-gray-50 px-2 py-1"
          />
          <TouchableOpacity
            className="mb-1 rounded bg-gray-200 px-2 py-1"
            onPress={async () => {
              const uri = await pickImage();
              if (uri) setEditImage(uri);
            }}>
            <Text>{editImage ? 'Change Image' : 'Pick Image'}</Text>
          </TouchableOpacity>
          {editImage && (
            <Image
              source={{ uri: editImage }}
              style={{ width: 50, height: 50, borderRadius: 8, marginTop: 4 }}
            />
          )}
        </View>
      ) : (
        <View className="flex-1 flex-row items-center">
          <Image
            source={{ uri: item.image ?? PLACEHOLDER_IMAGE }}
            style={{ width: 50, height: 50, borderRadius: 8, marginRight: 8 }}
          />
          <Text className="font-semibold text-gray-800">
            {index + 1}. {item.name} — ₱{item.price.toFixed(2)}
          </Text>
        </View>
      )}

      <View className="ml-2 flex-row items-center">
        {editingId === item.id ? (
          <>
            <TouchableOpacity className="mr-2" onPress={handleEditSubmit}>
              <Ionicons name="checkmark-outline" size={22} color="#10B981" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setEditingId(null)}>
              <Ionicons name="close-outline" size={22} color="#EF4444" />
            </TouchableOpacity>
          </>
        ) : (
          <>
            <TouchableOpacity className="mr-2" onPress={() => handleEditProduct(item)}>
              <Ionicons name="pencil-outline" size={22} color="#1D4ED8" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleDeleteProduct(item.id)}>
              <Ionicons name="trash-outline" size={22} color="#EF4444" />
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );

  /** Password screen */
  /*   if (!authenticated) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50 p-4">
        <Text className="mb-4 text-2xl font-bold text-gray-800">Enter Admin Password</Text>
        <TextInput
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          placeholder="Password"
          className="mb-4 w-full rounded-2xl bg-white px-4 py-3 text-gray-800 shadow"
        />
        <TouchableOpacity
          onPress={handlePasswordSubmit}
          className="rounded-2xl bg-blue-600 px-6 py-3">
          <Text className="font-semibold text-white">Submit</Text>
        </TouchableOpacity>
      </View>
    );
  } */

  /** Main admin panel */
  return (
    <ScrollView className="flex-1 bg-gray-50 p-4">
      <Text className="mb-6 text-3xl font-bold text-gray-900">Settings & Menu Management</Text>

      {/* Add Product Form */}
      <View className="mb-6 rounded-2xl bg-white p-4 shadow">
        <View className="mb-4 flex-row items-center justify-between">
          <Text className="text-xl font-semibold text-gray-800">Menu Management</Text>
          <TouchableOpacity
            onPress={() => setShowForm(!showForm)}
            className="flex-row items-center rounded-2xl bg-blue-600 px-4 py-2">
            <Ionicons name="add-outline" size={20} color="white" className="mr-1" />
            <Text className="font-semibold text-white">Add Menu</Text>
          </TouchableOpacity>
        </View>

        {showForm && (
          <View className="mb-4 rounded-2xl bg-gray-50 p-4 shadow">
            <TextInput
              placeholder="Menu Name"
              value={newName}
              onChangeText={setNewName}
              placeholderTextColor="#888"
              className="mb-2 rounded-2xl bg-white px-4 py-3 text-gray-800 shadow"
            />
            <TextInput
              placeholder="Price"
              value={newPrice}
              onChangeText={setNewPrice}
              placeholderTextColor="#888"
              keyboardType="decimal-pad"
              className="mb-2 rounded-2xl bg-white px-4 py-3 text-gray-800 shadow"
            />
            <TouchableOpacity
              className="mb-2 rounded-2xl bg-gray-200 px-4 py-2"
              onPress={async () => {
                const uri = await pickImage();
                if (uri) setNewImage(uri);
              }}>
              <Text>{newImage ? 'Change Image' : 'Pick Image'}</Text>
            </TouchableOpacity>
            {newImage && (
              <Image
                source={{ uri: newImage }}
                style={{ width: 50, height: 50, borderRadius: 8, marginBottom: 4 }}
              />
            )}
            <TouchableOpacity
              onPress={handleAddProductSubmit}
              className="mb-2 flex-row justify-center rounded-2xl bg-green-600 px-4 py-3">
              <Text className="font-semibold text-white">Submit</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setShowForm(false)}
              className="flex-row justify-center rounded-2xl bg-gray-300 px-4 py-3">
              <Text className="font-semibold text-gray-800">Cancel</Text>
            </TouchableOpacity>
          </View>
        )}

        {loading && <Text>Loading products...</Text>}
        {error && <Text className="text-red-500">{error}</Text>}

        {products.length === 0 ? (
          <Text className="text-gray-400">No products available</Text>
        ) : (
          <FlatList
            data={products}
            renderItem={renderProduct}
            keyExtractor={(item) => item.id.toString()}
            scrollEnabled={false}
          />
        )}
      </View>
    </ScrollView>
  );
}
