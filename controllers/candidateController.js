const Candidate = require('../models/candidate');
const User = require('../models/user');
const VoteAudit = require('../models/voteAudit');
const Election = require('../models/election');
const VoteTracker = require('../models/voteTracker');
const { sendVoteReceipt } = require('../services/emailService');
const jwt = require('jsonwebtoken');

const escapeRegExp = (value) => {
    return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

// @desc    Get all candidates
// @route   GET /api/candidate
exports.getCandidates = async (req, res, next) => {
    try {
        const filter = {};
        
        if (req.query.electionId) {
            filter.electionId = req.query.electionId;
        }

        // Determine if admin is querying to see all candidates (e.g. pending ones)
        let isAdmin = false;
        if (req.cookies && req.cookies.token) {
            try {
                const decoded = jwt.verify(req.cookies.token, process.env.JWT_SECRET);
                if (decoded && decoded.role === 'admin') {
                    isAdmin = true;
                }
            } catch (e) {
                // Ignore verification errors for public route
            }
        }

        // If not admin, or if not requesting all candidates, filter by approved status
        if (!isAdmin || req.query.approvedOnly === 'true') {
            filter.status = 'approved';
        }

        const candidates = await Candidate.find(filter).sort({ name: 1 }).populate('electionId');
        
        // Mask vote counts if election status is not completed
        const sanitizedCandidates = candidates.map(c => {
            const candidateObj = c.toObject();
            if (candidateObj.electionId && candidateObj.electionId.status !== 'completed') {
                candidateObj.voteCount = 0;
            }
            return candidateObj;
        });

        res.status(200).json({ success: true, count: sanitizedCandidates.length, data: sanitizedCandidates });
    } catch (err) {
        next(err);
    }
};

// @desc    Add a candidate (or register candidate request)
// @route   POST /api/candidate
// @access  Voter/Admin
exports.addCandidate = async (req, res, next) => {
    try {
        const { name, party, age, electionId, manifesto, symbol } = req.body;
        
        if (!name || !party || age === undefined || age === null || !electionId || !manifesto || !symbol) {
            return res.status(400).json({ success: false, error: 'All candidate fields are required.' });
        }

        // Check if election exists
        const election = await Election.findById(electionId);
        if (!election) {
            return res.status(404).json({ success: false, error: 'Election not found.' });
        }

        // Check for duplicate candidate name in the same election (case-insensitive)
        const duplicateName = await Candidate.findOne({
            electionId,
            name: { $regex: new RegExp(`^${escapeRegExp(name.trim())}$`, 'i') }
        });
        if (duplicateName) {
            return res.status(400).json({ success: false, error: 'A candidate with this name is already registered in this election.' });
        }

        // Check for duplicate symbol in the same election
        const duplicateSymbol = await Candidate.findOne({ electionId, symbol });
        if (duplicateSymbol) {
            return res.status(400).json({ success: false, error: 'This election symbol has already been reserved by another candidate.' });
        }

        // Check for duplicate party in the same election (case-insensitive, excluding NOTA/independent/none)
        const normalizedParty = party.trim().toLowerCase();
        if (normalizedParty !== 'independent' && normalizedParty !== 'nota' && normalizedParty !== 'none') {
            const duplicateParty = await Candidate.findOne({
                electionId,
                party: { $regex: new RegExp(`^${escapeRegExp(party.trim())}$`, 'i') }
            });
            if (duplicateParty) {
                return res.status(400).json({ success: false, error: `A candidate from the "${party}" party is already registered in this election.` });
            }
        }

        // If user is admin, candidate is auto-approved, otherwise pending approval
        const status = (req.user && req.user.role === 'admin') ? 'approved' : 'pending';

        const newCandidate = await Candidate.create({
            name,
            party,
            age,
            electionId,
            manifesto,
            symbol,
            status
        });

        res.status(201).json({ success: true, data: newCandidate });
    } catch (err) {
        next(err);
    }
};

// @desc    Approve candidate
// @route   PUT /api/candidate/approve/:id
// @access  Admin
exports.approveCandidate = async (req, res, next) => {
    try {
        const candidate = await Candidate.findByIdAndUpdate(
            req.params.id,
            { status: 'approved' },
            { new: true, runValidators: true }
        );

        if (!candidate) {
            return res.status(404).json({ success: false, error: 'Candidate not found' });
        }

        res.status(200).json({ success: true, data: candidate });
    } catch (err) {
        next(err);
    }
};

// @desc    Reject candidate
// @route   PUT /api/candidate/reject/:id
// @access  Admin
exports.rejectCandidate = async (req, res, next) => {
    try {
        const candidate = await Candidate.findByIdAndUpdate(
            req.params.id,
            { status: 'rejected' },
            { new: true, runValidators: true }
        );

        if (!candidate) {
            return res.status(404).json({ success: false, error: 'Candidate not found' });
        }

        res.status(200).json({ success: true, data: candidate });
    } catch (err) {
        next(err);
    }
};

// @desc    Update a candidate
// @route   PUT /api/candidate/:id
// @access  Admin
exports.updateCandidate = async (req, res, next) => {
    try {
        const candidate = await Candidate.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });

        if (!candidate) {
            return res.status(404).json({ success: false, error: 'Candidate not found' });
        }

        res.status(200).json({ success: true, data: candidate });
    } catch (err) {
        next(err);
    }
};

