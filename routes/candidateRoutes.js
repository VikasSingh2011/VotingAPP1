const express = require('express');
const router = express.Router();
const { getCandidates, addCandidate, updateCandidate, deleteCandidate, vote, getVoteCounts, approveCandidate, rejectCandidate } = require('../controllers/candidateController');
const { protect, authorize } = require('../middlewares/authMiddleware');
const { candidateValidationRules, validateResult } = require('../middlewares/validationMiddleware');

// Public/Voter Routes
router.get('/', getCandidates);
router.get('/vote/count', getVoteCounts);
router.post('/vote/:id', protect, authorize('voter'), vote);
// Both voters and admin can add candidate (voters submit request)
router.post('/', protect, candidateValidationRules, validateResult, addCandidate);

// Admin Only Routes
router.put('/approve/:id', protect, authorize('admin'), approveCandidate);
router.put('/reject/:id', protect, authorize('admin'), rejectCandidate);
router.put('/:id', protect, authorize('admin'), updateCandidate);
router.delete('/:id', protect, authorize('admin'), deleteCandidate);

module.exports = router;