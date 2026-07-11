const mongoose = require('mongoose');

const voteTrackerSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    electionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Election',
        required: true
    },
    votedAt: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

// Create a compound unique index so a user can vote only once per election
voteTrackerSchema.index({ userId: 1, electionId: 1 }, { unique: true });

const VoteTracker = mongoose.model('VoteTracker', voteTrackerSchema);
module.exports = VoteTracker;
