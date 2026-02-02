import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { useAuth } from '../context/AuthContext';
import { startSignalRConnection, stopSignalRConnection } from '../services/signalrService';
import { receiveMessageFromSignalR, deleteMessageFromSignalR, fetchChats } from '../store/chatSlice';
import { receiveNotificationFromSignalR } from '../store/notificationSlice';

export default function SignalRProvider({ children }) {
	const { isAuthenticated, loading, token } = useAuth();
	const dispatch = useDispatch();

	useEffect(() => {
		// No iniciar SignalR hasta que AuthContext termine de cargar
		if (loading) return;

		if (isAuthenticated() && token) {
			const handleReceiveMessage = (message) => {
				dispatch(receiveMessageFromSignalR(message));
			};

			const handleMessageDeleted = (data) => {
				dispatch(deleteMessageFromSignalR(data));
			};

			const handleChatUpdated = () => {
				dispatch(fetchChats());
			};

			const handleReceiveNotification = (notification) => {
				dispatch(receiveNotificationFromSignalR(notification));
			};

			startSignalRConnection(
				token,
				handleReceiveMessage,
				handleMessageDeleted,
				handleChatUpdated,
				handleReceiveNotification
			).catch(err => console.error('Failed to start SignalR:', err));

			return () => {
				stopSignalRConnection();
			};
		}
	}, [isAuthenticated, loading, token, dispatch]);

	return children;
}
