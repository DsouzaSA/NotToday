import React, { useEffect } from 'react';
import { StatusBar, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context'
import {
  setupNotificationChannels,
  requestNotificationPermission,
} from './src/services/notificationService';
import {
  initBackgroundFetch,
  scheduleAllChecks,
  ScheduledRoute,
} from './src/services/backgroundFetch';

// Your saved route
const MY_ROUTE: ScheduledRoute = {
  id: 'route-1',
  originName: 'S Hohenzollerndamm (Berlin)',
  destinationName: 'S Potsdam Hauptbahnhof',
  originId: '900044101',
  destinationId: '900230999',
  departureTime: '23:30',
  enabled: true,
};

function App(): React.JSX.Element {
  useEffect(() => {
    async function init() {
      // 1. Set up notification channels
      await setupNotificationChannels();

      // 2. Request permission
      const granted = await requestNotificationPermission();
      if (!granted) {
        console.warn('[App] Notification permission denied');
        return;
      }

      // 3. Init background fetch
      await initBackgroundFetch([MY_ROUTE]);

      // 4. Schedule exact checks for today
      await scheduleAllChecks(MY_ROUTE);

      console.log('[App] All systems ready ✅');
    }

    init();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0D0D1A" />
      <View style={styles.content}>
        <Text style={styles.title}>NotToday</Text>
        <Text style={styles.subtitle}>BVG Transit Alert</Text>
        <View style={styles.routeCard}>
          <Text style={styles.routeLabel}>Monitoring</Text>
          <Text style={styles.routeText}>S Hohenzollerndamm</Text>
          <Text style={styles.routeArrow}>↓</Text>
          <Text style={styles.routeText}>Potsdam Hbf</Text>
          <Text style={styles.routeTime}>Departure: 23:30</Text>
        </View>
        <Text style={styles.status}>
          Checks scheduled at 23:00 · 23:15 · 23:25
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D0D1A',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    fontSize: 42,
    fontWeight: '800',
    color: '#F0C832',
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 14,
    color: '#888',
    marginBottom: 48,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  routeCard: {
    backgroundColor: '#1A1A2E',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(240,200,50,0.2)',
    marginBottom: 24,
  },
  routeLabel: {
    fontSize: 11,
    color: '#F0C832',
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: 12,
  },
  routeText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  routeArrow: {
    fontSize: 20,
    color: '#F0C832',
    marginVertical: 4,
  },
  routeTime: {
    fontSize: 13,
    color: '#888',
    marginTop: 12,
  },
  status: {
    fontSize: 12,
    color: '#555',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
});

export default App;