import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchNotifications, markAsRead, markAllAsRead } from '../store/notificationSlice';
import Notification from '../components/Notification';

export default function NotificationsPage() {
	const dispatch = useDispatch();
	const { notifications, unreadCount, loading, error } = useSelector((state) => state.notification);

	useEffect(() => {
		dispatch(fetchNotifications());
	}, [dispatch]);

	const handleMarkAsRead = (notificationId) => {
		dispatch(markAsRead(notificationId));
	};

	const handleMarkAllAsRead = () => {
		dispatch(markAllAsRead());
	};

	if (loading) {
		return (
			<div style={{ padding: '20px', textAlign: 'center' }}>
				<div>Loading notifications...</div>
			</div>
		);
	}

	return (
		<div style={{ maxWidth: '600px', margin: '0 auto', backgroundColor: '#fff', minHeight: '100vh' }}>
			{/* Header */}
			<div style={{
				padding: '16px 20px',
				borderBottom: '1px solid #e1e8ed',
				position: 'sticky',
				top: 0,
				backgroundColor: '#fff',
				zIndex: 10,
				display: 'flex',
				justifyContent: 'space-between',
				alignItems: 'center'
			}}>
				<h1 style={{ fontSize: '20px', fontWeight: 'bold', margin: 0 }}>
					Notifications
				</h1>
				{unreadCount > 0 && (
					<button
						onClick={handleMarkAllAsRead}
						style={{
							background: 'none',
							border: 'none',
							color: '#1da1f2',
							fontSize: '14px',
							cursor: 'pointer',
							fontWeight: '500'
						}}
					>
						Mark all as read
					</button>
				)}
			</div>

			{/* Error message */}
			{error && (
				<div style={{
					padding: '16px',
					backgroundColor: '#ffebee',
					color: '#c62828',
					fontSize: '14px'
				}}>
					Error: {error}
				</div>
			)}

			{/* Notifications list */}
			{notifications.length === 0 ? (
				<div style={{
					padding: '40px 20px',
					textAlign: 'center',
					color: '#657786'
				}}>
					<div style={{ fontSize: '48px', marginBottom: '16px' }}>🔔</div>
					<div style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '8px' }}>
						No notifications yet
					</div>
					<div style={{ fontSize: '14px' }}>
						When someone interacts with you, you'll see it here
					</div>
				</div>
			) : (
				<div>
					{notifications.map((notification) => (
						<Notification
							key={notification.id}
							notification={notification}
							onMarkAsRead={handleMarkAsRead}
						/>
					))}
				</div>
			)}
		</div>
	);
}
