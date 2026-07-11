// State
let token = localStorage.getItem('token');
let userRole = null;
let userData = null;

// DOM Elements
const navLinks = document.getElementById('nav-links');
const loader = document.getElementById('loader');
const toastContainer = document.getElementById('toast-container');
const views = document.querySelectorAll('.view');

// Initialization
document.addEventListener('DOMContentLoaded', () => {
    if (token) {
        fetchProfile();
    } else {
        updateNav();
        switchView('view-auth');
    }
});

// UI Utilities
function showLoader() { loader.classList.remove('hidden'); }
function hideLoader() { loader.classList.add('hidden'); }

function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    toastContainer.appendChild(toast);
    setTimeout(() => {
        toast.style.animation = 'slideInRight 0.3s ease reverse forwards';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function switchView(viewId) {
    views.forEach(view => view.classList.add('hidden'));
    document.getElementById(viewId).classList.remove('hidden');
}

function switchAuthTab(tab) {
    document.querySelectorAll('.auth-tabs .tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));
    
    if (tab === 'login') {
        document.querySelector('.auth-tabs .tab:nth-child(1)').classList.add('active');
        document.getElementById('form-login').classList.add('active');
    } else {
        document.querySelector('.auth-tabs .tab:nth-child(2)').classList.add('active');
        document.getElementById('form-signup').classList.add('active');
    }
}

function updateNav() {
    navLinks.innerHTML = '';
    if (!token) {
        navLinks.innerHTML = `<button onclick="switchView('view-auth')">Login / Sign Up</button>`;
        return;
    }

    if (userRole === 'admin') {
        navLinks.innerHTML += `<button onclick="switchView('view-admin')">Admin Dashboard</button>`;
    } else {
        navLinks.innerHTML += `<button onclick="switchView('view-voter')">Voter Dashboard</button>`;
    }
    navLinks.innerHTML += `<button onclick="switchView('view-profile')">Profile Settings</button>`;
    navLinks.innerHTML += `<button class="btn-danger" style="margin-left:1rem; padding: 0.25rem 0.75rem;" onclick="logout()">Logout</button>`;
}

// Authentication
function logout() {
    localStorage.removeItem('token');
    token = null;
    userRole = null;
    userData = null;
    updateNav();
    switchView('view-auth');
    showToast('Logged out successfully');
}

async function handleLogin(e) {
    e.preventDefault();
    const aadharCardNumber = document.getElementById('login-aadhar').value;
    const password = document.getElementById('login-password').value;

    try {
        showLoader();
        const res = await fetch('/user/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ aadharCardNumber, password })
        });
        const data = await res.json();
        
        if (res.ok) {
            token = data.token;
            localStorage.setItem('token', token);
            showToast('Login successful!');
            await fetchProfile();
        } else {
            showToast(data.error || 'Login failed', 'error');
        }
    } catch (err) {
        showToast('Network error', 'error');
    } finally {
        hideLoader();
    }
}

async function handleSignup(e) {
    e.preventDefault();
    const payload = {
        name: document.getElementById('signup-name').value,
        age: document.getElementById('signup-age').value,
        email: document.getElementById('signup-email').value,
        mobile: document.getElementById('signup-mobile').value,
        address: document.getElementById('signup-address').value,
        aadharCardNumber: document.getElementById('signup-aadhar').value,
        password: document.getElementById('signup-password').value,
        role: document.getElementById('signup-role').value
    };

    try {
        showLoader();
        const res = await fetch('/user/signup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const data = await res.json();
        
        if (res.ok) {
            token = data.token;
            localStorage.setItem('token', token);
            showToast('Account created successfully!');
            await fetchProfile();
        } else {
            showToast(data.error || 'Signup failed', 'error');
        }
    } catch (err) {
        showToast('Network error', 'error');
    } finally {
        hideLoader();
    }
}

// User Profile
async function fetchProfile() {
    try {
        showLoader();
        const res = await fetch('/user/profile', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();

        if (res.ok && data.user) {
            userData = data.user;
            userRole = userData.role;
            updateNav();
            
            if (userRole === 'admin') {
                switchView('view-admin');
                fetchAdminData();
            } else {
                document.getElementById('voter-name').textContent = userData.name;
                switchView('view-voter');
                fetchVoterData();
            }
        } else {
            logout();
        }
    } catch (err) {
        logout();
    } finally {
        hideLoader();
    }
}

async function handleChangePassword(e) {
    e.preventDefault();
    const currentPassword = document.getElementById('current-password').value;
    const newPassword = document.getElementById('new-password').value;

    try {
        showLoader();
        const res = await fetch('/user/profile/password', {
            method: 'PUT',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ currentPassword, newPassword })
        });
        const data = await res.json();
        if (res.ok) {
            showToast('Password updated successfully');
            e.target.reset();
        } else {
            showToast(data.error || 'Failed to update password', 'error');
        }
    } catch (err) {
        showToast('Network error', 'error');
    } finally {
        hideLoader();
    }
}

// Voter Flow
async function fetchVoterData() {
    await Promise.all([fetchCandidates(), fetchLiveVotes()]);
}

async function fetchCandidates() {
    try {
        const res = await fetch('/candidate');
        const candidates = await res.json();
        
        const list = document.getElementById('candidates-list');
        list.innerHTML = '';
        
        candidates.forEach(c => {
            const card = document.createElement('div');
            card.className = 'candidate-card';
            card.innerHTML = `
                <h4>${c.name}</h4>
                <div class="party">${c.party}</div>
                <p style="color:var(--text-muted); font-size:0.875rem; margin-bottom:1rem;">Age: ${c.age}</p>
                ${userData.isVoted 
                    ? '<button class="btn-secondary" disabled>Already Voted</button>' 
                    : `<button class="btn-primary" onclick="castVote('${c._id}')">Vote</button>`}
            `;
            list.appendChild(card);
        });
    } catch (err) {
        console.error(err);
    }
}

async function castVote(candidateId) {
    if (!confirm('Are you sure you want to vote for this candidate? This action cannot be undone.')) return;
    
    try {
        showLoader();
        const res = await fetch(`/candidate/vote/${candidateId}`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        
        if (res.ok) {
            showToast('Vote cast successfully!');
            userData.isVoted = true; // Update local state
            await fetchVoterData(); // Refresh UI
        } else {
            showToast(data.message || data.error || 'Failed to cast vote', 'error');
        }
    } catch (err) {
        showToast('Network error', 'error');
    } finally {
        hideLoader();
    }
}

async function fetchLiveVotes() {
    try {
        const res = await fetch('/candidate/vote/count');
        const votes = await res.json();
        
        const html = votes.map(v => `
            <div class="vote-item">
                <span>${v.party}</span>
                <span class="vote-count">${v.count}</span>
            </div>
        `).join('');
        
        document.getElementById('live-votes-list').innerHTML = html;
        if (userRole === 'admin') {
            document.getElementById('admin-live-votes-list').innerHTML = html;
        }
    } catch (err) {
        console.error(err);
    }
}

// Admin Flow
async function fetchAdminData() {
    await Promise.all([fetchAdminCandidates(), fetchLiveVotes()]);
}

async function fetchAdminCandidates() {
    try {
        const res = await fetch('/candidate');
        const candidates = await res.json();
        
        const list = document.getElementById('admin-candidates-list');
        list.innerHTML = '';
        
        candidates.forEach(c => {
            const item = document.createElement('div');
            item.className = 'admin-candidate-item';
            item.innerHTML = `
                <div>
                    <strong>${c.name}</strong> <span class="party" style="margin-left:0.5rem">${c.party}</span>
                </div>
                <div class="actions">
                    <button class="btn-danger" style="padding: 0.4rem 0.8rem;" onclick="deleteCandidate('${c._id}')">Delete</button>
                </div>
            `;
            list.appendChild(item);
        });
    } catch (err) {
        console.error(err);
    }
}

// Modals
function openAddCandidateModal() {
    document.getElementById('modal-add-candidate').classList.remove('hidden');
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.add('hidden');
}

async function handleAddCandidate(e) {
    e.preventDefault();
    const payload = {
        name: document.getElementById('candidate-name').value,
        party: document.getElementById('candidate-party').value,
        age: document.getElementById('candidate-age').value
    };

    try {
        showLoader();
        const res = await fetch('/candidate', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(payload)
        });
        const data = await res.json();
        
        if (res.ok) {
            showToast('Candidate added successfully');
            closeModal('modal-add-candidate');
            e.target.reset();
            await fetchAdminData();
        } else {
            showToast(data.message || data.error || 'Failed to add candidate', 'error');
        }
    } catch (err) {
        showToast('Network error', 'error');
    } finally {
        hideLoader();
    }
}

async function deleteCandidate(candidateId) {
    if (!confirm('Are you sure you want to delete this candidate?')) return;
    
    try {
        showLoader();
        const res = await fetch(`/candidate/${candidateId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        
        if (res.ok) {
            showToast('Candidate deleted successfully');
            await fetchAdminData();
        } else {
            showToast(data.message || data.error || 'Failed to delete candidate', 'error');
        }
    } catch (err) {
        showToast('Network error', 'error');
    } finally {
        hideLoader();
    }
}