// @desc    Delete a candidate
// @route   DELETE /api/candidate/:id
// @access  Admin
exports.deleteCandidate = async (req, res, next) => {
    try {
        const candidate = await Candidate.findByIdAndDelete(req.params.id);

        if (!candidate) {
            return res.status(404).json({ success: false, error: 'Candidate not found' });
        }

        res.status(200).json({ success: true, data: {} });
    } catch (err) {
        next(err);
    }
};

// @desc    Vote for a candidate
// @route   POST /api/candidate/vote/:id
// @access  Voter
exports.vote = async (req, res, next) => {
    try {
        const candidateId = req.params.id;
        const userId = req.user.id;
        const ipAddress = req.ip || req.connection.remoteAddress || '127.0.0.1';
        const userAgent = req.headers['user-agent'] || 'Unknown';

        // 1. Verify candidate exists & status is approved
        const candidate = await Candidate.findById(candidateId);
        if (!candidate) {
            return res.status(404).json({ success: false, error: 'Candidate not found' });
        }

        if (candidate.status !== 'approved') {
            return res.status(400).json({ success: false, error: 'Candidate is not approved for this election' });
        }

        // 2. Verify election exists & status is active within correct bounds
        const election = await Election.findById(candidate.electionId);
        if (!election) {
            return res.status(404).json({ success: false, error: 'Election not found for this candidate' });
        }

        const now = new Date();

        if (election.status !== 'completed' && now >= election.startDate && now <= election.endDate && election.status !== 'active') {
            election.status = 'active';
            await election.save();
        }

        if (election.status === 'active' && now < election.startDate) {
            election.startDate = now;
            await election.save();
        }

        if (now > election.endDate) {
            election.status = 'completed';
            await election.save();
            return res.status(403).json({ success: false, error: 'Voting period is closed or has not started.' });
        }

        if (election.status !== 'active') {
            return res.status(403).json({ success: false, error: 'This election is not active.' });
        }

        // Get voter info
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }

        if (user.role === 'admin') {
            await VoteAudit.create({ userId, electionId: election._id, ipAddress, userAgent, status: 'failed_unauthorized' });
            return res.status(403).json({ success: false, error: 'Admin cannot vote' });
        }

        // 3. Verify user has not already voted in this election (using VoteTracker)
        const alreadyVoted = await VoteTracker.findOne({ userId, electionId: election._id });
        if (alreadyVoted) {
            // Log failed duplicate attempt (Keep candidateId null or omit to enforce voter anonymity in logs)
            await VoteAudit.create({ userId, electionId: election._id, ipAddress, userAgent, status: 'failed_duplicate' });
            return res.status(400).json({ success: false, error: 'User has already voted in this election' });
        }

        // 4. Record the vote anonymously (Increment Candidate voteCount, save VoteTracker)
        candidate.voteCount++;
        await candidate.save();

        await VoteTracker.create({
            userId,
            electionId: election._id
        });

        // 5. Create successful audit log with hash chaining (Omit candidateId to guarantee anonymity)
        await VoteAudit.create({
            userId,
            electionId: election._id,
            ipAddress,
            userAgent,
            status: 'success'
        });

        // Emit live vote count update to all connected clients if Socket.io is active
        if (req.io) {
            const candidates = await Candidate.find({ electionId: election._id }).sort({ voteCount: -1 });
            const voteRecord = candidates.map((data) => ({
                id: data._id,
                party: data.party,
                name: data.name,
                count: (election.status === 'completed') ? data.voteCount : 0
            }));
            req.io.emit('voteUpdate', { electionId: election._id, voteRecord });
        }

        // Send Vote Receipt Email
        if (user.email) {
            sendVoteReceipt(user.email, user.name, candidate.name, election.title);
        }

        res.status(200).json({ success: true, message: 'Vote recorded successfully' });
    } catch (err) {
        next(err);
    }
};

// @desc    Get vote counts
// @route   GET /api/candidate/vote/count
exports.getVoteCounts = async (req, res, next) => {
    try {
        const filter = {};
        if (req.query.electionId) {
            filter.electionId = req.query.electionId;

            // Secure active election results: only visible to Admin
            const election = await Election.findById(req.query.electionId);
            if (election && election.status !== 'completed') {
                let isAdmin = false;
                if (req.cookies && req.cookies.token) {
                    try {
                        const decoded = jwt.verify(req.cookies.token, process.env.JWT_SECRET);
                        if (decoded && decoded.role === 'admin') {
                            isAdmin = true;
                        }
                    } catch (e) {}
                }
                if (!isAdmin) {
                    return res.status(403).json({ success: false, error: 'Vote counts are hidden until election is completed' });
                }
            }
        }

        const candidates = await Candidate.find(filter).sort({ voteCount: -1 });
        
        const voteRecord = candidates.map((data) => ({
            party: data.party,
            count: data.voteCount
        }));

        res.status(200).json({ success: true, data: voteRecord });
    } catch (err) {
        next(err);
    }
};
