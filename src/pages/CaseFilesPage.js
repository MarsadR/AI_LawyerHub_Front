import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  FolderOpen, Folder, Upload, Trash2, Download,
  Grid, List, Search, ChevronRight, Home, X,
  FileText, Image as ImageIcon, Film, File,
  FolderPlus, ArrowLeft, RefreshCw,
  Play, Pause, Volume2, VolumeX
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import axios from 'axios';

// ── Helpers ────────────────────────────────────────────────────────────────────

function formatBytes(b) {
  if (!b) return '';
  if (b < 1024) return `${b} B`;
  if (b < 1048576) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / 1048576).toFixed(1)} MB`;
}

function uid() {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function getExt(name = '') {
  return name.split('.').pop()?.toLowerCase() || '';
}

function isImage(node) {
  return node.type?.startsWith('image/') || ['jpg','jpeg','png','gif','webp','svg'].includes(getExt(node.name));
}
function isVideo(node) {
  return node.type?.startsWith('video/') || ['mp4','mov','avi','webm','mkv'].includes(getExt(node.name));
}
function isPdf(node) {
  return node.type === 'application/pdf' || getExt(node.name) === 'pdf';
}
function isOfficeDoc(node) {
  const ext = getExt(node.name);
  return ['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'].includes(ext) || node.type?.includes('officedocument') || node.type?.includes('msword');
}

function getVideoThumbnail(url) {
  if (!url) return null;
  // If it's a Cloudinary video, we can ask for a jpg thumbnail
  if (url.includes('cloudinary.com/video/upload/')) {
    return url.replace(/\.[^/.]+$/, ".jpg");
  }
  return null; // For local we just show the icon
}

// ── File Icon ─────────────────────────────────────────────────────────────────

function FileIcon({ node, size = 20 }) {
  if (node.type === 'folder') return <Folder size={size} color="#FBBF24" />;
  if (isImage(node)) return <ImageIcon size={size} color="#34D399" />;
  if (isVideo(node)) return <Film size={size} color="#A78BFA" />;
  if (isPdf(node)) return <FileText size={size} color="#F87171" />;
  if (isOfficeDoc(node)) return <FileText size={size} color="#60A5FA" />;
  return <File size={size} color="#94A3B8" />;
}

// File type badge label
function typeLabel(node) {
  if (node.type === 'folder') return null;
  if (isImage(node)) return { label: 'IMG', color: '#34D399' };
  if (isVideo(node)) return { label: 'VID', color: '#A78BFA' };
  if (isPdf(node)) return { label: 'PDF', color: '#F87171' };
  if (isOfficeDoc(node)) return { label: getExt(node.name).toUpperCase() || 'DOC', color: '#60A5FA' };
  const ext = getExt(node.name).toUpperCase();
  return { label: ext || 'FILE', color: '#94A3B8' };
}

// ── Custom Video Player ────────────────────────────────────────────────────────

function CustomVideoPlayer({ node, onClose }) {
  const containerRef = useRef(null);
  const videoRef = useRef(null);
  const [playing, setPlaying] = useState(true);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [muted, setMuted] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const timeoutRef = useRef(null);

  const handleMouseMove = useCallback(() => {
    setShowControls(true);
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      if (playing) setShowControls(false);
    }, 2500);
  }, [playing]);

  useEffect(() => {
    handleMouseMove();
    return () => clearTimeout(timeoutRef.current);
  }, [handleMouseMove]);

  useEffect(() => {
    if (containerRef.current) {
      const el = containerRef.current;
      if (el.requestFullscreen) el.requestFullscreen().catch(()=>{});
      else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
    }
    const handleFsChange = () => {
      if (!document.fullscreenElement && !document.webkitFullscreenElement) {
        onClose();
      }
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    document.addEventListener('webkitfullscreenchange', handleFsChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFsChange);
      document.removeEventListener('webkitfullscreenchange', handleFsChange);
      if (document.fullscreenElement) document.exitFullscreen?.().catch(()=>{});
    };
  }, [onClose]);

  const togglePlay = (e) => {
    if (e) e.stopPropagation();
    if (playing) videoRef.current?.pause();
    else videoRef.current?.play();
    setPlaying(!playing);
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    setProgress((videoRef.current.currentTime / (videoRef.current.duration || 1)) * 100);
  };

  const handleSeek = (e) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    if (videoRef.current) {
      videoRef.current.currentTime = pos * (videoRef.current.duration || 0);
    }
  };

  const formatTime = (sec) => {
    if (!sec || isNaN(sec)) return "0:00";
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div 
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onClick={togglePlay}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999, background: '#000',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: showControls ? 'default' : 'none'
      }}
    >
      <video
        ref={videoRef}
        src={node.fileUrl}
        autoPlay
        playsInline
        muted={muted}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={(e) => setDuration(e.target.duration)}
        onEnded={() => setPlaying(false)}
        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
      />
      
      {/* Controls Overlay */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: showControls ? 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 15%, transparent 85%, rgba(0,0,0,0.6) 100%)' : 'transparent',
        transition: 'background 0.4s ease',
        display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
        padding: '30px 40px'
      }}>
        {/* Top bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', opacity: showControls ? 1 : 0, transition: 'opacity 0.4s', transform: showControls ? 'translateY(0)' : 'translateY(-10px)' }}>
          <div style={{ color: '#fff', fontSize: 16, fontWeight: 600, textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}>
            {node.name}
          </div>
          <button 
            onClick={(e) => { e.stopPropagation(); document.exitFullscreen?.().catch(()=>{}); onClose(); }}
            style={{ pointerEvents: 'auto', background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff', padding: 10, borderRadius: '50%', cursor: 'pointer', backdropFilter: 'blur(10px)', transition: 'background 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.25)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
          >
            <X size={24} />
          </button>
        </div>

        {/* Bottom bar */}
        <div onClick={e => e.stopPropagation()} style={{ opacity: showControls ? 1 : 0, transition: 'opacity 0.4s', transform: showControls ? 'translateY(0)' : 'translateY(10px)', pointerEvents: 'auto', display: 'flex', flexDirection: 'column', gap: 15 }}>
          {/* Progress */}
          <div onClick={handleSeek} style={{ height: 6, background: 'rgba(255,255,255,0.3)', borderRadius: 3, cursor: 'pointer', position: 'relative' }}>
            <div style={{ width: `${progress}%`, height: '100%', background: '#60A5FA', borderRadius: 3, transition: 'width 0.1s linear' }} />
            <div style={{ position: 'absolute', left: `${progress}%`, top: '50%', transform: 'translate(-50%, -50%)', width: 14, height: 14, background: '#fff', borderRadius: '50%', boxShadow: '0 2px 10px rgba(0,0,0,0.5)' }} />
          </div>

          {/* Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
              <button onClick={togglePlay} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex' }}>
                {playing ? <Pause size={28} fill="white" /> : <Play size={28} fill="white" />}
              </button>
              <button onClick={() => setMuted(!muted)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex' }}>
                {muted ? <VolumeX size={24} /> : <Volume2 size={24} />}
              </button>
              <span style={{ color: '#fff', fontSize: 13, fontWeight: 500, fontFamily: 'monospace', textShadow: '0 1px 4px rgba(0,0,0,0.5)' }}>
                {formatTime(videoRef.current?.currentTime)} / {formatTime(duration)}
              </span>
            </div>
            
            <a
              href={node.fileUrl}
              download={node.name}
              target="_blank"
              rel="noreferrer"
              style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', padding: '8px 16px', borderRadius: 20, textDecoration: 'none', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8, backdropFilter: 'blur(10px)', transition: 'background 0.2s', border: '1px solid rgba(255,255,255,0.1)' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.25)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
            >
              <Download size={15} /> Download
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Preview Modal ──────────────────────────────────────────────────────────────


function PreviewModal({ node, onClose }) {
  if (!node) return null;
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{ maxWidth: 900, width: '100%', maxHeight: '90vh', display: 'flex', flexDirection: 'column', gap: 12 }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <p style={{ fontWeight: 700, fontSize: 15, color: '#fff', maxWidth: '80%' }} className="truncate">{node.name}</p>
          <div style={{ display: 'flex', gap: 8 }}>
            {node.fileUrl && (
              <a
                href={node.fileUrl}
                download={node.name}
                target="_blank"
                rel="noreferrer"
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '7px 14px', borderRadius: 8,
                  background: 'rgba(59,130,246,0.3)', color: '#93C5FD',
                  textDecoration: 'none', fontSize: 13, fontWeight: 600,
                  border: '1px solid rgba(59,130,246,0.4)'
                }}
              >
                <Download size={14} /> Download
              </a>
            )}
            <button
              onClick={onClose}
              style={{
                width: 36, height: 36, borderRadius: 8,
                background: 'rgba(255,255,255,0.1)', border: 'none',
                color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div style={{
          flex: 1, background: 'rgba(0,0,0,0.4)', borderRadius: 16,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          overflow: 'hidden', maxHeight: 'calc(90vh - 80px)'
        }}>
          {isImage(node) && node.fileUrl ? (
            <img
              src={node.fileUrl}
              alt={node.name}
              style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', borderRadius: 12 }}
            />
          ) : isVideo(node) && node.fileUrl ? (
            <video
              className="animate-slide-up"
              src={node.fileUrl}
              controls={true}
              autoPlay
              playsInline
              style={{
                maxWidth: '100%', maxHeight: '100%', borderRadius: 12,
                boxShadow: '0 24px 64px rgba(0,0,0,0.5)'
              }}
            />
          ) : (isPdf(node) || isOfficeDoc(node)) && node.fileUrl ? (
            <iframe
              src={`https://docs.google.com/viewer?url=${encodeURIComponent(node.fileUrl)}&embedded=true`}
              title={node.name}
              style={{ width: '100%', height: '70vh', border: 'none', borderRadius: 12, background: '#fff' }}
            />
          ) : (
            <div style={{ textAlign: 'center', color: '#94A3B8', padding: 40 }}>
              <File size={64} style={{ marginBottom: 16, opacity: 0.4 }} />
              <p style={{ fontSize: 14, marginBottom: 12 }}>Preview not available</p>
              {node.fileUrl && (
                <a
                  href={node.fileUrl}
                  download={node.name}
                  target="_blank"
                  rel="noreferrer"
                  style={{ color: '#60A5FA', fontSize: 13 }}
                >
                  Download to view
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── New Folder Modal ───────────────────────────────────────────────────────────

function NewFolderModal({ onClose, onCreate }) {
  const [name, setName] = useState('');
  const inputRef = useRef();
  useEffect(() => { inputRef.current?.focus(); }, []);
  const submit = (e) => {
    e.preventDefault();
    if (!name.trim()) return toast.error('Enter a folder name');
    onCreate(name.trim());
    onClose();
  };
  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center'
    }}>
      <form onClick={e => e.stopPropagation()} onSubmit={submit} style={{
        background: 'var(--surface)', borderRadius: 20, padding: 28,
        width: 380, border: '1px solid var(--border)', boxShadow: '0 24px 64px rgba(0,0,0,0.5)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 style={{ fontWeight: 700, fontSize: 18 }}>New Folder</h3>
          <button type="button" onClick={onClose} className="btn-icon"><X size={16} /></button>
        </div>
        <div className="input-wrap" style={{ marginBottom: 20 }}>
          <FolderPlus size={15} className="icon-left" />
          <input
            ref={inputRef}
            className="input input-icon"
            placeholder="Folder name…"
            value={name}
            onChange={e => setName(e.target.value)}
            maxLength={120}
          />
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button type="button" className="btn btn-ghost" style={{ flex: 1 }} onClick={onClose}>Cancel</button>
          <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Create</button>
        </div>
      </form>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────

export default function CaseFilesPage() {
  const { API } = useAuth();
  const [nodes, setNodes] = useState([]);           // flat array from server
  const [loading, setLoading] = useState(true);
  const [currentFolderId, setCurrentFolderId] = useState(null);  // null = root
  const [breadcrumbs, setBreadcrumbs] = useState([]);             // [{id, name}]
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const [preview, setPreview] = useState(null);
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [fullscreenVideo, setFullscreenVideo] = useState(null);
  const fileInputRef = useRef();

  // ── Native Fullscreen Video ──
  const handleNodeClick = (node) => {
    if (node.type === 'folder') {
      openFolder(node);
    } else if (isVideo(node) && node.fileUrl) {
      setFullscreenVideo(node);
    } else {
      setPreview(node);
    }
  };

  // ── Fetch ────────────────────────────────────────────────────────────────────
  const fetchNodes = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API}/case-files`);
      const data = res.data?.data;
      setNodes(Array.isArray(data) ? data : []);
    } catch {
      toast.error('Failed to load files');
    } finally {
      setLoading(false);
    }
  }, [API]);

  useEffect(() => { fetchNodes(); }, [fetchNodes]);

  // ── Tree helpers ─────────────────────────────────────────────────────────────
  // Children of current folder
  const currentChildren = nodes.filter(n =>
    (n.parentClientId || null) === (currentFolderId || null)
  );

  // Apply search (only when searching)
  const displayed = search.trim()
    ? nodes.filter(n =>
        n.type !== 'folder' &&
        (n.name || '').toLowerCase().includes(search.toLowerCase())
      )
    : currentChildren;

  // Sort: folders first, then files, alpha
  const sorted = [...displayed].sort((a, b) => {
    if (a.type === 'folder' && b.type !== 'folder') return -1;
    if (a.type !== 'folder' && b.type === 'folder') return 1;
    return (a.name || '').localeCompare(b.name || '');
  });

  // Counts
  const folderCount = currentChildren.filter(n => n.type === 'folder').length;
  const fileCount = currentChildren.filter(n => n.type !== 'folder').length;

  // ── Navigation ───────────────────────────────────────────────────────────────
  const openFolder = (node) => {
    setCurrentFolderId(node.clientId);
    setBreadcrumbs(prev => [...prev, { id: node.clientId, name: node.name }]);
    setSearch('');
  };

  const goToBreadcrumb = (index) => {
    if (index === -1) {
      setCurrentFolderId(null);
      setBreadcrumbs([]);
    } else {
      const crumb = breadcrumbs[index];
      setCurrentFolderId(crumb.id);
      setBreadcrumbs(prev => prev.slice(0, index + 1));
    }
    setSearch('');
  };

  const goBack = () => {
    if (breadcrumbs.length === 0) return;
    goToBreadcrumb(breadcrumbs.length - 2);
  };

  // ── Create Folder ─────────────────────────────────────────────────────────────
  const handleCreateFolder = async (name) => {
    const newId = uid();
    try {
      await axios.post(`${API}/case-files/folder`, {
        clientId: newId,
        parentClientId: currentFolderId || null,
        name
      });
      toast.success(`Folder "${name}" created`);
      fetchNodes();
    } catch {
      toast.error('Failed to create folder');
    }
  };

  // ── Upload File ───────────────────────────────────────────────────────────────
  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const newId = uid();
    const formData = new FormData();
    formData.append('file', file);
    formData.append('clientId', newId);
    formData.append('parentClientId', currentFolderId || '');
    formData.append('name', file.name);
    formData.append('mimeType', file.type);
    setUploading(true);
    try {
      await axios.post(`${API}/case-files/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success(`"${file.name}" uploaded`);
      fetchNodes();
    } catch {
      toast.error('Upload failed');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // ── Delete ────────────────────────────────────────────────────────────────────
  const handleDelete = async (node) => {
    const label = node.type === 'folder' ? `folder "${node.name}" and all its contents` : `"${node.name}"`;
    if (!window.confirm(`Delete ${label}?`)) return;
    setDeleting(node.clientId);
    try {
      await axios.delete(`${API}/case-files/${node.clientId}`);
      toast.success('Deleted');
      fetchNodes();
    } catch {
      toast.error('Delete failed');
    } finally {
      setDeleting(null);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────────
  const isSearching = !!search.trim();

  return (
    <div style={{ padding: '28px 32px 60px' }}>
      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: -0.5 }}>Case Files</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 3 }}>
            {isSearching
              ? `Search results for "${search}"`
              : `${folderCount} folder${folderCount !== 1 ? 's' : ''} · ${fileCount} file${fileCount !== 1 ? 's' : ''}`}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-ghost btn-sm" onClick={fetchNodes}>
            <RefreshCw size={14} />
          </button>
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => setShowNewFolder(true)}
            title="New Folder"
          >
            <FolderPlus size={15} /> New Folder
          </button>
          <button
            className="btn btn-primary btn-sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            {uploading
              ? <><span className="spinner" style={{ width: 13, height: 13 }} /> Uploading…</>
              : <><Upload size={14} /> Upload</>}
          </button>
          <input ref={fileInputRef} type="file" style={{ display: 'none' }} onChange={handleUpload} />
        </div>
      </div>

      {/* ── Breadcrumb ── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 6,
        padding: '10px 14px', borderRadius: 12,
        background: 'var(--surface-2)', border: '1px solid var(--border)',
        marginBottom: 16, flexWrap: 'wrap'
      }}>
        {breadcrumbs.length > 0 && (
          <button
            onClick={goBack}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--text-muted)', padding: '2px 6px', borderRadius: 6,
              display: 'flex', alignItems: 'center'
            }}
            title="Go back"
          >
            <ArrowLeft size={15} />
          </button>
        )}
        <button
          onClick={() => goToBreadcrumb(-1)}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 5,
            color: currentFolderId ? 'var(--text-muted)' : 'var(--primary-light)',
            fontWeight: 600, fontSize: 13, padding: '2px 6px', borderRadius: 6
          }}
        >
          <Home size={14} /> My Files
        </button>

        {breadcrumbs.map((crumb, i) => (
          <React.Fragment key={crumb.id}>
            <ChevronRight size={13} color="var(--text-dim)" />
            <button
              onClick={() => goToBreadcrumb(i)}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: i === breadcrumbs.length - 1 ? 'var(--text)' : 'var(--text-muted)',
                fontWeight: i === breadcrumbs.length - 1 ? 700 : 500,
                fontSize: 13, padding: '2px 6px', borderRadius: 6,
                maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
              }}
              title={crumb.name}
            >
              {crumb.name}
            </button>
          </React.Fragment>
        ))}
      </div>

      {/* ── Search + View toggle ── */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, alignItems: 'center' }}>
        <div className="input-wrap" style={{ flex: 1, maxWidth: 400 }}>
          <Search size={15} className="icon-left" />
          <input
            className="input input-icon"
            placeholder="Search all files…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              style={{
                position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)'
              }}
            >
              <X size={13} />
            </button>
          )}
        </div>
        <button
          className="btn-icon"
          onClick={() => setViewMode(v => v === 'grid' ? 'list' : 'grid')}
          title={viewMode === 'grid' ? 'Switch to list' : 'Switch to grid'}
        >
          {viewMode === 'grid' ? <List size={16} /> : <Grid size={16} />}
        </button>
      </div>

      {/* ── Drag & Drop Upload Zone ── */}
      {!isSearching && (
        <div
          onDragOver={e => { e.preventDefault(); e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.background = 'rgba(59,130,246,0.05)'; }}
          onDragLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'transparent'; }}
          onDrop={async (e) => {
            e.preventDefault();
            e.currentTarget.style.borderColor = 'var(--border)';
            e.currentTarget.style.background = 'transparent';
            const file = e.dataTransfer.files[0];
            if (file) handleUpload({ target: { files: [file] } });
          }}
          onClick={() => fileInputRef.current?.click()}
          style={{
            border: '2px dashed var(--border)', borderRadius: 14,
            padding: '14px 20px', marginBottom: 20, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            transition: 'all 0.2s', color: 'var(--text-dim)',
          }}
        >
          <Upload size={16} />
          <span style={{ fontSize: 13 }}>
            Drag & drop files here, or <span style={{ color: 'var(--primary-light)' }}>click to upload</span>
            {currentFolderId ? ` into "${breadcrumbs[breadcrumbs.length - 1]?.name}"` : ' to root'}
          </span>
        </div>
      )}

      {/* ── File / Folder Grid or List ── */}
      {loading ? (
        <div className={viewMode === 'grid' ? 'grid-4' : ''} style={{ gap: 12 }}>
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="skeleton" style={{ height: viewMode === 'grid' ? 130 : 60, borderRadius: 12 }} />
          ))}
        </div>
      ) : sorted.length === 0 ? (
        <div className="glass-card empty-state" style={{ minHeight: 220 }}>
          {isSearching ? <Search size={44} /> : <FolderOpen size={44} />}
          <h3>{isSearching ? 'No files found' : 'This folder is empty'}</h3>
          <p>
            {isSearching
              ? 'Try a different search term'
              : 'Upload files or create a sub-folder to get started'}
          </p>
          {!isSearching && (
            <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowNewFolder(true)}>
                <FolderPlus size={13} /> New Folder
              </button>
              <button className="btn btn-primary btn-sm" onClick={() => fileInputRef.current?.click()}>
                <Upload size={13} /> Upload File
              </button>
            </div>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        /* ── GRID ── */
        <div className="grid-4" style={{ gap: 14 }}>
          {sorted.map((node, i) => {
            const isFolder = node.type === 'folder';
            const badge = typeLabel(node);
            return (
              <div
                key={node.clientId || node._id}
                className="glass-card animate-slide-up"
                style={{
                  padding: 0, overflow: 'hidden', cursor: 'pointer',
                  transition: 'transform 0.2s var(--ease), box-shadow 0.2s',
                  animationDelay: `${i * 0.03}s`,
                  opacity: deleting === node.clientId ? 0.5 : 1,
                  position: 'relative'
                }}
                onClick={() => handleNodeClick(node)}
              >
                {/* Thumbnail / icon area */}
                <div style={{
                  height: 100, position: 'relative', overflow: 'hidden',
                  background: isFolder
                    ? 'rgba(251,191,36,0.1)'
                    : isImage(node) && node.fileUrl
                      ? 'var(--surface-2)'
                      : isVideo(node)
                        ? 'rgba(139,92,246,0.1)'
                        : isPdf(node)
                          ? 'rgba(248,113,113,0.1)'
                          : isOfficeDoc(node)
                            ? 'rgba(96,165,250,0.1)'
                            : 'rgba(100,116,139,0.1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  {isImage(node) && node.fileUrl ? (
                    <img
                      src={node.fileUrl}
                      alt={node.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={e => { e.target.style.display = 'none'; }}
                    />
                  ) : isVideo(node) ? (
                    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
                      {getVideoThumbnail(node.fileUrl) ? (
                        <img
                          src={getVideoThumbnail(node.fileUrl)}
                          alt={node.name}
                          style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(0.8)' }}
                          onError={e => { e.target.style.display = 'none'; }}
                        />
                      ) : (
                        <video
                          src={`${node.fileUrl}#t=0.1`}
                          style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(0.8)' }}
                          preload="metadata"
                          muted
                          playsInline
                        />
                      )}
                      <Film size={24} color="#fff" style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', opacity: 0.8, filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))' }} />
                    </div>
                  ) : (
                    <FileIcon node={node} size={isFolder ? 40 : 34} />
                  )}
                  {/* Folder child count */}
                  {isFolder && (
                    <div style={{
                      position: 'absolute', bottom: 6, right: 8,
                      fontSize: 10, color: '#FBBF24', fontWeight: 700, opacity: 0.8
                    }}>
                      {nodes.filter(n => n.parentClientId === node.clientId).length} items
                    </div>
                  )}
                  {/* File type badge */}
                  {badge && (
                    <div style={{
                      position: 'absolute', top: 6, left: 6,
                      background: `${badge.color}22`,
                      border: `1px solid ${badge.color}44`,
                      color: badge.color,
                      borderRadius: 6, padding: '2px 6px',
                      fontSize: 9, fontWeight: 800, letterSpacing: 0.5
                    }}>
                      {badge.label}
                    </div>
                  )}
                </div>

                {/* Info */}
                <div style={{ padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)' }} className="truncate">
                      {node.name}
                    </p>
                    {!isFolder && node.size && (
                      <p style={{ fontSize: 10, color: 'var(--text-dim)', marginTop: 2 }}>
                        {formatBytes(node.size)}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={e => { e.stopPropagation(); handleDelete(node); }}
                    style={{
                      background: 'none', border: 'none', cursor: 'pointer',
                      color: 'var(--text-dim)', padding: 4, borderRadius: 6,
                      flexShrink: 0, display: 'flex',
                      transition: 'color 0.2s'
                    }}
                    onMouseEnter={e => e.currentTarget.style.color = '#F87171'}
                    onMouseLeave={e => e.currentTarget.style.color = 'var(--text-dim)'}
                    title="Delete"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* ── LIST ── */
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {sorted.map((node, i) => {
            const isFolder = node.type === 'folder';
            return (
              <div
                key={node.clientId || node._id}
                className="glass-card animate-fade-in"
                style={{
                  padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 14,
                  cursor: 'pointer', animationDelay: `${i * 0.02}s`,
                  opacity: deleting === node.clientId ? 0.5 : 1,
                  transition: 'background 0.2s'
                }}
                onClick={() => handleNodeClick(node)}
              >
                <FileIcon node={node} size={22} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }} className="truncate">
                    {node.name}
                  </p>
                  <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                    {isFolder
                      ? `${nodes.filter(n => n.parentClientId === node.clientId).length} items`
                      : `${formatBytes(node.size)} · ${node.createdAt ? new Date(node.createdAt).toLocaleDateString() : ''}`}
                  </p>
                </div>
                {isFolder && <ChevronRight size={16} color="var(--text-dim)" style={{ flexShrink: 0 }} />}
                {!isFolder && node.fileUrl && (
                  <a
                    href={node.fileUrl}
                    download={node.name}
                    target="_blank"
                    rel="noreferrer"
                    onClick={e => e.stopPropagation()}
                    className="btn-icon"
                    style={{ textDecoration: 'none', flexShrink: 0 }}
                    title="Download"
                  >
                    <Download size={14} />
                  </a>
                )}
                <button
                  onClick={e => { e.stopPropagation(); handleDelete(node); }}
                  className="btn-icon"
                  style={{ flexShrink: 0, color: 'var(--text-dim)' }}
                  onMouseEnter={e => e.currentTarget.style.color = '#F87171'}
                  onMouseLeave={e => e.currentTarget.style.color = 'var(--text-dim)'}
                  title="Delete"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Modals ── */}
      {showNewFolder && (
        <NewFolderModal
          onClose={() => setShowNewFolder(false)}
          onCreate={handleCreateFolder}
        />
      )}
      {preview && <PreviewModal node={preview} onClose={() => setPreview(null)} />}
      {fullscreenVideo && <CustomVideoPlayer node={fullscreenVideo} onClose={() => setFullscreenVideo(null)} />}
    </div>
  );
}
