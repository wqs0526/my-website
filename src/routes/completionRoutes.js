// ##############################################################
// REQUIRE MODULES
// ##############################################################
const express = require("express");
const router = express.Router();

// ##############################################################
// CREATE ROUTER
// ##############################################################

const controller = require('../controllers/completionController')  
const jwtMiddleware = require('../middlewares/jwtMiddleware');

// ##############################################################
// DEFINE ROUTES
// ##############################################################
router.get('/recent', jwtMiddleware.verifyToken, controller.readCompletionByUserId);
router.get('/streak', jwtMiddleware.verifyToken, controller.readCurrentStreakById)
router.post('/challenge', jwtMiddleware.verifyToken, controller.checkAssociationForUserAndChallenge, controller.checkCompletionDate, controller.createCompletions, controller.updatePoints, controller.updateStreak, controller.awardStreakBonus);
router.get('/:challengeId', jwtMiddleware.verifyToken, controller.readUserCompletionByChallengeId);
// ##############################################################
// EXPORT ROUTER
// ##############################################################
module.exports = router;