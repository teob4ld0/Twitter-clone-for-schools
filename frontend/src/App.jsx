import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './store/store';
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
import SignalRProvider from './components/SignalRProvider';
import PushNotificationProvider from './components/PushNotificationProvider';
import InstallPrompt from './components/InstallPrompt';

function App() {
  return (
    <Provider store={store}>
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
            </Routes>
          </Layout>
          <InstallPrompt />
          </PushNotificationProvider>
        </SignalRProvider>
      </BrowserRouter>
    </Provider>
  );
}

export default App;