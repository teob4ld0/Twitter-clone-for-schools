import 'react-native-gesture-handler';
import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { NavigationContainer, useNavigationContainerRef } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Provider } from 'react-redux';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { store } from './src/store/store';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { colors } from './src/styles/colors';

// Screens
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import FeedScreen from './src/screens/FeedScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import StatusDetailScreen from './src/screens/StatusDetailScreen';
import ChatsScreen from './src/screens/ChatsScreen';
import ChatDetailScreen from './src/screens/ChatDetailScreen';
import NotificationsScreen from './src/screens/NotificationsScreen';
import AdminScreen from './src/screens/AdminScreen';

// Components
import SignalRProvider from './src/components/SignalRProvider';
import TabBar from './src/components/TabBar';
import PushNotificationProvider from './src/components/PushNotificationProvider';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Header component
function Header({ navigation }) {
  const { logout } = useAuth();
  const insets = useSafeAreaInsets();

  const handleLogout = () => {
    Alert.alert(
      'Cerrar Sesión',
      '¿Estás seguro que deseas cerrar sesión?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Salir', 
          style: 'destructive',
          onPress: async () => {
            await logout();
          }
        }
      ]
    );
  };

  return (
    <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
      <Text style={styles.headerTitle}>Twitetec</Text>
      <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
        <Feather name="log-out" size={20} color={colors.white} />
      </TouchableOpacity>
    </View>
  );
}

// Tab Navigator para la app autenticada
function MainTabs() {
  const { user } = useAuth();
  
  return (
    <Tab.Navigator
      tabBar={(props) => <TabBar {...props} />}
      screenOptions={{
        header: (props) => <Header {...props} />,
      }}
    >
      <Tab.Screen 
        name="Feed" 
        component={FeedScreen}
        options={{ title: 'Feed' }}
      />
      <Tab.Screen 
        name="Chats" 
        component={ChatsScreen}
        options={{ title: 'Chats' }}
      />
      <Tab.Screen 
        name="Notifications" 
        component={NotificationsScreen}
        options={{ title: 'Notif' }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{ title: 'Perfil' }}
        initialParams={{ userId: user?.id }}
      />
    </Tab.Navigator>
  );
}

function AppNavigator() {
  const { isAuthenticated, loading, isRehydrating } = useAuth();
  const navigationRef = useNavigationContainerRef();

  // Mostrar loading mientras se verifica la autenticación o se rehidrata el estado
  if (loading || isRehydrating) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Cargando...</Text>
      </View>
    );
  }

  return (
    <NavigationContainer ref={navigationRef}>
      {isAuthenticated() ? (
        <SignalRProvider>
          <PushNotificationProvider navigation={navigationRef}>
            <Stack.Navigator screenOptions={{ headerShown: false }}>
              <Stack.Screen name="MainTabs" component={MainTabs} />
            <Stack.Screen 
              name="StatusDetail" 
              component={StatusDetailScreen}
              options={{
                headerShown: true,
                headerStyle: { backgroundColor: colors.primary },
                headerTintColor: colors.white,
                headerTitle: 'Estado',
              }}
            />
            <Stack.Screen 
              name="ChatDetail" 
              component={ChatDetailScreen}
              options={{
                headerShown: true,
                headerStyle: { backgroundColor: colors.primary },
                headerTintColor: colors.white,
                headerTitle: 'Chat',
              }}
            />
            <Stack.Screen 
              name="UserProfile" 
              component={ProfileScreen}
              options={{
                headerShown: true,
                headerStyle: { backgroundColor: colors.primary },
                headerTintColor: colors.white,
                headerTitle: 'Perfil de Usuario',
              }}
            />
            <Stack.Screen 
              name="Admin" 
              component={AdminScreen}
              options={{
                headerShown: true,
                headerStyle: { backgroundColor: colors.primary },
                headerTintColor: colors.white,
                headerTitle: 'Administración',
              }}
            />
          </Stack.Navigator>
          </PushNotificationProvider>
        </SignalRProvider>
      ) : (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
        </Stack.Navigator>
      )}
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <Provider store={store}>
      <AuthProvider>
        <AppNavigator />
      </AuthProvider>
    </Provider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.textSecondary,
  },
  header: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.white,
  },
  logoutButton: {
    padding: 8,
    borderRadius: 20,
  },
});