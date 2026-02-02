import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api, { mediaAPI } from '../services/api';

const getErrorMessage = (error) => {
	const data = error?.response?.data;
	if (typeof data === 'string' && data.trim()) return data;
	if (data?.message) return data.message;
	return error?.message || 'Request failed';
};

// Async thunks
export const fetchChats = createAsyncThunk(
	'chat/fetchChats',
	async (_, { rejectWithValue }) => {
		try {
			const response = await api.get('/chats');
			const data = response.data;
			return Array.isArray(data) ? data : [];
		} catch (error) {
			return rejectWithValue(getErrorMessage(error));
		}
	}
);

export const fetchMessages = createAsyncThunk(
	'chat/fetchMessages',
	async (chatId, { rejectWithValue }) => {
		try {
			const response = await api.get(`/chats/${chatId}/messages`);
			const data = response.data;
			return {
				chatId,
				messages: data.messages || [],
				markedAsReadCount: data.markedAsReadCount || 0
			};
		} catch (error) {
			return rejectWithValue(getErrorMessage(error));
		}
	}
);

export const sendMessage = createAsyncThunk(
	'chat/sendMessage',
	async ({ chatId, content, file }, { rejectWithValue }) => {
		try {
			const normalizedContent = (content ?? '').trim();
			let mediaUrl = null;

			if (file) {
				const uploadRes = await mediaAPI.upload(file, `chats/${chatId}`);
				mediaUrl = uploadRes?.data?.publicUrl ?? null;
				if (!mediaUrl) {
					throw new Error('Upload did not return publicUrl');
				}
			}

			if (!normalizedContent && !mediaUrl) {
				throw new Error('Content or media is required');
			}
			const response = await api.post(`/chats/${chatId}/messages`, {
				Content: normalizedContent,
				MediaUrl: mediaUrl
			});
			const message = response.data;
			return { chatId, message };
		} catch (error) {
			return rejectWithValue(getErrorMessage(error));
		}
	}
);

export const deleteMessage = createAsyncThunk(
	'chat/deleteMessage',
	async ({ chatId, messageId }, { rejectWithValue }) => {
		try {
			await api.delete(`/chats/${chatId}/messages/${messageId}`);
			return { chatId, messageId };
		} catch (error) {
			return rejectWithValue(getErrorMessage(error));
		}
	}
);

export const createOrGetChat = createAsyncThunk(
	'chat/createOrGetChat',
	async (otherUserId, { rejectWithValue }) => {
		try {
			const response = await api.post(`/chats/${otherUserId}`);
			const chat = response.data;
			return chat;
		} catch (error) {
			return rejectWithValue(getErrorMessage(error));
		}
	}
);

