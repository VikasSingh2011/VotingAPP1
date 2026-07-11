const Election = require('../models/election');
const Candidate = require('../models/candidate');
const User = require('../models/user');
const VoteTracker = require('../models/voteTracker');
const { 
    sendElectionStartedNotification, 
    sendElectionCompletedNotification, 
    sendResultPublishedNotification 
} = require('../services/emailService');

const syncTimedElectionStatuses = async () => {
    const now = new Date();

    await Election.updateMany(
        { status: { $ne: 'completed' }, endDate: { $lt: now } },
        { $set: { status: 'completed' } }
    );

    await Election.updateMany(
        { status: 'upcoming', startDate: { $lte: now }, endDate: { $gte: now } },
        { $set: { status: 'active' } }
    );
};

// @desc    Get all elections
// @route   GET /api/election
exports.getElections = async (req, res, next) => {
    try {
        await syncTimedElectionStatuses();
        const elections = await Election.find().sort({ createdAt: -1 });
        res.status(200).json({ success: true, data: elections });
    } catch (err) {
        next(err);
    }
};

// @desc    Create a new election
// @route   POST /api/election
// @access  Admin
exports.createElection = async (req, res, next) => {
    try {
        const { title, description, startDate, endDate } = req.body;
        if (!title || !startDate || !endDate) {
            return res.status(400).json({ success: false, error: 'Title, startDate, and endDate are required.' });
        }
        if (new Date(startDate) >= new Date(endDate)) {
            return res.status(400).json({ success: false, error: 'Election End Date must be after the Start Date.' });
        }
        const election = await Election.create({ title, description, startDate, endDate });

        // Email notifications when an election is created (non-blocking)
        const voters = await User.find({ role: 'voter' });
        voters.forEach(voter => {
            if (voter.email) {
                sendElectionStartedNotification(voter.email, voter.name, title);
            }
        });

        res.status(201).json({ success: true, data: election });
    } catch (err) {
        next(err);
    }
};

// @desc    Update election (e.g., set status to active/completed)
// @route   PUT /api/election/:id
// @access  Admin
exports.updateElection = async (req, res, next) => {
    try {
        const currentElec = await Election.findById(req.params.id);
        if (!currentElec) {
            return res.status(404).json({ success: false, error: 'Election not found' });
        }

        if (req.body.startDate && req.body.endDate) {
            if (new Date(req.body.startDate) >= new Date(req.body.endDate)) {
                return res.status(400).json({ success: false, error: 'Election End Date must be after the Start Date.' });
            }
        } else if (req.body.startDate || req.body.endDate) {
            const sDate = req.body.startDate ? new Date(req.body.startDate) : currentElec.startDate;
            const eDate = req.body.endDate ? new Date(req.body.endDate) : currentElec.endDate;
            if (sDate >= eDate) {
                return res.status(400).json({ success: false, error: 'Election End Date must be after the Start Date.' });
            }
        }

        const updateData = { ...req.body };
        if (updateData.status === 'active') {
            const now = new Date();
            const endDate = updateData.endDate ? new Date(updateData.endDate) : currentElec.endDate;

            if (endDate <= now) {
                return res.status(400).json({ success: false, error: 'Cannot activate an election after its end date.' });
            }

            const startDate = updateData.startDate ? new Date(updateData.startDate) : currentElec.startDate;
            if (startDate > now) {
                updateData.startDate = now;
            }
        }

        const election = await Election.findByIdAndUpdate(req.params.id, updateData, {
            new: true,
            runValidators: true
        });
        res.status(200).json({ success: true, data: election });
    } catch (err) {
        next(err);
    }
};

// @desc    Manually finish an active election
// @route   PUT /api/election/:id/finish
// @access  Admin
exports.finishElection = async (req, res, next) => {
    try {
        const election = await Election.findById(req.params.id);

        if (!election) {
            return res.status(404).json({ success: false, error: 'Election not found' });
        }

        if (election.status !== 'active') {
            return res.status(400).json({ success: false, error: 'Only active elections can be finished' });
        }

        const updatedElection = await Election.findByIdAndUpdate(
            req.params.id,
            { 
                status: 'completed',
                completedAt: new Date(),
                completedBy: req.user.id
            },
            { new: true, runValidators: true }
        );

        // Notify voters about completion & results publication (non-blocking)
        const voters = await User.find({ role: 'voter' });
        const candidates = await Candidate.find({ electionId: election._id, status: 'approved' }).sort({ voteCount: -1 });
        const winnerName = candidates.length > 0 ? candidates[0].name : 'N/A';

        voters.forEach(voter => {
            if (voter.email) {
                sendElectionCompletedNotification(voter.email, voter.name, election.title);
                sendResultPublishedNotification(voter.email, voter.name, election.title, winnerName);
            }
        });

        res.status(200).json({ success: true, data: updatedElection });
    } catch (err) {
        next(err);
    }
};

