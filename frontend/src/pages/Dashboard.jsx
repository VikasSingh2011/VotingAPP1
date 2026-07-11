import React, { useEffect, useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import { io } from 'socket.io-client';
import ThemeToggle from '../components/ThemeToggle';
import PartySymbol from '../components/PartySymbol';

const socket = io('/', {
    withCredentials: true,
    autoConnect: false
});

const VoterDashboard = () => {
    const { user, logout } = useContext(AuthContext);
    const [candidates, setCandidates] = useState([]);
    const [elections, setElections] = useState([]);
    const [selectedElectionId, setSelectedElectionId] = useState('');
    const [votedElectionIds, setVotedElectionIds] = useState(user?.votedElectionIds || []);
    const [electionResults, setElectionResults] = useState(null);
    const [loading, setLoading] = useState(true);
    const [candidatesLoading, setCandidatesLoading] = useState(false);
    const [votingFor, setVotingFor] = useState(null);
    const [toast, setToast] = useState(null);

    const showToast = (msg, type = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3000);
    };

    // Load elections on mount
    useEffect(() => {
        socket.connect();

        const fetchElections = async () => {
            try {
                const [elecRes, profileRes] = await Promise.all([
                    api.get('/election'),
                    api.get('/user/profile')
                ]);
                const fetchedElections = elecRes.data.data || [];
                setElections(fetchedElections);
                setVotedElectionIds(profileRes.data.user?.votedElectionIds || []);
                
                // Select first active or first available election
                const active = fetchedElections.find(e => e.status === 'active');
                if (active) {
                    setSelectedElectionId(active._id);
                } else if (fetchedElections.length > 0) {
                    setSelectedElectionId(fetchedElections[0]._id);
                }
            } catch (err) {
                showToast('Failed to fetch elections', 'error');
            } finally {
                setLoading(false);
            }
        };

        fetchElections();

        return () => {
            socket.disconnect();
        };
    }, []);

    // Load candidates and details whenever selectedElectionId changes
    useEffect(() => {
        if (!selectedElectionId) return;
        fetchElectionDetails(selectedElectionId);
    }, [selectedElectionId, elections]);

    // Real-time vote updates via websocket
    useEffect(() => {
        if (!selectedElectionId) return;

        const handleVoteUpdate = ({ electionId, voteRecord }) => {
            if (electionId === selectedElectionId) {
                const selElection = elections.find(e => e._id === selectedElectionId);
                if (selElection && selElection.status === 'completed') {
                    fetchElectionDetails(selectedElectionId);
                }
            }
        };

        socket.on('voteUpdate', handleVoteUpdate);

        return () => {
            socket.off('voteUpdate', handleVoteUpdate);
        };
    }, [selectedElectionId, elections]);

    const fetchElectionDetails = async (electionId) => {
        setCandidatesLoading(true);
        try {
            const currentElection = elections.find(e => e._id === electionId);
            if (!currentElection) return;

            // Fetch approved candidates for this election
            const candRes = await api.get(`/candidate?electionId=${electionId}&approvedOnly=true`);
            setCandidates(candRes.data.data || []);

            // If completed, fetch full analytics and winner details
            if (currentElection.status === 'completed') {
                const resultsRes = await api.get(`/election/${electionId}/results`);
                setElectionResults(resultsRes.data.data);
            } else {
                setElectionResults(null);
            }
        } catch (err) {
            showToast('Failed to load election details', 'error');
        } finally {
            setCandidatesLoading(false);
        }
    };

    const handleVote = async (candidateId, candidateName) => {
        const hasVotedThisElection = votedElectionIds.includes(selectedElectionId);
        if (hasVotedThisElection) {
            showToast('You have already cast a vote in this election', 'error');
            return;
        }

        if (!window.confirm(`Cast your vote for ${candidateName}? This action cannot be undone.`)) return;
        setVotingFor(candidateId);
        try {
            await api.post(`/candidate/vote/${candidateId}`);
            setVotedElectionIds(prev => [...prev, selectedElectionId]);
            showToast(`✅ Your vote for ${candidateName} has been recorded!`);
            // Refetch details
            fetchElectionDetails(selectedElectionId);
        } catch (err) {
            showToast(err.response?.data?.error || 'Failed to cast vote', 'error');
        } finally {
            setVotingFor(null);
        }
    };

    const selectedElection = elections.find(e => e._id === selectedElectionId);
    const hasVotedSelected = votedElectionIds.includes(selectedElectionId);
    const totalVotes = candidates.reduce((sum, c) => sum + (c.voteCount || 0), 0);

    if (loading) return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
            <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '48px', marginBottom: '12px' }}>🗳️</div>
                <p style={{ color: '#6b7280' }}>Loading voting dashboard...</p>
            </div>
        </div>
    );

    return (
        <div className="gradient-bg" style={{ minHeight: '100vh', position: 'relative', zIndex: 1 }}>
            {toast && <div className={`toast toast-${toast.type}`}>{toast.msg}</div>}

            {/* Topbar */}
            <div className="topbar">
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '24px' }}>🗳️</span>
                    <div>
                        <div style={{ fontWeight: '700', fontSize: '16px' }}>Enterprise Voting</div>
                        <div style={{ fontSize: '12px', color: '#6b7280' }}>Secure Voter Portal</div>
                    </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span className="badge badge-voter">Voter</span>
                    <span style={{
                        padding: '4px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: '700',
                        background: hasVotedSelected ? 'rgba(16,185,129,0.2)' : 'rgba(245,158,11,0.2)',
                        color: hasVotedSelected ? '#34d399' : '#fbbf24',
                        border: `1px solid ${hasVotedSelected ? 'rgba(16,185,129,0.3)' : 'rgba(245,158,11,0.3)'}`
                    }}>
                        {hasVotedSelected ? '✅ Voted in this Election' : '⏳ Action Required'}
                    </span>
                    <ThemeToggle />
                    <button onClick={logout} className="btn btn-danger" style={{ padding: '8px 16px', fontSize: '13px' }}>
                        Logout
                    </button>
                </div>
            </div>

            <div style={{ maxWidth: '900px', margin: '0 auto', padding: '30px 20px', position: 'relative', zIndex: 2 }}>
                {/* Election Selector & Header */}
                <div className="glass-card" style={{ padding: '24px', marginBottom: '24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                        <div>
                            <h2 style={{ fontSize: '22px', fontWeight: '700', marginBottom: '4px' }}>
                                Welcome back, {user?.name} 👋
                            </h2>
                            <p style={{ color: '#9ca3af', fontSize: '14px' }}>
                                Select an election to cast your vote or view results.
                            </p>
                        </div>
                        <div className="form-group" style={{ margin: 0, minWidth: '240px' }}>
                            <label className="form-label">Active & Completed Elections</label>
                            <select 
                                className="form-input" 
                                value={selectedElectionId} 
                                onChange={e => setSelectedElectionId(e.target.value)}
                                style={{ background: '#111827', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' }}
                            >
                                <option value="" disabled>-- Choose Election --</option>
                                {elections.map(e => (
                                    <option key={e._id} value={e._id}>
                                        {e.title} ({e.status.toUpperCase()})
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {selectedElection ? (
                    <>
                        {/* Election Status Banner */}
                        <div className="glass-card" style={{ 
                            padding: '20px', 
                            marginBottom: '24px', 
                            borderLeft: `4px solid ${
                                selectedElection.status === 'active' ? '#10b981' : 
                                selectedElection.status === 'completed' ? '#3b82f6' : '#f59e0b'
                            }`
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                                <div>
                                    <span style={{ 
                                        padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '700', marginRight: '8px',
                                        background: selectedElection.status === 'active' ? 'rgba(16,185,129,0.2)' : 'rgba(59,130,246,0.2)',
                                        color: selectedElection.status === 'active' ? '#34d399' : '#60a5fa'
                                    }}>
                                        {selectedElection.status.toUpperCase()}
                                    </span>
                                    <strong style={{ fontSize: '16px' }}>{selectedElection.title}</strong>
                                    <p style={{ color: '#9ca3af', fontSize: '13px', margin: '4px 0 0' }}>{selectedElection.description}</p>
                                </div>
                                <div style={{ fontSize: '13px', color: '#9ca3af', textAlign: 'right' }}>
                                    <div>📅 Starts: {new Date(selectedElection.startDate).toLocaleDateString()}</div>
                                    <div>📅 Ends: {new Date(selectedElection.endDate).toLocaleDateString()}</div>
                                </div>
                            </div>
                        </div>

                        {/* Completed Election Analytics */}
                        {selectedElection.status === 'completed' && electionResults && (
                            <div className="glass-card" style={{ padding: '24px', marginBottom: '24px', background: 'rgba(59,130,246,0.05)', border: '1px solid rgba(59,130,246,0.1)' }}>
                                <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#60a5fa', marginBottom: '16px' }}>🏆 Election Winner & Turnout Analytics</h3>
                                <div className="stats-grid" style={{ marginBottom: '20px' }}>
                                    <div className="stat-card" style={{ background: 'rgba(0,0,0,0.2)' }}>
                                        <div className="stat-value" style={{ color: '#60a5fa' }}>{electionResults.winners?.map(w => w.name).join(', ') || 'None'}</div>
                                        <div className="stat-label">Winner ({electionResults.winners?.map(w => w.party).join(', ')})</div>
                                    </div>
                                    <div className="stat-card" style={{ background: 'rgba(0,0,0,0.2)' }}>
                                        <div className="stat-value">{electionResults.totalVotes}</div>
                                        <div className="stat-label">Total Votes Cast</div>
                                    </div>
                                    <div className="stat-card" style={{ background: 'rgba(0,0,0,0.2)' }}>
                                        <div className="stat-value">{electionResults.voterTurnoutPercentage}%</div>
                                        <div className="stat-label">Voter Turnout</div>
                                    </div>
                                </div>
                                {electionResults.runnerUp && (
                                    <div style={{ fontSize: '14px', color: '#9ca3af', padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                        🥈 <strong>Runner-Up:</strong> {electionResults.runnerUp.name} ({electionResults.runnerUp.party}) with <strong>{electionResults.runnerUp.votes} votes</strong>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Candidates List / Voting Area */}
                        <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            👥 Candidates in this Election
                        </h3>

                        {candidatesLoading ? (
                            <p style={{ color: '#9ca3af', textAlign: 'center' }}>Loading candidates...</p>
                        ) : candidates.length === 0 ? (
                            <div className="glass-card" style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>
                                No approved candidates found for this election.
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {candidates.map((candidate, index) => {
                                    const showResults = selectedElection.status === 'completed' && electionResults;
                                    const votePercent = showResults && electionResults.totalVotes > 0 
                                        ? Math.round(((candidate.voteCount || 0) / electionResults.totalVotes) * 100) 
                                        : 0;

                                    return (
                                        <div key={candidate._id} className="vote-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1 }}>
                                                <PartySymbol symbol={candidate.symbol} size={44} />

                                                <div style={{ flex: 1 }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                        <span style={{ fontWeight: '700', fontSize: '16px' }}>{candidate.name}</span>
                                                        <span style={{ fontSize: '12px', color: '#9ca3af' }}>({candidate.party})</span>
                                                    </div>
                                                    <p style={{ margin: '4px 0 0', color: '#6b7280', fontSize: '13px' }}>
                                                        {candidate.manifesto}
                                                    </p>
                                                    
                                                    {showResults && (
                                                        <div style={{ marginTop: '10px' }}>
                                                            <div className="progress-bar">
                                                                <div className="progress-fill" style={{ width: `${votePercent}%` }}></div>
                                                            </div>
                                                            <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '4px' }}>
                                                                {candidate.voteCount || 0} votes • {votePercent}%
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginLeft: '24px' }}>
                                                {!showResults && (
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#6b7280', fontSize: '13px' }}>
                                                        🔒 <em>Results Hidden</em>
                                                    </div>
                                                )}

                                                {showResults && (
                                                    <div style={{ textAlign: 'center', marginRight: '12px' }}>
                                                        <div style={{ fontSize: '20px', fontWeight: '800', color: '#a5b4fc' }}>
                                                            {candidate.voteCount || 0}
                                                        </div>
                                                        <div style={{ fontSize: '10px', color: '#6b7280' }}>VOTES</div>
                                                    </div>
                                                )}

                                                {selectedElection.status === 'active' && !hasVotedSelected && (
                                                    <button
                                                        onClick={() => handleVote(candidate._id, candidate.name)}
                                                        disabled={votingFor === candidate._id}
                                                        className="btn btn-success"
                                                        style={{ padding: '10px 20px', fontSize: '13px' }}
                                                    >
                                                        {votingFor === candidate._id ? '⏳' : 'VOTE'}
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </>
                ) : (
                    <div className="glass-card" style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>
                        No elections found. Please contact the administrator.
                    </div>
                )}
            </div>
        </div>
    );
};

export default VoterDashboard;
