// Adaptar a los status si es necesario
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { notificationsAPI, pushAPI } from '../services/api';
import * as pushService from '../services/pushService';

// Async thunks
export const fetchNotifications = createAsyncThunk(
	'notification/fetchNotifications',
	async (_, { rejectWithValue }) => {
		try {
			const response = await notificationsAPI.getAll();
			return Array.isArray(response.data) ? response.data : [];
		} catch (error) {
			return rejectWithValue(error.response?.data?.message || error.message);
		}
	}
);

export const markAsRead = createAsyncThunk(
	'notification/markAsRead',
	async (notificationId, { rejectWithValue }) => {
		try {
			await notificationsAPI.markAsRead(notificationId);
			return notificationId;
		} catch (error) {
			return rejectWithValue(error.response?.data?.message || error.message);
		}
	}
);

export const markAllAsRead = createAsyncThunk(
	'notification/markAllAsRead',
	async (_, { rejectWithValue }) => {
		try {
			await notificationsAPI.markAllAsRead();
			return true;
		} catch (error) {
			return rejectWithValue(error.response?.data?.message || error.message);
		}
	}
);

// Push notification thunks
export const subscribeToPush = createAsyncThunk(
	'notification/subscribeToPush',
	async (_, { rejectWithValue }) => {
		try {
			if (!pushService.isPushSupported()) {
				throw new Error('Push notifications not supported');
			}
			
			const subscription = await pushService.subscribeToPushNotifications();
			return {
				subscribed: true,
				permission: pushService.getNotificationPermission()
			};
		} catch (error) {
			return rejectWithValue(error.message || 'Failed to subscribe to push notifications');
		}
	}
);

export const unsubscribeFromPush = createAsyncThunk(
	'notification/unsubscribeFromPush',
	async (_, { rejectWithValue }) => {
		try {
			await pushService.unsubscribeFromPushNotifications();
			return {
				subscribed: false,
				permission: pushService.getNotificationPermission()
			};
		} catch (error) {
			return rejectWithValue(error.message || 'Failed to unsubscribe from push notifications');
		}
	}
);

export const checkPushSubscription = createAsyncThunk(
	'notification/checkPushSubscription',
	async (_, { rejectWithValue }) => {
		try {
			const isSubscribed = await pushService.isSubscribedToPush();
			const permission = pushService.getNotificationPermission();
			return { subscribed: isSubscribed, permission };
		} catch (error) {
			return rejectWithValue(error.message || 'Failed to check push subscription');
		}
	}
);

const notificationSlice = createSlice({
	name: 'notification',
	initialState: {
		notifications: [],
		unreadCount: 0,
		loading: false,
		error: null,
		pushSubscribed: false,
		pushPermission: 'default', // 'default', 'granted', 'denied'
		pushSupported: pushService.isPushSupported()
	},
	reducers: {
		receiveNotificationFromSignalR: (state, action) => {
			const notification = action.payload;
			// Agregar al principio de la lista
			state.notifications.unshift(notification);
			if (!notification.isRead) {
				state.unreadCount += 1;
			}
		},
		receiveNotificationFromPush: (state, action) => {
			const notification = action.payload;
			// Agregar al principio si no existe
			const exists = state.notifications.some(n => n.id === notification.id);
			if (!exists) {
				state.notifications.unshift(notification);
				if (!notification.isRead) {
					state.unreadCount += 1;
				}
			}
		},
		clearError: (state) => {
			state.error = null;
		},
		updatePushPermission: (state, action) => {
			state.pushPermission = action.payload;
		}
	},
	extraReducers: (builder) => {
		builder
			// Fetch notifications
			.addCase(fetchNotifications.pending, (state) => {
				state.loading = true;
				state.error = null;
			})
			.addCase(fetchNotifications.fulfilled, (state, action) => {
				state.loading = false;
				state.notifications = action.payload;
				state.unreadCount = action.payload.filter(n => !n.isRead).length;
			})
			.addCase(fetchNotifications.rejected, (state, action) => {
				state.loading = false;
				state.error = action.payload;
			})
			// Mark as read
			.addCase(markAsRead.fulfilled, (state, action) => {
				const notificationId = action.payload;
				const notification = state.notifications.find(n => n.id === notificationId);
				if (notification && !notification.isRead) {
					notification.isRead = true;
					state.unreadCount = Math.max(0, state.unreadCount - 1);
				}
			})
			// Mark all as read
			.addCase(markAllAsRead.fulfilled, (state) => {
				state.notifications.forEach(n => {
					n.isRead = true;
				});
				state.unreadCount = 0;
			})
			// Subscribe to push
			.addCase(subscribeToPush.pending, (state) => {
				state.loading = true;
				state.error = null;
			})
			.addCase(subscribeToPush.fulfilled, (state, action) => {
				state.loading = false;
				state.pushSubscribed = action.payload.subscribed;
				state.pushPermission = action.payload.permission;
			})
			.addCase(subscribeToPush.rejected, (state, action) => {
				state.loading = false;
				state.error = action.payload;
				state.pushSubscribed = false;
			})
			// Unsubscribe from push
			.addCase(unsubscribeFromPush.fulfilled, (state, action) => {
				state.pushSubscribed = action.payload.subscribed;
				state.pushPermission = action.payload.permission;
			})
			// Check push subscription
			.addCase(checkPushSubscription.fulfilled, (state, action) => {
				state.pushSubscribed = action.payload.subscribed;
				state.pushPermission = action.payload.permission;
			});
	}
});

export const { 
	receiveNotificationFromSignalR, 
	receiveNotificationFromPush,
	clearError,
	updatePushPermission
} = notificationSlice.actions;
export default notificationSlice.reducer;
