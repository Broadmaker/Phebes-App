import { View, Text, Button } from "react-native";
import { useProducts } from "@/db/useProducts";

export default function TestScreen() {
  const { products, loading, error, addProduct } = useProducts();

  if (loading) return <Text>Loading...</Text>;
  if (error) return <Text>Error: {error}</Text>;

  return (
    <View className="p-4">
      {products.map((p) => (
        <Text key={p.id}>
          {p.name} — ${p.price}
        </Text>
      ))}

      <Button
        title="Add Product"
        onPress={() => addProduct({ name: "Coffee Mug", price: 12.99 })}
      />
    </View>
  );
}
