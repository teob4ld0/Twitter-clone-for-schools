import React, { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useAuth } from "../context/AuthContext";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
	fetchChats,
	fetchMessages,
	sendMessage as sendMessageAction,
	deleteMessage as deleteMessageAction,
	createOrGetChat,
	setSelectedChat,
	clearError
} from "../store/chatSlice";
import ChatsList from "../components/ChatsList";
import Message from "../components/Message";
import { useIsMobile } from "../hooks/useMobile";

export default function ChatsPage() {
	const { user } = useAuth();
	const dispatch = useDispatch();
	const navigate = useNavigate();
	const [searchParams] = useSearchParams();
	const [currentUserId, setCurrentUserId] = useState(null);
	const [messageText, setMessageText] = useState("");
	const [mediaFile, setMediaFile] = useState(null);
	const [otherUserIdInput, setOtherUserIdInput] = useState("");
	const bottomRef = useRef(null);
	const fileInputRef = useRef(null);
	const isMobile = useIsMobile();
	const [showChatList, setShowChatList] = useState(true);

	const [fileError, setFileError] = useState('');
	const [isSending, setIsSending] = useState(false);

	const { selectedChatId, messages, loading, error, chats } = useSelector((state) => ({
		selectedChatId: state.chat.selectedChatId,
		messages: state.chat.messages[state.chat.selectedChatId] || [],
		loading: state.chat.loading,
		error: state.chat.error,
		chats: state.chat.chats
	}));

	const selectedChat = chats.find(c => c.id === selectedChatId);

	// Cargar chats cuando el usuario está autenticado
	useEffect(() => {
		if (user?.id) {
			setCurrentUserId(user.id);
			dispatch(fetchChats());
		}
	}, [user, dispatch]);

	useEffect(() => {
		if (!user?.id) return;
		const chatIdParam = searchParams.get('chatId');
		if (!chatIdParam) return;
		const chatId = parseInt(chatIdParam, 10);
		if (!chatId) return;
		dispatch(setSelectedChat(chatId));
		dispatch(clearError());
		dispatch(fetchMessages(chatId));
	}, [searchParams, user, dispatch]);

	const openChat = (chat) => {
		dispatch(setSelectedChat(chat.id));
		dispatch(clearError());
		dispatch(fetchMessages(chat.id));
		if (isMobile) {
			setShowChatList(false);
		}
	};

	const handleSendMessage = () => {
		if (!selectedChatId) return;
		if (!messageText.trim() && !mediaFile) return;
		if (isSending) return;
		
		// Validar tamaño del archivo (512MB máximo)
		if (mediaFile && mediaFile.size > 512 * 1024 * 1024) {
			setFileError('El archivo es demasiado pesado. Debe ser menor a 512 MB.');
			return;
		}
		
		setFileError('');
		setIsSending(true);
		dispatch(sendMessageAction({ chatId: selectedChatId, content: messageText, file: mediaFile }))
			.unwrap()
			.then(() => {
				setMessageText("");
				setMediaFile(null);
				if (fileInputRef.current) fileInputRef.current.value = '';
				// El sendMessage.fulfilled en chatSlice ya agrega el mensaje automáticamente
			})
			.catch((err) => {
				console.error("Error sending message:", err);
			})
			.finally(() => {
				setIsSending(false);
			});
	};

	const handleDeleteMessage = (messageId) => {
		if (!selectedChatId) return;
		if (!window.confirm("Are you sure you want to delete this message?")) return;

		dispatch(deleteMessageAction({ chatId: selectedChatId, messageId }))
			.unwrap()
			.then(() => {
				// No necesitamos fetchMessages aquí, SignalR lo manejará
			})
			.catch((err) => {
				console.error("Error deleting message:", err);
			});
	};

	const handleCreateOrOpenChat = () => {
		const otherId = parseInt(otherUserIdInput, 10);
		if (!otherId || otherId === currentUserId) {
			return;
		}
		dispatch(createOrGetChat(otherId))
			.unwrap()
			.then((chat) => {
				dispatch(fetchMessages(chat.id));
				setOtherUserIdInput("");
			})
			.catch((err) => {
				console.error("Error creating chat:", err);
			});
	};

	useEffect(() => { if (bottomRef.current) bottomRef.current.scrollIntoView({ behavior: "smooth" }); }, [messages]);

	// Reset showChatList cuando cambia el modo mobile/desktop
	useEffect(() => {
		if (!isMobile) {
			setShowChatList(true);
		}
	}, [isMobile]);

	if (!currentUserId) return <div>Loading...</div>;

	return (
		<div style={isMobile ? mobileContainerStyle : desktopContainerStyle}>
			{/* Lista de chats */}
			<div style={isMobile ? (showChatList ? mobileListVisibleStyle : mobileListHiddenStyle) : desktopListStyle}>
				<div style={createChatContainerStyle}>
					<div style={{ display: "flex", gap: 8, marginBottom: 8, flexDirection: isMobile ? 'column' : 'row' }}>
						<input 
							placeholder="ID de usuario" 
							value={otherUserIdInput} 
							onChange={(e) => setOtherUserIdInput(e.target.value)} 
							style={createChatInputStyle}
						/>
						<button 
							onClick={handleCreateOrOpenChat} 
							style={createChatButtonStyle}
						>
							Abrir Chat
						</button>
					</div>
					{error && <div style={errorMessageStyle}>{error}</div>}
				</div>
				<ChatsList onChatSelect={openChat} selectedChatId={selectedChatId} currentUserId={currentUserId} />
			</div>

			{/* Vista del chat */}
			<div style={isMobile ? (showChatList ? mobileChatHiddenStyle : mobileChatVisibleStyle) : desktopChatStyle}>
				{/* Header del chat */}
				<div style={chatHeaderStyle}>
					{isMobile && selectedChat && (
						<button
							onClick={() => setShowChatList(true)}
							style={backButtonStyle}
							title="Volver a chats"
						>
							<svg style={{ width: '24px', height: '24px' }} viewBox="0 0 24 24" fill="currentColor">
								<path d="M19 12H5M12 19l-7-7 7-7"/>
							</svg>
						</button>
					)}
					{selectedChat ? (
						<button
							onClick={() => {
								const otherId = selectedChat.otherUser?.id;
								if (otherId) navigate(`/perfil/${otherId}`);
							}}
							style={{
								background: 'none',
								border: 'none',
								padding: 0,
								margin: 0,
								fontWeight: 800,
								cursor: selectedChat.otherUser?.id ? 'pointer' : 'default',
								color: '#14171a',
								fontSize: isMobile ? '18px' : '16px'
							}}
							title="Ver perfil"
						>
							{selectedChat.otherUser?.userName ?? selectedChat.otherUser?.username ?? `Chat ${selectedChat.id}`}
						</button>
					) : (
						<div style={{ fontWeight: 700, fontSize: isMobile ? '16px' : '14px' }}>
							{isMobile ? 'Selecciona un chat' : 'Select a chat'}
						</div>
					)}
				</div>

				{/* Mensajes */}
				<div style={messagesContainerStyle}>
					{!selectedChat && <div style={{ color: "#666", padding: 20, textAlign: 'center' }}>Select or create a chat to start messaging.</div>}
					{selectedChat && loading.messages && <div style={{ padding: 20 }}>Loading messages...</div>}
					{selectedChat && error && <div style={{ color: "#c00", padding: 20 }}>Error: {error}</div>}
					{selectedChat && !loading.messages && messages.map((m) => <div key={m.id} style={{ marginBottom: 8 }}><Message message={m} currentUserId={currentUserId} onDelete={() => handleDeleteMessage(m.id)} /></div>)}
					<div ref={bottomRef} />
				</div>

				{/* Input de mensajes */}
				{selectedChat && (
					<div style={inputContainerStyle}>
						{fileError && (
							<div style={fileErrorStyle}>
								{fileError}
							</div>
						)}
						{mediaFile && (
							<div style={mediaFileDisplayStyle}>
								<div style={mediaFileNameStyle}>
									📎 <b>{mediaFile.name}</b>
								</div>
								<button
									onClick={() => {
										setMediaFile(null);
										setFileError('');
										if (fileInputRef.current) fileInputRef.current.value = '';
									}}
									style={removeFileButtonStyle}
								>
									✕
								</button>
							</div>
						)}
						<div style={messageInputRowStyle}>
							<input
								ref={fileInputRef}
								type="file"
								accept="image/jpeg,image/jpg,image/png,image/gif,image/webp,video/mp4,video/webm,video/mov"
								onChange={(e) => {
									setFileError('');
									setMediaFile(e.target.files?.[0] ?? null);
								}}
								style={{ display: 'none' }}
								disabled={isSending}
							/>
							<button
								onClick={() => fileInputRef.current?.click()}
								style={chatMediaButtonStyle}
								disabled={isSending || !!mediaFile}
								type="button"
								title="Adjuntar archivo"
							>
								<svg style={{ width: '20px', height: '20px' }} viewBox="0 0 24 24" fill="currentColor">
									<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
									<polyline points="17 8 12 3 7 8"/>
									<line x1="12" y1="3" x2="12" y2="15"/>
								</svg>
							</button>
							<input 
								value={messageText} 
								onChange={(e) => setMessageText(e.target.value)} 
								onKeyDown={(e) => { if (e.key === "Enter" && !isSending) handleSendMessage(); }} 
								style={chatInputStyle} 
								placeholder="Escribe un mensaje..." 
								disabled={isSending} 
							/>
							<button 
								onClick={handleSendMessage} 
								style={chatSendButtonStyle} 
								disabled={isSending}
							>
								{isSending ? '📤' : '➤'}
							</button>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}

// Estilos
const desktopContainerStyle = {
	display: "flex",
	gap: 16,
	height: "calc(100vh - 120px)"
};

const mobileContainerStyle = {
	display: "flex",
	flexDirection: "column",
	height: "calc(100vh - 130px)",
	position: "relative"
};

const desktopListStyle = {
	width: 320,
	borderRight: "1px solid #ddd",
	overflowY: "auto"
};

const mobileListVisibleStyle = {
	width: "100%",
	height: "100%",
	overflowY: "auto",
	backgroundColor: "#fff"
};

const mobileListHiddenStyle = {
	display: "none"
};

const desktopChatStyle = {
	flex: 1,
	display: "flex",
	flexDirection: "column"
};

const mobileChatVisibleStyle = {
	width: "100%",
	height: "100%",
	display: "flex",
	flexDirection: "column",
	backgroundColor: "#fff"
};

const mobileChatHiddenStyle = {
	display: "none"
};

const chatHeaderStyle = {
	padding: 12,
	borderBottom: "1px solid #eee",
	display: "flex",
	alignItems: "center",
	gap: 12,
	backgroundColor: "#fff",
	position: "sticky",
	top: 0,
	zIndex: 10
};

const backButtonStyle = {
	background: "none",
	border: "none",
	cursor: "pointer",
	padding: 8,
	display: "flex",
	alignItems: "center",
	justifyContent: "center",
	color: "#1da1f2",
	minHeight: "44px",
	minWidth: "44px"
};

const messagesContainerStyle = {
	flex: 1,
	overflowY: "auto",
	padding: 12
};

const inputContainerStyle = {
	padding: 12,
	borderTop: "1px solid #eee",
	backgroundColor: "#fff"
};

const createChatContainerStyle = {
	padding: '1rem',
	backgroundColor: '#f7f9fa',
	borderBottom: '1px solid #e1e8ed'
};

const createChatInputStyle = {
	flex: 1,
	padding: '0.75rem',
	fontSize: '1rem',
	border: '1px solid #e1e8ed',
	borderRadius: '8px',
	outline: 'none',
	transition: 'border-color 0.2s'
};

const createChatButtonStyle = {
	padding: '0.75rem 1.5rem',
	backgroundColor: '#1da1f2',
	color: 'white',
	border: 'none',
	borderRadius: '24px',
	fontSize: '0.95rem',
	fontWeight: 'bold',
	cursor: 'pointer',
	transition: 'background-color 0.2s',
	whiteSpace: 'nowrap'
};

const errorMessageStyle = {
	color: '#e0245e',
	fontSize: '0.875rem',
	marginTop: '0.5rem',
	padding: '0.5rem',
	backgroundColor: '#fee',
	borderRadius: '6px'
};

const fileErrorStyle = {
	padding: '0.75rem',
	backgroundColor: '#fee',
	color: '#e0245e',
	borderRadius: '8px',
	fontSize: '0.875rem',
	marginBottom: '0.5rem'
};

const mediaFileDisplayStyle = {
	marginBottom: '0.75rem',
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'space-between',
	gap: '0.5rem',
	padding: '0.75rem',
	backgroundColor: '#f7f9fa',
	borderRadius: '8px',
	border: '1px solid #e1e8ed'
};

const mediaFileNameStyle = {
	fontSize: '0.875rem',
	color: '#14171a',
	overflow: 'hidden',
	textOverflow: 'ellipsis',
	whiteSpace: 'nowrap'
};

const removeFileButtonStyle = {
	padding: '0.25rem 0.5rem',
	backgroundColor: 'transparent',
	color: '#657786',
	border: '1px solid #e1e8ed',
	borderRadius: '50%',
	cursor: 'pointer',
	fontSize: '1rem',
	width: '28px',
	height: '28px',
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'center',
	transition: 'background-color 0.2s'
};

const messageInputRowStyle = {
	display: 'flex',
	gap: '0.5rem',
	alignItems: 'center'
};

const chatMediaButtonStyle = {
	padding: '0.5rem',
	backgroundColor: 'transparent',
	color: '#1da1f2',
	border: '1px solid #e1e8ed',
	borderRadius: '50%',
	cursor: 'pointer',
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'center',
	width: '40px',
	height: '40px',
	transition: 'background-color 0.2s',
	flexShrink: 0
};

const chatInputStyle = {
	flex: 1,
	padding: '0.75rem 1rem',
	fontSize: '1rem',
	border: '1px solid #e1e8ed',
	borderRadius: '24px',
	outline: 'none',
	transition: 'border-color 0.2s'
};

const chatSendButtonStyle = {
	padding: '0.75rem',
	backgroundColor: '#1da1f2',
	color: 'white',
	border: 'none',
	borderRadius: '50%',
	cursor: 'pointer',
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'center',
	width: '40px',
	height: '40px',
	fontSize: '1.25rem',
	transition: 'background-color 0.2s',
	flexShrink: 0
};