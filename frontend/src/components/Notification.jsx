import { useNavigate } from 'react-router-dom';

const notificationTypeLabels = {
	1: 'liked your status',
	2: 'replied to your status',
	3: 'started following you',
	4: 'sent you a message',
	5: 'replied to your reply',
	6: 'mentioned you',
	7: 'reposted your status',
	8: 'quoted your status'
};

export default function Notification({ notification, onMarkAsRead }) {
	const navigate = useNavigate();

	const handleClick = () => {
		// Marcar como leída al hacer clic
		if (!notification.isRead && onMarkAsRead) {
			onMarkAsRead(notification.id);
		}

		// Navegar según el tipo
		if (notification.type === 4) {
			// Message - ir a chats
			navigate('/chats');
		} else if (notification.type === 3) {
			// Follow - ir al perfil del actor
			navigate(`/perfil/${notification.actorId}`);
		} else if (notification.statusId) {
			// Like/Reply/Mention sobre un status o una respuesta:
			// ir directo al status involucrado (si es reply, abre la reply).
			navigate(`/status/${notification.statusId}`);
		} else if (notification.threadId) {
			// Fallback: ir al thread (status raíz) si no hay statusId.
			navigate(`/status/${notification.threadId}`);
		}
	};

	const formatTime = (dateString) => {
		const date = new Date(dateString);
		const now = new Date();
		const diffMs = now - date;
		const diffMins = Math.floor(diffMs / 60000);
		const diffHours = Math.floor(diffMs / 3600000);
		const diffDays = Math.floor(diffMs / 86400000);

		if (diffMins < 1) return 'just now';
		if (diffMins < 60) return `${diffMins}m ago`;
		if (diffHours < 24) return `${diffHours}h ago`;
		if (diffDays < 7) return `${diffDays}d ago`;
		return date.toLocaleDateString();
	};

	return (
		<div
			onClick={handleClick}
			style={{
				padding: '12px 16px',
				borderBottom: '1px solid #e1e8ed',
				cursor: 'pointer',
				backgroundColor: notification.isRead ? '#fff' : '#f7f9fa',
				transition: 'background-color 0.2s',
				display: 'flex',
				gap: '12px',
				alignItems: 'flex-start'
			}}
			onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f0f0f0'}
			onMouseLeave={(e) => e.currentTarget.style.backgroundColor = notification.isRead ? '#fff' : '#f7f9fa'}
		>
			{/* Avatar placeholder */}
			<div style={{
				width: '40px',
				height: '40px',
				borderRadius: '50%',
				backgroundColor: '#1da1f2',
				color: 'white',
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'center',
				fontSize: '1rem',
				fontWeight: 'bold',
				flexShrink: 0
			}}>
				{notification.actor?.username?.charAt(0).toUpperCase() || '?'}
			</div>

			{/* Content */}
			<div style={{ flex: 1, minWidth: 0 }}>
				<div style={{ fontSize: '14px', lineHeight: '1.4' }}>
					<strong>{notification.actor?.username || 'Someone'}</strong>
					{' '}
					<span style={{ color: '#657786' }}>
						{notification.type === 1 && notification.parentStatusId
							? 'liked your reply'
							: (notification.type === 7 && notification.parentStatusId
								? 'reposted your reply'
								: (notification.type === 8 && notification.quotedParentStatusId
									? 'quoted your reply'
									: notificationTypeLabels[notification.type] || 'interacted with you'
								)
							)
						}
					</span>
				</div>
				<div style={{ fontSize: '13px', color: '#657786', marginTop: '4px' }}>
					{formatTime(notification.createdAt)}
				</div>
			</div>

			{/* Unread indicator */}
			{!notification.isRead && (
				<div style={{
					width: '8px',
					height: '8px',
					borderRadius: '50%',
					backgroundColor: '#1da1f2',
					flexShrink: 0,
					marginTop: '6px'
				}} />
			)}
		</div>
	);
}
