// ##############################################################
// REQUIRE MODULES
// ##############################################################
const express = require("express");
const router = express.Router();

// ##############################################################
// CREATE ROUTER
// ##############################################################

const controller = require('../controllers/wellnessChallengesController')
const jwtMiddleware = require('../middlewares/jwtMiddleware');

// ##############################################################
// DEFINE ROUTES
// ##############################################################
router.post('/createChallenge', jwtMiddleware.verifyToken, controller.createNewChallenge);  
router.get('/', controller.readAllChallenges);
router.delete('/delete', jwtMiddleware.verifyToken, controller.checkIfUserAndChallengeExists, controller.deleteChallengeById);
router.put('/update', jwtMiddleware.verifyToken, controller.checkIfUserAndChallengeExists, controller.updateChallengeById);

// ##############################################################
// EXPORT ROUTER
// ##############################################################
module.exports = router;