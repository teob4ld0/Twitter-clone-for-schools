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
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
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
import SettingsScreen from './src/screens/SettingsScreen';

// Components
import SignalRProvider from './src/components/SignalRProvider';
import TabBar from './src/components/TabBar';
import PushNotificationProvider from './src/components/PushNotificationProvider';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Header component
function Header({ navigation }) {
  const { logout } = useAuth();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();

  const headerStyles = {
    header: {
      backgroundColor: theme.colors.primary,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
      shadowColor: theme.colors.shadowColor,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 4,
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: theme.colors.textOnPrimary,
    },
  };

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
    <View style={[headerStyles.header, { paddingTop: insets.top + 12 }]}>
      <Text style={headerStyles.headerTitle}>Twitetec</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <TouchableOpacity onPress={() => navigation.navigate('Settings')} style={styles.logoutButton}>
          <Feather name="settings" size={20} color={theme.colors.textOnPrimary} />
        </TouchableOpacity>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <Feather name="log-out" size={20} color={theme.colors.textOnPrimary} />
        </TouchableOpacity>
      </View>
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
  const { theme } = useTheme();
  const navigationRef = useNavigationContainerRef();

  const loadingStyles = {
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme.colors.background,
    },
    loadingText: {
      marginTop: 16,
      fontSize: 16,
      color: theme.colors.textSecondary,
    },
  };

  // Mostrar loading mientras se verifica la autenticación o se rehidrata el estado
  if (loading || isRehydrating) {
    return (
      <View style={loadingStyles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={loadingStyles.loadingText}>Cargando...</Text>
      </View>
    );
  }

  const authenticated = isAuthenticated();

  const screenOptions = {
    headerStyle: { backgroundColor: theme.colors.primary },
    headerTintColor: theme.colors.textOnPrimary,
  };

  return (
    <NavigationContainer ref={navigationRef}>
      <SignalRProvider>
        <PushNotificationProvider navigation={navigationRef}>
          {authenticated ? (
            <Stack.Navigator screenOptions={{ headerShown: false }}>
              <Stack.Screen name="MainTabs" component={MainTabs} />
              <Stack.Screen 
                name="StatusDetail" 
                component={StatusDetailScreen}
                options={{
                  headerShown: true,
                  ...screenOptions,
                  headerTitle: 'Estado',
                }}
              />
              <Stack.Screen 
                name="ChatDetail" 
                component={ChatDetailScreen}
                options={{
                  headerShown: true,
                  ...screenOptions,
                  headerTitle: 'Chat',
                }}
              />
              <Stack.Screen 
                name="UserProfile" 
                component={ProfileScreen}
                options={{
                  headerShown: true,
                  ...screenOptions,
                  headerTitle: 'Perfil de Usuario',
                }}
              />
              <Stack.Screen 
                name="Admin" 
                component={AdminScreen}
                options={{
                  headerShown: true,
                  ...screenOptions,
                  headerTitle: 'Administración',
                }}
              />
              <Stack.Screen 
                name="Settings" 
                component={SettingsScreen}
                options={{
                  headerShown: false,
                }}
              />
            </Stack.Navigator>
          ) : (
            <Stack.Navigator screenOptions={{ headerShown: false }}>
              <Stack.Screen name="Login" component={LoginScreen} />
              <Stack.Screen name="Register" component={RegisterScreen} />
            </Stack.Navigator>
          )}
        </PushNotificationProvider>
      </SignalRProvider>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <Provider store={store}>
      <ThemeProvider>
        <AuthProvider>
          <AppNavigator />
        </AuthProvider>
      </ThemeProvider>
    </Provider>
  );
}

const styles = StyleSheet.create({
  logoutButton: {
    padding: 8,
    borderRadius: 20,
  },
});