const chatSlice = createSlice({
	name: 'chat',
	initialState: {
		chats: [],
		messages: {},
		selectedChatId: null,
		loading: {
			chats: false,
			messages: false,
			sending: false
		},
		error: null,
		lastUpdate: null
	},
	reducers: {
		setSelectedChat: (state, action) => {
			state.selectedChatId = action.payload;
		},
		clearError: (state) => {
			state.error = null;
		},
		updateChatLocally: (state, action) => {
			const index = state.chats.findIndex(c => c.id === action.payload.id);
			if (index !== -1) {
				state.chats[index] = { ...state.chats[index], ...action.payload };
			}
		},
		// Actions para manejar eventos de SignalR
		receiveMessageFromSignalR: (state, action) => {
			const message = action.payload;
			if (!state.messages[message.chatId]) {
				state.messages[message.chatId] = [];
			}
			// Evitar duplicados
			const exists = state.messages[message.chatId].some(m => m.id === message.id);
			if (!exists) {
				state.messages[message.chatId].push(message);
			}

			// Mantener la lista de chats actualizada (preview + orden + unreadCount)
			const chatIndex = state.chats.findIndex(c => c.id === message.chatId);
			if (chatIndex !== -1) {
				const chat = state.chats[chatIndex];
				const shouldIncrementUnread = state.selectedChatId !== message.chatId;
				const nextUnread = shouldIncrementUnread ? (chat.unreadCount || 0) + 1 : (chat.unreadCount || 0);
				const updated = { ...chat, lastMessage: message, unreadCount: nextUnread };
				state.chats.splice(chatIndex, 1);
				state.chats.unshift(updated);
			}
			state.lastUpdate = Date.now();
		},
		deleteMessageFromSignalR: (state, action) => {
			const { chatId, messageId } = action.payload;
			if (state.messages[chatId]) {
				state.messages[chatId] = state.messages[chatId].filter(m => m.id !== messageId);
			}
			state.lastUpdate = Date.now();
		}
	},
	extraReducers: (builder) => {
		builder
			// Fetch chats
			.addCase(fetchChats.pending, (state) => {
				state.loading.chats = true;
				state.error = null;
			})
			.addCase(fetchChats.fulfilled, (state, action) => {
				state.loading.chats = false;
				state.chats = action.payload;
				state.lastUpdate = Date.now();
			})
			.addCase(fetchChats.rejected, (state, action) => {
				state.loading.chats = false;
				state.error = action.payload;
			})
			// Fetch messages
			.addCase(fetchMessages.pending, (state) => {
				state.loading.messages = true;
				state.error = null;
			})
			.addCase(fetchMessages.fulfilled, (state, action) => {
				state.loading.messages = false;
				const { chatId, messages, markedAsReadCount } = action.payload;
				state.messages[chatId] = messages;

				// Si al cargar mensajes se marcaron como leídos en backend, reflejarlo ya en la UI
				if (markedAsReadCount > 0) {
					const chatIndex = state.chats.findIndex(c => c.id === chatId);
					if (chatIndex !== -1) {
						const chat = state.chats[chatIndex];
						const lastMessage = messages && messages.length > 0 ? messages[messages.length - 1] : chat.lastMessage;
						state.chats[chatIndex] = { ...chat, unreadCount: 0, lastMessage };
					}
					state.lastUpdate = Date.now();
				}
			})
			.addCase(fetchMessages.rejected, (state, action) => {
				state.loading.messages = false;
				state.error = action.payload;
			})
			// Send message
			.addCase(sendMessage.pending, (state) => {
				state.loading.sending = true;
				state.error = null;
			})
			.addCase(sendMessage.fulfilled, (state, action) => {
				state.loading.sending = false;
				const { chatId, message } = action.payload;
				if (!state.messages[chatId]) {
					state.messages[chatId] = [];
				}
				state.messages[chatId].push(message);

				// Actualizar preview/orden del chat localmente
				const chatIndex = state.chats.findIndex(c => c.id === chatId);
				if (chatIndex !== -1) {
					const chat = state.chats[chatIndex];
					const updated = { ...chat, lastMessage: message, unreadCount: chat.unreadCount || 0 };
					state.chats.splice(chatIndex, 1);
					state.chats.unshift(updated);
				}
				state.lastUpdate = Date.now();
			})
			.addCase(sendMessage.rejected, (state, action) => {
				state.loading.sending = false;
				state.error = action.payload;
			})
			// Delete message
			.addCase(deleteMessage.fulfilled, (state, action) => {
				const { chatId, messageId } = action.payload;
				if (state.messages[chatId]) {
					state.messages[chatId] = state.messages[chatId].filter(m => m.id !== messageId);
				}
				state.lastUpdate = Date.now();
			})
			// Create or get chat
			.addCase(createOrGetChat.fulfilled, (state, action) => {
				const existingIndex = state.chats.findIndex(c => c.id === action.payload.id);
				if (existingIndex === -1) {
					state.chats.unshift(action.payload);
				}
				state.selectedChatId = action.payload.id;
			});
	}
});

export const {
	setSelectedChat,
	clearError,
	updateChatLocally,
	receiveMessageFromSignalR,
	deleteMessageFromSignalR
} = chatSlice.actions;
export default chatSlice.reducer;
