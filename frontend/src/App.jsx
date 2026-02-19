import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './store/store';
import { ThemeProvider } from './context/ThemeContext';
import Layout from './layouts/Layout';
import Feed from './pages/Feed';
import Login from './pages/Login';
import Register from './pages/Register';
import VerifyEmail from './pages/VerifyEmail';
import GoogleCallback from './pages/GoogleCallback';
import UserProfile from './pages/UserProfile';
import StatusDetail from './pages/StatusDetail';
import ProtectedRoute from './components/ProtectedRoute';
import PublicRoute from './components/PublicRoute';
import ChatsPage from './pages/Chats';
import NotificationsPage from './pages/Notifications';
import AdminPage from './pages/AdminPage';
import Download from './pages/Download';
import MobileAppRedirect from './pages/MobileAppRedirect';
import InstallPWA from './pages/InstallPWA';
import ThankYouInstall from './pages/ThankYouInstall';
import SettingsPage from './pages/SettingsPage';
import SupportPage from './pages/SupportPage';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';
import SafetyStandardsPage from './pages/SafetyStandardsPage';
import SignalRProvider from './components/SignalRProvider';
import PushNotificationProvider from './components/PushNotificationProvider';

function App() {
  return (
    <Provider store={store}>
      <ThemeProvider>
        <BrowserRouter>
          <SignalRProvider>
            <PushNotificationProvider>
              <Layout>
            <Routes>
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <Feed />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/login"
                element={
                  <PublicRoute>
                    <Login />
                  </PublicRoute>
                }
              />
              <Route
                path="/register"
                element={
                  <PublicRoute>
                    <Register />
                  </PublicRoute>
                }
              />
              <Route
                path="/verify-email"
                element={
                  <PublicRoute>
                    <VerifyEmail />
                  </PublicRoute>
                }
              />
              <Route
                path="/google/callback"
                element={
                  <PublicRoute>
                    <GoogleCallback />
                  </PublicRoute>
                }
              />
              <Route
                path="/perfil/:userId"
                element={
                  <ProtectedRoute>
                    <UserProfile />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/status/:statusId"
                element={
                  <ProtectedRoute>
                    <StatusDetail />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/chats"
                element={
                  <ProtectedRoute>
                    <ChatsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/notifications"
                element={
                  <ProtectedRoute>
                    <NotificationsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin"
                element={
                  <ProtectedRoute>
                    <AdminPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/download"
                element={
                  <Download />
                }
              />
              <Route
                path="/descargar-app"
                element={
                  <MobileAppRedirect />
                }
              />
              <Route
                path="/instalar-pwa"
                element={
                  <InstallPWA />
                }
              />
              <Route
                path="/gracias-por-instalar"
                element={
                  <ThankYouInstall />
                }
              />
              <Route
                path="/settings"
                element={
                  <ProtectedRoute>
                    <SettingsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/support"
                element={
                  <SupportPage />
                }
              />
              <Route
                path="/privacy-policy"
                element={
                  <PrivacyPolicyPage />
                }
              />
              <Route
                path="/safety-standards"
                element={
                  <SafetyStandardsPage />
                }
              />
            </Routes>
          </Layout>
          </PushNotificationProvider>
        </SignalRProvider>
      </BrowserRouter>
      </ThemeProvider>
    </Provider>
  );
}

export default App;