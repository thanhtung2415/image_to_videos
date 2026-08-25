import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Activity, Film, ImagePlus, LoaderCircle, LogOut, Play, RefreshCcw, Shield, Sparkles, Upload } from 'lucide-react';
import {
  clearSession,
  createCheckout,
  createProject,
  getAdminCostSummary,
  getAdminOverview,
  getAdminProviderHealth,
  getProject,
  getProjects,
  getNotifications,
  getProviders,
  getPricingPlans,
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

function PricingPanel({ onPurchased }) {
  const [plans, setPlans] = useState([]);
  const [loadingPlan, setLoadingPlan] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    getPricingPlans()
      .then((result) => setPlans(result.plans || []))
      .catch(() => setPlans([]));
  }, []);

  async function handleBuy(planCode) {
    setLoadingPlan(planCode);
    setMessage('');

    try {
      const result = await createCheckout({
        planCode,
        idempotencyKey: `${planCode}-${crypto.randomUUID()}`
      });
      onPurchased(result.payment);
      setMessage('Credit da duoc cong vao vi.');
    } catch (err) {
      setMessage(err.message);
    } finally {
      setLoadingPlan('');
    }
  }

  return (
    <section className="panel pricing-panel">
      <div className="section-title">
        <Sparkles size={22} />
        <h2>Credit packages</h2>
      </div>

      <div className="plan-grid">
        {plans.map((plan) => (
          <article className="plan-card" key={plan.code}>
            <strong>{plan.name}</strong>
            <span>{plan.credits} credits</span>
            <p>{plan.price.toLocaleString('vi-VN')} {plan.currency}</p>
            <button className="ghost-button" disabled={loadingPlan === plan.code} type="button" onClick={() => handleBuy(plan.code)}>
              {loadingPlan === plan.code ? <LoaderCircle className="spin" size={16} /> : <Sparkles size={16} />}
              Buy
            </button>
          </article>
        ))}
      </div>

      {message && <div className="muted-message">{message}</div>}
    </section>
  );
}

function NotificationsPanel() {
  const [notifications, setNotifications] = useState([]);

  async function loadNotifications() {
    try {
      const result = await getNotifications();
      setNotifications(result.notifications || []);
    } catch {
      setNotifications([]);
    }
  }

  useEffect(() => {
    loadNotifications();
    const timer = window.setInterval(loadNotifications, 5000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <section className="panel notifications-panel">
      <div className="section-title">
        <RefreshCcw size={22} />
        <h2>Notifications</h2>
      </div>

      {notifications.length === 0 && <div className="empty small">No notifications.</div>}

      <div className="notification-list">
        {notifications.slice(0, 5).map((item) => (
          <article className="notification-item" key={item._id}>
            <strong>{item.title}</strong>
            <span>{item.message}</span>
          </article>
        ))}
      </div>
    </section>
  );
}

function AdminPanel() {
  const [overview, setOverview] = useState(null);
  const [health, setHealth] = useState([]);
  const [costSummary, setCostSummary] = useState(null);
  const [error, setError] = useState('');

  async function loadAdminData() {
    setError('');

    try {
      const [overviewResult, healthResult, costResult] = await Promise.all([
        getAdminOverview(),
        getAdminProviderHealth(),
        getAdminCostSummary()
      ]);
      setOverview(overviewResult.overview);
      setHealth(healthResult.health || []);
      setCostSummary(costResult.summary);
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    loadAdminData();
  }, []);

  return (
    <section className="panel admin-panel">
      <div className="section-title">
        <Shield size={22} />
        <h2>Admin overview</h2>
      </div>

      {error && <div className="alert">{error}</div>}

      {overview && (
        <div className="metric-grid">
          {Object.entries(overview).map(([key, value]) => (
            <article className="metric-card" key={key}>
              <span>{key}</span>
              <strong>{value}</strong>
            </article>
          ))}
        </div>
      )}

      <div className="section-title compact">
        <Activity size={20} />
        <h3>Provider health</h3>
      </div>

      <div className="provider-list">
        {health.map((item) => (
          <article className="provider-row" key={item.provider}>
            <div>
              <strong>{item.provider}</strong>
              <span>{item.enabled ? 'enabled' : 'disabled'}</span>
            </div>
            <StatusBadge status={item.status} />
          </article>
        ))}
      </div>

      {costSummary && (
        <>
          <div className="section-title compact">
            <Sparkles size={20} />
            <h3>Cost tracking</h3>
          </div>
          <div className="metric-grid">
            <article className="metric-card">
              <span>events</span>
              <strong>{costSummary.totals.events || 0}</strong>
            </article>
            <article className="metric-card">
              <span>credits</span>
              <strong>{costSummary.totals.credits || 0}</strong>
            </article>
          </div>
        </>
      )}
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

  function handlePurchased(payment) {
    setCurrentUser((value) => ({
      ...value,
      creditWallet: {
        ...value.creditWallet,
        availableCredit: value.creditWallet.availableCredit + payment.credits,
        lifetimePurchased: value.creditWallet.lifetimePurchased + payment.credits
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
        <div className="sidebar-stack">
          <ProjectForm onCreated={handleCreated} />
          <PricingPanel onPurchased={handlePurchased} />
          <NotificationsPanel />
          {currentUser.role === 'admin' && <AdminPanel />}
        </div>

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
