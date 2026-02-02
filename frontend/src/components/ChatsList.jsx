import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { followersAPI } from "../services/api";
import { useNavigate } from "react-router-dom";

export default function ChatsList({ onChatSelect, selectedChatId }) {
	const navigate = useNavigate();
	const { chats, loading, error } = useSelector((state) => ({
		chats: state.chat.chats,
		loading: state.chat.loading.chats,
		error: state.chat.error
	}));

	const [followStatusByUserId, setFollowStatusByUserId] = useState({});

	useEffect(() => {
		let cancelled = false;

		const loadFollowStatuses = async () => {
			try {
				const otherUserIds = Array.from(
					new Set((chats ?? []).map((c) => c.otherUser?.id).filter(Boolean))
				);

				if (otherUserIds.length === 0) {
					if (!cancelled) setFollowStatusByUserId({});
					return;
				}

				const results = await Promise.allSettled(
					otherUserIds.map(async (id) => {
						const res = await followersAPI.getFollowStatus(id);
						return [id, res.data];
					})
				);

				const next = {};
				for (const r of results) {
					if (r.status !== "fulfilled") continue;
					const [id, data] = r.value;
					next[id] = {
						followsBack: !!data?.followsBack,
						isMutual: !!data?.isMutual,
						isFollowing: !!data?.isFollowing
					};
				}

				if (!cancelled) setFollowStatusByUserId(next);
			} catch {
				// Silencioso: si no hay auth o falla, no mostramos badges.
				if (!cancelled) setFollowStatusByUserId({});
			}
		};

		loadFollowStatuses();
		return () => {
			cancelled = true;
		};
	}, [chats]);

	if (loading) return <div>Loading chats...</div>;
	if (error) return <div style={{ color: "#c00" }}>Error loading chats: {error}</div>;
	if (!chats || chats.length === 0) return <div style={{ color: "#666", padding: 12 }}>No chats yet. Start by entering a user ID above.</div>;

	return (
		<div className="chats-list">
			{chats.map((c) => {
				const other = c.otherUser ?? {};
				const otherId = other.id;
				const followStatus = otherId ? followStatusByUserId[otherId] : null;
				const isMutual = (c.isMutual ?? followStatus?.isMutual) === true;
				const showsFollowsYou = !!followStatus?.followsBack && !isMutual;
				const otherName = other.userName ?? other.username ?? other.name ?? `User ${other.id ?? "?"}`;
				const last = c.lastMessage;
				const isSelected = selectedChatId === c.id;
				return (
					<div
						key={c.id}
						className={`chat-item ${isSelected ? "selected" : ""}`}
						onClick={() => onChatSelect && onChatSelect(c)}
						style={{ padding: 8, borderBottom: "1px solid #eee", cursor: "pointer", background: isSelected ? "#f0f8ff" : "transparent" }}
					>
						<div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
							<div style={{ flex: 1 }}>
								<div style={{ display: "flex", alignItems: "center", gap: 6 }}>
									<button
										onClick={(e) => {
											e.stopPropagation();
											if (otherId) navigate(`/perfil/${otherId}`);
										}}
										style={{
											background: "none",
											border: "none",
											padding: 0,
											margin: 0,
											fontWeight: 700,
											cursor: otherId ? "pointer" : "default",
											color: "#14171a"
										}}
										title="Ver perfil"
									>
										{otherName}
									</button>
									{isMutual && (
										<span style={{ fontSize: 10, backgroundColor: "#e8f5fe", color: "#1da1f2", padding: "2px 6px", borderRadius: 8, fontWeight: 600 }} title="Se siguen mutuamente">
											↔️
										</span>
									)}
									{showsFollowsYou && (
										<span style={{ fontSize: 10, backgroundColor: "#f0f0f0", color: "#14171a", padding: "2px 6px", borderRadius: 8, fontWeight: 600 }} title="Este usuario te sigue">
											Te sigue
										</span>
									)}
								</div>
								{last ? (
									<div style={{ color: "#666", fontSize: 13, marginTop: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
										{last.content && String(last.content).trim().length > 0 ? last.content : (last.mediaUrl ? 'Media adjunta' : '')}
									</div>
								) : (
									<div style={{ color: "#999", fontSize: 13, marginTop: 4 }}>No messages yet</div>
								)}
							</div>
							<div style={{ textAlign: "right", marginLeft: 8 }}>
								{c.unreadCount > 0 && <div style={{ background: "#e33", color: "#fff", borderRadius: 12, padding: "2px 8px", fontSize: 12, marginBottom: 4 }}>{"!"}</div>}
								<div style={{ fontSize: 11, color: "#999" }}>{last ? new Date(last.createdAt).toLocaleString() : new Date(c.createdAt).toLocaleString()}</div>
							</div>
						</div>
					</div>
				);
			})}
		</div>
	);
}