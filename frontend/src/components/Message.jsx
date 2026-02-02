import React from "react";

export default function Message({ message, currentUserId, compact = false, onDelete }) {
	if (!message) return null;
	// SenderId comes directly from the message object in camelCase
	const senderId = message.senderId;
	const sender = message.sender ?? {};
	// Use loose equality to handle string/number comparison
	const isMine = currentUserId != null && senderId != null && senderId == currentUserId;

	const renderMedia = (url) => {
		if (!url) return null;
		const lower = String(url).toLowerCase();
		const isVideo = lower.endsWith('.mp4') || lower.endsWith('.webm') || lower.endsWith('.mov') || lower.endsWith('.m4v');
		const isImage = lower.endsWith('.jpg') || lower.endsWith('.jpeg') || lower.endsWith('.png') || lower.endsWith('.gif') || lower.endsWith('.webp');

		const mediaStyle = {
			display: 'block',
			marginTop: 8,
			borderRadius: 10,
			maxWidth: compact ? 180 : 360,
			maxHeight: compact ? 180 : 360,
			width: '100%',
			objectFit: 'cover',
			background: isMine ? 'rgba(255,255,255,0.15)' : '#fff'
		};

		if (isVideo) {
			return <video controls style={mediaStyle} src={url} />;
		}
		if (isImage) {
			return <img alt="media" style={mediaStyle} src={url} />;
		}

		return (
			<a href={url} target="_blank" rel="noreferrer" style={{ display: 'inline-block', marginTop: 8, color: isMine ? '#fff' : '#0066cc' }}>
				{url}
			</a>
		);
	};
	const containerStyle = {
		display: "inline-block",
		padding: compact ? "6px 8px" : "10px 14px",
		borderRadius: 12,
		background: isMine ? "#0084ff" : "#f1f1f1",
		color: isMine ? "#fff" : "#111",
		maxWidth: "100%",
		fontSize: compact ? 12 : 14,
		position: "relative"
	};
	const metaStyle = { fontSize: 11, color: isMine ? "#fff" : "#666", marginTop: 6 };

	return (
		<div
			className={`message ${isMine ? "mine" : "theirs"}`}
			style={{ marginBottom: compact ? 4 : 8, textAlign: isMine ? "right" : "left" }}
		>
			<div style={containerStyle}>
				<div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
					<div style={{ flex: 1 }}>
						<div>{message.content}</div>
						{message.mediaUrl && renderMedia(message.mediaUrl)}
						{!compact && (
							<div style={metaStyle}>
								{isMine
									? (message.isRead ? "Read" : "Sent")
									: (sender?.username ?? "Unknown")
								}
							</div>
						)}
					</div>
					{isMine && onDelete && (
						<button
							onClick={onDelete}
							style={{
								background: "none",
								border: "none",
								fontSize: "1rem",
								cursor: "pointer",
								opacity: 0.7,
								transition: "opacity 0.2s",
								color: isMine ? "#fff" : "#666",
								padding: 0,
								lineHeight: 1
							}}
							onMouseEnter={(e) => e.currentTarget.style.opacity = "1"}
							onMouseLeave={(e) => e.currentTarget.style.opacity = "0.7"}
						>
							✕
						</button>
					)}
				</div>
			</div>
		</div>
	);
}