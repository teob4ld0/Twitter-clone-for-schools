import { useEffect, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { fetchChats, fetchMessages } from '../store/chatSlice';

/**
 * Hook para polling de chats y mensajes
 * @param {number} selectedChatId - ID del chat seleccionado
 * @param {boolean} enabled - Si el polling está habilitado
 * @param {number} interval - Intervalo de polling en ms (default: 3000)
 */
export const useChatPolling = (selectedChatId, enabled = true, interval = 3000) => {
	const dispatch = useDispatch();
	const intervalRef = useRef(null);

	useEffect(() => {
		if (!enabled) return;

		// Polling de la lista de chats
		const pollChats = () => {
			dispatch(fetchChats());
		};

		// Iniciar polling
		pollChats(); // Primera llamada inmediata
		intervalRef.current = setInterval(pollChats, interval);

		return () => {
			if (intervalRef.current) {
				clearInterval(intervalRef.current);
			}
		};
	}, [dispatch, enabled, interval]);

	// Polling de mensajes del chat seleccionado
	useEffect(() => {
		if (!enabled || !selectedChatId) return;

		const pollMessages = () => {
			dispatch(fetchMessages(selectedChatId));
		};

		// Polling de mensajes más frecuente
		const messagesInterval = setInterval(pollMessages, interval);

		return () => {
			clearInterval(messagesInterval);
		};
	}, [dispatch, selectedChatId, enabled, interval]);
};
