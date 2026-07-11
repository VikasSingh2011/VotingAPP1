const express = require('express');
const router = express.Router();
const { getElections, createElection, updateElection, deleteElection, finishElection, getElectionResults, getDashboardAnalytics } = require('../controllers/electionController');
const { protect, authorize } = require('../middlewares/authMiddleware');

// Public
router.get('/', getElections);

// Admin / Voter Authorized Routes
router.get('/analytics/dashboard', protect, authorize('admin'), getDashboardAnalytics);
router.get('/:id/results', protect, getElectionResults);

// Admin only
router.post('/', protect, authorize('admin'), createElection);
router.put('/:id/finish', protect, authorize('admin'), finishElection);
router.put('/:id', protect, authorize('admin'), updateElection);
router.delete('/:id', protect, authorize('admin'), deleteElection);

module.exports = router;