// @desc    Get completed election results
// @route   GET /api/election/:id/results
// @access  Admin/Voter
exports.getElectionResults = async (req, res, next) => {
    try {
        const election = await Election.findById(req.params.id);

        if (!election) {
            return res.status(404).json({ success: false, error: 'Election not found' });
        }

        // Hide results for non-admins if election is not completed
        if (election.status !== 'completed' && req.user.role !== 'admin') {
            return res.status(403).json({ success: false, error: 'Results are available only after the election is completed' });
        }

        const candidates = await Candidate.find({ electionId: election._id, status: 'approved' }).sort({ voteCount: -1, name: 1 });
        const totalVotes = candidates.reduce((sum, candidate) => sum + (candidate.voteCount || 0), 0);
        const highestVotes = candidates.length > 0 ? candidates[0].voteCount || 0 : 0;
        const tiedCandidates = candidates.filter(candidate => (candidate.voteCount || 0) === highestVotes);
        const isTie = tiedCandidates.length > 1;

        const totalRegisteredVoters = await User.countDocuments({ role: 'voter' });
        const voterTurnoutPercentage = totalRegisteredVoters > 0 ? Number(((totalVotes / totalRegisteredVoters) * 100).toFixed(2)) : 0;

        const results = candidates.map(candidate => {
            const votes = candidate.voteCount || 0;
            return {
                candidateId: candidate._id,
                name: candidate.name,
                party: candidate.party,
                votes,
                percentage: totalVotes === 0 ? 0 : Number(((votes / totalVotes) * 100).toFixed(2)),
                isWinner: candidates.length > 0 && votes === highestVotes
            };
        });

        const runnerUp = candidates.length > 1 ? {
            name: candidates[1].name,
            party: candidates[1].party,
            votes: candidates[1].voteCount || 0
        } : null;

        res.status(200).json({
            success: true,
            data: {
                election,
                totalVotes,
                totalRegisteredVoters,
                voterTurnoutPercentage,
                isTie,
                winners: tiedCandidates.map(candidate => ({
                    candidateId: candidate._id,
                    name: candidate.name,
                    party: candidate.party,
                    votes: candidate.voteCount || 0
                })),
                runnerUp,
                results
            }
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Delete an election
// @route   DELETE /api/election/:id
// @access  Admin
exports.deleteElection = async (req, res, next) => {
    try {
        const election = await Election.findByIdAndDelete(req.params.id);
        if (!election) {
            return res.status(404).json({ success: false, error: 'Election not found' });
        }
        res.status(200).json({ success: true, data: {} });
    } catch (err) {
        next(err);
    }
};

// @desc    Get Admin Dashboard Analytics
// @route   GET /api/election/analytics/dashboard
// @access  Admin
exports.getDashboardAnalytics = async (req, res, next) => {
    try {
        const totalVoters = await User.countDocuments({ role: 'voter' });
        const totalVotesCast = await VoteTracker.countDocuments({});
        const voterTurnoutPercentage = totalVoters > 0 ? Number(((totalVotesCast / totalVoters) * 100).toFixed(2)) : 0;
        
        const activeElectionsCount = await Election.countDocuments({ status: 'active' });
        const completedElectionsCount = await Election.countDocuments({ status: 'completed' });
        const approvedCandidatesCount = await Candidate.countDocuments({ status: 'approved' });
        const pendingCandidatesCount = await Candidate.countDocuments({ status: 'pending' });

        const candidates = await Candidate.find({});

        res.status(200).json({
            success: true,
            data: {
                totalVoters,
                totalVotesCast,
                voterTurnoutPercentage,
                activeElectionsCount,
                completedElectionsCount,
                approvedCandidatesCount,
                pendingCandidatesCount,
                candidates
            }
        });
    } catch (err) {
        next(err);
    }
};
