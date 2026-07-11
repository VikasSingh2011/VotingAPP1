const mongoose = require('mongoose');
const crypto = require('crypto');

const voteAuditSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    candidateId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Candidate',
        required: false
    },
    electionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Election'
    },
    ipAddress: {
        type: String,
        required: true
    },
    userAgent: {
        type: String
    },
    status: {
        type: String,
        enum: ['success', 'failed_duplicate', 'failed_unauthorized', 'failed_error'],
        required: true
    },
    previousHash: {
        type: String
    },
    currentHash: {
        type: String
    }
}, { timestamps: true });

// Pre-save middleware to handle hash chaining
voteAuditSchema.pre('save', async function(next) {
    if (this.isNew) {
        try {
            // Get the last audit record to read its currentHash
            const lastAudit = await this.constructor.findOne({}).sort({ createdAt: -1 });
            this.previousHash = lastAudit ? lastAudit.currentHash : '0000000000000000000000000000000000000000000000000000000000000000';
            
            const hash = crypto.createHash('sha256');
            hash.update(
                (this.userId ? this.userId.toString() : '') +
                (this.candidateId ? this.candidateId.toString() : '') +
                (this.electionId ? this.electionId.toString() : '') +
                (this.status || '') +
                (this.ipAddress || '') +
                (this.userAgent || '') +
                this.previousHash
            );
            this.currentHash = hash.digest('hex');
        } catch (err) {
            return next(err);
        }
    }
    next();
});

// Middleware to prevent modification or deletion of logs
const preventMutation = function(next) {
    next(new Error('Audit logs are read-only and cannot be modified or deleted.'));
};

voteAuditSchema.pre('updateOne', preventMutation);
voteAuditSchema.pre('updateMany', preventMutation);
voteAuditSchema.pre('findOneAndUpdate', preventMutation);
voteAuditSchema.pre('findByIdAndUpdate', preventMutation);
voteAuditSchema.pre('deleteOne', preventMutation);
voteAuditSchema.pre('deleteMany', preventMutation);
voteAuditSchema.pre('findOneAndDelete', preventMutation);
voteAuditSchema.pre('findByIdAndDelete', preventMutation);

const VoteAudit = mongoose.model('VoteAudit', voteAuditSchema);
module.exports = VoteAudit;
