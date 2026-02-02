import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useAuth } from '../context/AuthContext';
import { 
	subscribeToPush, 
	checkPushSubscription,
	receiveNotificationFromPush,
	fetchNotifications 
} from '../store/notificationSlice';

export default function PushNotificationProvider({ children }) {
	const { isAuthenticated, loading } = useAuth();
	const dispatch = useDispatch();
	const { pushSubscribed, pushSupported } = useSelector(state => state.notification);

	useEffect(() => {
		// No hacer nada hasta que AuthContext termine de cargar
		if (loading) return;

		// Solo configurar push si está autenticado y el navegador lo soporta
		if (isAuthenticated() && pushSupported) {
			// Verificar estado de suscripción actual
			dispatch(checkPushSubscription());

			// Configurar listener para clicks en notificaciones push
			const handlePushNotificationClick = (event) => {
				const { data } = event.detail;
				
				// Cuando el usuario hace click, recargar notificaciones
				if (data) {
					dispatch(fetchNotifications());
					
					// Opcionalmente, agregar la notificación al store si tiene los datos
					if (data.id) {
						dispatch(receiveNotificationFromPush(data));
					}
				}
			};

			window.addEventListener('push-notification-clicked', handlePushNotificationClick);

			// Si no está suscrito, intentar suscribir automáticamente
			// (esto pedirá permiso al usuario)
			if (!pushSubscribed) {
				// Esperar un poco para no bombardear al usuario inmediatamente
				const subscribeTimer = setTimeout(() => {
					dispatch(subscribeToPush()).catch(error => {
						console.log('User declined push notifications or error:', error);
					});
				}, 3000); // 3 segundos después del login

				return () => {
					clearTimeout(subscribeTimer);
					window.removeEventListener('push-notification-clicked', handlePushNotificationClick);
				};
			}

			return () => {
				window.removeEventListener('push-notification-clicked', handlePushNotificationClick);
			};
		}
	}, [isAuthenticated, loading, pushSupported, pushSubscribed, dispatch]);

	return children;
}
