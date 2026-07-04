/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import { NewAppScreen } from '@react-native/new-app-screen';
import { StatusBar, StyleSheet, useColorScheme, View } from 'react-native';
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';

function App() {
  const isDarkMode = useColorScheme() === 'dark';

  return (
    <SafeAreaProvider>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <AppContent />
    </SafeAreaProvider>
  );
}

function AppContent() {
  const safeAreaInsets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <NewAppScreen
        templateFileName="App.tsx"
        safeAreaInsets={safeAreaInsets}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

import { resolveStop } from './src/api/stops';
import { fetchJourneys, evaluateJourney } from './src/api/journeys';

async function testBVGApi() {
  console.log('[TEST] Starting BVG API test...');
  const origin = await resolveStop('S Hohenzollerndamm');
  const dest   = await resolveStop('Potsdam Hbf');
  console.log('[TEST] Origin:', origin?.name, origin?.id);
  console.log('[TEST] Destination:', dest?.name, dest?.id);

  if (origin && dest) {
    const now = new Date();
    now.setHours(23, 30, 0, 0);
    const journeys = await fetchJourneys(origin.id, dest.id, now.toISOString());
    console.log('[TEST] Journeys found:', journeys.length);
    if (journeys.length > 0) {
      const result = evaluateJourney(journeys[0]);
      console.log('[TEST] Alert result:', result.status, result.details);
    }
  }
}

testBVGApi();

export default App;
