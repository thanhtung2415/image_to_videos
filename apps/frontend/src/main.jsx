import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Film, ImagePlus, LoaderCircle, LogOut, Play, RefreshCcw, Sparkles, Upload } from 'lucide-react';
import {
  clearSession,
  createProject,
  getProject,
  getProjects,
  getProviders,
  getStoredUser,
  login,
  register,
  saveSession
} from './api.js';
import './styles.css';

const emptyAuth = {
  name: 'Nguyen Van A',
  email: 'demo@example.com',
  password: '123456'
};

function AuthPanel({ onSignedIn }) {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState(emptyAuth);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      const action = mode === 'login' ? login : register;
      const payload = mode === 'login' ? { email: form.email, password: form.password } : form;
      const session = await action(payload);
      saveSession(session);
      onSignedIn(session.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <div className="brand-mark">
          <Sparkles size={28} />
        </div>
        <h1>Image To Videos</h1>
        <p>Dang nhap de upload anh va tao video ngan bang FFmpeg MVP.</p>

        <div className="tabs">
          <button className={mode === 'login' ? 'active' : ''} type="button" onClick={() => setMode('login')}>
            Dang nhap
          </button>
          <button className={mode === 'register' ? 'active' : ''} type="button" onClick={() => setMode('register')}>
            Dang ky
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {mode === 'register' && (
            <label>
              Ho ten
              <input
                value={form.name}
                onChange={(event) => setForm({ ...form, name: event.target.value })}
                minLength={2}
                maxLength={80}
                required
              />
            </label>
          )}

          <label>
            Email
            <input
              type="email"
              value={form.email}
              onChange={(event) => setForm({ ...form, email: event.target.value })}
              required
            />
          </label>

          <label>
            Mat khau
            <input
              type="password"
              value={form.password}
              onChange={(event) => setForm({ ...form, password: event.target.value })}
              minLength={6}
              required
            />
          </label>

          {error && <div className="alert">{error}</div>}

          <button className="primary-button" disabled={loading} type="submit">
            {loading ? <LoaderCircle className="spin" size={18} /> : <Play size={18} />}
            {mode === 'login' ? 'Dang nhap' : 'Tao tai khoan'}
          </button>
        </form>
      </section>
    </main>
  );
}

function ProjectForm({ onCreated }) {
  const [title, setTitle] = useState('Video demo tu hinh anh');
  const [prompt, setPrompt] = useState('Tao chuyen dong nhe, cam giac cinematic.');
  const [duration, setDuration] = useState('5');
  const [resolution, setResolution] = useState('1280x720');
  const [generationMode, setGenerationMode] = useState('ffmpeg');
  const [provider, setProvider] = useState('fal');
  const [model, setModel] = useState('fal-image-to-video');
  const [providers, setProviders] = useState([]);
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  useEffect(() => {
    getProviders()
      .then((result) => setProviders(result.providers || []))
      .catch(() => setProviders([]));
  }, []);

  const selectedProvider = providers.find((item) => item.name === provider);
  const selectedModels = selectedProvider?.models || [];

  function handleImageChange(file) {
    setImage(file);
    setPreview(file ? URL.createObjectURL(file) : '');
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('prompt', prompt);
      formData.append('duration', duration);
      formData.append('resolution', resolution);
      formData.append('generationMode', generationMode);
      formData.append('provider', provider);
      formData.append('model', model);
      formData.append('image', image);

      const result = await createProject(formData);
      onCreated(result.project);
      setImage(null);
      setPreview('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="panel">
      <div className="section-title">
        <ImagePlus size={22} />
        <h2>Tao video moi</h2>
      </div>

      <form className="project-form" onSubmit={handleSubmit}>
        <label>
          Tieu de
          <input value={title} onChange={(event) => setTitle(event.target.value)} minLength={2} maxLength={120} />
        </label>

        <label>
          Prompt
          <textarea value={prompt} onChange={(event) => setPrompt(event.target.value)} maxLength={600} rows={3} />
        </label>

        <div className="form-grid">
          <label>
            Thoi luong
            <select value={duration} onChange={(event) => setDuration(event.target.value)}>
              <option value="3">3 giay</option>
              <option value="5">5 giay</option>
              <option value="8">8 giay</option>
              <option value="10">10 giay</option>
            </select>
          </label>

          <label>
            Ty le
            <select value={resolution} onChange={(event) => setResolution(event.target.value)}>
              <option value="1280x720">Landscape 16:9</option>
              <option value="720x1280">Portrait 9:16</option>
              <option value="1024x1024">Square 1:1</option>
            </select>
          </label>
        </div>

        <div className="form-grid">
          <label>
            Engine
            <select value={generationMode} onChange={(event) => setGenerationMode(event.target.value)}>
              <option value="ffmpeg">FFmpeg stable</option>
              <option value="ai">AI provider</option>
            </select>
          </label>

          <label>
            Provider
            <select
              value={provider}
              disabled={generationMode !== 'ai'}
              onChange={(event) => {
                const nextProvider = event.target.value;
                const nextModels = providers.find((item) => item.name === nextProvider)?.models || [];
                setProvider(nextProvider);
                setModel(nextModels[0]?.id || '');
              }}
            >
              {providers.map((item) => (
                <option key={item.name} value={item.name}>
                  {item.name} {item.enabled ? '' : '(not configured)'}
                </option>
              ))}
            </select>
          </label>
        </div>

        {generationMode === 'ai' && (
          <label>
            Model
            <select value={model} onChange={(event) => setModel(event.target.value)}>
              {selectedModels.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label} - {item.native2K ? 'Native 2K' : 'Upscaled 2K'}
                </option>
              ))}
            </select>
          </label>
        )}

        <button className="upload-box" type="button" onClick={() => fileInputRef.current?.click()}>
          {preview ? <img src={preview} alt="Preview upload" /> : <Upload size={32} />}
          <span>{image ? image.name : 'Chon anh JPG, PNG hoac WEBP'}</span>
        </button>

        <input
          ref={fileInputRef}
          hidden
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={(event) => handleImageChange(event.target.files?.[0])}
        />

        {error && <div className="alert">{error}</div>}

        <button className="primary-button" disabled={!image || loading} type="submit">
          {loading ? <LoaderCircle className="spin" size={18} /> : <Film size={18} />}
          Tao video
        </button>
      </form>
    </section>
  );
}

