import React, { useState, useEffect, useContext } from 'react';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';
import BarChart from '../components/BarChart';
import ThemeToggle from '../components/ThemeToggle';
import PartySymbol from '../components/PartySymbol';
import { DEFAULT_PARTY_SYMBOL, PARTY_SYMBOL_OPTIONS, getPartySymbol } from '../utils/partySymbols';

const SymbolPicker = ({ value, onChange }) => (
    <div
        style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
            gap: '8px'
        }}
    >
        {PARTY_SYMBOL_OPTIONS.map(opt => {
            const selected = value === opt.id;

            return (
                <button
                    key={opt.id}
                    type="button"
                    onClick={() => onChange(opt.id)}
                    title={opt.label}
                    aria-pressed={selected}
                    style={{
                        height: '54px',
                        borderRadius: '8px',
                        border: selected ? '2px solid #818cf8' : '1px solid rgba(255,255,255,0.14)',
                        background: selected ? 'rgba(129,140,248,0.18)' : 'rgba(255,255,255,0.04)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        padding: 0
                    }}
                >
                    <PartySymbol symbol={opt.id} size={36} />
                </button>
            );
        })}
    </div>
);

const AdminDashboard = () => {
    const { logout } = useContext(AuthContext);

    const [candidates, setCandidates] = useState([]);
    const [elections, setElections] = useState([]);
    const [analytics, setAnalytics] = useState(null);
    const [activeTab, setActiveTab] = useState('candidates');
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState(null);
    const [resultElection, setResultElection] = useState(null);
    const [resultData, setResultData] = useState(null);

    const [newCandidate, setNewCandidate] = useState({
        name: '',
        party: '',
        age: '',
        electionId: '',
        manifesto: '',
        symbol: DEFAULT_PARTY_SYMBOL
    });
    const [newElection, setNewElection] = useState({ title: '', description: '', startDate: '', endDate: '' });

    const showToast = (msg, type = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3500);
    };

    const fetchData = async () => {
        setLoading(true);
        try {
            const [candRes, elecRes, analyticRes] = await Promise.all([
                api.get('/candidate'),
                api.get('/election'),
                api.get('/election/analytics/dashboard')
            ]);
            setCandidates(candRes.data.data || []);
            setElections(elecRes.data.data || []);
            setAnalytics(analyticRes.data.data || null);

            // Set default election for new candidate form
            const fetchedElections = elecRes.data.data || [];
            if (fetchedElections.length > 0 && !newCandidate.electionId) {
                setNewCandidate(prev => ({ ...prev, electionId: fetchedElections[0]._id }));
            }
        } catch (err) {
            showToast('Failed to load data', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    // --- Candidate Actions ---
    const handleAddCandidate = async (e) => {
        e.preventDefault();
        try {
            const isNota = newCandidate.name.trim().toUpperCase() === 'NOTA';
            await api.post('/candidate', {
                ...newCandidate,
                age: isNota ? 0 : Number(newCandidate.age)
            });
            setNewCandidate({
                name: '',
                party: '',
                age: '',
                electionId: elections[0]?._id || '',
                manifesto: '',
                symbol: DEFAULT_PARTY_SYMBOL
            });
            showToast(`✅ ${newCandidate.name} added as a candidate!`);
            fetchData();
        } catch (err) {
            showToast(err.response?.data?.error || err.response?.data?.errors?.[0]?.msg || 'Failed to add candidate', 'error');
        }
    };

    const handleApproveCandidate = async (id, name) => {
        try {
            await api.put(`/candidate/approve/${id}`);
            showToast(`Candidate "${name}" approved successfully.`);
            fetchData();
        } catch (err) {
            showToast('Failed to approve candidate', 'error');
        }
    };

    const handleRejectCandidate = async (id, name) => {
        try {
            await api.put(`/candidate/reject/${id}`);
            showToast(`Candidate "${name}" request rejected.`);
            fetchData();
        } catch (err) {
            showToast('Failed to reject candidate', 'error');
        }
    };

    const handleDeleteCandidate = async (id, name) => {
        if (!window.confirm(`Delete candidate "${name}"? This cannot be undone.`)) return;
        try {
            await api.delete(`/candidate/${id}`);
            showToast(`Candidate "${name}" deleted.`);
            fetchData();
        } catch (err) {
            showToast('Failed to delete candidate', 'error');
        }
    };

    // --- Election Actions ---
    const handleCreateElection = async (e) => {
        e.preventDefault();
        if (new Date(newElection.startDate) >= new Date(newElection.endDate)) {
            showToast('Election End Date must be after the Start Date.', 'error');
            return;
        }
        try {
            await api.post('/election', newElection);
            setNewElection({ title: '', description: '', startDate: '', endDate: '' });
            showToast(`✅ Election "${newElection.title}" created!`);
            fetchData();
        } catch (err) {
            showToast(err.response?.data?.error || 'Failed to create election', 'error');
        }
    };

    const handleUpdateStatus = async (id, status, title) => {
        try {
            await api.put(`/election/${id}`, { status });
            showToast(`Election "${title}" is now ${status}.`);
            fetchData();
        } catch (err) {
            showToast('Failed to update status', 'error');
        }
    };

    const handleFinishElection = async (id, title) => {
        if (!window.confirm(`Finish election "${title}"? Voting will be closed.`)) return;

        try {
            await api.put(`/election/${id}/finish`);
            showToast(`Election "${title}" finished.`);
            setResultElection(null);
            setResultData(null);
            fetchData();
        } catch (err) {
            showToast(err.response?.data?.error || 'Failed to finish election', 'error');
        }
    };

    const handleViewResults = async (election) => {
        try {
            const res = await api.get(`/election/${election._id}/results`);
            setResultElection(election);
            setResultData(res.data.data);
        } catch (err) {
            showToast(err.response?.data?.error || 'Failed to load results', 'error');
        }
    };

    const handleDeleteElection = async (id, title) => {
        if (!window.confirm(`Delete election "${title}"?`)) return;
        try {
            await api.delete(`/election/${id}`);
            showToast(`Election deleted.`);
            fetchData();
        } catch (err) {
            showToast('Failed to delete election', 'error');
        }
    };

    const totalVotes = candidates.reduce((sum, c) => sum + (c.voteCount || 0), 0);

    const approvedCandidates = candidates.filter(c => c.status === 'approved');
    const pendingCandidates = candidates.filter(c => c.status === 'pending');
    const selectedSymbol = getPartySymbol(newCandidate.symbol);

    return (
        <div className="gradient-bg" style={{ minHeight: '100vh', position: 'relative', zIndex: 1 }}>
            {toast && <div className={`toast toast-${toast.type}`}>{toast.msg}</div>}

            {/* Topbar */}
            <div className="topbar">
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '24px' }}>🛡️</span>
                    <div>
                        <div style={{ fontWeight: '700', fontSize: '16px' }}>Enterprise Voting</div>
                        <div style={{ fontSize: '12px', color: '#6b7280' }}>Admin Control Panel</div>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <span className="badge badge-admin">Admin</span>
                    <ThemeToggle />
                    <button onClick={logout} className="btn btn-danger" style={{ padding: '8px 16px', fontSize: '13px' }}>
                        Logout
                    </button>
                </div>
            </div>

            <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '30px 20px', position: 'relative', zIndex: 2 }}>

                {/* Stats */}
                {analytics && (
                    <div className="stats-grid" style={{ marginBottom: '28px', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))' }}>
                        <div className="stat-card">
                            <div className="stat-value">{analytics.totalVoters || 0}</div>
                            <div className="stat-label">Voters</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-value">{analytics.totalVotesCast || 0}</div>
                            <div className="stat-label">Votes Cast</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-value">{analytics.voterTurnoutPercentage || 0}%</div>
                            <div className="stat-label">Turnout</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-value" style={{ color: '#fbbf24' }}>{analytics.pendingCandidatesCount || 0}</div>
                            <div className="stat-label">Pending Requests</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-value">{analytics.activeElectionsCount || 0}</div>
                            <div className="stat-label">Active Elections</div>
                        </div>
                    </div>
                )}

                {/* Chart */}
                <div className="glass-card" style={{ marginBottom: '28px', padding: '24px' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#a5b4fc', marginBottom: '16px' }}>Approved Candidate Live Tallies</h3>
                    <BarChart candidates={approvedCandidates} />
                </div>

                {/* Tabs */}
                <div style={{ display: 'flex', gap: '10px', marginBottom: '24px' }}>
                    {[
                        { key: 'candidates', label: '👤 Candidates & Requests' },
                        { key: 'elections', label: '🗳️ Elections Portal' }
                    ].map(tab => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            className={`tab-btn ${activeTab === tab.key ? 'active' : ''}`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {loading ? (
                    <div style={{ textAlign: 'center', padding: '60px', color: '#6b7280' }}>Loading panel parameters...</div>
                ) : (
                    <>
                        {/* ===== CANDIDATES TAB ===== */}
                        {activeTab === 'candidates' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

                                {/* Pending Candidate Requests Queue */}
                                <div className="glass-card" style={{ overflow: 'hidden', border: '1px solid rgba(245,158,11,0.2)' }}>
                                    <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.08)', background: 'rgba(245,158,11,0.02)' }}>
                                        <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#fbbf24' }}>📥 Candidate Application Queue</h3>
                                    </div>
                                    {pendingCandidates.length === 0 ? (
                                        <div style={{ padding: '32px', textAlign: 'center', color: '#6b7280', fontSize: '13px' }}>
                                            No pending candidate approvals.
                                        </div>
                                    ) : (
                                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                            <thead>
                                                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                                                    {['Symbol', 'Name', 'Party', 'Age', 'Manifesto', 'Actions'].map(h => (
                                                        <th key={h} style={{ padding: '12px 20px', textAlign: 'left', fontSize: '11px', color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{h}</th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {pendingCandidates.map(c => (
                                                    <tr key={c._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                                                        <td style={{ padding: '14px 20px' }}>
                                                            <PartySymbol symbol={c.symbol} size={34} />
                                                        </td>
                                                        <td style={{ padding: '14px 20px', fontWeight: '600', fontSize: '14px' }}>{c.name}</td>
                                                        <td style={{ padding: '14px 20px', color: '#9ca3af', fontSize: '14px' }}>{c.party}</td>
                                                        <td style={{ padding: '14px 20px', color: '#9ca3af', fontSize: '14px' }}>{c.age}</td>
                                                        <td style={{ padding: '14px 20px', color: '#6b7280', fontSize: '13px', maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.manifesto}</td>
                                                        <td style={{ padding: '14px 20px', display: 'flex', gap: '8px' }}>
                                                            <button onClick={() => handleApproveCandidate(c._id, c.name)} className="btn btn-success" style={{ padding: '6px 12px', fontSize: '12px' }}>🟢 Approve</button>
                                                            <button onClick={() => handleRejectCandidate(c._id, c.name)} className="btn btn-danger" style={{ padding: '6px 12px', fontSize: '12px' }}>🔴 Reject</button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    )}
                                </div>

                                {/* Add Candidate Form */}
                                <div className="glass-card" style={{ padding: '28px' }}>
                                    <h2 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '20px', color: '#a5b4fc' }}>
                                        ➕ Register Candidate on Behalf of Voter
                                    </h2>
                                    <form onSubmit={handleAddCandidate}>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 120px', gap: '14px', marginBottom: '14px' }}>
                                            <div className="form-group">
                                                <label className="form-label">Full Name</label>
                                                <input className="form-input" placeholder="Candidate name" value={newCandidate.name} onChange={e => setNewCandidate({ ...newCandidate, name: e.target.value })} required />
                                            </div>
                                            <div className="form-group">
                                                <label className="form-label">Party</label>
                                                <input className="form-input" placeholder="Party name" value={newCandidate.party} onChange={e => setNewCandidate({ ...newCandidate, party: e.target.value })} required />
                                            </div>
                                            <div className="form-group">
                                                <label className="form-label">{newCandidate.name.trim().toUpperCase() === 'NOTA' ? 'Age' : 'Age (25+)'}</label>
                                                <input
                                                    className="form-input"
                                                    type="number"
                                                    min={newCandidate.name.trim().toUpperCase() === 'NOTA' ? '0' : '25'}
                                                    placeholder={newCandidate.name.trim().toUpperCase() === 'NOTA' ? 'N/A' : 'Age'}
                                                    value={newCandidate.name.trim().toUpperCase() === 'NOTA' ? '' : newCandidate.age}
                                                    onChange={e => setNewCandidate({ ...newCandidate, age: e.target.value })}
                                                    disabled={newCandidate.name.trim().toUpperCase() === 'NOTA'}
                                                    required={newCandidate.name.trim().toUpperCase() !== 'NOTA'}
                                                />
                                            </div>
                                        </div>

                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 220px 110px', gap: '14px', marginBottom: '14px' }}>
                                            <div className="form-group">
                                                <label className="form-label">Associated Election</label>
                                                <select
                                                    className="form-input"
                                                    value={newCandidate.electionId}
                                                    onChange={e => setNewCandidate({ ...newCandidate, electionId: e.target.value })}
                                                    required
                                                >
                                                    <option value="" disabled>-- Select Election --</option>
                                                    {elections.map(e => (
                                                        <option key={e._id} value={e._id}>{e.title}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div className="form-group">
                                                <label className="form-label">Symbol</label>
                                                <SymbolPicker
                                                    value={newCandidate.symbol}
                                                    onChange={symbol => setNewCandidate({ ...newCandidate, symbol })}
                                                />
                                                <div style={{ marginTop: '8px', fontSize: '12px', color: '#9ca3af' }}>
                                                    <PartySymbol symbol={selectedSymbol.id} size={32} showLabel />
                                                </div>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                                                <button type="submit" className="btn btn-primary btn-full" style={{ height: '42px' }}>Submit</button>
                                            </div>
                                        </div>
                                        <div className="form-group" style={{ marginBottom: '14px' }}>
                                            <label className="form-label">Manifesto / Agenda</label>
                                            <textarea className="form-input" placeholder="Agenda of candidate..." rows="2" value={newCandidate.manifesto} onChange={e => setNewCandidate({ ...newCandidate, manifesto: e.target.value })} required />
                                        </div>
                                    </form>
                                </div>

                                {/* Approved Candidate Table */}
                                <div className="glass-card" style={{ overflow: 'hidden' }}>
                                    <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                                        <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#a5b4fc' }}>Approved Candidates</h3>
                                    </div>
                                    {approvedCandidates.length === 0 ? (
                                        <div style={{ padding: '48px', textAlign: 'center', color: '#4b5563' }}>
                                            No candidates approved yet. Approve some from the approval queue above!
                                        </div>
                                    ) : (
                                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                            <thead>
                                                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                                                    {['Symbol', 'Name', 'Party', 'Age', 'Votes', 'Action'].map(h => (
                                                        <th key={h} style={{ padding: '12px 20px', textAlign: 'left', fontSize: '11px', color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{h}</th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {approvedCandidates.map((c, i) => (
                                                    <tr key={c._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                                                        <td style={{ padding: '14px 20px' }}>
                                                            <PartySymbol symbol={c.symbol} size={34} />
                                                        </td>
                                                        <td style={{ padding: '14px 20px', fontWeight: '600', fontSize: '14px' }}>{c.name}</td>
                                                        <td style={{ padding: '14px 20px', color: '#9ca3af', fontSize: '14px' }}>{c.party}</td>
                                                        <td style={{ padding: '14px 20px', color: '#9ca3af', fontSize: '14px' }}>{c.age}</td>
                                                        <td style={{ padding: '14px 20px' }}>
                                                            <span style={{ fontWeight: '800', fontSize: '16px', background: 'linear-gradient(135deg, #a5b4fc, #818cf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                                                                {c.voteCount || 0}
                                                            </span>
                                                        </td>
                                                        <td style={{ padding: '14px 20px' }}>
                                                            <button
                                                                onClick={() => handleDeleteCandidate(c._id, c.name)}
                                                                className="btn btn-danger"
                                                                style={{ padding: '7px 14px', fontSize: '12px' }}
                                                            >
                                                                🗑 Delete
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* ===== ELECTIONS TAB ===== */}
                        {activeTab === 'elections' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                {/* Create Election Form */}
                                <div className="glass-card" style={{ padding: '28px' }}>
                                    <h2 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '20px', color: '#a5b4fc' }}>
                                        ➕ Create New Election
                                    </h2>
                                    <form onSubmit={handleCreateElection}>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                                            <div className="form-group">
                                                <label className="form-label">Title</label>
                                                <input className="form-input" placeholder="Election title" value={newElection.title} onChange={e => setNewElection({ ...newElection, title: e.target.value })} required />
                                            </div>
                                            <div className="form-group">
                                                <label className="form-label">Description (Optional)</label>
                                                <input className="form-input" placeholder="Brief description" value={newElection.description} onChange={e => setNewElection({ ...newElection, description: e.target.value })} />
                                            </div>
                                            <div className="form-group">
                                                <label className="form-label">Start Date & Time</label>
                                                <input className="form-input" type="datetime-local" value={newElection.startDate} onChange={e => setNewElection({ ...newElection, startDate: e.target.value })} required />
                                            </div>
                                            <div className="form-group">
                                                <label className="form-label">End Date & Time</label>
                                                <input className="form-input" type="datetime-local" value={newElection.endDate} onChange={e => setNewElection({ ...newElection, endDate: e.target.value })} required />
                                            </div>
                                        </div>
                                        <button type="submit" className="btn btn-primary">Create Election</button>
                                    </form>
                                </div>

                                {resultElection && (
                                    <div className="glass-card" style={{ padding: '28px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', marginBottom: '18px', flexWrap: 'wrap' }}>
                                            <div>
                                                <h2 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '6px', color: '#a5b4fc' }}>
                                                    Result Breakdown: {resultElection.title}
                                                </h2>
                                                <p style={{ color: '#9ca3af', fontSize: '13px' }}>
                                                    Total Turnout: <strong>{resultData?.voterTurnoutPercentage || 0}%</strong> ({resultData?.totalVotes || 0} out of {resultData?.totalRegisteredVoters || 0} voters)
                                                </p>
                                            </div>
                                            <button
                                                onClick={() => setResultElection(null)}
                                                className="btn btn-ghost"
                                                style={{ padding: '8px 14px', fontSize: '13px' }}
                                            >
                                                Close
                                            </button>
                                        </div>

                                        {!resultData || resultData.results.length === 0 ? (
                                            <div style={{ padding: '32px', textAlign: 'center', color: '#6b7280' }}>
                                                No candidates available for this result.
                                            </div>
                                        ) : (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                                {resultData.isTie ? (
                                                    <div style={{ padding: '16px', borderRadius: '12px', background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.28)', marginBottom: '8px' }}>
                                                        <div style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#fbbf24', marginBottom: '4px' }}>Tie Event</div>
                                                        <div style={{ fontSize: '18px', fontWeight: '800' }}>
                                                            {resultData.winners.map(candidate => candidate.name).join(', ')}
                                                        </div>
                                                        <div style={{ color: '#9ca3af', fontSize: '13px' }}>{resultData.winners[0]?.votes || 0} votes each</div>
                                                    </div>
                                                ) : resultData.winners[0] && (
                                                    <div style={{ padding: '16px', borderRadius: '12px', background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.28)', marginBottom: '8px' }}>
                                                        <div style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#34d399', marginBottom: '4px' }}>Elected Candidate</div>
                                                        <div style={{ fontSize: '18px', fontWeight: '800' }}>{resultData.winners[0].name} ({resultData.winners[0].party})</div>
                                                        <div style={{ color: '#9ca3af', fontSize: '13px' }}>Highest Tally: {resultData.winners[0].votes} votes ({resultData.results[0]?.percentage.toFixed(2)}% share)</div>
                                                    </div>
                                                )}

                                                {resultData.results.map((candidate, index) => (
                                                    <div key={candidate.candidateId} style={{ display: 'grid', gridTemplateColumns: '48px 1fr 90px', gap: '14px', alignItems: 'center', padding: '14px 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                                                        <div style={{ color: '#a5b4fc', fontWeight: '800' }}>#{index + 1}</div>
                                                        <div>
                                                            <div style={{ fontWeight: '700', marginBottom: '4px' }}>
                                                                {candidate.name}
                                                                {candidate.isWinner && (
                                                                    <span className="badge badge-active" style={{ fontSize: '10px', marginLeft: '8px' }}>
                                                                        {resultData.isTie ? 'Tie' : 'Winner'}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <div style={{ color: '#6b7280', fontSize: '13px', marginBottom: '8px' }}>{candidate.party}</div>
                                                            <div className="progress-bar">
                                                                <div className="progress-fill" style={{ width: `${candidate.percentage}%` }}></div>
                                                            </div>
                                                        </div>
                                                        <div style={{ textAlign: 'right' }}>
                                                            <div style={{ fontSize: '20px', fontWeight: '800', color: '#a5b4fc' }}>{candidate.votes}</div>
                                                            <div style={{ color: '#6b7280', fontSize: '12px' }}>{candidate.percentage.toFixed(2)}%</div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Elections List */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                                    {elections.length === 0 && (
                                        <div className="glass-card" style={{ padding: '48px', textAlign: 'center', color: '#4b5563' }}>
                                            No elections yet. Create your first one above!
                                        </div>
                                    )}
                                    {elections.map(election => (
                                        <div key={election._id} className="glass-card" style={{ padding: '22px 26px' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
                                                <div>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                                                        <h3 style={{ fontSize: '16px', fontWeight: '700' }}>{election.title}</h3>
                                                        <span className={`badge badge-${election.status}`}>{election.status}</span>
                                                    </div>
                                                    {election.description && (
                                                        <p style={{ color: '#6b7280', fontSize: '13px', marginBottom: '8px' }}>{election.description}</p>
                                                    )}
                                                    <p style={{ fontSize: '12px', color: '#4b5563' }}>
                                                        📅 {new Date(election.startDate).toLocaleString()} → {new Date(election.endDate).toLocaleString()}
                                                    </p>
                                                </div>
                                                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                                    {election.status === 'upcoming' && (
                                                        <button
                                                            onClick={() => handleUpdateStatus(election._id, 'active', election.title)}
                                                            className="btn btn-success"
                                                            style={{ padding: '8px 16px', fontSize: '13px' }}
                                                        >
                                                            ▶ Activate
                                                        </button>
                                                    )}
                                                    {election.status === 'active' && (
                                                        <button
                                                            onClick={() => handleFinishElection(election._id, election.title)}
                                                            className="btn btn-danger"
                                                            style={{ padding: '8px 16px', fontSize: '13px' }}
                                                        >
                                                            ⏹ Finish Election
                                                        </button>
                                                    )}
                                                    {election.status === 'completed' && (
                                                        <button
                                                            onClick={() => handleViewResults(election)}
                                                            className="btn btn-success"
                                                            style={{ padding: '8px 16px', fontSize: '13px' }}
                                                        >
                                                            📈 View Results
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => handleDeleteElection(election._id, election.title)}
                                                        className="btn btn-danger"
                                                        style={{ padding: '8px 16px', fontSize: '13px' }}
                                                    >
                                                        🗑 Delete
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default AdminDashboard;
