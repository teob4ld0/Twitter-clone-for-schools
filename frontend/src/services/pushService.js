import api from './api';

// Convertir VAPID key de base64 a Uint8Array
function urlBase64ToUint8Array(base64String) {
	const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
	const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
	const rawData = window.atob(base64);
	const outputArray = new Uint8Array(rawData.length);
	for (let i = 0; i < rawData.length; ++i) {
		outputArray[i] = rawData.charCodeAt(i);
	}
	return outputArray;
}

// Verificar si el navegador soporta notificaciones push
export function isPushSupported() {
	return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
}

// Obtener la clave pública VAPID del servidor
export async function getVapidPublicKey() {
	try {
		const response = await api.get('/push/public-key');
		return response.data.publicKey;
	} catch (error) {
		console.error('Error getting VAPID public key:', error);
		throw error;
	}
}

// Solicitar permiso de notificaciones y suscribirse
export async function subscribeToPushNotifications() {
	if (!isPushSupported()) {
		throw new Error('Push notifications are not supported in this browser');
	}

	// Verificar permiso de notificaciones
	const permission = await Notification.requestPermission();
	if (permission !== 'granted') {
		throw new Error('Notification permission denied');
	}

	try {
		// Obtener el service worker registration
		const registration = await navigator.serviceWorker.ready;

		// Obtener la clave pública VAPID del servidor
		const vapidPublicKey = await getVapidPublicKey();
		const applicationServerKey = urlBase64ToUint8Array(vapidPublicKey);

		// Verificar si ya existe una suscripción
		let subscription = await registration.pushManager.getSubscription();

		// Si no existe, crear una nueva
		if (!subscription) {
			subscription = await registration.pushManager.subscribe({
				userVisibleOnly: true,
				applicationServerKey: applicationServerKey
			});
		}

		// Enviar la suscripción al servidor
		const subscriptionJson = subscription.toJSON();
		await api.post('/push/subscribe', subscriptionJson);

		console.log('Push subscription successful:', subscriptionJson);
		return subscription;
	} catch (error) {
		console.error('Error subscribing to push notifications:', error);
		throw error;
	}
}

// Desuscribirse de las notificaciones push
export async function unsubscribeFromPushNotifications() {
	if (!isPushSupported()) {
		return;
	}

	try {
		const registration = await navigator.serviceWorker.ready;
		const subscription = await registration.pushManager.getSubscription();

		if (subscription) {
			// Desuscribirse en el cliente
			await subscription.unsubscribe();

			// Notificar al servidor
			const subscriptionJson = subscription.toJSON();
			await api.post('/push/unsubscribe', subscriptionJson);

			console.log('Push unsubscription successful');
		}
	} catch (error) {
		console.error('Error unsubscribing from push notifications:', error);
		throw error;
	}
}

// Verificar si el usuario está suscrito
export async function isSubscribedToPush() {
	if (!isPushSupported()) {
		return false;
	}

	try {
		const registration = await navigator.serviceWorker.ready;
		const subscription = await registration.pushManager.getSubscription();
		return subscription !== null;
	} catch (error) {
		console.error('Error checking push subscription:', error);
		return false;
	}
}

// Verificar estado del permiso de notificaciones
export function getNotificationPermission() {
	if ('Notification' in window) {
		return Notification.permission;
	}
	return 'default';
}