function StatusBadge({ status }) {
  return <span className={`badge ${status}`}>{status}</span>;
}

function ProjectCard({ project, onRefresh }) {
  return (
    <article className="project-card">
      <div className="project-media">
        {project.outputVideo?.url ? (
          <video controls src={project.outputVideo.url} />
        ) : (
          <img src={project.sourceImage?.url} alt={project.title} />
        )}
      </div>

      <div className="project-info">
        <div>
          <h3>{project.title}</h3>
          <StatusBadge status={project.status} />
        </div>
        <p>{project.prompt || 'Khong co prompt'}</p>
        <div className="project-meta">
          <span>{project.generationMode}</span>
          <span>{project.costCredits} credits</span>
          <span>{new Date(project.createdAt).toLocaleString('vi-VN')}</span>
        </div>
        {project.status !== 'completed' && (
          <button className="ghost-button" type="button" onClick={() => onRefresh(project._id)}>
            <RefreshCcw size={16} />
            Cap nhat
          </button>
        )}
      </div>
    </article>
  );
}

function Dashboard({ user, onLogout }) {
  const [projects, setProjects] = useState([]);
  const [currentUser, setCurrentUser] = useState(user);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const activeProjects = useMemo(
    () => projects.filter((project) => ['queued', 'processing', 'post_processing', 'uploading'].includes(project.status)),
    [projects]
  );

  async function loadProjects() {
    try {
      const result = await getProjects();
      setProjects(result.projects);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function refreshProject(projectId) {
    const result = await getProject(projectId);
    setProjects((items) => items.map((item) => (item._id === projectId ? result.project : item)));
  }

  useEffect(() => {
    loadProjects();
  }, []);

  useEffect(() => {
    if (!activeProjects.length) {
      return undefined;
    }

    const timer = window.setInterval(() => {
      activeProjects.forEach((project) => refreshProject(project._id));
    }, 3000);

    return () => window.clearInterval(timer);
  }, [activeProjects]);

  function handleLogout() {
    clearSession();
    onLogout();
  }

  function handleCreated(project) {
    setProjects((items) => [project, ...items]);
    setCurrentUser((value) => ({
      ...value,
      creditWallet: {
        ...value.creditWallet,
        availableCredit: value.creditWallet.availableCredit - project.costCredits,
        reservedCredit: value.creditWallet.reservedCredit + project.costCredits
      }
    }));
  }

  return (
    <main className="dashboard">
      <header className="topbar">
        <div>
          <span className="eyebrow">Commercial MVP</span>
          <h1>Image To Videos</h1>
        </div>
        <div className="account-box">
          <div>
            <strong>{currentUser.name}</strong>
            <span>{currentUser.creditWallet?.availableCredit ?? 0} credits</span>
          </div>
          <button className="icon-button" type="button" onClick={handleLogout} aria-label="Dang xuat">
            <LogOut size={20} />
          </button>
        </div>
      </header>

      <div className="layout">
        <ProjectForm onCreated={handleCreated} />

        <section className="panel history-panel">
          <div className="section-title">
            <Film size={22} />
            <h2>Video da tao</h2>
          </div>

          {error && <div className="alert">{error}</div>}
          {loading && <div className="empty">Dang tai du lieu...</div>}
          {!loading && projects.length === 0 && <div className="empty">Chua co video nao.</div>}

          <div className="project-list">
            {projects.map((project) => (
              <ProjectCard key={project._id} project={project} onRefresh={refreshProject} />
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

function App() {
  const [user, setUser] = useState(getStoredUser());

  if (!user) {
    return <AuthPanel onSignedIn={setUser} />;
  }

  return <Dashboard user={user} onLogout={() => setUser(null)} />;
}

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
