import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  Activity,
  Download,
  Film,
  Flag,
  ImagePlus,
  LoaderCircle,
  LogOut,
  Play,
  RefreshCcw,
  Shield,
  Sparkles,
  Trash2,
  Upload
} from 'lucide-react';
import {
  adjustAdminUserCredits,
  clearSession,
  cancelProject,
  changePassword,
  createAdminCoupon,
  createAdminPricingPlan,
  createAdminPromotion,
  createCheckout,
  createProject,
  deleteAccount,
  getAdminAuditLogs,
  getAdminCostSummary,
  getAdminContentReports,
  getAdminCoupons,
  getAdminCreditTransactions,
  getAdminOverview,
  getAdminPayments,
  getAdminPricingPlans,
  getAdminPromotion,
  getAdminPromotionRegistrations,
  getAdminUser,
  getAdminUsers,
  getAdminPromotions,
  getAdminProviderHealth,
  getAdminReportOverview,
  getAdminSettings,
  getAdminVideo,
  getAdminVideos,
  getAdminVideoCosts,
  getActivePromotions,
  getCreditTransactions,
  getCreditWallet,
  getCurrentUser,
  getAccountExportUrl,
  getProjectEventsUrl,
  getProject,
  getProjects,
  getNotifications,
  getNotificationPreferences,
  getProviders,
  getPricingPlans,
  getStoredUser,
  login,
  register,
  registerPromotion,
  reportProject,
  refundAdminPayment,
  saveSession,
  updateAdminContentReport,
  updateAdminSettings,
  updateAdminPromotion,
  updateAdminUser,
  updateAdminPricingPlan,
  updateAdminVideoCosts,
  updateProfile,
  updateNotificationPreferences
} from './api.js';
import './styles.css';

const emptyAuth = {
  name: 'User Demo',
  email: 'user@example.com',
  password: 'User123!',
  promotionCode: ''
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
            <>
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
              <label>
                Promotion code
                <input
                  value={form.promotionCode}
                  onChange={(event) => setForm({ ...form, promotionCode: event.target.value })}
                  maxLength={40}
                  placeholder="Optional"
                />
              </label>
            </>
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
  const [model, setModel] = useState('blackforestlabs/flux-3/image-to-video');
  const [providers, setProviders] = useState([]);
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  useEffect(() => {
    getProviders()
      .then((result) => {
        const providerList = result.providers || [];
        setProviders(providerList);
        const configuredDefault = providerList.find((item) => item.name === result.defaultProvider && item.enabled);
        const defaultProvider = configuredDefault || providerList.find((item) => item.enabled) || providerList[0];

        if (defaultProvider) {
          setProvider(defaultProvider.name);
          setModel(defaultProvider.models?.[0]?.id || '');
        }
      })
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

function PricingPanel({ onPurchased, onWalletChanged }) {
  const [plans, setPlans] = useState([]);
  const [promotions, setPromotions] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loadingPlan, setLoadingPlan] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [promotionCode, setPromotionCode] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    getPricingPlans()
      .then((result) => setPlans(result.plans || []))
      .catch(() => setPlans([]));
    getActivePromotions()
      .then((result) => setPromotions(result.promotions || []))
      .catch(() => setPromotions([]));
    getCreditTransactions()
      .then((result) => setTransactions(result.transactions || []))
      .catch(() => setTransactions([]));
  }, []);

  async function handleBuy(planCode) {
    setLoadingPlan(planCode);
    setMessage('');

    try {
      const result = await createCheckout({
        planCode,
        couponCode,
        idempotencyKey: `${planCode}-${crypto.randomUUID()}`
      });
      await onPurchased(result.payment);
      const transactionResult = await getCreditTransactions();
      setTransactions(transactionResult.transactions || []);
      setMessage('Credit da duoc cong vao vi.');
    } catch (err) {
      setMessage(err.message);
    } finally {
      setLoadingPlan('');
    }
  }

  async function handlePromotion(event) {
    event.preventDefault();
    setMessage('');

    try {
      const result = await registerPromotion({ code: promotionCode });
      onWalletChanged(result.wallet);
      const transactionResult = await getCreditTransactions();
      setTransactions(transactionResult.transactions || []);
      setPromotionCode('');
      setMessage(`Promotion accepted: +${result.promotion.creditBonus} credits.`);
    } catch (err) {
      setMessage(err.message);
    }
  }

  return (
    <section className="panel pricing-panel">
      <div className="section-title">
        <Sparkles size={22} />
        <h2>Credit packages</h2>
      </div>

      <div className="plan-grid">
        <label>
          Coupon
          <input value={couponCode} onChange={(event) => setCouponCode(event.target.value)} placeholder="Optional code" />
        </label>

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

      <form className="promotion-form" onSubmit={handlePromotion}>
        <label>
          Promotion
          <input value={promotionCode} onChange={(event) => setPromotionCode(event.target.value)} placeholder="Promotion code" />
        </label>
        <button className="ghost-button" disabled={!promotionCode} type="submit">
          Register promotion
        </button>
      </form>

      {promotions.length > 0 && (
        <div className="compact-list">
          {promotions.slice(0, 3).map((promotion) => (
            <article key={promotion._id}>
              <strong>{promotion.code}</strong>
              <span>{promotion.creditBonus} credits - until {new Date(promotion.endsAt || promotion.endAt).toLocaleDateString('vi-VN')}</span>
            </article>
          ))}
        </div>
      )}

      <div className="section-title compact">
        <RefreshCcw size={20} />
        <h3>Credit history</h3>
      </div>

      <div className="compact-list">
        {transactions.length === 0 && <div className="empty small">No transactions.</div>}
        {transactions.slice(0, 5).map((transaction) => (
          <article key={transaction._id}>
            <strong>{transaction.type}: {transaction.amount}</strong>
            <span>{transaction.note || new Date(transaction.createdAt).toLocaleString('vi-VN')}</span>
          </article>
        ))}
      </div>

      {message && <div className="muted-message">{message}</div>}
    </section>
  );
}

