import { Stack } from 'expo-router';

export default function DetailsLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="vitamins" />
      <Stack.Screen name="water-detail" />
      <Stack.Screen name="meal-detail" />
      <Stack.Screen name="steps" />
    </Stack>
  );
}
