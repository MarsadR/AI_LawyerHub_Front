import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  MessageSquare, Send, Search, MoreVertical,
  Paperclip,
  Flag, Ban, X, Download, FileText,
  Trash2, CheckCircle2, Eye, ArrowLeft
} from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { io } from 'socket.io-client';

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return new Date(dateStr).toLocaleDateString([], { month: 'short', day: 'numeric' });
}

export default function ChatsPage() {
  const { user, token, API } = useAuth();
  const [chats, setChats] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [search, setSearch] = useState('');
  
  // Real-time socket states
  const [socket, setSocket] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);

  // Block / Report states
  const [isBlocked, setIsBlocked] = useState(false);
  const [isBlockedByOther, setIsBlockedByOther] = useState(false);
  const [blockLoading, setBlockLoading] = useState(false);
  const [headerMenuOpen, setHeaderMenuOpen] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [repReason, setRepReason] = useState('Harassment');
  const [repCustom, setRepCustom] = useState('');
  const [reporting, setReporting] = useState(false);

  // Lightbox media viewer state
  const [mediaViewer, setMediaViewer] = useState(null); // { url, type, name }

  // Individual message options/actions states
  const [hoveredMsgId, setHoveredMsgId] = useState(null);
  const [activeMenuMsg, setActiveMenuMsg] = useState(null);
  const [replyTo, setReplyTo] = useState(null);
  const [editingMsg, setEditingMsg] = useState(null);

  // Gesture Swipe-to-Reply States (WhatsApp style)
  const [touchStart, setTouchStart] = useState(null);
  const [swipingMsgId, setSwipingMsgId] = useState(null);
  const [swipeOffset, setSwipeOffset] = useState(0);

  // File queue state
  const [selectedFile, setSelectedFile] = useState(null);

  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const messagesEndRef = useRef(null);
  const longPressTimerRef = useRef(null);

  const getMediaType = (att) => {
    if (!att || !att.url) return 'file';
    const url = att.url.toLowerCase();
    const fileName = (att.fileName || '').toLowerCase();
    const fileType = att.fileType ? att.fileType.toLowerCase() : '';
    
    if (
      fileType.startsWith('image/') || 
      url.match(/\.(jpeg|jpg|gif|png|webp|svg)$/i) || 
      fileName.match(/\.(jpeg|jpg|gif|png|webp|svg)$/i)
    ) {
      return 'image';
    }
    if (
      fileType.startsWith('video/') || 
      url.match(/\.(mp4|mov|avi|mkv|webm|3gp)$/i) || 
      fileName.match(/\.(mp4|mov|avi|mkv|webm|3gp)$/i)
    ) {
      return 'video';
    }
    if (
      fileType === 'application/pdf' || 
      url.endsWith('.pdf') || 
      fileName.endsWith('.pdf')
    ) {
      return 'pdf';
    }
    if (
      url.match(/\.(docx|doc|xlsx|xls|pptx|ppt)$/i) || 
      fileName.match(/\.(docx|doc|xlsx|xls|pptx|ppt)$/i) ||
      fileType.includes('officedocument') ||
      fileType.includes('msword') ||
      fileType.includes('ms-excel') ||
      fileType.includes('ms-powerpoint')
    ) {
      return 'office';
    }
    return 'file';
  };

  const renderInlineDocPreview = (att, type) => {
    const isLocal = att.url?.includes('localhost') || att.url?.includes('127.0.0.1');

    if (type === 'pdf') {
      return (
        <div style={{ width: '100%', height: 130, background: '#fff', overflow: 'hidden', borderRadius: 6, position: 'relative', border: '1px solid var(--border)', marginBottom: 8 }}>
          <embed 
            src={att.url} 
            type="application/pdf"
            style={{ width: '100%', height: '100%', border: 'none', pointerEvents: 'none' }}
          />
        </div>
      );
    }
    if (type === 'office') {
      if (isLocal) {
        return (
          <div style={{ 
            width: '100%', height: 130, background: 'var(--surface-2)', 
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            borderRadius: 6, border: '1px solid var(--border)', marginBottom: 8, padding: 12, textAlign: 'center' 
          }}>
            <FileText size={24} color="var(--primary-light)" style={{ marginBottom: 4 }} />
            <span style={{ fontSize: 10, fontWeight: 700, opacity: 0.8 }}>Local Office Document</span>
            <span style={{ fontSize: 9, opacity: 0.6, marginTop: 2 }}>Previews require public URL. Click Download to open.</span>
          </div>
        );
      }
      const officeUrl = `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(att.url)}`;
      return (
        <div style={{ width: '100%', height: 130, background: '#fff', overflow: 'hidden', borderRadius: 6, position: 'relative', border: '1px solid var(--border)', marginBottom: 8 }}>
          <iframe 
            src={officeUrl} 
            title="Office Inline"
            style={{ width: '100%', height: '100%', border: 'none', pointerEvents: 'none' }}
          />
        </div>
      );
    }
    return null;
  };

  const downloadFile = async (url, fileName) => {
    try {
      toast.loading('Preparing download...', { id: 'downloading-file' });
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(blobUrl);
      toast.success('Download started!', { id: 'downloading-file' });
    } catch (err) {
      window.open(url, '_blank');
      toast.dismiss('downloading-file');
    }
  };

  // Touch handlers for mobile swipe-to-reply
  const handleTouchStart = (e, msgId) => {
    if (activeChat?.type !== 'consultation') return;
    setTouchStart(e.touches[0].clientX);
    setSwipingMsgId(msgId);
  };

  const handleTouchMove = (e) => {
    if (!touchStart || swipingMsgId === null) return;
    const currentX = e.touches[0].clientX;
    const diffX = currentX - touchStart;
    
    // Only allow swiping to the right (positive value) like WhatsApp
    if (diffX > 0) {
      const dampenedOffset = Math.min(diffX * 0.65, 80);
      setSwipeOffset(dampenedOffset);
    }
  };

  const handleTouchEnd = (msg) => {
    if (swipingMsgId === msg._id && swipeOffset > 50 && !msg.deletedForEveryone) {
      setReplyTo(msg);
      setEditingMsg(null);
      if (navigator.vibrate) {
        navigator.vibrate(12); // Short haptic bump
      }
    }
    setTouchStart(null);
    setSwipingMsgId(null);
    setSwipeOffset(0);
  };

  // 1. Establish Socket connection
  useEffect(() => {
    if (!token) return;
    const newSocket = io(API, {
      auth: { token },
      transports: ['websocket']
    });

    newSocket.on('connect', () => {
      console.log('Socket connected: ', newSocket.id);
    });

    newSocket.on('online_users', ({ onlineUsers: users }) => {
      setOnlineUsers(users || []);
    });

    newSocket.on('user_online', ({ userId }) => {
      setOnlineUsers(prev => prev.includes(userId) ? prev : [...prev, userId]);
    });

    newSocket.on('user_offline', ({ userId }) => {
      setOnlineUsers(prev => prev.filter(id => id !== userId));
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [token, API]);

  // 2. Fetch Conversations lists (Both Client Consultations & Professional Network)
  const fetchChats = useCallback(async () => {
    try {
      const [consRes, netRes] = await Promise.all([
        axios.get(`${API}/api/lawyer-consultations`),
        axios.get(`${API}/lawyer-chats`)
      ]);

      const consultations = (consRes.data.data?.consultations || []).map(c => ({
        ...c,
        type: 'consultation'
      }));

      const networkChats = (netRes.data.chats || []).map(c => ({
        ...c,
        type: 'network'
      }));

      // Merge and sort by last activity
      const combined = [...consultations, ...networkChats].sort((a, b) => {
        return new Date(b.lastActivity || b.updatedAt || 0) - new Date(a.lastActivity || a.updatedAt || 0);
      });

      setChats(combined);
    } catch {
      toast.error('Failed to load conversations');
    } finally {
      setLoading(false);
    }
  }, [API]);

  useEffect(() => {
    fetchChats();
  }, [fetchChats]);

  // 3. Fetch Message History of Active Chat
  const fetchMessages = useCallback(async (chatId, type) => {
    try {
      const url = type === 'consultation'
        ? `${API}/api/lawyer-consultations/${chatId}/messages`
        : `${API}/lawyer-chats/${chatId}/messages`;
      
      const res = await axios.get(url);
      setMessages(res.data.messages || res.data.data?.messages || []);
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    } catch {
      toast.error('Failed to load message history');
    }
  }, [API]);

  // 4. Handle Join room & Realtime events when activeChat changes
  useEffect(() => {
    if (!activeChat) return;

    // Load history
    fetchMessages(activeChat._id, activeChat.type);
    setReplyTo(null);
    setEditingMsg(null);

    // Block status check
    const statusUrl = activeChat.type === 'consultation'
      ? `${API}/api/lawyer-consultations/${activeChat._id}/block-status`
      : `${API}/lawyer-chats/${activeChat._id}/block-status`;

    axios.get(statusUrl)
      .then(res => {
        if (res.data.success) {
          setIsBlocked(res.data.data.isBlocked);
          setIsBlockedByOther(res.data.data.isBlockedByOther);
        }
      }).catch(() => {
        setIsBlocked(false);
        setIsBlockedByOther(false);
      });

    if (!socket) return;

    const roomId = activeChat._id;
    socket.emit('join_chat', roomId);

    const handleNewMessage = (msg) => {
      if (activeChat.type === 'network' && msg.chatId === roomId) {
        setMessages(prev => {
          if (prev.some(m => m._id === msg._id)) return prev;
          return [...prev, msg];
        });
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
      }
    };

    const handleNewConsultationMessage = (msg) => {
      if (activeChat.type === 'consultation' && msg.consultationId === roomId) {
        setMessages(prev => {
          if (prev.some(m => m._id === msg._id)) return prev;
          return [...prev, msg];
        });
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
      }
    };

    const handleMessageDeleted = (data) => {
      if (activeChat.type === 'consultation' && data.consultationId === roomId) {
        fetchMessages(roomId, activeChat.type);
      }
    };

    socket.on('new_message', handleNewMessage);
    socket.on('new_consultation_message', handleNewConsultationMessage);
    socket.on('message_deleted', handleMessageDeleted);
    socket.on('message_edited', () => fetchMessages(roomId, activeChat.type));

    return () => {
      socket.emit('leave_chat', roomId);
      socket.off('new_message', handleNewMessage);
      socket.off('new_consultation_message', handleNewConsultationMessage);
      socket.off('message_deleted', handleMessageDeleted);
    };
  }, [activeChat, socket, fetchMessages, API]);

  // 5. Send Message Handler
  const handleSend = async () => {
    if (!activeChat) return;
    const isFileSend = !!selectedFile;
    const payload = text.trim();
    
    if (!payload && !isFileSend) return;

    setText('');
    setSending(true);

    try {
      if (isFileSend) {
        // Upload file attachment (with optional text caption)
        const fd = new FormData();
        fd.append('file', selectedFile);
        if (payload) {
          fd.append('caption', payload);
        }

        const uploadUrl = activeChat.type === 'consultation'
          ? `${API}/api/lawyer-consultations/${activeChat._id}/upload`
          : `${API}/lawyer-chats/${activeChat._id}/upload`;

        toast.loading('Uploading and sharing file...', { id: 'uploading' });
        await axios.post(uploadUrl, fd, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        toast.success('File shared successfully!', { id: 'uploading' });
        setSelectedFile(null);
      } else {
        if (editingMsg) {
          // Edit message
          await axios.patch(`${API}/api/lawyer-consultations/message/${editingMsg._id}`, { text: payload });
          setEditingMsg(null);
        } else {
          // Send normal text message
          if (activeChat.type === 'consultation') {
            await axios.post(`${API}/api/lawyer-consultations/${activeChat._id}/message`, { 
              text: payload,
              replyToId: replyTo ? replyTo._id : undefined
            });
            setReplyTo(null);
          } else {
            await axios.post(`${API}/lawyer-chats/${activeChat._id}/message`, { text: payload });
          }
        }
      }
      fetchMessages(activeChat._id, activeChat.type);
    } catch (err) {
      toast.error(isFileSend ? 'Failed to upload attachment' : editingMsg ? 'Failed to edit message' : 'Failed to send message', { id: 'uploading' });
    } finally {
      setSending(false);
    }
  };

  // 6. Block / Unblock User
  const handleBlockToggle = async () => {
    if (!activeChat) return;
    setBlockLoading(true);
    setHeaderMenuOpen(false);
    try {
      const endpoint = isBlocked ? 'unblock' : 'block';
      const url = activeChat.type === 'consultation'
        ? `${API}/api/lawyer-consultations/${activeChat._id}/${endpoint}`
        : `${API}/lawyer-chats/${activeChat._id}/${endpoint}`;

      const res = await axios.post(url);
      if (res.data.success) {
        setIsBlocked(!isBlocked);
        toast.success(isBlocked ? 'User unblocked' : 'User blocked successfully');
      }
    } catch {
      toast.error('Block operation failed');
    } finally {
      setBlockLoading(false);
    }
  };

  // 7. Report User Handler
  const handleReportSubmit = async () => {
    if (!activeChat) return;
    const otherParticipant = activeChat.type === 'network'
      ? activeChat.participants?.find(p => p._id !== user._id)
      : activeChat.userId;
    
    const reportedId = otherParticipant?._id || otherParticipant?.id;
    if (!reportedId) {
      toast.error('User information not found');
      return;
    }

    if (repReason === 'Other' && !repCustom.trim()) {
      toast.error('Please specify a reason');
      return;
    }

    setReporting(true);
    try {
      await axios.post(`${API}/api/reports`, {
        reportedId,
        reportedModel: activeChat.type === 'network' ? 'Lawyer' : 'User',
        reason: repReason === 'Other' ? `Other: ${repCustom}` : repReason,
        description: `Reported from Lawyer Webchat: ${activeChat._id}`
      });
      toast.success('Report submitted to Admin review');
      setReportModalOpen(false);
      setRepCustom('');
    } catch {
      toast.error('Report submission failed');
    } finally {
      setReporting(false);
    }
  };

  // 8. Delete / Clear Conversation Chat
  const handleDeleteChat = async () => {
    if (!activeChat) return;
    if (!window.confirm("Are you sure you want to delete this chat history?")) return;
    setHeaderMenuOpen(false);
    try {
      const url = activeChat.type === 'consultation'
        ? `${API}/api/lawyer-consultations/${activeChat._id}`
        : `${API}/lawyer-chats/${activeChat._id}`;
      
      await axios.delete(url);
      setActiveChat(null);
      fetchChats();
      toast.success('Conversation deleted');
    } catch {
      toast.error('Delete conversation failed');
    }
  };

  // 9. Delete individual message
  const handleDeleteSingleMessage = async (messageId, scope) => {
    setActiveMenuMsg(null);
    try {
      await axios.delete(`${API}/api/lawyer-consultations/message/${messageId}?scope=${scope}`);
      toast.success(scope === 'everyone' ? 'Message deleted for everyone' : 'Message deleted');
      fetchMessages(activeChat._id, activeChat.type);
    } catch {
      toast.error('Failed to delete message');
    }
  };

  // 10. File attachment queueing
  const handleAttachFile = (e) => {
    const file = e.target.files[0];
    if (!file || !activeChat) return;

    const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    const forbiddenExts = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx'];
    const isDocument = forbiddenExts.includes(ext) || 
      file.type.includes('pdf') || 
      file.type.includes('officedocument') || 
      file.type.includes('msword') || 
      file.type.includes('ms-excel') || 
      file.type.includes('ms-powerpoint');

    if (isDocument) {
      toast.error('Documents (PDF, DOCX, Excel, PPTX) cannot be sent in chat');
      e.target.value = null;
      return;
    }

    setSelectedFile(file);
    e.target.value = null; // Clear target value to allow re-uploading same file
  };

  // Filter conversations
  const clientConsultations = chats.filter(c => c.type === 'consultation');
  const networkChats = chats.filter(c => c.type === 'network');

  const filteredClients = clientConsultations.filter(c => {
    const name = c.userId?.fullName || c.userId?.email || 'Client';
    return name.toLowerCase().includes(search.toLowerCase());
  });

  const filteredNetwork = networkChats.filter(c => {
    const other = c.participants?.find(p => p._id !== user._id);
    const name = other?.name || 'Colleague';
    return name.toLowerCase().includes(search.toLowerCase());
  });

  const isMe = (msg) => msg.senderModel === 'Lawyer' || msg.role === 'lawyer';

  // Get active chat profile image & name
  const getActiveChatDetails = () => {
    if (!activeChat) return { name: '', initials: '', photo: '', isOnline: false };
    if (activeChat.type === 'consultation') {
      const u = activeChat.userId || {};
      const initials = (u.fullName || 'C').slice(0, 2).toUpperCase();
      const isOnline = u._id && onlineUsers.includes(u._id.toString());
      return {
        name: u.fullName || u.email || 'Client',
        initials,
        photo: u.photoUrl || u.profilePhotoUrl,
        isOnline
      };
    } else {
      const other = activeChat.participants?.find(p => p._id !== user._id) || {};
      const initials = (other.name || 'L').slice(0, 2).toUpperCase();
      const isOnline = other._id && onlineUsers.includes(other._id.toString());
      return {
        name: other.name || 'Colleague',
        initials,
        photo: other.profilePhotoUrl || other.photoUrl,
        isOnline
      };
    }
  };

  const activeDetails = getActiveChatDetails();

  // Helper to render Lightbox content dynamically based on classification
  const renderLightboxContent = () => {
    if (!mediaViewer) return null;

    if (mediaViewer.type === 'image') {
      return (
        <img 
          src={mediaViewer.url} 
          alt="" 
          style={{ 
            maxWidth: '100%', maxHeight: '100%', 
            objectFit: 'contain', borderRadius: 8,
            boxShadow: '0 12px 36px rgba(0,0,0,0.5)'
          }} 
        />
      );
    }
    
    if (mediaViewer.type === 'video') {
      return (
        <video 
          src={mediaViewer.url} 
          controls 
          autoPlay 
          style={{ 
            maxWidth: '100%', maxHeight: '90vh', 
            borderRadius: 8, 
            boxShadow: '0 12px 36px rgba(0,0,0,0.5)'
          }} 
        />
      );
    }
    
    if (mediaViewer.type === 'pdf') {
      return (
        <embed 
          src={mediaViewer.url} 
          type="application/pdf"
          style={{ 
            width: '85vw', height: '80vh', 
            border: 'none', borderRadius: 8, 
            background: '#fff',
            boxShadow: '0 12px 36px rgba(0,0,0,0.5)'
          }} 
        />
      );
    }
    
    if (mediaViewer.type === 'office') {
      const isLocal = mediaViewer.url?.includes('localhost') || mediaViewer.url?.includes('127.0.0.1');
      if (isLocal) {
        return (
          <div style={{ color: '#fff', textAlign: 'center', padding: 24 }}>
            <FileText size={64} color="var(--primary-light)" style={{ marginBottom: 16, opacity: 0.8 }} />
            <h4 style={{ margin: '0 0 8px 0', fontSize: 16 }}>Office Document Preview (Local Environment)</h4>
            <p style={{ margin: 0, fontSize: 13, color: 'var(--text-muted)', maxWidth: 400 }}>
              Microsoft Office Online preview engine requires a publicly routeable internet URL. 
              Please click the **Download** button at the top to view the document contents.
            </p>
          </div>
        );
      }
      const officeUrl = `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(mediaViewer.url)}`;
      return (
        <iframe 
          src={officeUrl} 
          title="Office Document Preview"
          style={{ 
            width: '85vw', height: '80vh', 
            border: 'none', borderRadius: 8, 
            background: '#fff',
            boxShadow: '0 12px 36px rgba(0,0,0,0.5)'
          }} 
        />
      );
    }
    
    return (
      <div style={{ color: '#fff', textAlign: 'center' }}>
        <FileText size={48} style={{ marginBottom: 12, opacity: 0.8 }} />
        <p style={{ fontSize: 15, fontWeight: 500 }}>Preview not supported for this file type.</p>
        <button 
          onClick={() => downloadFile(mediaViewer.url, mediaViewer.name || 'Document')}
          className="btn btn-primary" 
          style={{ marginTop: 12 }}
        >
          Download Document
        </button>
      </div>
    );
  };

  return (
    <div style={{
      height: 'calc(100vh - 68px)',
      display: 'flex',
      background: 'var(--bg)'
    }}>
      
      {/* Sidebar: Conversations lists */}
      <div style={{
        width: isMobile ? '100%' : 320,
        borderRight: '1px solid var(--border)',
        display: isMobile && activeChat ? 'none' : 'flex',
        flexDirection: 'column',
        background: 'var(--bg-2)',
        flexShrink: 0
      }}>
        <div style={{ padding: '20px 16px 12px', borderBottom: '1px solid var(--border)' }}>
          <h2 style={{ fontWeight: 700, fontSize: 18, marginBottom: 12 }}>Messages</h2>
          <div className="input-wrap">
            <Search size={15} className="icon-left" />
            <input
              className="input input-icon"
              placeholder="Search chats by name…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ fontSize: 13, padding: '9px 12px 9px 38px' }}
            />
          </div>
        </div>

        {/* Categories / Scroll Area */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '10px 0' }}>
          {loading ? (
            <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[1, 2, 3].map(i => (
                <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <div className="skeleton" style={{ width: 40, height: 40, borderRadius: '50%' }} />
                  <div style={{ flex: 1 }}>
                    <div className="skeleton" style={{ height: 12, width: '70%', marginBottom: 6 }} />
                    <div className="skeleton" style={{ height: 10, width: '40%' }} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <>
              {/* CLIENT CONSULTATIONS SECTION */}
              <div style={{ marginBottom: 20 }}>
                <p style={{
                  fontSize: 10, fontWeight: 800, color: 'var(--text-muted)',
                  textTransform: 'uppercase', letterSpacing: 0.8, padding: '0 16px 8px 16px'
                }}>
                  Client Consultations
                </p>
                {filteredClients.length === 0 ? (
                  <p style={{ fontSize: 12, color: 'var(--text-dim)', padding: '0 16px' }}>No active client consultations</p>
                ) : (
                  filteredClients.map(chat => {
                    const u = chat.userId || {};
                    const name = u.fullName || u.email || 'Client';
                    const initials = name.slice(0, 2).toUpperCase();
                    const photo = u.photoUrl || u.profilePhotoUrl;
                    const isActive = activeChat?._id === chat._id;
                    const isOnline = u._id && onlineUsers.includes(u._id.toString());
                    const lm = chat.lastMessage || {};
                    const lastText = lm.text?.replace(/^Shared file:.*$/, '').trim() || (lm.attachments?.length ? '📎 File Attachment' : '');

                    return (
                      <div
                        key={chat._id}
                        onClick={() => setActiveChat(chat)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 12,
                          padding: '10px 16px', cursor: 'pointer',
                          background: isActive ? 'rgba(59,130,246,0.08)' : 'transparent',
                          borderLeft: isActive ? '3px solid #10B981' : '3px solid transparent',
                          transition: 'all 0.15s'
                        }}
                      >
                        <div style={{ position: 'relative', width: 40, height: 40, flexShrink: 0 }}>
                          {photo ? (
                            <img src={photo.startsWith('http') ? photo : `${API}/${photo}`} alt="" style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover' }} />
                          ) : (
                            <div className="avatar-placeholder" style={{ width: 40, height: 40, fontSize: 13, background: '#10B981' }}>
                              {initials}
                            </div>
                          )}
                          {isOnline && (
                            <div style={{
                              position: 'absolute', bottom: -2, right: -2, width: 12, height: 12,
                              borderRadius: '50%', background: '#10B981', border: '2px solid var(--bg-2)'
                            }} />
                          )}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <p style={{ fontWeight: 600, fontSize: 13.5, color: isActive ? 'var(--primary-light)' : 'var(--text)' }} className="truncate">
                              {name}
                            </p>
                            <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                              {timeAgo(chat.lastActivity || chat.updatedAt)}
                            </span>
                          </div>
                          <p style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 2 }} className="truncate">
                            {lm.senderModel === 'Lawyer' ? 'You: ' : ''}{lastText || 'Tap to chat'}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* PROFESSIONAL NETWORK SECTION */}
              <div>
                <p style={{
                  fontSize: 10, fontWeight: 800, color: 'var(--text-muted)',
                  textTransform: 'uppercase', letterSpacing: 0.8, padding: '0 16px 8px 16px'
                }}>
                  Professional Network
                </p>
                {filteredNetwork.length === 0 ? (
                  <p style={{ fontSize: 12, color: 'var(--text-dim)', padding: '0 16px' }}>No connections yet</p>
                ) : (
                  filteredNetwork.map(chat => {
                    const other = chat.participants?.find(p => p._id !== user._id) || {};
                    const name = other.name || 'Colleague';
                    const initials = name.slice(0, 2).toUpperCase();
                    const photo = other.profilePhotoUrl || other.photoUrl;
                    const isActive = activeChat?._id === chat._id;
                    const isOnline = other._id && onlineUsers.includes(other._id.toString());
                    const lm = chat.lastMessage || {};
                    const lastText = lm.text?.replace(/^Shared file:.*$/, '').trim() || (lm.attachments?.length ? '📎 File Attachment' : '');

                    return (
                      <div
                        key={chat._id}
                        onClick={() => setActiveChat(chat)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 12,
                          padding: '10px 16px', cursor: 'pointer',
                          background: isActive ? 'rgba(59,130,246,0.08)' : 'transparent',
                          borderLeft: isActive ? '3px solid #3B82F6' : '3px solid transparent',
                          transition: 'all 0.15s'
                        }}
                      >
                        <div style={{ position: 'relative', width: 40, height: 40, flexShrink: 0 }}>
                          {photo ? (
                            <img src={photo.startsWith('http') ? photo : `${API}/${photo}`} alt="" style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover' }} />
                          ) : (
                            <div className="avatar-placeholder" style={{ width: 40, height: 40, fontSize: 13, background: '#3B82F6' }}>
                              {initials}
                            </div>
                          )}
                          {isOnline && (
                            <div style={{
                              position: 'absolute', bottom: -2, right: -2, width: 12, height: 12,
                              borderRadius: '50%', background: '#10B981', border: '2px solid var(--bg-2)'
                            }} />
                          )}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <p style={{ fontWeight: 600, fontSize: 13.5, color: isActive ? 'var(--primary-light)' : 'var(--text)' }} className="truncate">
                              {name}
                            </p>
                            <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                              {timeAgo(chat.lastActivity || chat.updatedAt)}
                            </span>
                          </div>
                          <p style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 2 }} className="truncate">
                            {lastText || 'Tap to chat'}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Chat Window */}
      {activeChat ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative' }}>
          
          {/* Block Banner */}
          {(isBlocked || isBlockedByOther) && (
            <div style={{
              background: isBlocked ? 'rgba(245,158,11,0.1)' : 'rgba(107,114,128,0.1)',
              borderBottom: `1px solid ${isBlocked ? 'rgba(245,158,11,0.2)' : 'rgba(107,114,128,0.2)'}`,
              padding: '10px 20px', display: 'flex', alignItems: 'center', gap: 10
            }}>
              <Ban size={15} color={isBlocked ? '#F59E0B' : '#6B7280'} />
              <span style={{ fontSize: 13, color: isBlocked ? '#F59E0B' : 'var(--text-muted)' }}>
                {isBlocked 
                  ? `You blocked ${activeDetails.name}. Click the menu option to unblock.` 
                  : `You cannot send messages to ${activeDetails.name} now.`
                }
              </span>
            </div>
          )}

          {/* Chat Header */}
          <div style={{
            padding: '0 20px', height: 64,
            borderBottom: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            background: 'var(--surface)', backdropFilter: 'blur(16px)',
            zIndex: 10
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1 }}>
              {isMobile && (
                <button 
                  onClick={() => setActiveChat(null)}
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: '6px 8px 6px 0',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--text)',
                    outline: 'none'
                  }}
                  title="Back to Chats"
                >
                  <ArrowLeft size={20} />
                </button>
              )}
              <div style={{ position: 'relative', width: 40, height: 40 }}>
                {activeDetails.photo ? (
                  <img src={activeDetails.photo.startsWith('http') ? activeDetails.photo : `${API}/${activeDetails.photo}`} alt="" style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover' }} />
                ) : (
                  <div className="avatar-placeholder" style={{ width: 40, height: 40, fontSize: 13, background: '#3B82F6' }}>
                    {activeDetails.initials}
                  </div>
                )}
                {activeDetails.isOnline && (
                  <div style={{
                    position: 'absolute', bottom: -1, right: -1, width: 12, height: 12,
                    borderRadius: '50%', background: '#10B981', border: '2px solid var(--bg)'
                  }} />
                )}
              </div>
              <div>
                <p style={{ fontWeight: 700, fontSize: 15, margin: 0 }}>{activeDetails.name}</p>
                <p style={{ fontSize: 11, color: activeDetails.isOnline ? 'var(--emerald)' : 'var(--text-dim)', margin: 0 }}>
                  {activeDetails.isOnline ? '● Online' : 'Offline'}
                </p>
              </div>
            </div>

            {/* Menu Options */}
            <div style={{ position: 'relative' }}>
              <button 
                className="btn-icon" 
                onClick={() => setHeaderMenuOpen(!headerMenuOpen)}
                style={{ width: 32, height: 32 }}
              >
                <MoreVertical size={16} />
              </button>

              {headerMenuOpen && (
                <div style={{
                  position: 'absolute', right: 0, top: 38, width: 190,
                  background: 'var(--surface-2)', border: '1px solid var(--border)',
                  borderRadius: 12, boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
                  padding: 6, display: 'flex', flexDirection: 'column', gap: 2,
                  zIndex: 100
                }}>
                  <button 
                    className="btn btn-ghost btn-sm"
                    onClick={() => { setHeaderMenuOpen(false); setReportModalOpen(true); }}
                    style={{
                      justifyContent: 'flex-start', color: '#EF4444',
                      padding: '8px 10px', fontSize: 12.5, width: '100%'
                    }}
                  >
                    <Flag size={14} style={{ marginRight: 8 }} />
                    Report {activeChat.type === 'network' ? 'Lawyer' : 'Client'}
                  </button>

                  <button 
                    className="btn btn-ghost btn-sm"
                    onClick={handleBlockToggle}
                    disabled={blockLoading}
                    style={{
                      justifyContent: 'flex-start', color: isBlocked ? '#F59E0B' : '#EF4444',
                      padding: '8px 10px', fontSize: 12.5, width: '100%'
                    }}
                  >
                    <Ban size={14} style={{ marginRight: 8 }} />
                    {isBlocked ? 'Unblock User' : 'Block User'}
                  </button>

                  <div style={{ height: 1, background: 'var(--border)', margin: '4px 0' }} />

                  <button 
                    className="btn btn-ghost btn-sm"
                    onClick={handleDeleteChat}
                    style={{
                      justifyContent: 'flex-start', color: 'var(--text-muted)',
                      padding: '8px 10px', fontSize: 12.5, width: '100%'
                    }}
                  >
                    <Trash2 size={14} style={{ marginRight: 8 }} />
                    Delete History
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Messages Feed */}
          <div
            onContextMenu={e => e.preventDefault()}
            style={{
              flex: 1, overflowY: 'auto', padding: '20px 24px',
              display: 'flex', flexDirection: 'column', gap: 14,
              background: 'var(--bg)'
            }}>
            {messages.map((msg, i) => {
              const me = isMe(msg);
              const isSwipingThis = swipingMsgId === msg._id;
              const openUpwards = i >= messages.length - 2 && messages.length > 2;
              
              // Touch Swipe Animations & Styles
              const transformStyle = isSwipingThis ? `translateX(${swipeOffset}px)` : 'translateX(0px)';
              const transitionStyle = isSwipingThis ? 'none' : 'transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)';

              return (
                <div 
                  key={msg._id || i} 
                  style={{
                    display: 'flex',
                    justifyContent: me ? 'flex-end' : 'flex-start',
                    position: 'relative',
                    touchAction: 'pan-y',
                    zIndex: activeMenuMsg === msg._id ? 10000 : (hoveredMsgId === msg._id ? 1000 : (messages.length - i + 10))
                  }}
                  onMouseEnter={() => setHoveredMsgId(msg._id)}
                  onMouseLeave={() => setHoveredMsgId(null)}
                >
                  
                  {/* Swipe-to-Reply Icon Indicator (Behind bubble) */}
                  {isSwipingThis && swipeOffset > 10 && (
                    <div style={{
                      position: 'absolute',
                      left: 0,
                      top: 0,
                      bottom: 0,
                      width: 40,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      opacity: Math.min(swipeOffset / 50, 1),
                      transform: `scale(${Math.min(swipeOffset / 50, 1.1)})`,
                      transition: 'opacity 0.15s, transform 0.15s',
                      color: swipeOffset > 50 ? 'var(--primary-light)' : 'var(--text-muted)',
                      zIndex: 1
                    }}>
                      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="9 17 4 12 9 7" />
                        <path d="M20 18v-2a4 4 0 0 0-4-4H4" />
                      </svg>
                    </div>
                  )}

                  <div
                    className={`chat-bubble ${me ? 'me' : 'other'}`}
                    onDoubleClick={() => {
                      if (activeChat.type === 'consultation' && !msg.deletedForEveryone) {
                        setReplyTo(msg);
                        setEditingMsg(null);
                        if (navigator.vibrate) navigator.vibrate(10);
                      }
                    }}
                    onContextMenu={(e) => e.preventDefault()}
                    onTouchStart={(e) => {
                      // Swipe-to-reply handler
                      handleTouchStart(e, msg._id);
                      // Long-press to open options menu (mobile)
                      if (isMobile && !msg.deletedForEveryone) {
                        longPressTimerRef.current = setTimeout(() => {
                          if (navigator.vibrate) navigator.vibrate(20);
                          setActiveMenuMsg(msg._id);
                        }, 500);
                      }
                    }}
                    onTouchMove={(e) => {
                      handleTouchMove(e);
                      clearTimeout(longPressTimerRef.current);
                    }}
                    onTouchEnd={() => {
                      handleTouchEnd(msg);
                      clearTimeout(longPressTimerRef.current);
                    }}
                    style={{
                      opacity: msg.pending ? 0.7 : 1,
                      maxWidth: isMobile ? '85%' : '65%',
                      borderRadius: 14,
                      padding: '10px 14px',
                      paddingRight: (!msg.deletedForEveryone && (isMobile || hoveredMsgId === msg._id || activeMenuMsg === msg._id)) ? 28 : 14,
                      background: me ? 'var(--primary)' : 'var(--surface-2)',
                      color: me ? '#fff' : 'var(--text)',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
                      position: 'relative',
                      overflow: 'visible',
                      transform: transformStyle,
                      transition: transitionStyle,
                      cursor: activeChat.type === 'consultation' ? 'pointer' : 'default',
                      userSelect: 'none',
                      WebkitUserSelect: 'none',
                      WebkitTouchCallout: 'none',
                      zIndex: activeMenuMsg === msg._id ? 10000 : 2
                    }}
                  >
                    
                    {/* 3-dot options button — desktop: hover only, mobile: always visible (long-press opens menu) */}
                    {(hoveredMsgId === msg._id || (isMobile && activeMenuMsg === msg._id) || isMobile) && !msg.deletedForEveryone && (
                      <div style={{
                        position: 'absolute', right: 6, top: 6, zIndex: 110
                      }}>
                        <button 
                          onClick={(e) => { e.stopPropagation(); setActiveMenuMsg(activeMenuMsg === msg._id ? null : msg._id); }}
                          style={{
                            width: 20, height: 20, borderRadius: '50%',
                            background: me ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.25)',
                            backdropFilter: 'blur(4px)',
                            border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            cursor: 'pointer', outline: 'none', color: me ? '#fff' : 'var(--text)',
                            // Always show on mobile, fade in on desktop hover
                            opacity: isMobile ? (hoveredMsgId === msg._id || activeMenuMsg === msg._id ? 1 : 0.45) : 1
                          }}
                        >
                          <MoreVertical size={11} />
                        </button>

                        {activeMenuMsg === msg._id && (
                          <>
                            {/* Invisible backdrop — tap anywhere to close */}
                            <div
                              style={{ position: 'fixed', inset: 0, zIndex: 199 }}
                              onClick={(e) => { e.stopPropagation(); setActiveMenuMsg(null); }}
                              onTouchStart={(e) => { e.stopPropagation(); e.preventDefault(); clearTimeout(longPressTimerRef.current); setActiveMenuMsg(null); }}
                            />
                            <div style={{
                              position: 'absolute',
                              right: me ? 0 : 'auto',
                              left: me ? 'auto' : 0,
                              top: openUpwards ? 'auto' : 26,
                              bottom: openUpwards ? 26 : 'auto',
                              width: 160,
                              background: 'var(--surface-2)', border: '1px solid var(--border)',
                              borderRadius: 10, boxShadow: '0 10px 30px rgba(0,0,0,0.4)',
                              padding: 5, display: 'flex', flexDirection: 'column', gap: 2,
                              zIndex: 10000
                            }}>
                              {activeChat.type === 'consultation' && (
                                <button 
                                  className="btn btn-ghost btn-sm" 
                                  onClick={() => { setReplyTo(msg); setEditingMsg(null); setActiveMenuMsg(null); }}
                                  style={{ justifyContent: 'flex-start', padding: '6px 8px', fontSize: 12 }}
                                >
                                  Reply / Quote
                                </button>
                              )}
                              
                              {msg.text && (
                                <button 
                                  className="btn btn-ghost btn-sm" 
                                  onClick={() => { navigator.clipboard.writeText(msg.text); toast.success('Message copied!'); setActiveMenuMsg(null); }}
                                  style={{ justifyContent: 'flex-start', padding: '6px 8px', fontSize: 12 }}
                                >
                                  Copy Message
                                </button>
                              )}

                              {activeChat.type === 'consultation' && me && msg.text && (
                                <button 
                                  className="btn btn-ghost btn-sm" 
                                  onClick={() => { setEditingMsg(msg); setReplyTo(null); setText(msg.text); setActiveMenuMsg(null); }}
                                  style={{ justifyContent: 'flex-start', padding: '6px 8px', fontSize: 12 }}
                                >
                                  Edit Message
                                </button>
                              )}

                              {activeChat.type === 'consultation' && (
                                <>
                                  <button 
                                    className="btn btn-ghost btn-sm" 
                                    onClick={() => handleDeleteSingleMessage(msg._id, 'me')}
                                    style={{ justifyContent: 'flex-start', padding: '6px 8px', fontSize: 12 }}
                                  >
                                    Delete for me
                                  </button>
                                  {me && (
                                    <button 
                                      className="btn btn-ghost btn-sm" 
                                      onClick={() => handleDeleteSingleMessage(msg._id, 'everyone')}
                                      style={{ justifyContent: 'flex-start', color: '#EF4444', padding: '6px 8px', fontSize: 12 }}
                                    >
                                      Delete for everyone
                                    </button>
                                  )}
                                </>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    )}

                    {/* Quoted Reply reference block */}
                    {msg.replyTo && (
                      <div style={{
                        padding: '6px 10px',
                        background: me ? 'rgba(0, 0, 0, 0.12)' : 'var(--surface-3)',
                        borderLeft: `3px solid ${me ? '#fff' : 'var(--primary)'}`,
                        borderRadius: 6,
                        marginBottom: 8,
                        fontSize: 12,
                        color: 'var(--text-muted)'
                      }}>
                        <p style={{ fontWeight: 700, margin: '0 0 2px 0', fontSize: 11, color: me ? '#fff' : 'var(--primary-light)' }}>
                          {msg.replyTo.senderModel === 'Lawyer' ? 'You' : activeDetails.name}
                        </p>
                        <p style={{ margin: 0 }} className="truncate">{msg.replyTo.text || '📎 File Attachment'}</p>
                      </div>
                    )}

                    {/* Deleted message status */}
                    {msg.deletedForEveryone ? (
                      <p style={{ margin: 0, fontSize: 13, fontStyle: 'italic', color: me ? '#e2e8f0' : 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Ban size={12} /> This message was deleted
                      </p>
                    ) : (
                      <>
                        {/* 1. Rendering attachments first (top) */}
                        {msg.attachments && msg.attachments.length > 0 && (() => {
                          const mediaAttachments = msg.attachments.filter(att => getMediaType(att) !== 'file' && getMediaType(att) !== 'pdf' && getMediaType(att) !== 'office');
                          const fileAttachments = msg.attachments.filter(att => getMediaType(att) === 'file' || getMediaType(att) === 'pdf' || getMediaType(att) === 'office');
                          
                          return (
                            <>
                              {/* Media Gallery (WhatsApp Grid Style) */}
                              {mediaAttachments.length > 0 && (
                                <div style={{
                                  display: 'grid',
                                  gridTemplateColumns: mediaAttachments.length === 1 ? '1fr' : '1fr 1fr',
                                  gap: 6,
                                  width: '100%',
                                  maxWidth: 240,
                                  marginBottom: (msg.text && !msg.text.startsWith('Shared file:')) || fileAttachments.length > 0 ? 8 : 0,
                                  borderRadius: 10,
                                  overflow: 'hidden'
                                }}>
                                  {mediaAttachments.slice(0, 4).map((att, idx) => {
                                    const type = getMediaType(att);
                                    const isMoreThanFour = mediaAttachments.length > 4 && idx === 3;
                                    const remainingCount = mediaAttachments.length - 4;
                                    const thumbHeight = mediaAttachments.length === 1 ? 160 : mediaAttachments.length === 2 ? 100 : 80;

                                    return (
                                      <div 
                                        key={idx}
                                        onClick={() => setMediaViewer({ url: att.url, type, name: att.fileName || 'Media' })}
                                        style={{
                                          position: 'relative',
                                          width: '100%',
                                          height: thumbHeight,
                                          cursor: 'pointer',
                                          background: '#000',
                                          overflow: 'hidden'
                                        }}
                                      >
                                        {type === 'image' ? (
                                          <img 
                                            src={att.url} 
                                            alt="" 
                                            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} 
                                          />
                                        ) : (
                                          <>
                                            <video 
                                              src={`${att.url}#t=0.1`} 
                                              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', opacity: 0.85 }} 
                                              preload="metadata"
                                            />
                                            <div style={{
                                              position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                              background: 'rgba(0, 0, 0, 0.2)'
                                            }}>
                                              <div style={{
                                                width: 30, height: 30, borderRadius: '50%', background: 'rgba(255, 255, 255, 0.3)',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(2px)'
                                              }}>
                                                <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" style={{ color: '#fff', marginLeft: 1 }}>
                                                  <path d="M8 5v14l11-7z"/>
                                                </svg>
                                              </div>
                                            </div>
                                          </>
                                        )}
                                        
                                        {isMoreThanFour && (
                                          <div style={{
                                            position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            color: '#fff', fontSize: 16, fontWeight: 700
                                          }}>
                                            +{remainingCount + 1}
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              )}

                              {/* General File & Documents Attachments (e.g. Word, Excel, PDFs) */}
                              {fileAttachments.length > 0 && (
                                <div style={{
                                  display: 'flex', flexDirection: 'column', gap: 6,
                                  marginBottom: (msg.text && !msg.text.startsWith('Shared file:')) ? 8 : 0
                                }}>
                                  {fileAttachments.map((att, idx) => {
                                    const type = getMediaType(att);
                                    const isPreviewable = type === 'pdf' || type === 'office';

                                    return (
                                      <div key={idx} style={{
                                        padding: '8px 12px', borderRadius: 8,
                                        background: me ? 'rgba(255,255,255,0.12)' : 'var(--surface-3)',
                                        display: 'flex', flexDirection: 'column', gap: 8, width: '100%'
                                      }}>
                                        {/* Inline Visual Document Preview (PDF / Word) */}
                                        {isPreviewable && renderInlineDocPreview(att, type)}

                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                          <FileText size={16} style={{ flexShrink: 0 }} />
                                          <div style={{ flex: 1, minWidth: 0 }}>
                                            <p style={{ fontSize: 11.5, fontWeight: 600, margin: 0 }} className="truncate">
                                              {att.fileName || 'Shared Document'}
                                            </p>
                                          </div>
                                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                                            {isPreviewable && (
                                              <button 
                                                onClick={() => setMediaViewer({ url: att.url, type, name: att.fileName || 'Document' })}
                                                style={{ 
                                                  background: 'none', border: 'none', padding: 4, cursor: 'pointer',
                                                  color: me ? '#fff' : 'var(--primary-light)', display: 'inline-flex', alignItems: 'center',
                                                  outline: 'none'
                                                }}
                                                title="Preview Document"
                                              >
                                                <Eye size={14} />
                                              </button>
                                            )}
                                            <button 
                                              onClick={() => downloadFile(att.url, att.fileName || 'Document')}
                                              style={{ background: 'none', border: 'none', padding: 4, cursor: 'pointer', color: me ? '#fff' : 'var(--primary-light)', display: 'inline-flex', outline: 'none' }}
                                              title="Download Document"
                                            >
                                              <Download size={14} />
                                            </button>
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </>
                          );
                        })()}

                        {/* 2. Rendering text message second (bottom) if it's not a auto-generated system upload text */}
                        {msg.text && !msg.text.startsWith('Shared file:') && (
                          <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.5 }}>
                            {msg.text}
                            {msg.isEdited && (
                              <span style={{ fontSize: 10, marginLeft: 6, opacity: 0.7, fontStyle: 'italic' }}>(edited)</span>
                            )}
                          </p>
                        )}
                      </>
                    )}

                    <div style={{
                      fontSize: 9.5, marginTop: 4, opacity: 0.6,
                      textAlign: 'right', fontWeight: 500
                    }}>
                      {new Date(msg.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Quoted Reply Preview Box */}
          {replyTo && (
            <div style={{
              padding: '10px 20px', background: 'var(--surface-2)',
              borderTop: '1px solid var(--border)', display: 'flex',
              alignItems: 'center', justifyContent: 'space-between', gap: 12
            }}>
              <div style={{
                borderLeft: '4px solid var(--primary)', paddingLeft: 10,
                flex: 1, minWidth: 0
              }}>
                <p style={{ margin: '0 0 2px 0', fontSize: 11.5, fontWeight: 700, color: 'var(--primary-light)' }}>
                  Replying to {replyTo.senderModel === 'Lawyer' ? 'yourself' : activeDetails.name}
                </p>
                <p style={{ margin: 0, fontSize: 12.5, color: 'var(--text-muted)' }} className="truncate">
                  {replyTo.text || '📎 Media Attachment'}
                </p>
              </div>
              <button 
                className="btn-icon" 
                onClick={() => setReplyTo(null)}
                style={{ width: 24, height: 24 }}
              >
                <X size={14} />
              </button>
            </div>
          )}

          {/* Editing Preview Box */}
          {editingMsg && (
            <div style={{
              padding: '10px 20px', background: 'var(--surface-2)',
              borderTop: '1px solid var(--border)', display: 'flex',
              alignItems: 'center', justifyContent: 'space-between', gap: 12
            }}>
              <div style={{
                borderLeft: '4px solid #F59E0B', paddingLeft: 10,
                flex: 1, minWidth: 0
              }}>
                <p style={{ margin: '0 0 2px 0', fontSize: 11.5, fontWeight: 700, color: '#F59E0B' }}>
                  Editing message
                </p>
                <p style={{ margin: 0, fontSize: 12.5, color: 'var(--text-muted)' }} className="truncate">
                  {editingMsg.text}
                </p>
              </div>
              <button 
                className="btn-icon" 
                onClick={() => { setEditingMsg(null); setText(''); }}
                style={{ width: 24, height: 24 }}
              >
                <X size={14} />
              </button>
            </div>
          )}

          {/* Queued Selected File Preview Box */}
          {selectedFile && (
            <div style={{
              padding: '10px 20px', background: 'var(--surface-2)',
              borderTop: '1px solid var(--border)', display: 'flex',
              alignItems: 'center', justifyContent: 'space-between', gap: 12
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
                <FileText size={18} color="var(--primary-light)" />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 600 }} className="truncate">
                    {selectedFile.name}
                  </p>
                  <p style={{ margin: '2px 0 0 0', fontSize: 10.5, color: 'var(--text-muted)' }}>
                    {(selectedFile.size / 1024).toFixed(1)} KB • Ready to send
                  </p>
                </div>
              </div>
              <button 
                className="btn-icon" 
                onClick={() => setSelectedFile(null)}
                style={{ width: 24, height: 24 }}
              >
                <X size={14} />
              </button>
            </div>
          )}

          {/* Input Bar */}
          <div style={{
            padding: '14px 20px',
            borderTop: '1px solid var(--border)',
            background: 'var(--bg-2)',
            display: 'flex', alignItems: 'center', gap: 10
          }}>
            
            {/* Attachment input */}
            <label style={{
              cursor: (isBlocked || isBlockedByOther) ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: 38, height: 38, borderRadius: '50%',
              background: 'var(--surface-2)', transition: 'background 0.2s'
            }} className="btn-icon">
              <Paperclip size={16} color={(isBlocked || isBlockedByOther) ? 'var(--text-dim)' : 'var(--text-muted)'} />
              <input 
                type="file" 
                accept="image/*,video/*"
                style={{ display: 'none' }} 
                onChange={handleAttachFile} 
                disabled={isBlocked || isBlockedByOther} 
              />
            </label>

            <input
              className="input"
              placeholder={
                isBlocked 
                  ? 'Unblock to send messages' 
                  : isBlockedByOther 
                    ? 'Messages unavailable' 
                    : editingMsg 
                      ? 'Edit message content...' 
                      : selectedFile
                        ? 'Add a caption...'
                        : 'Type a message…'
              }
              value={text}
              onChange={e => setText(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }}}
              disabled={isBlocked || isBlockedByOther}
              style={{ flex: 1, borderRadius: 20 }}
            />
            <button
              className="btn btn-primary"
              onClick={handleSend}
              disabled={(!text.trim() && !selectedFile) || sending || isBlocked || isBlockedByOther}
              style={{ width: 38, height: 38, padding: 0, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              {sending ? <span className="spinner" style={{ width: 16, height: 16 }} /> : <Send size={15} style={{ marginLeft: 2 }} />}
            </button>
          </div>

        </div>
      ) : (
        <div style={{
          flex: 1,
          display: isMobile ? 'none' : 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div style={{
            width: 80, height: 80, borderRadius: 24,
            background: 'rgba(59,130,246,0.1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: 20, animation: 'float 3s ease-in-out infinite'
          }}>
            <MessageSquare size={36} color="var(--primary-light)" />
          </div>
          <h2 style={{ fontWeight: 700, fontSize: 20, marginBottom: 8 }}>Select a conversation</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Choose a chat from the left to start messaging</p>
        </div>
      )}

      {/* Lightbox Media & Document Viewer Modal (WhatsApp style) */}
      {mediaViewer && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(5, 7, 12, 0.95)',
          display: 'flex', flexDirection: 'column', zIndex: 9999,
          backdropFilter: 'blur(10px)'
        }}>
          {/* Header */}
          <div style={{
            height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '0 24px', borderBottom: '1px solid rgba(255,255,255,0.08)'
          }}>
            <div>
              <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#fff' }}>{mediaViewer.name}</h3>
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <button 
                onClick={() => downloadFile(mediaViewer.url, mediaViewer.name || 'Document')}
                className="btn btn-ghost btn-sm" 
                style={{ color: '#fff', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: 6 }}
              >
                <Download size={15} /> Download
              </button>
              <button 
                className="btn btn-ghost btn-sm" 
                onClick={() => setMediaViewer(null)}
                style={{ color: '#fff', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: 6 }}
              >
                <X size={16} /> Close
              </button>
            </div>
          </div>

          {/* Body with Dynamic rendering (Images, Videos, PDFs, Word, Excel documents) */}
          <div style={{
            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 24, overflow: 'hidden'
          }}>
            {renderLightboxContent()}
          </div>
        </div>
      )}

      {/* REPORT USER MODAL */}
      {reportModalOpen && (
        <div className="modal-overlay" onClick={() => setReportModalOpen(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()} style={{ maxWidth: 440 }}>
            <div className="modal-header">
              <h2 className="modal-title">Report User</h2>
              <button className="btn-icon" onClick={() => setReportModalOpen(false)}><X size={18} /></button>
            </div>
            
            <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 16 }}>
              Why are you reporting this profile? We will review the conversation logs immediately.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 }}>
              {['Harassment', 'Spam', 'Misleading', 'Unprofessional', 'Fake Profile', 'Other'].map(reason => (
                <div
                  key={reason}
                  onClick={() => setRepReason(reason)}
                  style={{
                    padding: '11px 14px', borderRadius: 10, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    background: repReason === reason ? 'rgba(239,68,68,0.08)' : 'var(--surface-2)',
                    border: `1px solid ${repReason === reason ? 'rgba(239,68,68,0.2)' : 'var(--border)'}`,
                    transition: 'all 0.15s'
                  }}
                >
                  <span style={{ fontSize: 14, color: repReason === reason ? '#EF4444' : 'var(--text-2)' }}>{reason}</span>
                  {repReason === reason && <CheckCircle2 size={16} color="#EF4444" />}
                </div>
              ))}
            </div>

            {repReason === 'Other' && (
              <textarea
                className="input"
                rows={3}
                placeholder="Please describe the issue..."
                value={repCustom}
                onChange={e => setRepCustom(e.target.value)}
                style={{ width: '100%', marginBottom: 16 }}
              />
            )}

            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setReportModalOpen(false)}>Cancel</button>
              <button 
                className="btn btn-primary" 
                style={{ flex: 1, background: '#EF4444', borderColor: '#EF4444' }} 
                onClick={handleReportSubmit}
                disabled={reporting}
              >
                {reporting ? <span className="spinner" style={{ width: 14, height: 14 }} /> : 'Submit Report'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