function NotificationsPanel() {
  const [notifications, setNotifications] = useState([]);
  const [preferences, setPreferences] = useState(null);
  const [savingPreference, setSavingPreference] = useState('');

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
    getNotificationPreferences()
      .then((result) => setPreferences(result.preferences))
      .catch(() => setPreferences(null));
    const timer = window.setInterval(loadNotifications, 5000);
    return () => window.clearInterval(timer);
  }, []);

  async function togglePreference(key) {
    if (!preferences) {
      return;
    }

    setSavingPreference(key);

    try {
      const result = await updateNotificationPreferences({
        [key]: !preferences[key]
      });
      setPreferences(result.preferences);
    } finally {
      setSavingPreference('');
    }
  }

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

      {preferences && (
        <>
          <div className="section-title compact">
            <Shield size={20} />
            <h3>Preferences</h3>
          </div>

          <div className="toggle-grid">
            {['inAppEnabled', 'browserEnabled', 'emailEnabled', 'videoCompleted', 'paymentEvents', 'securityAlerts'].map((key) => (
              <button className={preferences[key] ? 'toggle active' : 'toggle'} key={key} type="button" onClick={() => togglePreference(key)}>
                {savingPreference === key ? <LoaderCircle className="spin" size={14} /> : null}
                <span>{key}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </section>
  );
}

function AdminPanel() {
  const [overview, setOverview] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);
  const [creditTransactions, setCreditTransactions] = useState([]);
  const [health, setHealth] = useState([]);
  const [costSummary, setCostSummary] = useState(null);
  const [reportSummary, setReportSummary] = useState(null);
  const [costSettings, setCostSettings] = useState(null);
  const [coupons, setCoupons] = useState([]);
  const [pricingPlans, setPricingPlans] = useState([]);
  const [payments, setPayments] = useState([]);
  const [promotions, setPromotions] = useState([]);
  const [reports, setReports] = useState([]);
  const [adminVideos, setAdminVideos] = useState([]);
  const [selectedPromotion, setSelectedPromotion] = useState(null);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [videoStatusFilter, setVideoStatusFilter] = useState('');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('');
  const [creditTypeFilter, setCreditTypeFilter] = useState('');
  const [userStatusFilter, setUserStatusFilter] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('');
  const [reportRange, setReportRange] = useState(() => {
    const to = new Date();
    const from = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    return {
      from: from.toISOString().slice(0, 10),
      to: to.toISOString().slice(0, 10)
    };
  });
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userSearch, setUserSearch] = useState('');
  const [userForm, setUserForm] = useState({ name: '', role: 'user', status: 'active' });
  const [creditForm, setCreditForm] = useState({ amount: '10', reason: 'Admin adjustment' });
  const [costForm, setCostForm] = useState({ ffmpegBaseCredits: '5', aiDefaultBaseCredits: '20', extraSecondCredits: '5' });
  const [settingsForm, setSettingsForm] = useState({ maxFileSizeMb: '5', defaultProvider: 'ffmpeg' });
  const [planForm, setPlanForm] = useState({ code: 'starter', name: 'Starter', credits: '50', price: '25000', currency: 'VND', active: true, sortOrder: '5' });
  const [couponForm, setCouponForm] = useState({ code: 'SALE20', type: 'percent', value: '20', maxUses: '100' });
  const [promotionForm, setPromotionForm] = useState(() => ({
    name: 'New user bonus',
    code: 'WELCOME10',
    creditBonus: '10',
    maxRegistrations: '100',
    startsAt: new Date().toISOString().slice(0, 16),
    endsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
    conditions: 'One registration per user'
  }));
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  async function loadAdminData() {
    setError('');

    try {
      const [
        overviewResult,
        healthResult,
        costResult,
        couponResult,
        reportResult,
        usersResult,
        promotionResult,
        costSettingsResult,
        adminSettingsResult,
        reportSummaryResult,
        adminVideosResult,
        pricingPlansResult,
        paymentsResult,
        auditLogsResult,
        creditTransactionsResult
      ] = await Promise.all([
        getAdminOverview(),
        getAdminProviderHealth(),
        getAdminCostSummary(),
        getAdminCoupons(),
        getAdminContentReports(),
        getAdminUsers(userSearch),
        getAdminPromotions(),
        getAdminVideoCosts(),
        getAdminSettings(),
        getAdminReportOverview(reportRange),
        getAdminVideos(videoStatusFilter),
        getAdminPricingPlans(),
        getAdminPayments(paymentStatusFilter),
        getAdminAuditLogs(),
        getAdminCreditTransactions({ type: creditTypeFilter })
      ]);
      setOverview(overviewResult.overview);
      setAuditLogs(auditLogsResult.logs || []);
      setHealth(healthResult.health || []);
      setCostSummary(costResult.summary);
      setCoupons(couponResult.coupons || []);
      setPricingPlans(pricingPlansResult.plans || []);
      setPayments(paymentsResult.payments || []);
      setCreditTransactions(creditTransactionsResult.transactions || []);
      setReports(reportResult.reports || []);
      setUsers(usersResult.users || []);
      setPromotions(promotionResult.promotions || []);
      setAdminVideos(adminVideosResult.videos || []);
      setReportSummary(reportSummaryResult.report);
      setCostSettings(costSettingsResult.costs);
      setCostForm({
        ffmpegBaseCredits: String(costSettingsResult.costs.ffmpegBaseCredits),
        aiDefaultBaseCredits: String(costSettingsResult.costs.aiDefaultBaseCredits),
        extraSecondCredits: String(costSettingsResult.costs.extraSecondCredits)
      });
      setSettingsForm({
        maxFileSizeMb: String(adminSettingsResult.settings.upload?.maxFileSizeMb ?? 5),
        defaultProvider: adminSettingsResult.settings.provider?.default || 'ffmpeg'
      });
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    loadAdminData();
  }, []);

  async function handleCreateCoupon(event) {
    event.preventDefault();
    setMessage('');
    setError('');

    try {
      await createAdminCoupon({
        code: couponForm.code,
        type: couponForm.type,
        value: Number(couponForm.value),
        maxUses: Number(couponForm.maxUses)
      });
      setMessage('Coupon created.');
      await loadAdminData();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleCreatePromotion(event) {
    event.preventDefault();
    setMessage('');
    setError('');

    try {
      await createAdminPromotion({
        name: promotionForm.name,
        code: promotionForm.code,
        creditBonus: Number(promotionForm.creditBonus),
        maxRegistrations: Number(promotionForm.maxRegistrations),
        startsAt: new Date(promotionForm.startsAt).toISOString(),
        endsAt: new Date(promotionForm.endsAt).toISOString(),
        conditions: promotionForm.conditions
      });
      setMessage('Promotion created.');
      await loadAdminData();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleTogglePromotion(promotion) {
    setMessage('');
    setError('');

    try {
      const result = await updateAdminPromotion(promotion._id, {
        status: promotion.status === 'active' ? 'inactive' : 'active'
      });
      setPromotions((items) => items.map((item) => (item._id === result.promotion._id ? result.promotion : item)));
      setMessage('Promotion updated.');
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleSelectPromotion(promotionId) {
    setMessage('');
    setError('');

    try {
      const [detailResult, registrationsResult] = await Promise.all([
        getAdminPromotion(promotionId),
        getAdminPromotionRegistrations(promotionId)
      ]);

      setSelectedPromotion({
        ...detailResult,
        registrations: registrationsResult.registrations || [],
        summary: registrationsResult.summary || { registrations: 0, creditsGranted: 0 }
      });
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleCreatePlan(event) {
    event.preventDefault();
    setMessage('');
    setError('');

    try {
      await createAdminPricingPlan({
        ...planForm,
        credits: Number(planForm.credits),
        price: Number(planForm.price),
        sortOrder: Number(planForm.sortOrder)
      });
      setMessage('Credit package created.');
      await loadAdminData();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleTogglePlan(plan) {
    setMessage('');
    setError('');

    try {
      const result = await updateAdminPricingPlan(plan._id, { active: !plan.active });
      setPricingPlans((items) => items.map((item) => (item._id === result.plan._id ? result.plan : item)));
      setMessage('Credit package updated.');
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleSearchUsers(event) {
    event.preventDefault();
    setError('');

    try {
      const result = await getAdminUsers({
        search: userSearch,
        status: userStatusFilter,
        role: userRoleFilter
      });
      setUsers(result.users || []);
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleReportRange(event) {
    event.preventDefault();
    setError('');

    try {
      const result = await getAdminReportOverview(reportRange);
      setReportSummary(result);
      setMessage('Reports updated.');
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleSelectUser(userId) {
    setError('');
    setMessage('');

    try {
      const result = await getAdminUser(userId);
      setSelectedUser(result);
      setUserForm({
        name: result.user.name,
        role: result.user.role,
        status: result.user.status
      });
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleUpdateUser(event) {
    event.preventDefault();

    if (!selectedUser) {
      return;
    }

    setMessage('');
    setError('');

    try {
      const result = await updateAdminUser(selectedUser.user.id, userForm);
      setSelectedUser({ ...selectedUser, user: result.user });
      setUsers((items) => items.map((item) => (item.id === result.user.id ? result.user : item)));
      setMessage('User updated.');
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleAdjustCredit(event) {
    event.preventDefault();

    if (!selectedUser) {
      return;
    }

    setMessage('');
    setError('');

    try {
      if (!window.confirm(`Adjust ${creditForm.amount} credits for ${selectedUser.user.email}?`)) {
        return;
      }

      const result = await adjustAdminUserCredits(selectedUser.user.id, {
        amount: Number(creditForm.amount),
        reason: creditForm.reason
      });
      const transactionResult = await getAdminCreditTransactions({ type: creditTypeFilter });
      await handleSelectUser(result.user.id);
      setUsers((items) => items.map((item) => (item.id === result.user.id ? result.user : item)));
      setCreditTransactions(transactionResult.transactions || []);
      setMessage('Credit adjusted.');
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleCreditTransactionFilter(event) {
    const nextType = event.target.value;
    setCreditTypeFilter(nextType);
    setError('');

    try {
      const result = await getAdminCreditTransactions({ type: nextType });
      setCreditTransactions(result.transactions || []);
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleUpdateSystemSettings(event) {
    event.preventDefault();
    setMessage('');
    setError('');

    try {
      const result = await updateAdminSettings({
        upload: {
          maxFileSizeMb: Number(settingsForm.maxFileSizeMb)
        },
        provider: {
          default: settingsForm.defaultProvider
        }
      });

      setSettingsForm({
        maxFileSizeMb: String(result.settings.upload?.maxFileSizeMb ?? 5),
        defaultProvider: result.settings.provider?.default || 'ffmpeg'
      });
      setMessage('System settings updated.');
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleUpdateCosts(event) {
    event.preventDefault();
    setMessage('');
    setError('');

    try {
      const result = await updateAdminVideoCosts({
        ffmpegBaseCredits: Number(costForm.ffmpegBaseCredits),
        aiDefaultBaseCredits: Number(costForm.aiDefaultBaseCredits),
        extraSecondCredits: Number(costForm.extraSecondCredits)
      });
      setCostSettings(result.costs);
      setMessage('Video costs updated.');
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleVideoFilter(event) {
    const nextStatus = event.target.value;
    setVideoStatusFilter(nextStatus);
    setError('');

    try {
      const result = await getAdminVideos(nextStatus);
      setAdminVideos(result.videos || []);
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleSelectVideo(videoId) {
    setMessage('');
    setError('');

    try {
      const result = await getAdminVideo(videoId);
      setSelectedVideo(result);
    } catch (err) {
      setError(err.message);
    }
  }

  async function handlePaymentFilter(event) {
    const nextStatus = event.target.value;
    setPaymentStatusFilter(nextStatus);
    setError('');

    try {
      const result = await getAdminPayments(nextStatus);
      setPayments(result.payments || []);
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleRefundPayment(paymentId) {
    const reason = window.prompt('Refund reason?') || 'Admin refund';
    setMessage('');
    setError('');

    try {
      await refundAdminPayment(paymentId, {
        reason,
        idempotencyKey: `refund-${paymentId}-${crypto.randomUUID()}`
      });
      const result = await getAdminPayments(paymentStatusFilter);
      setPayments(result.payments || []);
      setMessage('Payment refunded.');
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleReportStatus(reportId, status) {
    setMessage('');
    setError('');

    try {
      const result = await updateAdminContentReport(reportId, { status });
      setReports((items) => items.map((item) => (item._id === result.report._id ? result.report : item)));
      setMessage('Report updated.');
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <section className="panel admin-panel">
      <div className="section-title">
        <Shield size={22} />
        <h2>Admin overview</h2>
      </div>

      {error && <div className="alert">{error}</div>}
      {message && <div className="muted-message">{message}</div>}

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

      {reportSummary && (
        <>
          <div className="section-title compact">
            <Activity size={20} />
            <h3>Reports</h3>
          </div>
          <form className="admin-form report-filter" onSubmit={handleReportRange}>
            <div className="form-grid">
              <label>
                From
                <input
                  type="date"
                  value={reportRange.from}
                  onChange={(event) => setReportRange({ ...reportRange, from: event.target.value })}
                />
              </label>
              <label>
                To
                <input
                  type="date"
                  value={reportRange.to}
                  onChange={(event) => setReportRange({ ...reportRange, to: event.target.value })}
                />
              </label>
            </div>
            <button className="ghost-button" type="submit">
              Update reports
            </button>
          </form>
          <div className="metric-grid">
            <article className="metric-card">
              <span>total users</span>
              <strong>{reportSummary.users.total}</strong>
            </article>
            <article className="metric-card">
              <span>new users</span>
              <strong>{reportSummary.users.new}</strong>
            </article>
            <article className="metric-card">
              <span>completed videos</span>
              <strong>{reportSummary.videos.completed}</strong>
            </article>
            <article className="metric-card">
              <span>failed videos</span>
              <strong>{reportSummary.videos.failed}</strong>
            </article>
            <article className="metric-card">
              <span>processing videos</span>
              <strong>{reportSummary.videos.processing}</strong>
            </article>
            <article className="metric-card">
              <span>revenue</span>
              <strong>{reportSummary.payments.revenue.toLocaleString('vi-VN')}</strong>
            </article>
            <article className="metric-card">
              <span>credit granted</span>
              <strong>{reportSummary.credits.granted}</strong>
            </article>
            <article className="metric-card">
              <span>credit used</span>
              <strong>{reportSummary.credits.used}</strong>
            </article>
            <article className="metric-card">
              <span>credit refunded</span>
              <strong>{reportSummary.credits.refunded}</strong>
            </article>
            <article className="metric-card">
              <span>promotion registrations</span>
              <strong>{reportSummary.promotions.registrations}</strong>
            </article>
            <article className="metric-card">
              <span>promotion credits</span>
              <strong>{reportSummary.promotions.creditsGranted}</strong>
            </article>
          </div>
        </>
      )}

      <div className="section-title compact">
        <Activity size={20} />
        <h3>Audit logs</h3>
      </div>

      <div className="compact-list">
        {auditLogs.length === 0 && <div className="empty small">No logs.</div>}
        {auditLogs.slice(0, 5).map((log) => (
          <article key={log._id}>
            <strong>{log.action}</strong>
            <span>{log.resourceType} - {new Date(log.createdAt).toLocaleString('vi-VN')}</span>
          </article>
        ))}
      </div>

      <div className="section-title compact">
        <Sparkles size={20} />
        <h3>Credit transaction history</h3>
      </div>

      <label>
        Transaction type
        <select value={creditTypeFilter} onChange={handleCreditTransactionFilter}>
          <option value="">all</option>
          <option value="purchase">purchase</option>
          <option value="reserve">reserve</option>
          <option value="capture">capture</option>
          <option value="release">release</option>
          <option value="refund">refund</option>
          <option value="manual_adjustment">manual_adjustment</option>
          <option value="promotion_bonus">promotion_bonus</option>
        </select>
      </label>

      <div className="compact-list">
        {creditTransactions.length === 0 && <div className="empty small">No credit transactions.</div>}
        {creditTransactions.slice(0, 8).map((transaction) => (
          <article key={transaction._id}>
            <strong>{transaction.type}: {transaction.amount}</strong>
            <span>{transaction.user?.email || 'unknown user'} - balance {transaction.balanceAfter?.availableCredit ?? 'N/A'} credits</span>
            <span>{transaction.project?.title || transaction.reason || transaction.note || 'System transaction'} - {new Date(transaction.createdAt).toLocaleString('vi-VN')}</span>
          </article>
        ))}
      </div>

      <div className="section-title compact">
        <Shield size={20} />
        <h3>User management</h3>
      </div>

      <form className="admin-form" onSubmit={handleSearchUsers}>
        <input
          value={userSearch}
          onChange={(event) => setUserSearch(event.target.value)}
          placeholder="Search name or email"
        />
        <div className="form-grid">
          <label>
            Status
            <select value={userStatusFilter} onChange={(event) => setUserStatusFilter(event.target.value)}>
              <option value="">all</option>
              <option value="active">active</option>
              <option value="locked">locked</option>
            </select>
          </label>
          <label>
            Role
            <select value={userRoleFilter} onChange={(event) => setUserRoleFilter(event.target.value)}>
              <option value="">all</option>
              <option value="user">user</option>
              <option value="admin">admin</option>
            </select>
          </label>
        </div>
        <button className="ghost-button" type="submit">
          Search users
        </button>
      </form>

      <div className="compact-list">
        {users.slice(0, 6).map((item) => (
          <article key={item.id}>
            <strong>{item.name}</strong>
            <span>{item.email} - {item.role} - {item.status} - {item.creditWallet?.availableCredit ?? 0} credits</span>
            <button className="ghost-button small-action" type="button" onClick={() => handleSelectUser(item.id)}>
              Manage
            </button>
          </article>
        ))}
      </div>

      {selectedUser && (
        <div className="admin-user-box">
          <form className="admin-form" onSubmit={handleUpdateUser}>
            <label>
              Name
              <input value={userForm.name} onChange={(event) => setUserForm({ ...userForm, name: event.target.value })} />
            </label>
            <div className="form-grid">
              <label>
                Role
                <select value={userForm.role} onChange={(event) => setUserForm({ ...userForm, role: event.target.value })}>
                  <option value="user">user</option>
                  <option value="admin">admin</option>
                </select>
              </label>
              <label>
                Status
                <select value={userForm.status} onChange={(event) => setUserForm({ ...userForm, status: event.target.value })}>
                  <option value="active">active</option>
                  <option value="locked">locked</option>
                </select>
              </label>
            </div>
            <button className="ghost-button" type="submit">
              Update user
            </button>
          </form>

          <form className="admin-form" onSubmit={handleAdjustCredit}>
            <div className="form-grid">
              <label>
                Credit amount
                <input
                  type="number"
                  value={creditForm.amount}
                  onChange={(event) => setCreditForm({ ...creditForm, amount: event.target.value })}
                />
              </label>
              <label>
                Reason
                <input value={creditForm.reason} onChange={(event) => setCreditForm({ ...creditForm, reason: event.target.value })} />
              </label>
            </div>
            <button className="ghost-button" type="submit">
              Adjust credit
            </button>
          </form>

          <div className="compact-list">
            {(selectedUser.transactions || []).slice(0, 5).map((transaction) => (
              <article key={transaction._id}>
                <strong>{transaction.type}: {transaction.amount}</strong>
                <span>{transaction.note || new Date(transaction.createdAt).toLocaleString('vi-VN')}</span>
              </article>
            ))}
          </div>
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

      <div className="section-title compact">
        <Sparkles size={20} />
        <h3>Credit package management</h3>
      </div>

      <form className="admin-form" onSubmit={handleCreatePlan}>
        <div className="form-grid">
          <input value={planForm.code} onChange={(event) => setPlanForm({ ...planForm, code: event.target.value })} placeholder="Code" />
          <input value={planForm.name} onChange={(event) => setPlanForm({ ...planForm, name: event.target.value })} placeholder="Name" />
        </div>
        <div className="form-grid">
          <input
            min="0"
            type="number"
            value={planForm.credits}
            onChange={(event) => setPlanForm({ ...planForm, credits: event.target.value })}
            placeholder="Credits"
          />
          <input
            min="0"
            type="number"
            value={planForm.price}
            onChange={(event) => setPlanForm({ ...planForm, price: event.target.value })}
            placeholder="Price"
          />
        </div>
        <div className="form-grid">
          <input value={planForm.currency} onChange={(event) => setPlanForm({ ...planForm, currency: event.target.value })} placeholder="Currency" />
          <input
            type="number"
            value={planForm.sortOrder}
            onChange={(event) => setPlanForm({ ...planForm, sortOrder: event.target.value })}
            placeholder="Sort"
          />
        </div>
        <button className="ghost-button" type="submit">
          Create package
        </button>
      </form>

      <div className="compact-list">
        {pricingPlans.slice(0, 5).map((plan) => (
          <article key={plan._id}>
            <strong>{plan.name}</strong>
            <span>{plan.code} - {plan.credits} credits - {plan.price.toLocaleString('vi-VN')} {plan.currency} - {plan.active ? 'active' : 'inactive'}</span>
            <button className="ghost-button small-action" type="button" onClick={() => handleTogglePlan(plan)}>
              {plan.active ? 'Disable' : 'Enable'}
            </button>
          </article>
        ))}
      </div>

      <div className="section-title compact">
        <Sparkles size={20} />
        <h3>Payment management</h3>
      </div>

      <label>
        Payment status
        <select value={paymentStatusFilter} onChange={handlePaymentFilter}>
          <option value="">all</option>
          <option value="paid">paid</option>
          <option value="pending">pending</option>
          <option value="failed">failed</option>
          <option value="refunded">refunded</option>
        </select>
      </label>

      <div className="compact-list">
        {payments.length === 0 && <div className="empty small">No payments.</div>}
        {payments.slice(0, 5).map((payment) => (
          <article key={payment._id}>
            <strong>{payment.planCode} - {payment.status}</strong>
            <span>{payment.user?.email || 'unknown user'} - {payment.credits} credits - {payment.amount.toLocaleString('vi-VN')} {payment.currency}</span>
            {payment.status === 'paid' && (
              <button className="ghost-button small-action" type="button" onClick={() => handleRefundPayment(payment._id)}>
                Refund
              </button>
            )}
          </article>
        ))}
      </div>

      <div className="section-title compact">
        <Film size={20} />
        <h3>Video review</h3>
      </div>

      <label>
        Status
        <select value={videoStatusFilter} onChange={handleVideoFilter}>
          <option value="">all</option>
          <option value="completed">completed</option>
          <option value="failed">failed</option>
          <option value="processing">processing</option>
          <option value="queued">queued</option>
          <option value="cancelled">cancelled</option>
        </select>
      </label>

      <div className="compact-list">
        {adminVideos.length === 0 && <div className="empty small">No videos.</div>}
        {adminVideos.slice(0, 5).map((video) => (
          <article key={video._id}>
            <strong>{video.title}</strong>
            <span>{video.user?.email || 'unknown user'} - {video.status} - {video.costCredits} credits</span>
            <span>{video.generationMode} / {video.provider} / {video.model}</span>
            {video.errorMessage && <span>{video.errorMessage}</span>}
            <button className="ghost-button small-action" type="button" onClick={() => handleSelectVideo(video._id)}>
              View detail
            </button>
          </article>
        ))}
      </div>

      {selectedVideo && (
        <div className="admin-detail-box">
          <div className="detail-header">
            <div>
              <strong>{selectedVideo.video.title}</strong>
              <span>{selectedVideo.video.user?.email || 'unknown user'} - {selectedVideo.video.status}</span>
            </div>
            <StatusBadge status={selectedVideo.video.status} />
          </div>

          <div className="admin-media-grid">
            {selectedVideo.video.sourceImage?.url && (
              <figure>
                <img src={selectedVideo.video.sourceImage.url} alt="Source" />
                <figcaption>Source image</figcaption>
              </figure>
            )}
            {selectedVideo.video.outputVideo?.url && (
              <figure>
                <video controls src={selectedVideo.video.outputVideo.url} />
                <figcaption>Output video</figcaption>
              </figure>
            )}
          </div>

          <div className="detail-grid">
            <div><span>Prompt</span><strong>{selectedVideo.video.prompt || 'N/A'}</strong></div>
            <div><span>Engine</span><strong>{selectedVideo.video.generationMode}</strong></div>
            <div><span>Provider</span><strong>{selectedVideo.video.provider}</strong></div>
            <div><span>Model</span><strong>{selectedVideo.video.model}</strong></div>
            <div><span>Credit Cost</span><strong>{selectedVideo.video.costCredits}</strong></div>
            <div><span>Resolution</span><strong>{selectedVideo.video.outputVideo?.resolution || selectedVideo.job?.resolution || 'N/A'}</strong></div>
            <div><span>Created</span><strong>{new Date(selectedVideo.video.createdAt).toLocaleString('vi-VN')}</strong></div>
            <div><span>Completed</span><strong>{selectedVideo.job?.completedAt ? new Date(selectedVideo.job.completedAt).toLocaleString('vi-VN') : 'N/A'}</strong></div>
            <div><span>Provider Request</span><strong>{selectedVideo.job?.providerGenerationId || 'N/A'}</strong></div>
            <div><span>Error</span><strong>{selectedVideo.video.errorMessage || selectedVideo.job?.errorMessage || 'N/A'}</strong></div>
          </div>
        </div>
      )}

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

      {costSettings && (
        <>
          <div className="section-title compact">
            <Sparkles size={20} />
            <h3>Video cost settings</h3>
          </div>
          <form className="admin-form" onSubmit={handleUpdateCosts}>
            <div className="form-grid">
              <label>
                FFmpeg
                <input
                  min="0"
                  type="number"
                  value={costForm.ffmpegBaseCredits}
                  onChange={(event) => setCostForm({ ...costForm, ffmpegBaseCredits: event.target.value })}
                />
              </label>
              <label>
                AI default
                <input
                  min="0"
                  type="number"
                  value={costForm.aiDefaultBaseCredits}
                  onChange={(event) => setCostForm({ ...costForm, aiDefaultBaseCredits: event.target.value })}
                />
              </label>
            </div>
            <label>
              Extra second
              <input
                min="0"
                type="number"
                value={costForm.extraSecondCredits}
                onChange={(event) => setCostForm({ ...costForm, extraSecondCredits: event.target.value })}
              />
            </label>
            <button className="ghost-button" type="submit">
              Save costs
            </button>
          </form>

          <form className="admin-form" onSubmit={handleUpdateSystemSettings}>
            <div className="section-title compact">
              <Sparkles size={20} />
              <h3>System settings</h3>
            </div>
            <div className="form-grid">
              <label>
                Max upload MB
                <input
                  min="1"
                  max="100"
                  type="number"
                  value={settingsForm.maxFileSizeMb}
                  onChange={(event) => setSettingsForm({ ...settingsForm, maxFileSizeMb: event.target.value })}
                />
              </label>
              <label>
                Default provider
                <select
                  value={settingsForm.defaultProvider}
                  onChange={(event) => setSettingsForm({ ...settingsForm, defaultProvider: event.target.value })}
                >
                  <option value="ffmpeg">ffmpeg</option>
                  <option value="replicate">replicate</option>
                  <option value="fal">fal</option>
                  <option value="runway">runway</option>
                  <option value="luma">luma</option>
                </select>
              </label>
            </div>
            <button className="ghost-button" type="submit">
              Save settings
            </button>
          </form>
        </>
      )}

      <div className="section-title compact">
        <Sparkles size={20} />
        <h3>Coupon management</h3>
      </div>

      <form className="admin-form" onSubmit={handleCreateCoupon}>
        <input
          value={couponForm.code}
          onChange={(event) => setCouponForm({ ...couponForm, code: event.target.value })}
          placeholder="Code"
        />
        <select value={couponForm.type} onChange={(event) => setCouponForm({ ...couponForm, type: event.target.value })}>
          <option value="percent">Percent</option>
          <option value="fixed">Fixed</option>
        </select>
        <input
          min="0"
          type="number"
          value={couponForm.value}
          onChange={(event) => setCouponForm({ ...couponForm, value: event.target.value })}
          placeholder="Value"
        />
        <input
          min="0"
          type="number"
          value={couponForm.maxUses}
          onChange={(event) => setCouponForm({ ...couponForm, maxUses: event.target.value })}
          placeholder="Max uses"
        />
        <button className="ghost-button" type="submit">
          Create coupon
        </button>
      </form>

      <div className="compact-list">
        {coupons.slice(0, 5).map((coupon) => (
          <article key={coupon._id}>
            <strong>{coupon.code}</strong>
            <span>{coupon.type} {coupon.value} - used {coupon.usedCount}/{coupon.maxUses || '∞'}</span>
          </article>
        ))}
      </div>

      <div className="section-title compact">
        <Sparkles size={20} />
        <h3>Promotion management</h3>
      </div>

      <form className="admin-form" onSubmit={handleCreatePromotion}>
        <input
          value={promotionForm.name}
          onChange={(event) => setPromotionForm({ ...promotionForm, name: event.target.value })}
          placeholder="Promotion name"
        />
        <div className="form-grid">
          <input
            value={promotionForm.code}
            onChange={(event) => setPromotionForm({ ...promotionForm, code: event.target.value })}
            placeholder="Code"
          />
          <input
            min="1"
            type="number"
            value={promotionForm.creditBonus}
            onChange={(event) => setPromotionForm({ ...promotionForm, creditBonus: event.target.value })}
            placeholder="Credit bonus"
          />
        </div>
        <div className="form-grid">
          <input
            type="datetime-local"
            value={promotionForm.startsAt}
            onChange={(event) => setPromotionForm({ ...promotionForm, startsAt: event.target.value })}
          />
          <input
            type="datetime-local"
            value={promotionForm.endsAt}
            onChange={(event) => setPromotionForm({ ...promotionForm, endsAt: event.target.value })}
          />
        </div>
        <input
          min="0"
          type="number"
          value={promotionForm.maxRegistrations}
          onChange={(event) => setPromotionForm({ ...promotionForm, maxRegistrations: event.target.value })}
          placeholder="Max registrations"
        />
        <input
          value={promotionForm.conditions}
          onChange={(event) => setPromotionForm({ ...promotionForm, conditions: event.target.value })}
          placeholder="Conditions"
        />
        <button className="ghost-button" type="submit">
          Create promotion
        </button>
      </form>

      <div className="compact-list">
        {promotions.slice(0, 5).map((promotion) => (
          <article key={promotion._id}>
            <strong>{promotion.name} ({promotion.code})</strong>
            <span>Start: {new Date(promotion.startsAt || promotion.startAt).toLocaleDateString('vi-VN')}</span>
            <span>End: {new Date(promotion.endsAt || promotion.endAt).toLocaleDateString('vi-VN')}</span>
            <span>Bonus Credit: {promotion.creditBonus || promotion.bonusCredit}</span>
            <span>Registrations: {promotion.currentRegistrations ?? promotion.registeredCount}/{promotion.maxRegistrations || '∞'} - {promotion.status}</span>
            <div className="button-stack">
              <button className="ghost-button small-action" type="button" onClick={() => handleSelectPromotion(promotion._id)}>
                Registrations
              </button>
              <button className="ghost-button small-action" type="button" onClick={() => handleTogglePromotion(promotion)}>
                {promotion.status === 'active' ? 'Disable' : 'Enable'}
              </button>
            </div>
          </article>
        ))}
      </div>

      {selectedPromotion && (
        <div className="admin-detail-box">
          <div className="detail-header">
            <div>
              <strong>{selectedPromotion.promotion.name} ({selectedPromotion.promotion.code})</strong>
              <span>{selectedPromotion.summary.registrations} registrations - {selectedPromotion.summary.creditsGranted} credits granted</span>
            </div>
            <StatusBadge status={selectedPromotion.promotion.status} />
          </div>

          <div className="compact-list">
            {selectedPromotion.registrations.length === 0 && <div className="empty small">No registrations.</div>}
            {selectedPromotion.registrations.map((registration) => (
              <article key={registration._id}>
                <strong>{registration.user?.name || 'Unknown user'}</strong>
                <span>{registration.user?.email || 'unknown email'} - +{registration.creditGranted || registration.creditBonus} credits - {registration.status}</span>
                <span>{new Date(registration.registeredAt || registration.createdAt).toLocaleString('vi-VN')}</span>
              </article>
            ))}
          </div>
        </div>
      )}

      <div className="section-title compact">
        <Flag size={20} />
        <h3>Content reports</h3>
      </div>

      <div className="compact-list">
        {reports.length === 0 && <div className="empty small">No reports.</div>}
        {reports.slice(0, 5).map((report) => (
          <article key={report._id}>
            <strong>{report.project?.title || 'Unknown project'}</strong>
            <span>{report.reason} - {report.status}</span>
            <div className="button-stack">
              <button className="ghost-button small-action" type="button" onClick={() => handleReportStatus(report._id, 'reviewing')}>
                Review
              </button>
              <button className="ghost-button small-action" type="button" onClick={() => handleReportStatus(report._id, 'resolved')}>
                Resolve
              </button>
              <button className="ghost-button small-action" type="button" onClick={() => handleReportStatus(report._id, 'dismissed')}>
                Dismiss
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function AccountPanel({ user, onUpdated, onDeleted }) {
  const [profileName, setProfileName] = useState(user.name);
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '' });
  const [message, setMessage] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    setProfileName(user.name);
  }, [user.name]);

  async function handleProfile(event) {
    event.preventDefault();
    setSavingProfile(true);
    setMessage('');

    try {
      const result = await updateProfile({ name: profileName });
      const token = localStorage.getItem('image_to_videos_token');
      saveSession({ token, user: result.user });
      onUpdated(result.user);
      setMessage('Da cap nhat ho so.');
    } catch (err) {
      setMessage(err.message);
    } finally {
      setSavingProfile(false);
    }
  }

  async function handlePassword(event) {
    event.preventDefault();
    setSavingPassword(true);
    setMessage('');

    try {
      await changePassword(passwordForm);
      setPasswordForm({ currentPassword: '', newPassword: '' });
      setMessage('Da doi mat khau.');
    } catch (err) {
      setMessage(err.message);
    } finally {
      setSavingPassword(false);
    }
  }

  async function handleExport() {
    const token = localStorage.getItem('image_to_videos_token');
    const response = await fetch(getAccountExportUrl(), {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (!response.ok) {
      setMessage('Khong the export du lieu.');
      return;
    }

    const data = await response.json();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `account-export-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
    setMessage('Da export du lieu tai khoan.');
  }

  async function handleDelete() {
    if (!window.confirm('Ban chac chan muon xoa tai khoan?')) {
      return;
    }

    setDeleting(true);
    setMessage('');

    try {
      await deleteAccount();
      clearSession();
      onDeleted();
    } catch (err) {
      setMessage(err.message);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <section className="panel account-panel">
      <div className="section-title">
        <Shield size={22} />
        <h2>My Profile</h2>
      </div>

      <div className="profile-summary">
        <div>
          <span>Full name</span>
          <strong>{user.fullName || user.name}</strong>
        </div>
        <div>
          <span>Email</span>
          <strong>{user.email}</strong>
        </div>
        <div>
          <span>Role</span>
          <strong>{user.role}</strong>
        </div>
        <div>
          <span>Status</span>
          <strong>{user.status || 'active'}</strong>
        </div>
        <div>
          <span>Credit</span>
          <strong>{user.creditWallet?.availableCredit ?? 0}</strong>
        </div>
        <div>
          <span>Created</span>
          <strong>{user.createdAt ? new Date(user.createdAt).toLocaleDateString('vi-VN') : 'N/A'}</strong>
        </div>
      </div>

      <form className="account-form" onSubmit={handleProfile}>
        <label>
          Ho ten
          <input
            value={profileName}
            minLength={2}
            maxLength={80}
            onChange={(event) => setProfileName(event.target.value)}
            required
          />
        </label>
        <button className="ghost-button" disabled={savingProfile} type="submit">
          {savingProfile ? <LoaderCircle className="spin" size={16} /> : <Shield size={16} />}
          Update profile
        </button>
      </form>

      <form className="account-form" onSubmit={handlePassword}>
        <label>
          Mat khau hien tai
          <input
            type="password"
            value={passwordForm.currentPassword}
            minLength={6}
            maxLength={80}
            onChange={(event) => setPasswordForm({ ...passwordForm, currentPassword: event.target.value })}
            required
          />
        </label>
        <label>
          Mat khau moi
          <input
            type="password"
            value={passwordForm.newPassword}
            minLength={6}
            maxLength={80}
            onChange={(event) => setPasswordForm({ ...passwordForm, newPassword: event.target.value })}
            required
          />
        </label>
        <button className="ghost-button" disabled={savingPassword} type="submit">
          {savingPassword ? <LoaderCircle className="spin" size={16} /> : <Shield size={16} />}
          Change password
        </button>
      </form>

      <div className="button-stack">
        <button className="ghost-button" type="button" onClick={handleExport}>
          <Download size={16} />
          Export data
        </button>
        <button className="danger-button" disabled={deleting} type="button" onClick={handleDelete}>
          {deleting ? <LoaderCircle className="spin" size={16} /> : <Trash2 size={16} />}
          Delete account
        </button>
      </div>

      {message && <div className="muted-message">{message}</div>}
    </section>
  );
}

function StatusBadge({ status }) {
  return <span className={`badge ${status}`}>{status}</span>;
}

function ProjectCard({ project, onCancel, onRefresh }) {
  const [reporting, setReporting] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [message, setMessage] = useState('');
  const canCancel = ['queued', 'processing', 'post_processing', 'uploading'].includes(project.status);

  async function handleReport() {
    const reason = window.prompt('Ly do report video nay?');

    if (!reason) {
      return;
    }

    setReporting(true);
    setMessage('');

    try {
      await reportProject({
        projectId: project._id,
        reason
      });
      setMessage('Da gui report.');
    } catch (err) {
      setMessage(err.message);
    } finally {
      setReporting(false);
    }
  }

  async function handleCancel() {
    if (!window.confirm('Ban muon huy job tao video nay?')) {
      return;
    }

    setCancelling(true);
    setMessage('');

    try {
      await onCancel(project._id);
      setMessage('Da huy job va hoan credit.');
    } catch (err) {
      setMessage(err.message);
    } finally {
      setCancelling(false);
    }
  }

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
        {message && <div className="muted-message">{message}</div>}
        <div className="card-actions">
          {project.outputVideo?.url && (
            <a className="ghost-link" href={project.outputVideo.url} download>
              <Download size={16} />
              Download
            </a>
          )}
          <button className="ghost-button" disabled={reporting} type="button" onClick={handleReport}>
            {reporting ? <LoaderCircle className="spin" size={16} /> : <Flag size={16} />}
            Report
          </button>
          {canCancel && (
            <button className="danger-button compact" disabled={cancelling} type="button" onClick={handleCancel}>
              {cancelling ? <LoaderCircle className="spin" size={16} /> : <Trash2 size={16} />}
              Cancel
            </button>
          )}
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

  function updateCurrentUser(updater) {
    setCurrentUser((value) => {
      const nextUser = typeof updater === 'function' ? updater(value) : updater;
      const token = localStorage.getItem('image_to_videos_token');

      if (token) {
        saveSession({ token, user: nextUser });
      }

      return nextUser;
    });
  }

  async function refreshWallet() {
    try {
      const result = await getCreditWallet();
      updateCurrentUser((value) => ({
        ...value,
        creditWallet: result.wallet
      }));
    } catch {
      // Wallet refresh is best-effort because project polling already drives the UI.
    }
  }

  async function refreshProject(projectId) {
    const result = await getProject(projectId);
    setProjects((items) => items.map((item) => (item._id === projectId ? result.project : item)));

    if (['completed', 'failed', 'cancelled'].includes(result.project.status)) {
      await refreshWallet();
    }
  }

  async function handleCancelProject(projectId) {
    const result = await cancelProject(projectId);
    setProjects((items) => items.map((item) => (item._id === projectId ? result.project : item)));

    if (result.wallet) {
      updateCurrentUser((value) => ({
        ...value,
        creditWallet: result.wallet
      }));
    }
  }

  useEffect(() => {
    loadProjects();
    getCurrentUser()
      .then((result) => updateCurrentUser(result.user))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!activeProjects.length) {
      return undefined;
    }

    const eventSources = activeProjects.map((project) => {
      const source = new EventSource(getProjectEventsUrl(project._id));

      source.addEventListener('status', (event) => {
        const data = JSON.parse(event.data);
        setProjects((items) => items.map((item) => (item._id === project._id ? data.project : item)));

        if (['completed', 'failed', 'cancelled'].includes(data.project.status)) {
          refreshWallet();
          source.close();
        }
      });

      source.onerror = () => {
        source.close();
      };

      return source;
    });

    const timer = window.setInterval(() => {
      activeProjects.forEach((project) => refreshProject(project._id));
    }, 3000);

    return () => {
      window.clearInterval(timer);
      eventSources.forEach((source) => source.close());
    };
  }, [activeProjects]);

  function handleLogout() {
    clearSession();
    onLogout();
  }

  function handleCreated(project) {
    setProjects((items) => [project, ...items]);
    updateCurrentUser((value) => ({
      ...value,
      creditWallet: {
        ...value.creditWallet,
        availableCredit: value.creditWallet.availableCredit - project.costCredits,
        reservedCredit: value.creditWallet.reservedCredit + project.costCredits
      }
    }));
  }

  async function handlePurchased() {
    await refreshWallet();
  }

  function handleWalletChanged(wallet) {
    updateCurrentUser((value) => ({
      ...value,
      creditWallet: wallet
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
          <PricingPanel onPurchased={handlePurchased} onWalletChanged={handleWalletChanged} />
          <NotificationsPanel />
          <AccountPanel user={currentUser} onUpdated={updateCurrentUser} onDeleted={onLogout} />
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
              <ProjectCard key={project._id} project={project} onCancel={handleCancelProject} onRefresh={refreshProject} />
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
