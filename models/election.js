const mongoose = require('mongoose');

const electionSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String
    },
    startDate: {
        type: Date,
        required: true
    },
    endDate: {
        type: Date,
        required: true
    },
    status: {
        type: String,
        enum: ['upcoming', 'active', 'completed'],
        default: 'upcoming'
    },
    completedAt: {
        type: Date
    },
    completedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, { timestamps: true });

// Middleware to automatically update status based on current date
electionSchema.pre('save', function(next) {
    if (this.status === 'completed') {
        return next();
    }
    const now = new Date();
    if (this.endDate < now) {
        this.status = 'completed';
    } else if (this.startDate <= now && this.endDate >= now) {
        this.status = 'active';
    } else {
        this.status = 'upcoming';
    }
    next();
});

const Election = mongoose.model('Election', electionSchema);
module.exports = Election;
