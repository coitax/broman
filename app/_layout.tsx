import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { colors } from '@/design/tokens';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.bg },
          headerTintColor: colors.text,
          headerShadowVisible: false,
          contentStyle: { backgroundColor: colors.bg },
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="onboarding" options={{ title: 'Your morning' }} />
        <Stack.Screen name="journey" options={{ headerShown: false }} />
        <Stack.Screen name="checkin" options={{ title: 'Check in' }} />
        <Stack.Screen name="library" options={{ title: 'Journeys' }} />
        <Stack.Screen name="paywall" options={{ title: 'Premium', presentation: 'modal' }} />
        <Stack.Screen name="reminder" options={{ title: 'Reminder' }} />
      </Stack>
    </SafeAreaProvider>
  );
}
