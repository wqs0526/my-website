// ##############################################################
// REQUIRE MODULES
// ##############################################################
const express = require("express");
const router = express.Router();

// ##############################################################
// CREATE ROUTER
// ##############################################################

const controller = require('../controllers/usersController')
const bcryptMiddleware = require('../middlewares/bcryptMiddleware');
const jwtMiddleware = require('../middlewares/jwtMiddleware');

// ##############################################################
// DEFINE ROUTES
// ##############################################################
router.post('/register', controller.checkIfUserExists, bcryptMiddleware.hashPassword, controller.createNewUser, controller.createStreakRowForUser, controller.createFreePlantForUser, jwtMiddleware.generateToken, jwtMiddleware.sendToken);
router.post("/login", controller.login, bcryptMiddleware.comparePassword, jwtMiddleware.generateToken, jwtMiddleware.sendToken);
router.get('/leaderboard', jwtMiddleware.verifyToken, controller.readAllUser);
router.get('/info', jwtMiddleware.verifyToken, controller.readUserById); // retrieve userinfo
router.put('/updateUsername', jwtMiddleware.verifyToken, controller.checkUsername, controller.updateUsername)
router.delete('/delete', jwtMiddleware.verifyToken, controller.deleteUser)



// ##############################################################
// EXPORT ROUTER
// ##############################################################
module.exports = router;