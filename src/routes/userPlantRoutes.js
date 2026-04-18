// ##############################################################
// REQUIRE MODULES
// ##############################################################
const express = require("express");
const router = express.Router();

// ##############################################################
// CREATE ROUTER
// ##############################################################

const controller = require('../controllers/userPlantController')
const jwtMiddleware = require('../middlewares/jwtMiddleware');
// ##############################################################
// DEFINE ROUTES
// ##############################################################

router.get('/inventory', jwtMiddleware.verifyToken, controller.checkIfUserExists, controller.readUserPlantById);
router.post('/purchase', jwtMiddleware.verifyToken, controller.checkIfUserAndPlantExists, controller.checkIfUserHasEnoughPoints, controller.purchasePlant, controller.deductUserPoints)
router.post('/sellPlant/:inventoryId', jwtMiddleware.verifyToken, controller.deletePlant, controller.refundPoint)

// ##############################################################
// EXPORT ROUTER
// ##############################################################
module.exports = router;