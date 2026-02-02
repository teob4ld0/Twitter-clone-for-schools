import * as signalR from '@microsoft/signalr';

let chatConnection = null;
let notificationConnection = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;

// Default to same-origin so HTTPS pages use WSS automatically.
// If your frontend is hosted separately from the backend, set VITE_HUB_BASE_URL
// (e.g., https://io.twittetec.com) at build time.
const HUB_BASE_URL = import.meta.env.VITE_HUB_BASE_URL || '';

const joinUrl = (base, path) => {
	if (!base) return path;
	return `${base.replace(/\/$/, '')}${path}`;
};

export const startSignalRConnection = async (token, onReceiveMessage, onMessageDeleted, onChatUpdated, onReceiveNotification) => {
	const chatConnected = chatConnection && chatConnection.state === signalR.HubConnectionState.Connected;
	const notificationsConnected = notificationConnection && notificationConnection.state === signalR.HubConnectionState.Connected;

	if (chatConnected && notificationsConnected) {
		console.log('SignalR already connected');
		return chatConnection;
	}

	chatConnection = new signalR.HubConnectionBuilder()
		.withUrl(joinUrl(HUB_BASE_URL, '/hubs/chat'), {
			accessTokenFactory: () => token,
			skipNegotiation: false,
			transport: signalR.HttpTransportType.WebSockets | signalR.HttpTransportType.ServerSentEvents | signalR.HttpTransportType.LongPolling
		})
		.withAutomaticReconnect({
			nextRetryDelayInMilliseconds: (retryContext) => {
				if (retryContext.previousRetryCount < MAX_RECONNECT_ATTEMPTS) {
					return Math.min(1000 * Math.pow(2, retryContext.previousRetryCount), 30000);
				}
				return null;
			}
		})
		.configureLogging(signalR.LogLevel.Information)
		.build();

	// Event handlers
	chatConnection.on('ReceiveMessage', (message) => {
		console.log('SignalR: Message received', message);
		if (onReceiveMessage) onReceiveMessage(message);
	});

	chatConnection.on('MessageDeleted', (data) => {
		console.log('SignalR: Message deleted', data);
		if (onMessageDeleted) onMessageDeleted(data);
	});

	chatConnection.on('ChatUpdated', (chatId) => {
		console.log('SignalR: Chat updated', chatId);
		if (onChatUpdated) onChatUpdated(chatId);
	});

	notificationConnection = new signalR.HubConnectionBuilder()
		.withUrl(joinUrl(HUB_BASE_URL, '/hubs/notifications'), {
			accessTokenFactory: () => token,
			skipNegotiation: false,
			transport: signalR.HttpTransportType.WebSockets | signalR.HttpTransportType.ServerSentEvents | signalR.HttpTransportType.LongPolling
		})
		.withAutomaticReconnect({
			nextRetryDelayInMilliseconds: (retryContext) => {
				if (retryContext.previousRetryCount < MAX_RECONNECT_ATTEMPTS) {
					return Math.min(1000 * Math.pow(2, retryContext.previousRetryCount), 30000);
				}
				return null;
			}
		})
		.configureLogging(signalR.LogLevel.Information)
		.build();

	notificationConnection.on('ReceiveNotification', (notification) => {
		console.log('SignalR: Notification received', notification);
		if (onReceiveNotification) onReceiveNotification(notification);
	});

	// Connection lifecycle events
	chatConnection.onreconnecting((error) => {
		console.warn('SignalR: Reconnecting...', error);
		reconnectAttempts++;
	});
	notificationConnection.onreconnecting((error) => {
		console.warn('SignalR: Reconnecting (notifications)...', error);
		reconnectAttempts++;
	});

	chatConnection.onreconnected((connectionId) => {
		console.log('SignalR: Reconnected', connectionId);
		reconnectAttempts = 0;
	});
	notificationConnection.onreconnected((connectionId) => {
		console.log('SignalR: Reconnected (notifications)', connectionId);
		reconnectAttempts = 0;
	});

	chatConnection.onclose((error) => {
		console.error('SignalR: Connection closed', error);
		if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
			console.error('SignalR: Max reconnect attempts reached');
		}
	});
	notificationConnection.onclose((error) => {
		console.error('SignalR: Notifications connection closed', error);
		if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
			console.error('SignalR: Max reconnect attempts reached');
		}
	});

	try {
		await Promise.all([chatConnection.start(), notificationConnection.start()]);
		console.log('SignalR: Connected successfully');
		reconnectAttempts = 0;
		return chatConnection;
	} catch (error) {
		console.error('SignalR: Connection failed', error);
		throw error;
	}
};

export const stopSignalRConnection = async () => {
	if (chatConnection || notificationConnection) {
		try {
			await Promise.all([
				chatConnection ? chatConnection.stop() : Promise.resolve(),
				notificationConnection ? notificationConnection.stop() : Promise.resolve()
			]);
			console.log('SignalR: Connection stopped');
			chatConnection = null;
			notificationConnection = null;
			reconnectAttempts = 0;
		} catch (error) {
			console.error('SignalR: Error stopping connection', error);
		}
	}
};

export const getSignalRConnection = () => chatConnection;

export const isConnected = () => {
	return (
		chatConnection &&
		notificationConnection &&
		chatConnection.state === signalR.HubConnectionState.Connected &&
		notificationConnection.state === signalR.HubConnectionState.Connected
	);
};
