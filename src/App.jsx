import React, { useState, useEffect, useRef, useMemo } from 'react';
import axios from 'axios';
import {
  Plus,
  Minus,
  Search,
  User,
  ArrowRightLeft,
  FileText,
  X,
  Check,
  Download,
  LayoutDashboard,
  Users,
  Settings,
  Bell,
  ArrowUpRight,
  ArrowDownRight,
  History,
  TrendingUp,
  TrendingDown,
  CreditCard,
  Filter,
  UserCheck,
  Clock,
  ChevronRight,
  BarChart3,
  Percent,
  Timer,
  ChevronDown,
  MoreHorizontal,
  SlidersHorizontal,
  Globe,
  Wallet,
  Shield,
  Edit2,
  Trash2
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  Legend,
  Cell
} from 'recharts';

const API_BASE = 'http://localhost:5000/api';

const App = () => {
  const [clients, setClients] = useState([]);
  const [allTransactions, setAllTransactions] = useState([]);
  const [activeClient, setActiveClient] = useState(null);
  const [clientTransactions, setClientTransactions] = useState([]);
  const [activeModal, setActiveModal] = useState(null); // 'deposit', 'disburse', 'client', 'audit'
  const [activeTab, setActiveTab] = useState('dashboard');
  const [activeSettingsTab, setActiveSettingsTab] = useState('profile');
  const [searchQuery, setSearchQuery] = useState('');
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')) || null);
  const [authMode, setAuthMode] = useState('login'); // 'login' or 'register'
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });

  // Transaction Form States
  const [txType, setTxType] = useState('IN');
  const [txClientId, setTxClientId] = useState('');
  const [txAmountNaira, setTxAmountNaira] = useState('');
  const [txAmountAed, setTxAmountAed] = useState('');
  const [txRate, setTxRate] = useState('1405.2');
  const [txRecipient, setTxRecipient] = useState('');
  const [txDesc, setTxDesc] = useState('');
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientAddress, setClientAddress] = useState('');
  const [clientContact, setClientContact] = useState('');
  const [clientPhotoUrl, setClientPhotoUrl] = useState('');
  const [clientPhotoFile, setClientPhotoFile] = useState(null);
  const [clientPhotoPreview, setClientPhotoPreview] = useState(null);
  const [editingClient, setEditingClient] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Bulk Upload States
  const [bulkTransactions, setBulkTransactions] = useState([]);
  const [isBulkLoading, setIsBulkLoading] = useState(false);
  const [bulkUploadError, setBulkUploadError] = useState('');
  const [bulkProgress, setBulkProgress] = useState(null); // { current, total }
  const [bulkSummary, setBulkSummary] = useState(null); // { success, fail, duplicates }

  const resetFormStates = () => {
    setTxClientId('');
    setTxAmountNaira('');
    setTxAmountAed('');
    setTxRecipient('');
    setTxDesc('');
    setClientName('');
    setClientEmail('');
    setClientPhone('');
    setClientAddress('');
    setClientContact('');
    setClientPhotoUrl('');
    setClientPhotoFile(null);
    setClientPhotoPreview(null);
    setEditingClient(null);
    setIsSubmitting(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    if (!token) return;
    const config = { headers: { Authorization: `Bearer ${token}` } };
    try {
      const [clientsRes, txRes, profileRes] = await Promise.all([
        axios.get(`${API_BASE}/clients`, config),
        axios.get(`${API_BASE}/transactions`, config),
        axios.get(`${API_BASE}/user/profile`, config).catch(() => null)
      ]);
      setClients(clientsRes.data);
      setAllTransactions(txRes.data);
      if (profileRes && profileRes.data) {
        setUser(profileRes.data);
        localStorage.setItem('user', JSON.stringify(profileRes.data));
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      if (err.response?.status === 401) handleLogout();
    }
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError('');
    try {
      const endpoint = authMode === 'login' ? '/auth/login' : '/auth/register';
      const res = await axios.post(`${API_BASE}${endpoint}`, loginForm);

      if (authMode === 'login') {
        const { token, user } = res.data;
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        setToken(token);
        setUser(user);
      } else {
        alert('Registration successful! Please login.');
        setAuthMode('login');
      }
    } catch (err) {
      setAuthError(err.response?.data?.error || 'Authentication failed');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken('');
    setUser(null);
  };

  const handleSelectClient = async (client) => {
    setActiveClient(client);
    const config = { headers: { Authorization: `Bearer ${token}` } };
    try {
      const res = await axios.get(`${API_BASE}/clients/${client.id}/transactions`, config);
      setClientTransactions(res.data);
      setActiveModal('audit');
    } catch (err) {
      console.error('Error fetching client transactions:', err);
    }
  };

  const handleClientPhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setClientPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setClientPhotoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleInitiateEdit = (client) => {
    resetFormStates();
    setEditingClient(client);
    setClientName(client.name || '');
    setClientEmail(client.email || '');
    setClientPhone(client.phone || '');
    setClientAddress(client.address || '');
    setClientContact(client.contact_person || '');
    setClientPhotoUrl(client.photo_url || '');
    if (client.photo_url) {
      setClientPhotoPreview(`${API_BASE.replace('/api', '')}${client.photo_url}`);
    }
    setActiveModal('addClient');
  };

  const handleDeleteClient = async (clientId) => {
    if (!window.confirm('Are you sure you want to delete this client? This cannot be undone if they have no transactions.')) return;

    const config = { headers: { Authorization: `Bearer ${token}` } };
    try {
      await axios.delete(`${API_BASE}/clients/${clientId}`, config);
      fetchData();
      alert('Client deleted successfully.');
    } catch (err) {
      console.error('Error deleting client:', err);
      alert(err.response?.data?.error || 'Failed to delete client.');
    }
  };

  const handleAddClient = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    const config = { headers: { Authorization: `Bearer ${token}` } };

    try {
      let finalPhotoUrl = clientPhotoUrl;

      // Upload photo if a new file was selected
      if (clientPhotoFile) {
        const formData = new FormData();
        formData.append('photo', clientPhotoFile);
        const photoRes = await axios.post(`${API_BASE}/clients/photo`, formData, {
          headers: {
            ...config.headers,
            'Content-Type': 'multipart/form-data'
          }
        });
        finalPhotoUrl = photoRes.data.photo_url;
      }

      const payload = {
        name: clientName,
        email: clientEmail,
        phone: clientPhone,
        address: clientAddress,
        contact_person: clientContact,
        photo_url: finalPhotoUrl
      };

      if (editingClient) {
        await axios.put(`${API_BASE}/clients/${editingClient.id}`, payload, config);
      } else {
        await axios.post(`${API_BASE}/clients`, payload, config);
      }

      resetFormStates();
      setActiveModal(null);
      fetchData();
    } catch (err) {
      console.error('Error handling client entity:', err);
      alert('Failed to process client request.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddTransaction = async (e) => {
    e.preventDefault();
    if (!txClientId && !activeClient?.id) return alert('Please select a client');

    const amount = txType === 'IN' ? txAmountNaira : txAmountAed;
    if (!amount || parseFloat(amount) <= 0) return alert('Please enter a valid amount');

    setIsSubmitting(true);
    const config = { headers: { Authorization: `Bearer ${token}` } };
    try {
      const finalAed = txType === 'IN'
        ? (parseFloat(txAmountNaira) / parseFloat(txRate))
        : parseFloat(txAmountAed);

      await axios.post(`${API_BASE}/transactions`, {
        client_id: txClientId || activeClient?.id,
        type: txType,
        amount_naira: txType === 'IN' ? parseFloat(txAmountNaira) : null,
        amount_aed: finalAed,
        exchange_rate: txType === 'IN' ? parseFloat(txRate) : null,
        recipient: txType === 'OUT' ? txRecipient : txDesc,
        description: txDesc
      }, config);

      setActiveModal(null);
      fetchData();
      resetFormStates();
    } catch (err) {
      console.error('Error adding transaction:', err);
      alert('Transaction failed. Check console for details.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsBulkLoading(true);
    setBulkUploadError('');
    const formData = new FormData();
    formData.append('statement', file);

    const config = {
      headers: {
        'Content-Type': 'multipart/form-data',
        Authorization: `Bearer ${token}`
      }
    };

    try {
      const res = await axios.post(`${API_BASE}/transactions/upload-statement`, formData, config);
      const extracted = res.data;

      // Smart Auto-Assignment
      const enriched = extracted.map(tx => {
        const matchingClient = clients.find(c =>
          tx.sender.toLowerCase().includes(c.name.toLowerCase()) ||
          c.name.toLowerCase().includes(tx.sender.toLowerCase())
        );
        return { ...tx, client_id: matchingClient ? matchingClient.id : '', is_duplicate: false };
      });

      // Check for duplicates
      const ids = enriched.map(tx => tx.transaction_unique_id);
      const dupRes = await axios.post(`${API_BASE}/transactions/check-duplicates`, { ids }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const duplicateIds = new Set(dupRes.data);
      const finalTxs = enriched.map(tx => ({
        ...tx,
        is_duplicate: duplicateIds.has(tx.transaction_unique_id)
      }));

      setBulkTransactions(finalTxs);
    } catch (err) {
      console.error('Error uploading statement:', err);
      if (err.response?.status === 401 || err.response?.status === 403) {
        setBulkUploadError('Session expired. Please log out and log back in.');
      } else {
        setBulkUploadError(err.response?.data?.error || 'Failed to process statement');
      }
    } finally {
      setIsBulkLoading(false);
    }
  };

  const handleRemoveBulkTransaction = (idx) => {
    if (!window.confirm('Are you sure you want to remove this transaction from the list?')) return;
    const newTxs = [...bulkTransactions];
    newTxs.splice(idx, 1);
    setBulkTransactions(newTxs);
  };

  const handleBulkRecord = async () => {
    const validTransactions = bulkTransactions.filter(tx => tx.client_id);
    if (validTransactions.length === 0) return alert('Please assign clients to at least one transaction');

    setIsSubmitting(true);
    setBulkProgress({ current: 0, total: validTransactions.length });
    const config = { headers: { Authorization: `Bearer ${token}` } };
    let successCount = 0;
    let failCount = 0;
    let duplicateCount = 0;

    for (let i = 0; i < validTransactions.length; i++) {
      const tx = validTransactions[i];
      try {
        await axios.post(`${API_BASE}/transactions`, {
          client_id: tx.client_id,
          type: 'IN',
          amount_naira: tx.amount_naira,
          amount_aed: tx.amount_naira / parseFloat(txRate),
          exchange_rate: parseFloat(txRate),
          description: tx.narration,
          transaction_unique_id: tx.transaction_unique_id
        }, config);
        successCount++;
      } catch (err) {
        if (err.response?.status === 401 || err.response?.status === 403) {
          alert('Session expired. Please re-login.');
          break;
        }
        if (err.response?.status === 409) {
          duplicateCount++;
        } else {
          console.error('Error recording transaction:', err);
          failCount++;
        }
      }
      setBulkProgress({ current: i + 1, total: validTransactions.length });
    }

    setBulkSummary({
      success: successCount,
      fail: failCount,
      duplicates: duplicateCount,
      total: validTransactions.length
    });

    setIsSubmitting(false);
    setBulkProgress(null);
    fetchData(); // Refresh history
  };


  // Stats Calculations
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
  const sixtyDaysAgo = new Date(now.getTime() - (60 * 24 * 60 * 60 * 1000));

  const totalNgnInflow = allTransactions
    .filter(t => t.type === 'IN')
    .reduce((sum, t) => sum + (t.amount_naira || 0), 0);

  const monthInflow = allTransactions
    .filter(t => t.type === 'IN' && new Date(t.date) > thirtyDaysAgo)
    .reduce((sum, t) => sum + (t.amount_naira || 0), 0);

  const prevMonthInflow = allTransactions
    .filter(t => t.type === 'IN' && new Date(t.date) > sixtyDaysAgo && new Date(t.date) <= thirtyDaysAgo)
    .reduce((sum, t) => sum + (t.amount_naira || 0), 0);

  const inflowGrowth = prevMonthInflow === 0 ? (monthInflow > 0 ? 100 : 0) : ((monthInflow - prevMonthInflow) / prevMonthInflow) * 100;

  const totalAedOutflow = allTransactions
    .filter(t => t.type === 'OUT')
    .reduce((sum, t) => sum + (t.amount_aed || 0), 0);

  const totalAedLiabilities = clients.reduce((sum, c) => sum + (c.balance_aed || 0), 0);




  const TransactionsContent = () => {
    const [localSearch, setLocalSearch] = useState('');
    const [typeFilter, setTypeFilter] = useState('All');

    // Aggregate stats for the top row
    const stats = {
      total: allTransactions.length,
      inflows: allTransactions.filter(t => t.type === 'IN').length,
      payouts: allTransactions.filter(t => t.type === 'OUT').length,
      pending: 12 // Mocked
    };

    const filtered = allTransactions.filter(tx => {
      const matchesSearch = tx.client_name.toLowerCase().includes(localSearch.toLowerCase()) ||
        tx.id.toString().includes(localSearch);
      const matchesType = typeFilter === 'All' || (typeFilter === 'Inflow' && tx.type === 'IN') || (typeFilter === 'Payout' && tx.type === 'OUT');
      return matchesSearch && matchesType;
    });

    return (
      <div className="animate-fade">
        {/* Page Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2.5rem' }}>
          <div>
            <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.4rem' }}>Transaction History</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>Complete record of all financial operations.</p>
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button
              onClick={() => {
                setBulkTransactions([]);
                setActiveModal('bulk-upload');
              }}
              className="btn-premium"
              style={{ border: '1px solid var(--border-color)', background: 'white', color: 'var(--text-main)', borderRadius: '8px', padding: '0.7rem 1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <FileText size={18} /> Bulk Upload
            </button>
            <button className="btn-premium" style={{ border: '1px solid var(--border-color)', background: 'white', color: 'var(--text-main)', borderRadius: '8px', padding: '0.7rem 1.2rem' }}>
              <SlidersHorizontal size={18} /> Advanced Filters
            </button>
            <button className="btn-premium btn-primary-premium" style={{ borderRadius: '8px', padding: '0.7rem 1.2rem' }}>
              <Download size={18} /> Export CSV
            </button>
          </div>
        </div>

        {/* Summary Stats Row */}
        <div className="stats-grid-premium" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: '2.5rem' }}>
          <div className="premium-card" style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1rem' }}>
              <div style={{ width: 40, height: 40, borderRadius: '10px', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                <FileText size={20} />
              </div>
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>Total Transactions</span>
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800 }}>{stats.total.toLocaleString()}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>All time</div>
          </div>

          <div className="premium-card" style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1rem' }}>
              <div style={{ width: 40, height: 40, borderRadius: '10px', background: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981' }}>
                <TrendingUp size={20} />
              </div>
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>Total Inflows</span>
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800 }}>{stats.inflows.toLocaleString()}</div>
            <div style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 600, marginTop: '0.4rem' }}>{((stats.inflows / (stats.total || 1)) * 100).toFixed(1)}% of total</div>
          </div>

          <div className="premium-card" style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1rem' }}>
              <div style={{ width: 40, height: 40, borderRadius: '10px', background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444' }}>
                <TrendingDown size={20} />
              </div>
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>Total Payouts</span>
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800 }}>{stats.payouts.toLocaleString()}</div>
            <div style={{ fontSize: '0.75rem', color: '#ef4444', fontWeight: 600, marginTop: '0.4rem' }}>{((stats.payouts / (stats.total || 1)) * 100).toFixed(1)}% of total</div>
          </div>

          <div className="premium-card" style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1rem' }}>
              <div style={{ width: 40, height: 40, borderRadius: '10px', background: '#fff7ed', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f59e0b' }}>
                <Clock size={20} />
              </div>
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>Pending Review</span>
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800 }}>{stats.pending}</div>
            <div style={{ fontSize: '0.75rem', color: '#f59e0b', fontWeight: 600, marginTop: '0.4rem' }}>Requires action</div>
          </div>
        </div>

        {/* Transactions Table Card */}
        <div className="table-container" style={{ border: '1px solid var(--border-color)', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
          <div style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800 }}>All Transactions</h3>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <div style={{ position: 'relative' }}>
                <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  placeholder="Search by ID, client..."
                  value={localSearch}
                  onChange={(e) => setLocalSearch(e.target.value)}
                  style={{
                    padding: '0.5rem 0.75rem 0.5rem 2.25rem',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    fontSize: '0.85rem',
                    width: '240px',
                    background: '#f8fafc'
                  }}
                />
              </div>
              <div style={{ position: 'relative' }}>
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  style={{
                    padding: '0.5rem 2rem 0.5rem 1rem',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    background: '#f8fafc',
                    fontSize: '0.85rem',
                    appearance: 'none',
                    cursor: 'pointer',
                    minWidth: '120px'
                  }}
                >
                  <option>All Types</option>
                  <option>Inflow</option>
                  <option>Payout</option>
                </select>
                <ChevronDown size={14} style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--text-muted)' }} />
              </div>
            </div>
          </div>

          <table className="table-premium">
            <thead>
              <tr style={{ background: '#fcfcfd' }}>
                <th>Transaction ID</th>
                <th>Date & Time</th>
                <th>Client</th>
                <th>Type</th>
                <th style={{ textAlign: 'right' }}>NGN Amount</th>
                <th style={{ textAlign: 'right' }}>AED Amount</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(tx => (
                <tr key={tx.id} className="client-table-row">
                  <td>
                    <span className="tx-id-link">#TX-{tx.id.toString().padStart(4, '0')}</span>
                  </td>
                  <td>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{new Date(tx.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{new Date(tx.date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div className="client-table-avatar" style={{ width: 32, height: 32, fontSize: '0.75rem' }}>
                        {tx.client_name ? tx.client_name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2) : '??'}
                      </div>
                      <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>{tx.client_name}</div>
                    </div>
                  </td>
                  <td>
                    <span className={`pill ${tx.type === 'IN' ? 'pill-inflow' : 'pill-payout'}`}>
                      {tx.type === 'IN' ? 'INFLOW' : 'PAYOUT'}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: 700, fontSize: '0.85rem' }}>
                    {tx.amount_naira ? `₦ ${tx.amount_naira.toLocaleString()}` : '-'}
                  </td>
                  <td style={{ textAlign: 'right', fontSize: '0.85rem' }} className={tx.type === 'IN' ? 'amount-inflow' : 'amount-payout'}>
                    {tx.type === 'IN' ? '+' : '-'} {tx.amount_aed.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  <td>
                    <span className="pill pill-active" style={{ fontSize: '0.7rem' }}>
                      Completed
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <MoreHorizontal className="action-dots" size={18} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const SettingsContent = () => {
    const fileInputRef = useRef(null);
    const [profile, setProfile] = useState({
      first_name: '',
      last_name: '',
      email: '',
      department: 'Admin Manager',
      photo_url: ''
    });
    const [isLoading, setIsLoading] = useState(false);
    const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
    const [saveStatus, setSaveStatus] = useState(null);

    useEffect(() => {
      // Fetch latest profile on mount
      const fetchProfile = async () => {
        try {
          const token = localStorage.getItem('token');
          const res = await axios.get(`${API_BASE}/user/profile`, {
            headers: { Authorization: `Bearer ${token}` }
          });

          let fName = '';
          let lName = '';
          if (res.data.full_name) {
            const parts = res.data.full_name.split(' ');
            fName = parts[0] || '';
            lName = parts.slice(1).join(' ') || '';
          }

          setProfile({
            first_name: fName,
            last_name: lName,
            email: res.data.email || '',
            department: res.data.department || 'Admin Manager',
            photo_url: res.data.photo_url || ''
          });
        } catch (err) {
          console.error('Failed to fetch profile', err);
        }
      };
      fetchProfile();
    }, []);

    const handlePhotoUpload = async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      setIsUploadingPhoto(true);
      const formData = new FormData();
      formData.append('photo', file);

      try {
        const token = localStorage.getItem('token');
        const res = await axios.post(`${API_BASE}/user/photo`, formData, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        });

        const newPhotoUrl = res.data.photo_url;
        setProfile(prev => ({ ...prev, photo_url: newPhotoUrl }));

        if (setUser && user) {
          const updatedUser = { ...user, photo_url: newPhotoUrl };
          setUser(updatedUser);
          localStorage.setItem('user', JSON.stringify(updatedUser));
        }
      } catch (err) {
        console.error('Failed to upload photo', err);
      } finally {
        setIsUploadingPhoto(false);
      }
    };

    const handleSave = async () => {
      setIsLoading(true);
      setSaveStatus(null);
      try {
        const token = localStorage.getItem('token');
        const full_name = `${profile.first_name} ${profile.last_name}`.trim();

        await axios.put(`${API_BASE}/user/profile`, {
          email: profile.email,
          full_name,
          department: profile.department
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setSaveStatus('success');

        if (setUser && user) {
          const updatedUser = { ...user, email: profile.email, full_name, department: profile.department };
          setUser(updatedUser);
          localStorage.setItem('user', JSON.stringify(updatedUser));
        }

        setTimeout(() => setSaveStatus(null), 3000);
      } catch (err) {
        console.error('Failed to save profile', err);
        setSaveStatus('error');
      } finally {
        setIsLoading(false);
      }
    };

    return (
      <div className="animate-fade">
        <div style={{ marginBottom: '2.5rem' }}>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.4rem' }}>Account Settings</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>Manage your profile, security, and system preferences.</p>
        </div>

        <div className="settings-layout">
          <aside className="settings-nav-card">
            <div className={`settings-nav-item ${activeSettingsTab === 'profile' ? 'active' : ''}`} onClick={() => setActiveSettingsTab('profile')}>
              <User size={18} /> Profile Information
            </div>
            <div className={`settings-nav-item ${activeSettingsTab === 'security' ? 'active' : ''}`} onClick={() => setActiveSettingsTab('security')}>
              <Shield size={18} /> Security
            </div>
            <div className={`settings-nav-item ${activeSettingsTab === 'notifications' ? 'active' : ''}`} onClick={() => setActiveSettingsTab('notifications')}>
              <Bell size={18} /> Notifications
            </div>
            <div className={`settings-nav-item ${activeSettingsTab === 'system' ? 'active' : ''}`} onClick={() => setActiveSettingsTab('system')}>
              <SlidersHorizontal size={18} /> System Preferences
            </div>
          </aside>

          <main className="settings-content-card animate-fade">
            {activeSettingsTab === 'profile' && (
              <div>
                <div style={{ marginBottom: '2rem' }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '0.2rem' }}>Profile Information</h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Update your account details and profile picture.</p>
                </div>

                <div className="avatar-upload-section">
                  <div className="user-avatar" style={{ width: 80, height: 80, borderRadius: '40px', background: '#f5f3ff', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', color: 'var(--text-muted)', overflow: 'hidden' }}>
                    {profile.photo_url ? (
                      <img src={`${API_BASE.replace('/api', '')}${profile.photo_url}`} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <User size={40} color="var(--primary-color)" />
                    )}
                  </div>
                  <div>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handlePhotoUpload}
                      accept="image/jpeg, image/png, image/gif"
                      style={{ display: 'none' }}
                    />
                    <button
                      className="btn-premium btn-primary-premium"
                      style={{ padding: '0.6rem 1.2rem', fontSize: '0.85rem' }}
                      onClick={() => fileInputRef.current.click()}
                      disabled={isUploadingPhoto}
                    >
                      {isUploadingPhoto ? 'Uploading...' : 'Change Photo'}
                    </button>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>JPG, PNG or GIF. Max size 2MB.</p>
                  </div>
                </div>

                <div className="settings-form-row">
                  <div className="input-group">
                    <label>First Name</label>
                    <input
                      type="text"
                      value={profile.first_name}
                      onChange={e => setProfile({ ...profile, first_name: e.target.value })}
                    />
                  </div>
                  <div className="input-group">
                    <label>Last Name</label>
                    <input
                      type="text"
                      value={profile.last_name}
                      onChange={e => setProfile({ ...profile, last_name: e.target.value })}
                    />
                  </div>
                </div>

                <div className="input-group" style={{ marginBottom: '1.5rem' }}>
                  <label>Email Address</label>
                  <input
                    type="email"
                    value={profile.email}
                    onChange={e => setProfile({ ...profile, email: e.target.value })}
                  />
                </div>

                <div className="input-group" style={{ marginBottom: '1.5rem' }}>
                  <label>Role</label>
                  <input
                    type="text"
                    value={profile.department}
                    onChange={e => setProfile({ ...profile, department: e.target.value })}
                    style={{ background: '#f8fafc', borderStyle: 'dashed' }}
                  />
                </div>

                <div className="input-group" style={{ marginBottom: '2rem' }}>
                  <label>Phone Number</label>
                  <input type="text" defaultValue="+234 801 234 5678" />
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem' }}>
                  <div>
                    {saveStatus === 'success' && <span style={{ color: 'var(--success-color)', fontSize: '0.85rem', fontWeight: 600 }}>Profile updated successfully!</span>}
                    {saveStatus === 'error' && <span style={{ color: 'var(--danger-color)', fontSize: '0.85rem', fontWeight: 600 }}>Failed to update profile.</span>}
                  </div>
                  <div style={{ display: 'flex', gap: '1rem' }}>
                    <button className="btn-premium" style={{ border: '1px solid var(--border-color)', background: 'white' }}>Cancel</button>
                    <button
                      className="btn-premium btn-primary-premium"
                      onClick={handleSave}
                      disabled={isLoading}
                    >
                      {isLoading ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeSettingsTab !== 'profile' && (
              <div style={{ textAlign: 'center', padding: '4rem 2rem' }}>
                <div style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}><Settings size={48} style={{ opacity: 0.2 }} /></div>
                <h3 style={{ fontWeight: 800 }}>{activeSettingsTab.charAt(0).toUpperCase() + activeSettingsTab.slice(1)} Settings</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>This section is currently under development.</p>
              </div>
            )}
          </main>
        </div >
      </div >
    );
  };

  if (!token) return (
    <AuthScreen
      authMode={authMode}
      authError={authError}
      handleAuth={handleAuth}
      loginForm={loginForm}
      setLoginForm={setLoginForm}
      authLoading={authLoading}
      setAuthMode={setAuthMode}
    />
  );

  return (
    <div className="app-layout">
      {/* Sidebar Navigation */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">F</div>
          <span>FinanceBridge</span>
        </div>

        <nav className="sidebar-nav">
          <div className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}>
            <LayoutDashboard size={20} />
            Dashboard
          </div>
          <div className={`nav-item ${activeTab === 'clients' ? 'active' : ''}`} onClick={() => setActiveTab('clients')}>
            <Users size={20} />
            Clients
          </div>
          <div className={`nav-item ${activeTab === 'reports' ? 'active' : ''}`} onClick={() => setActiveTab('reports')}>
            <FileText size={20} />
            Reports
          </div>
          <div className={`nav-item ${activeTab === 'transactions' ? 'active' : ''}`} onClick={() => setActiveTab('transactions')}>
            <ArrowRightLeft size={20} />
            Transactions
          </div>

          <div style={{ marginTop: 'auto', paddingTop: '1rem' }}>
            <div className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => setActiveTab('settings')}>
              <Settings size={20} />
              Account Settings
            </div>
          </div>
        </nav>
      </aside>

      {/* Main Content */}
      <div className="main-wrapper">
        <header className="header-premium">
          <div className="header-search">
            <Search size={18} color="var(--text-muted)" />
            <input
              type="text"
              placeholder="Quick search records..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="header-actions">
            <div className="header-notification">
              <Bell size={20} color="var(--text-muted)" />
              <div className="notification-dot"></div>
            </div>
            <div className="user-profile-header" style={{ cursor: 'pointer' }} onClick={handleLogout}>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: 800, fontSize: '0.9rem' }}>{user?.username || 'User'}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Logout</div>
              </div>
              <div className="user-avatar" style={{ width: 40, height: 40, borderRadius: '12px', background: '#f1f5f9', overflow: 'hidden' }}>
                {user?.photo_url ? (
                  <img src={`${API_BASE.replace('/api', '')}${user.photo_url}`} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <User size={20} color="var(--text-muted)" style={{ margin: '10px' }} />
                )}
              </div>
            </div>
          </div>
        </header>

        <main className="content-area">
          {activeTab === 'dashboard' && (
            <DashboardContent
              setTxType={setTxType}
              setActiveModal={setActiveModal}
              totalNgnInflow={totalNgnInflow}
              monthInflow={monthInflow}
              inflowGrowth={inflowGrowth}
              totalAedOutflow={totalAedOutflow}
              totalAedLiabilities={totalAedLiabilities}
              clients={clients}
              txRate={txRate}
              allTransactions={allTransactions}
            />
          )}
          {activeTab === 'clients' && (
            <ClientsContent
              clients={clients}
              allTransactions={allTransactions}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              handleSelectClient={handleSelectClient}
              resetFormStates={resetFormStates}
              setActiveModal={setActiveModal}
              handleInitiateEdit={handleInitiateEdit}
              handleDeleteClient={handleDeleteClient}
            />
          )}
          {activeTab === 'reports' && (
            <ReportsContent
              clients={clients}
              allTransactions={allTransactions}
            />
          )}
          {activeTab === 'transactions' && (
            <TransactionsContent
              allTransactions={allTransactions}
            />
          )}
          {activeTab === 'settings' && (
            <SettingsContent
              user={user}
              setUser={setUser}
            />
          )}
        </main>
      </div>

      {/* Deposit Modal */}
      {activeModal === 'deposit' && (
        <div className="modal-overlay modal-overlay-blur">
          <div className="modal-premium animate-fade">
            <div className="modal-header-premium">
              <div>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Fund Account</h2>
                <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)' }}>Secure Naira capital injection</p>
              </div>
              <X style={{ cursor: 'pointer' }} onClick={() => setActiveModal(null)} />
            </div>

            <div className="modal-body-premium">
              <form onSubmit={handleAddTransaction}>
                <div className="input-group" style={{ marginBottom: '1.5rem' }}>
                  <label>Beneficiary / Source</label>
                  <select required value={txClientId} onChange={e => setTxClientId(e.target.value)}>
                    <option value="">Select corporate account...</option>
                    {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                  {txClientId && (
                    <div style={{ fontSize: '0.75rem', marginTop: '0.4rem', color: 'var(--text-muted)' }}>
                      Current Account Balance: <span style={{ fontWeight: 700 }}>{clients.find(c => c.id.toString() === txClientId.toString())?.balance_aed.toLocaleString()} AED</span>
                    </div>
                  )}
                </div>

                <div className="modal-grid-premium">
                  <div className="input-group">
                    <label>Naira Amount (₦)</label>
                    <div className="premium-input-wrapper">
                      <span className="input-icon">₦</span>
                      <input type="number" step="0.01" required value={txAmountNaira} onChange={e => setTxAmountNaira(e.target.value)} placeholder="0.00" />
                    </div>
                  </div>
                  <div className="input-group">
                    <label>Conversion Rate</label>
                    <input type="number" step="0.1" value={txRate} onChange={e => setTxRate(e.target.value)} />
                  </div>
                </div>

                <div className="modal-summary-box">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                    <div>
                      <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.5rem' }}>ESTIMATED AED EFFECT</div>
                      <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--success-color)' }}>
                        + {(parseFloat(txAmountNaira || 0) / parseFloat(txRate || 1)).toLocaleString(undefined, { minimumFractionDigits: 2 })} AED
                      </div>
                    </div>
                    {txClientId && (
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.2rem' }}>FUTURE BALANCE</div>
                        <div style={{ fontSize: '0.9rem', fontWeight: 700 }}>
                          {(clients.find(c => c.id.toString() === txClientId.toString())?.balance_aed + (parseFloat(txAmountNaira || 0) / parseFloat(txRate || 1))).toLocaleString(undefined, { minimumFractionDigits: 2 })} AED
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <button type="submit" disabled={isSubmitting} className="btn-premium btn-primary-premium" style={{ width: '100%', marginTop: '1rem', justifyContent: 'center' }}>
                  {isSubmitting ? 'Processing Transaction...' : 'Confirm Capital Inflow'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Disbursement Modal */}
      {activeModal === 'disburse' && (
        <div className="modal-overlay modal-overlay-blur">
          <div className="modal-premium animate-fade" style={{ maxWidth: '640px' }}>
            <div className="modal-header-premium">
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Record AED Payout</h2>
              <X style={{ cursor: 'pointer' }} onClick={() => setActiveModal(null)} />
            </div>

            <div className="modal-body-premium">
              <form onSubmit={handleAddTransaction}>
                <div className="modal-grid-premium">
                  <div className="input-group">
                    <label>Client Name</label>
                    <select required value={txClientId} onChange={e => setTxClientId(e.target.value)}>
                      <option value="">Select corporate account...</option>
                      {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>

                  <div className="input-group">
                    <label>Reference ID</label>
                    <input readOnly value={txClientId ? `#C-${txClientId.toString().padStart(4, '0')}` : ''} placeholder="Auto-generated" />
                  </div>

                  <div className="input-group">
                    <label>Category</label>
                    <select defaultValue="Standard Payout">
                      <option>Standard Payout</option>
                      <option>Legal Disbursement</option>
                      <option>Operational Expense</option>
                    </select>
                  </div>

                  <div className="input-group">
                    <label>Recipient Name</label>
                    <input required value={txRecipient} onChange={e => setTxRecipient(e.target.value)} placeholder="Searchable/Select..." />
                  </div>

                  <div className="input-group">
                    <label>Amount AED</label>
                    <div className="premium-input-wrapper">
                      <input type="number" step="0.01" required value={txAmountAed} onChange={e => setTxAmountAed(e.target.value)} placeholder="0.00" />
                    </div>
                  </div>

                  <div className="input-group">
                    <label>Purpose / Notes</label>
                    <textarea
                      value={txDesc}
                      onChange={e => setTxDesc(e.target.value)}
                      placeholder="TextArea..."
                      style={{
                        width: '100%',
                        height: '48px',
                        borderRadius: '12px',
                        padding: '0.6rem 1rem',
                        border: '1px solid var(--border-color)',
                        fontFamily: 'inherit'
                      }}
                    />
                  </div>
                </div>

                {(() => {
                  const client = clients.find(c => c.id.toString() === txClientId.toString());
                  const balance = client?.balance_aed || 0;
                  const exceeds = parseFloat(txAmountAed || 0) > balance;

                  return (
                    <>
                      {exceeds && (
                        <div className="warning-text">
                          <Bell size={14} />
                          Warning: Amount exceeds client's AED balance
                        </div>
                      )}

                      <div className="modal-summary-box-payout">
                        <div className="payout-label">Current Client AED Balance:</div>
                        <div className="payout-value" style={{ color: exceeds ? 'var(--danger-color)' : 'var(--text-main)' }}>
                          Balance: {balance.toLocaleString(undefined, { minimumFractionDigits: 2 })} AED
                        </div>
                      </div>
                    </>
                  );
                })()}

                <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '1rem' }}>
                  <button type="submit" disabled={isSubmitting} className="btn-confirm-payout">
                    {isSubmitting ? 'Processing...' : 'Confirm & Disburse'}
                  </button>
                  <button type="button" className="btn-cancel-payout" onClick={() => setActiveModal(null)}>
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Upload Modal */}
      {activeModal === 'bulk-upload' && (
        <div className="modal-overlay modal-overlay-blur">
          <div className="modal-premium animate-fade" style={{ maxWidth: '900px', width: '95%' }}>
            <div className="modal-header-premium">
              <div>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Bulk Statement Upload</h2>
                <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)' }}>Extract and record multiple deposits from PDF</p>
              </div>
              <X style={{ cursor: 'pointer' }} onClick={() => setActiveModal(null)} />
            </div>

            <div className="modal-body-premium">
              {bulkSummary ? (
                <div style={{ textAlign: 'center', padding: '3rem' }}>
                  <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: '#f0fdf4', color: 'var(--success-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                    <Check size={40} />
                  </div>
                  <h2 style={{ fontWeight: 800, marginBottom: '1rem' }}>Upload Summary</h2>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
                    <div style={{ padding: '1.5rem', background: '#f8fafc', borderRadius: '12px' }}>
                      <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--success-color)' }}>{bulkSummary.success}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Recorded</div>
                    </div>
                    <div style={{ padding: '1.5rem', background: '#f8fafc', borderRadius: '12px' }}>
                      <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#f59e0b' }}>{bulkSummary.duplicates}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Duplicates</div>
                    </div>
                    <div style={{ padding: '1.5rem', background: '#f8fafc', borderRadius: '12px' }}>
                      <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--danger-color)' }}>{bulkSummary.fail}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Failed</div>
                    </div>
                  </div>
                  <button
                    className="btn-premium btn-primary-premium"
                    onClick={() => {
                      setBulkSummary(null);
                      setBulkTransactions([]);
                      setActiveModal(null);
                    }}
                    style={{ padding: '0.8rem 2.5rem' }}
                  >
                    Done
                  </button>
                </div>
              ) : !bulkTransactions.length ? (
                <div style={{ textAlign: 'center', padding: '3rem 1rem', border: '2px dashed var(--border-color)', borderRadius: '16px' }}>
                  <div style={{ marginBottom: '1.5rem' }}>
                    <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto', color: 'var(--text-muted)' }}>
                      <FileText size={32} />
                    </div>
                  </div>
                  <h3 style={{ fontWeight: 800, marginBottom: '0.5rem' }}>Select Bank Statement PDF</h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '2rem' }}>Upload your Nigerian bank statement to extract credit transactions automatically.</p>

                  <input
                    type="file"
                    accept=".pdf"
                    onChange={handleFileUpload}
                    id="bulk-file-input"
                    style={{ display: 'none' }}
                  />
                  <label
                    htmlFor="bulk-file-input"
                    className="btn-premium btn-primary-premium"
                    style={{ cursor: 'pointer', display: 'inline-flex', padding: '0.8rem 2rem' }}
                  >
                    {isBulkLoading ? 'Processing PDF...' : 'Choose File'}
                  </label>
                  {bulkUploadError && <p style={{ color: 'var(--danger-color)', marginTop: '1rem', fontSize: '0.85rem' }}>{bulkUploadError}</p>}
                </div>
              ) : (
                <div className="bulk-review-section">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <div>
                      <h3 style={{ fontWeight: 800 }}>Review Extracted Transactions ({bulkTransactions.length})</h3>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Assign clients and verify details before recording.</p>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Rate:</span>
                      <input
                        type="number"
                        value={txRate}
                        onChange={(e) => setTxRate(e.target.value)}
                        style={{ width: '80px', padding: '0.3rem', borderRadius: '6px', border: '1px solid var(--border-color)', textAlign: 'center' }}
                      />
                    </div>
                  </div>

                  <div style={{ maxHeight: '500px', overflowY: 'auto', marginBottom: '1.5rem', paddingRight: '0.5rem' }}>
                    {(() => {
                      // Group transactions by sender
                      const groups = bulkTransactions.reduce((acc, tx, idx) => {
                        if (!acc[tx.sender]) {
                          acc[tx.sender] = {
                            sender: tx.sender,
                            transactions: []
                          };
                        }
                        acc[tx.sender].transactions.push({ ...tx, originalIdx: idx });
                        return acc;
                      }, {});

                      return Object.values(groups).map((group, gIdx) => (
                        <div key={gIdx} style={{
                          background: 'white',
                          borderRadius: '12px',
                          border: '1px solid var(--border-color)',
                          marginBottom: '1rem',
                          overflow: 'hidden'
                        }}>
                          {/* Group Header */}
                          <div style={{
                            padding: '1rem',
                            background: '#f8fafc',
                            borderBottom: '1px solid var(--border-color)',
                            display: 'grid',
                            gridTemplateColumns: '1fr 200px',
                            alignItems: 'center',
                            gap: '1rem'
                          }}>
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <User size={16} style={{ color: 'var(--primary-color)' }} />
                                <h4 style={{ fontWeight: 800, margin: 0 }}>{group.sender}</h4>
                                {group.transactions.every(tx => tx.is_duplicate) &&
                                  <span style={{ fontSize: '0.65rem', background: '#fee2e2', color: '#ef4444', padding: '2px 8px', borderRadius: '10px', fontWeight: 600 }}>ALL DUPLICATES</span>
                                }
                              </div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                                {group.transactions.length} transaction{group.transactions.length > 1 ? 's' : ''} from this sender
                              </div>
                            </div>
                            <div>
                              <select
                                value={group.transactions[0].client_id || ""}
                                disabled={group.transactions.every(tx => tx.is_duplicate)}
                                onChange={(e) => {
                                  const selectedId = e.target.value;
                                  const newTxs = [...bulkTransactions];
                                  group.transactions.forEach(gtx => {
                                    newTxs[gtx.originalIdx].client_id = selectedId;
                                  });
                                  setBulkTransactions(newTxs);
                                }}
                                style={{
                                  padding: '0.4rem',
                                  borderRadius: '8px',
                                  width: '100%',
                                  fontSize: '0.8rem',
                                  background: 'white',
                                  border: group.transactions[0].client_id ? '2px solid var(--success-color)' : '1px solid var(--border-color)',
                                  fontWeight: group.transactions[0].client_id ? 700 : 400
                                }}
                              >
                                <option value="">Assign Client...</option>
                                {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                              </select>
                            </div>
                          </div>

                          {/* Individual Transactions in Group */}
                          <div style={{ padding: '0.5rem 1rem' }}>
                            <table className="table-premium" style={{ fontSize: '0.75rem', width: '100%' }}>
                              <thead>
                                <tr style={{ border: 'none', background: 'transparent' }}>
                                  <th style={{ padding: '0.5rem' }}>Date</th>
                                  <th style={{ padding: '0.5rem' }}>Full Narration</th>
                                  <th style={{ padding: '0.5rem', textAlign: 'right' }}>Amount (₦)</th>
                                  <th style={{ padding: '0.5rem', textAlign: 'right' }}>Est. AED</th>
                                  <th style={{ padding: '0.5rem', textAlign: 'right' }}>Action</th>
                                </tr>
                              </thead>
                              <tbody>
                                {group.transactions.map((tx, tIdx) => (
                                  <tr key={tIdx} style={tx.is_duplicate ? { opacity: 0.5 } : {}}>
                                    <td>{tx.date}</td>
                                    <td style={{ maxWidth: '250px', whiteSpace: 'normal', lineBreak: 'anywhere' }}>
                                      {tx.narration}
                                      {tx.is_duplicate && (
                                        <div style={{ color: '#ef4444', fontWeight: 600, fontSize: '0.65rem', marginTop: '0.2rem' }}> Already exists in system </div>
                                      )}
                                    </td>
                                    <td style={{ textAlign: 'right', fontWeight: 600 }}>₦ {tx.amount_naira.toLocaleString()}</td>
                                    <td style={{ textAlign: 'right', color: 'var(--success-color)', fontWeight: 600 }}>
                                      {(tx.amount_naira / parseFloat(txRate)).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                    </td>
                                    <td style={{ textAlign: 'right' }}>
                                      <button
                                        onClick={() => handleRemoveBulkTransaction(tx.originalIdx)}
                                        style={{
                                          background: 'none',
                                          border: 'none',
                                          color: 'var(--danger-color)',
                                          cursor: 'pointer',
                                          padding: '4px',
                                          borderRadius: '4px',
                                          display: 'inline-flex',
                                          alignItems: 'center',
                                          justifyContent: 'center'
                                        }}
                                        title="Remove transaction"
                                      >
                                        <Trash2 size={14} />
                                      </button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      ));
                    })()}
                  </div>

                  {bulkProgress ? (
                    <div style={{ marginBottom: '1.5rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.5rem' }}>
                        <span>Recording transactions...</span>
                        <span>{bulkProgress.current} / {bulkProgress.total}</span>
                      </div>
                      <div style={{ width: '100%', height: '8px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                        <div
                          style={{
                            height: '100%',
                            background: 'var(--primary-color)',
                            width: `${(bulkProgress.current / bulkProgress.total) * 100}%`,
                            transition: 'width 0.2s ease'
                          }}
                        />
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                      <button
                        className="btn-premium"
                        onClick={() => {
                          if (window.confirm('Are you sure you want to clear all extracted transactions?')) {
                            setBulkTransactions([]);
                          }
                        }}
                        style={{ border: '1px solid var(--border-color)', background: 'white' }}
                      >
                        Clear All
                      </button>
                      <button
                        className="btn-premium btn-primary-premium"
                        onClick={handleBulkRecord}
                        disabled={isSubmitting || !bulkTransactions.some(tx => tx.client_id && !tx.is_duplicate)}
                      >
                        {isSubmitting ? 'Recording...' : `Record ${bulkTransactions.filter(tx => tx.client_id && !tx.is_duplicate).length} Transactions`}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )
      }

      {/* Account Onboarding Modal */}
      {
        activeModal === 'addClient' && (
          <div className="modal-overlay modal-overlay-blur">
            <div className="modal-premium animate-fade" style={{ maxWidth: '700px' }}>
              <div className="modal-header-premium">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div className="analytics-icon-wrapper card-icon-blue" style={{ marginBottom: 0, width: '40px', height: '40px' }}>
                    <Users size={20} />
                  </div>
                  <div>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>{editingClient ? 'Edit Client Details' : 'Onboard New Client'}</h2>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{editingClient ? `Editing ${editingClient.name}` : 'Register a new legal entity to the network.'}</p>
                  </div>
                </div>
                <X style={{ cursor: 'pointer' }} onClick={() => setActiveModal(null)} />
              </div>
              <div className="modal-body-premium">
                <form onSubmit={handleAddClient}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                    <div className="input-group">
                      <label>Legal Entity Name</label>
                      <input
                        required
                        value={clientName}
                        onChange={e => setClientName(e.target.value)}
                        placeholder="e.g. Al-Futtaim Group"
                      />
                    </div>
                    <div className="input-group">
                      <label>Contact Person</label>
                      <input
                        value={clientContact}
                        onChange={e => setClientContact(e.target.value)}
                        placeholder="Principal contact name"
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                    <div className="input-group">
                      <label>Email Address</label>
                      <input
                        type="email"
                        value={clientEmail}
                        onChange={e => setClientEmail(e.target.value)}
                        placeholder="billing@company.com"
                      />
                    </div>
                    <div className="input-group">
                      <label>Phone Number</label>
                      <input
                        value={clientPhone}
                        onChange={e => setClientPhone(e.target.value)}
                        placeholder="+971 -- --- ----"
                      />
                    </div>
                  </div>

                  <div className="input-group" style={{ marginBottom: '1.5rem' }}>
                    <label>Physical Address / Office</label>
                    <textarea
                      value={clientAddress}
                      onChange={e => setClientAddress(e.target.value)}
                      placeholder="Headquarters location"
                      style={{ minHeight: '80px', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', width: '100%' }}
                    />
                  </div>

                  <div className="input-group" style={{ marginBottom: '2rem' }}>
                    <label>Company Logo / Photo</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                      <div style={{
                        width: '64px',
                        height: '64px',
                        borderRadius: '12px',
                        background: '#f8fafc',
                        border: '2px dashed #cbd5e1',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        overflow: 'hidden'
                      }}>
                        {clientPhotoPreview ? (
                          <img src={clientPhotoPreview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <Users color="#94a3b8" size={24} />
                        )}
                      </div>
                      <div style={{ flex: 1 }}>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleClientPhotoChange}
                          style={{ display: 'none' }}
                          id="client-photo-input"
                        />
                        <label
                          htmlFor="client-photo-input"
                          className="btn-premium"
                          style={{
                            cursor: 'pointer',
                            background: 'white',
                            border: '1px solid var(--border-color)',
                            padding: '0.5rem 1rem',
                            borderRadius: '8px',
                            display: 'inline-block'
                          }}
                        >
                          {clientPhotoFile ? 'Change Logo' : 'Choose Logo'}
                        </label>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>PNG, JPG or SVG. Max 2MB.</p>
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="btn-premium btn-primary-premium"
                    style={{ width: '100%', justifyContent: 'center', height: '48px' }}
                  >
                    {isSubmitting ? (editingClient ? 'Saving...' : 'Onboarding Entity...') : (editingClient ? 'Save Changes' : 'Complete Registration')}
                  </button>
                </form>
              </div>
            </div>
          </div>
        )
      }

      {/* Account Audit Modal */}
      {
        activeModal === 'audit' && activeClient && (
          <div className="modal-overlay modal-overlay-blur">
            <div className="modal-premium animate-fade" style={{ maxWidth: '900px' }}>

              <div className="modal-header-premium">
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Account Audit: {activeClient.name}</h2>
                <X style={{ cursor: 'pointer' }} onClick={() => setActiveModal(null)} />
              </div>

              <div className="modal-body-premium">
                <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '2rem' }}>
                  <div style={{ flex: 1, padding: '1.5rem', background: 'var(--bg-color)', borderRadius: '12px' }}>
                    <div className="card-label">Net AED Balance</div>
                    <div className="card-value" style={{ color: 'var(--success-color)' }}>{activeClient.balance_aed.toLocaleString()} AED</div>
                  </div>
                  <div style={{ flex: 1, padding: '1.5rem', background: 'var(--bg-color)', borderRadius: '12px' }}>
                    <div className="card-label">Last Operation</div>
                    <div style={{ fontWeight: 700 }}>{clientTransactions[0] ? new Date(clientTransactions[0].date).toLocaleDateString() : 'N/A'}</div>
                  </div>
                </div>

                <table className="table-premium">
                  <thead>
                    <tr>
                      <th>Operation Date</th>
                      <th>Currency Breakdown</th>
                      <th>AED Impact</th>
                      <th>Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {clientTransactions.map(tx => (
                      <tr key={tx.id}>
                        <td>{new Date(tx.date).toLocaleDateString()}</td>
                        <td style={{ fontSize: '0.85rem' }}>
                          {tx.type === 'IN' ? `₦${tx.amount_naira?.toLocaleString()} @ ${tx.exchange_rate}` : 'Direct AED Payout'}
                        </td>
                        <td className="cell-amount" style={{ color: tx.type === 'IN' ? 'var(--success-color)' : 'var(--danger-color)' }}>
                          {tx.type === 'IN' ? '+' : '-'}{tx.amount_aed.toLocaleString()}
                        </td>
                        <td style={{ fontSize: '0.85rem' }}>{tx.recipient || tx.description}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div style={{ marginTop: '2.5rem', display: 'flex', gap: '1rem' }}>
                  <button className="btn-premium btn-primary-premium" onClick={() => window.print()}>
                    <Download size={18} /> Export Formal Report
                  </button>
                  <button className="btn-premium" style={{ border: '1px solid var(--border-color)', background: 'white' }} onClick={() => setActiveModal(null)}>
                    Close Audit
                  </button>
                </div>
              </div>
            </div>
          </div>
        )
      }
    </div >
  );
};


const AuthScreen = ({ authMode, authError, handleAuth, loginForm, setLoginForm, authLoading, setAuthMode }) => (
  <div className="auth-overlay">
    <div className="auth-card animate-fade">
      <div className="auth-header">
        <div className="sidebar-logo-icon" style={{ margin: '0 auto 1.5rem auto' }}>F</div>
        <h2>{authMode === 'login' ? 'Welcome Back' : 'Create Account'}</h2>
        <p>{authMode === 'login' ? 'Enter your credentials to access the platform' : 'Register a new admin account'}</p>
      </div>

      {authError && <div className="auth-error-badge">{authError}</div>}

      <form onSubmit={handleAuth}>
        <div className="input-group">
          <label>Username</label>
          <div style={{ position: 'relative' }}>
            <User size={18} className="input-icon-left" />
            <input
              type="text"
              required
              className="input-with-icon"
              value={loginForm.username}
              onChange={e => setLoginForm({ ...loginForm, username: e.target.value })}
              placeholder="admin_alex"
            />
          </div>
        </div>

        <div className="input-group">
          <label>Password</label>
          <div style={{ position: 'relative' }}>
            <Shield size={18} className="input-icon-left" />
            <input
              type="password"
              required
              className="input-with-icon"
              value={loginForm.password}
              onChange={e => setLoginForm({ ...loginForm, password: e.target.value })}
              placeholder="••••••••"
            />
          </div>
        </div>

        <button type="submit" disabled={authLoading} className="btn-premium btn-primary-premium" style={{ width: '100%', marginTop: '1rem', justifyContent: 'center' }}>
          {authLoading ? 'Authenticating...' : authMode === 'login' ? 'Sign In' : 'Register Account'}
        </button>
      </form>

      <div className="auth-footer">
        {authMode === 'login' ? (
          <p>Don't have an account? <span onClick={() => setAuthMode('register')}>Register here</span></p>
        ) : (
          <p>Already have an account? <span onClick={() => setAuthMode('login')}>Sign in here</span></p>
        )}
      </div>
    </div>
  </div>
);

const DashboardContent = ({
  setTxType,
  setActiveModal,
  totalNgnInflow,
  monthInflow,
  inflowGrowth,
  totalAedOutflow,
  totalAedLiabilities,
  clients,
  txRate,
  allTransactions
}) => (
  <div className="animate-fade">
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2.5rem' }}>
      <div>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.4rem' }}>Dashboard Overview</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>Welcome back, here's what's happening today.</p>
      </div>
      <div style={{ display: 'flex', gap: '1rem' }}>
        <button className="btn-premium" style={{ border: '1px solid var(--border-color)', background: 'white', color: '#ef4444', borderRadius: '8px', padding: '0.7rem 1.2rem' }} onClick={() => { setTxType('OUT'); setActiveModal('disburse'); }}>
          <TrendingDown size={18} /> Record Payout
        </button>
        <button className="btn-premium btn-primary-premium" style={{ borderRadius: '8px', padding: '0.7rem 1.2rem' }} onClick={() => { setTxType('IN'); setActiveModal('deposit'); }}>
          <Plus size={18} /> Record Deposit
        </button>
      </div>
    </div>

    <div className="stats-grid-premium" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: '2.5rem' }}>
      <div className="premium-card" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
          <div className="analytics-icon-wrapper card-icon-green" style={{ marginBottom: 0 }}>
            <TrendingUp size={20} />
          </div>
          <div className={`trend-badge ${inflowGrowth >= 0 ? 'trend-up' : 'trend-down'}`}>
            {inflowGrowth >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {Math.abs(inflowGrowth).toFixed(1)}%
          </div>
        </div>
        <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Monthly Naira Inflow</div>
        <div style={{ fontSize: '1.6rem', fontWeight: 800 }}>₦ {monthInflow.toLocaleString()}</div>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>vs previous 30 days</div>
      </div>

      <div className="premium-card" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
          <div className="analytics-icon-wrapper card-icon-red" style={{ marginBottom: 0 }}>
            <TrendingDown size={20} />
          </div>
        </div>
        <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Total AED Paid Out</div>
        <div style={{ fontSize: '1.6rem', fontWeight: 800 }}>AED {totalAedOutflow.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>Lifetime outflow</div>
      </div>

      <div className="premium-card" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
          <div className="analytics-icon-wrapper card-icon-violet" style={{ marginBottom: 0 }}>
            <Wallet size={20} />
          </div>
        </div>
        <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.5rem' }}>AED Running Balance</div>
        <div style={{ fontSize: '1.6rem', fontWeight: 800 }}>AED {totalAedLiabilities.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>Available for payout</div>
      </div>

      <div className="premium-card" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
          <div className="analytics-icon-wrapper card-icon-grey" style={{ marginBottom: 0 }}>
            <Globe size={20} />
          </div>
          <div className="status-badge status-pending">
            Live Rate
          </div>
        </div>
        <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Network Overview</div>
        <div style={{ fontSize: '1.6rem', fontWeight: 800 }}>{clients.length} <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 500 }}>Clients</span></div>
        <div style={{ fontSize: '0.75rem', color: 'var(--primary-color)', fontWeight: 700, marginTop: '0.5rem' }}>1 AED = {txRate} NGN</div>
      </div>
    </div>


    <div className="table-container" style={{ border: '1px solid var(--border-color)', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
      <div style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 800 }}>Recent Operations</h3>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="view-details-link" style={{ background: 'none', border: 'none', padding: 0 }}>View All Transactions</button>
        </div>
      </div>
      <table className="table-premium">
        <thead>
          <tr>
            <th>Date</th>
            <th>Counterparty</th>
            <th>Impact</th>
            <th>Status</th>
            <th style={{ textAlign: 'right' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {allTransactions.slice(0, 8).map(tx => (
            <tr key={tx.id}>
              <td>{new Date(tx.date).toLocaleDateString()}</td>
              <td>
                <div style={{ fontWeight: 700 }}>{clients.find(c => c.id === tx.client_id)?.name || 'Unknown'}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{tx.type === 'IN' ? 'Deposit' : 'Disbursement'}</div>
              </td>
              <td className="cell-amount" style={{ color: tx.type === 'IN' ? 'var(--success-color)' : 'var(--danger-color)' }}>
                {tx.type === 'IN' ? '+' : '-'}{tx.amount_aed.toLocaleString()} AED
              </td>
              <td><span className="pill pill-active">Verified</span></td>
              <td style={{ textAlign: 'right' }}><MoreHorizontal size={18} className="action-dots" /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

const ReportsContent = ({ clients, allTransactions }) => {
  const [timeFilter, setTimeFilter] = useState('Last 30 Days');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [clientFilter, setClientFilter] = useState('All Clients');

  // Filter transactions based on selected time period
  const filteredTransactions = useMemo(() => {
    if (!allTransactions || allTransactions.length === 0) return [];

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    return allTransactions.filter(tx => {
      // Client Filter
      if (clientFilter !== 'All Clients' && String(tx.client_id) !== String(clientFilter)) {
        return false;
      }

      const txDate = new Date(tx.date);

      switch (timeFilter) {
        case 'Last 30 Days': {
          const thirtyDaysAgo = new Date(today);
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
          return txDate >= thirtyDaysAgo;
        }
        case 'Last 90 Days': {
          const ninetyDaysAgo = new Date(today);
          ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
          return txDate >= ninetyDaysAgo;
        }
        case 'Year to Date': {
          const startOfYear = new Date(today.getFullYear(), 0, 1);
          return txDate >= startOfYear;
        }
        case 'Custom Range': {
          if (customStartDate) {
            const start = new Date(customStartDate);
            if (txDate < start) return false;
          }
          if (customEndDate) {
            const end = new Date(customEndDate);
            end.setHours(23, 59, 59, 999);
            if (txDate > end) return false;
          }
          return true;
        }
        case 'All Time':
        default:
          return true;
      }
    });
  }, [allTransactions, timeFilter, customStartDate, customEndDate, clientFilter]);

  // Aggregate data for charts dynamically
  const { trendData, comparisonData } = useMemo(() => {
    if (filteredTransactions.length === 0) return { trendData: [], comparisonData: [] };

    // Determine grouping granularity
    const groupByDay = timeFilter === 'Last 30 Days';

    const aggregated = filteredTransactions.reduce((acc, tx) => {
      const date = new Date(tx.date);
      let groupKey;
      let displayLabel;

      if (groupByDay) {
        // e.g., "2023-10-25" for sorting, "Oct 25" for display
        groupKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
        displayLabel = date.toLocaleString('default', { month: 'short', day: 'numeric' });
      } else {
        // e.g., "2023-10" for sorting, "Oct 2023" for display
        groupKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        displayLabel = date.toLocaleString('default', { month: 'short', year: 'numeric' });
      }

      if (!acc[groupKey]) {
        acc[groupKey] = { sortKey: groupKey, name: displayLabel, volume: 0, inflows: 0, payouts: 0 };
      }

      if (tx.type === 'IN') {
        acc[groupKey].volume += (tx.amount_naira || 0) / 1000000;
        acc[groupKey].inflows += (tx.amount_naira || 0) / 1000000;
      } else {
        acc[groupKey].payouts += (tx.amount_aed * 1400) / 1000000; // Rough NGN equivalent
      }
      return acc;
    }, {});

    // Sort chronologically
    const sortedData = Object.values(aggregated).sort((a, b) => a.sortKey.localeCompare(b.sortKey));

    // Limit points to avoid crowding, logic could be more complex (e.g. slicing or downsampling)
    // For now, if we have > 30 points (e.g. Last 90 Days grouped by day), we might want to slice, 
    // but since Last 90 Days uses months we are fine.
    // If 'All Time' produces too many months, we might want to slice the last 24 months.
    const limitedData = sortedData.slice(-24);

    const trend = limitedData.map(d => ({ name: d.name, volume: parseFloat(d.volume.toFixed(2)) }));
    const comparison = limitedData.map(d => ({
      name: d.name,
      inflows: parseFloat(d.inflows.toFixed(2)),
      payouts: parseFloat(d.payouts.toFixed(2))
    }));

    return { trendData: trend, comparisonData: comparison };
  }, [filteredTransactions, timeFilter]);

  // Top Performing Clients (Sorted by volume) based on filtered transactions
  const topClients = useMemo(() => {
    return clients.map(client => {
      const clientTx = filteredTransactions.filter(tx => tx.client_id === client.id);
      const volume = clientTx.reduce((sum, tx) => sum + (tx.amount_naira || 0), 0);
      return { ...client, totalVolume: volume, txCount: clientTx.length };
    }).sort((a, b) => b.totalVolume - a.totalVolume).slice(0, 5);
  }, [clients, filteredTransactions]);


  const handleExportReport = () => {
    if (filteredTransactions.length === 0) {
      alert("No data to export for the selected time period.");
      return;
    }

    // CSV Headers
    const headers = [
      "Date",
      "Time",
      "Client/Counterparty",
      "Recipient/Narration",
      "Operation Type",
      "Amount (NGN)",
      "Balance Effect (AED)",
      "Unique ID"
    ];

    // CSV Rows
    const rows = filteredTransactions.map(tx => {
      const date = new Date(tx.date).toLocaleDateString();
      const time = new Date(tx.date).toLocaleTimeString();
      const clientName = `"${(tx.client_name || '').replace(/"/g, '""')}"`;
      const recipient = `"${(tx.recipient || '').replace(/"/g, '""')}"`;
      const type = tx.type === 'IN' ? 'INFLOW' : 'PAYOUT';
      const naira = tx.amount_naira || '';
      const aed = `${tx.type === 'IN' ? '+' : '-'}${tx.amount_aed}`;
      const id = tx.transaction_unique_id || tx.id;

      return [date, time, clientName, recipient, type, naira, aed, id].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    const clientName = clientFilter === 'All Clients' ? 'all_clients' : `client_${clientFilter}`;
    const filename = `finance_report_${clientName}_${timeFilter.replace(/\s+/g, '_').toLowerCase()}_${new Date().toISOString().slice(0, 10)}.csv`;

    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="animate-fade">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.4rem' }}>Financial Reports</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>Comprehensive analytics and performance insights.</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'flex-end', alignItems: 'center' }}>
          <div style={{ position: 'relative' }}>
            <select
              value={clientFilter}
              onChange={(e) => setClientFilter(e.target.value)}
              style={{ padding: '0.7rem 2.5rem 0.7rem 1rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'white', fontWeight: 600, fontSize: '0.9rem', appearance: 'none', cursor: 'pointer' }}
            >
              <option value="All Clients">All Clients</option>
              {clients.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <ChevronDown size={16} style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--text-muted)' }} />
          </div>

          <div style={{ position: 'relative' }}>
            <select
              value={timeFilter}
              onChange={(e) => setTimeFilter(e.target.value)}
              style={{ padding: '0.7rem 2.5rem 0.7rem 1rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'white', fontWeight: 600, fontSize: '0.9rem', appearance: 'none', cursor: 'pointer' }}
            >
              <option value="Last 30 Days">Last 30 Days</option>
              <option value="Last 90 Days">Last 90 Days</option>
              <option value="Year to Date">Year to Date</option>
              <option value="All Time">All Time</option>
              <option value="Custom Range">Custom Range</option>
            </select>
            <ChevronDown size={16} style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--text-muted)' }} />
          </div>

          {timeFilter === 'Custom Range' && (
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                style={{ padding: '0.7rem 1rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'white', fontWeight: 600, fontSize: '0.9rem' }}
              />
              <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>to</span>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                style={{ padding: '0.7rem 1rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'white', fontWeight: 600, fontSize: '0.9rem' }}
              />
            </div>
          )}

          <button
            className="btn-premium btn-primary-premium"
            style={{ borderRadius: '8px', padding: '0.7rem 1.2rem' }}
            onClick={handleExportReport}
          >
            <Download size={18} style={{ marginRight: '0.5rem', display: 'inline-block', verticalAlign: 'middle' }} />
            <span style={{ verticalAlign: 'middle' }}>Export Report</span>
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
        <div className="premium-card" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1.5rem' }}>Transaction Volume Trend</h3>
          <div style={{ height: '300px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="colorVolume" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--primary-color)" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="var(--primary-color)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} tickFormatter={(value) => `₦${value}M`} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: 'var(--shadow-lg)' }} />
                <Area type="monotone" dataKey="volume" stroke="var(--primary-color)" strokeWidth={3} fillOpacity={1} fill="url(#colorVolume)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="premium-card" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1.5rem' }}>Inflow vs Payout</h3>
          <div style={{ height: '300px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={comparisonData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} tickFormatter={(value) => `₦${value}M`} />
                <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: 'var(--shadow-lg)' }} />
                <Legend verticalAlign="bottom" align="center" iconType="circle" />
                <Bar dataKey="inflows" fill="#10b981" radius={[4, 4, 0, 0]} name="Inflows" barSize={10} />
                <Bar dataKey="payouts" fill="#ef4444" radius={[4, 4, 0, 0]} name="Payouts" barSize={10} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="table-container" style={{ border: '1px solid var(--border-color)', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-color)' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800 }}>Top Performing Clients</h3>
        </div>
        <table className="table-premium">
          <thead>
            <tr style={{ background: '#fcfcfd' }}>
              <th style={{ width: '80px' }}>Rank</th>
              <th>Client</th>
              <th style={{ textAlign: 'right' }}>Total Volume</th>
              <th style={{ textAlign: 'right' }}>Transactions</th>
              <th style={{ textAlign: 'right' }}>Avg. Transaction</th>
            </tr>
          </thead>
          <tbody>
            {topClients.map((client, index) => (
              <tr key={client.id} className="client-table-row">
                <td><div className={`rank-marker rank-marker-${index + 1}`}>{index + 1}</div></td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div className="client-table-avatar">{client.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)}</div>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{client.name}</div>
                  </div>
                </td>
                <td style={{ textAlign: 'right', fontWeight: 800 }}>₦ {client.totalVolume.toLocaleString()}</td>
                <td style={{ textAlign: 'right' }}>{client.txCount}</td>
                <td style={{ textAlign: 'right', fontWeight: 700 }}>₦ {(client.totalVolume / (client.txCount || 1)).toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};


const TransactionsContent = ({ allTransactions }) => {
  const [localSearch, setLocalSearch] = useState('');

  const filteredTransactions = allTransactions.filter(tx =>
    tx.client_name?.toLowerCase().includes(localSearch.toLowerCase()) ||
    tx.recipient?.toLowerCase().includes(localSearch.toLowerCase()) ||
    tx.description?.toLowerCase().includes(localSearch.toLowerCase())
  );

  return (
    <div className="animate-fade">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.4rem' }}>Transaction Ledger</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>Full history of all financial operations across the network.</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <div className="header-search" style={{ background: 'white', border: '1px solid var(--border-color)', width: '300px' }}>
            <Search size={18} color="var(--text-muted)" />
            <input
              type="text"
              placeholder="Search ledger..."
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
            />
          </div>
          <button className="btn-premium" style={{ border: '1px solid var(--border-color)', background: 'white', borderRadius: '8px' }}>
            <Filter size={18} /> Filters
          </button>
        </div>
      </div>

      <div className="table-container" style={{ border: '1px solid var(--border-color)', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
        <table className="table-premium">
          <thead>
            <tr style={{ background: '#fcfcfd' }}>
              <th>Date & Time</th>
              <th>Client / Counterparty</th>
              <th>Operation Type</th>
              <th style={{ textAlign: 'right' }}>Amount</th>
              <th style={{ textAlign: 'right' }}>Balance Effect (AED)</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredTransactions.map(tx => (
              <tr key={tx.id} className="client-table-row">
                <td>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{new Date(tx.date).toLocaleDateString()}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{new Date(tx.date).toLocaleTimeString()}</div>
                </td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div className="client-table-avatar" style={{ width: 32, height: 32, fontSize: '0.75rem' }}>
                      {tx.client_name ? tx.client_name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2) : '??'}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>{tx.client_name}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{tx.recipient || 'Main Vault'}</div>
                    </div>
                  </div>
                </td>
                <td>
                  <span className={`pill ${tx.type === 'IN' ? 'pill-inflow' : 'pill-payout'}`} style={{ fontSize: '0.65rem' }}>
                    {tx.type === 'IN' ? 'INFLOW' : 'PAYOUT'}
                  </span>
                </td>
                <td style={{ textAlign: 'right', fontWeight: 800 }}>
                  {tx.amount_naira ? `₦ ${tx.amount_naira.toLocaleString()}` : 'Direct AED'}
                </td>
                <td style={{ textAlign: 'right', fontWeight: 700 }} className={tx.type === 'IN' ? 'amount-inflow' : 'amount-payout'}>
                  {tx.type === 'IN' ? '+' : '-'}{tx.amount_aed.toLocaleString()} AED
                </td>
                <td style={{ textAlign: 'right' }}>
                  <MoreHorizontal size={18} className="action-dots" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const SettingsContent = ({ user, setUser }) => {
  const [profile, setProfile] = useState({
    email: '',
    full_name: '',
    department: 'Financial Operations' // default
  });
  const [isLoading, setIsLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null); // 'success' | 'error' | null

  useEffect(() => {
    // Fetch latest profile on mount
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(`${API_BASE}/user/profile`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setProfile({
          email: res.data.email || '',
          full_name: res.data.full_name || '',
          department: res.data.department || 'Financial Operations'
        });
      } catch (err) {
        console.error('Failed to fetch profile', err);
      }
    };
    fetchProfile();
  }, []);

  const handleSave = async () => {
    setIsLoading(true);
    setSaveStatus(null);
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API_BASE}/user/profile`, profile, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSaveStatus('success');

      // Update global user state with new data so header reflects it instantly if needed
      if (setUser && user) {
        setUser({ ...user, ...profile });
      }

      setTimeout(() => setSaveStatus(null), 3000);
    } catch (err) {
      console.error('Failed to save profile', err);
      setSaveStatus('error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="animate-fade">
      <div style={{ marginBottom: '2.5rem' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.4rem' }}>Account Settings</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>Manage your administrative profile and security preferences.</p>
      </div>

      <div className="settings-layout">
        <aside className="settings-nav-card">
          <div className="settings-nav-item active"><User size={18} /> General Profile</div>
          <div className="settings-nav-item" style={{ opacity: 0.5, cursor: 'not-allowed' }}><Shield size={18} /> Security & Auth</div>
          <div className="settings-nav-item" style={{ opacity: 0.5, cursor: 'not-allowed' }}><Bell size={18} /> Notifications</div>
          <div className="settings-nav-item" style={{ opacity: 0.5, cursor: 'not-allowed' }}><CreditCard size={18} /> Billing & Plan</div>
          <div className="settings-nav-item" style={{ color: 'var(--danger-color)', marginTop: '2rem', opacity: 0.5, cursor: 'not-allowed' }}><LogOut size={18} /> Deactivate Account</div>
        </aside>

        <div className="settings-content-card">
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '2rem' }}>Administrative Profile</h3>

          <div className="avatar-upload-section">
            <div className="user-avatar" style={{ width: 80, height: 80, borderRadius: '24px', background: '#f5f3ff' }}>
              <User size={40} color="var(--primary-color)" />
            </div>
            <div>
              <button className="btn-premium btn-primary-premium" style={{ fontSize: '0.85rem', padding: '0.5rem 1rem', marginBottom: '0.5rem' }}>Change Photograph</button>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Recommended size: 400x400px. JPG or PNG.</div>
            </div>
          </div>

          <div className="settings-form-row">
            <div className="input-group">
              <label>Admin Username</label>
              <input readOnly value={user?.username || ''} style={{ background: '#f8fafc' }} />
            </div>
            <div className="input-group">
              <label>Recovery Email</label>
              <input
                placeholder="admin@financebridge.com"
                value={profile.email}
                onChange={e => setProfile({ ...profile, email: e.target.value })}
              />
            </div>
          </div>

          <div className="settings-form-row">
            <div className="input-group">
              <label>Full Display Name</label>
              <input
                placeholder="Enter your full name"
                value={profile.full_name}
                onChange={e => setProfile({ ...profile, full_name: e.target.value })}
              />
            </div>
            <div className="input-group">
              <label>Department</label>
              <select value={profile.department} onChange={e => setProfile({ ...profile, department: e.target.value })}>
                <option>Financial Operations</option>
                <option>Risk Management</option>
                <option>Compliance</option>
                <option>IT & Engineering</option>
              </select>
            </div>
          </div>

          <div style={{ marginTop: '2rem', paddingTop: '2rem', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              {saveStatus === 'success' && <span style={{ color: 'var(--success-color)', fontSize: '0.85rem', fontWeight: 600 }}>Profile updated successfully!</span>}
              {saveStatus === 'error' && <span style={{ color: 'var(--danger-color)', fontSize: '0.85rem', fontWeight: 600 }}>Failed to update profile.</span>}
            </div>
            <button
              className="btn-premium btn-primary-premium"
              onClick={handleSave}
              disabled={isLoading}
            >
              {isLoading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};


const ClientsContent = ({
  clients,
  allTransactions,
  searchQuery,
  setSearchQuery,
  handleSelectClient,
  resetFormStates,
  setActiveModal,
  handleInitiateEdit,
  handleDeleteClient
}) => {
  const enrichedClients = clients.map(client => {
    const clientTx = allTransactions.filter(tx => tx.client_id === client.id);
    const volume = clientTx.reduce((sum, tx) => sum + (tx.amount_naira || 0), 0);
    const lastTx = clientTx[0];
    return {
      ...client,
      txCount: clientTx.length,
      totalVolume: volume,
      status: clientTx.length > 0 ? 'Active' : 'Pending',
      lastActive: lastTx ? new Date(lastTx.date) : null
    };
  });

  const activeCount = enrichedClients.filter(c => c.txCount > 0).length;
  const pendingCount = enrichedClients.filter(c => c.txCount === 0).length;

  const filteredClients = enrichedClients.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="animate-fade">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.4rem' }}>Client Management</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>Manage your client network and their transaction history.</p>
        </div>
        <button className="btn-premium btn-primary-premium" style={{ borderRadius: '8px', padding: '0.7rem 1.2rem' }} onClick={() => { resetFormStates(); setActiveModal('addClient'); }}>
          <Plus size={18} /> Add New Client
        </button>
      </div>

      <div className="stats-grid-premium" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: '2.5rem' }}>
        <div className="premium-card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1rem' }}>
            <div style={{ width: 40, height: 40, borderRadius: '10px', background: '#f5f3ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary-color)' }}>
              <Users size={20} />
            </div>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>Total Clients</span>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800 }}>{clients.length}</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--success-color)', fontWeight: 600, marginTop: '0.5rem' }}>
            <TrendingUp size={14} /> Live network size
          </div>
        </div>

        <div className="premium-card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1rem' }}>
            <div style={{ width: 40, height: 40, borderRadius: '10px', background: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--success-color)' }}>
              <UserCheck size={20} />
            </div>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>Active Clients</span>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800 }}>{activeCount}</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>Transacting users</div>
        </div>

        <div className="premium-card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1rem' }}>
            <div style={{ width: 40, height: 40, borderRadius: '10px', background: '#fff7ed', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--warning-color)' }}>
              <Clock size={20} />
            </div>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>Initial Onboarding</span>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800 }}>{pendingCount}</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--warning-color)', marginTop: '0.5rem' }}>Awaiting first transaction</div>
        </div>
      </div>

      <div className="table-container" style={{ border: '1px solid var(--border-color)', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
        <div style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>All Clients</h3>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <div style={{ position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="Search clients..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ padding: '0.5rem 0.75rem 0.5rem 2.25rem', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '0.85rem', width: '240px' }}
              />
            </div>
            <button style={{ padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: '#f8fafc', color: 'var(--text-muted)', cursor: 'pointer' }}>
              <Filter size={18} />
            </button>
          </div>
        </div>

        <table className="table-premium" style={{ borderTop: '1px solid var(--border-color)' }}>
          <thead>
            <tr style={{ background: '#fcfcfd' }}>
              <th>Client</th>
              <th>Status</th>
              <th>Total Transactions</th>
              <th>Total Volume (NGN)</th>
              <th>Last Activity</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredClients.map(client => (
              <tr key={client.id} className="client-table-row">
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div className="client-table-avatar">
                      {client.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{client.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>ID: #CL-{client.id.toString().padStart(4, '0')}</div>
                    </div>
                  </div>
                </td>
                <td>
                  <span className={`pill ${client.status === 'Active' ? 'pill-active' : 'pill-pending'}`}>
                    {client.status}
                  </span>
                </td>
                <td style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>{client.txCount} transactions</td>
                <td style={{ fontWeight: 800, fontSize: '0.9rem' }}>₦ {client.totalVolume.toLocaleString()}</td>
                <td style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                  {client.lastActive ? `${Math.floor((new Date() - client.lastActive) / (1000 * 60 * 60 * 24))} days ago` : 'Never'}
                </td>
                <td style={{ textAlign: 'right' }}>
                  <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', alignItems: 'center' }}>
                    <span className="view-details-link" onClick={() => handleSelectClient(client)} style={{ fontSize: '0.85rem' }}>View Details</span>
                    <button
                      onClick={() => handleInitiateEdit(client)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary-color)', display: 'flex', padding: '4px', borderRadius: '4px' }}
                      title="Edit Client"
                      className="hover-bg"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => handleDeleteClient(client.id)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', display: 'flex', padding: '4px', borderRadius: '4px' }}
                      title="Delete Client"
                      className="hover-bg-red"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default App;
