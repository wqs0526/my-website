// ##############################################################  
// REQUIRE MODULES
// ##############################################################
const express = require("express");
const router = express.Router();


// ##############################################################
// CREATE ROUTER
// ##############################################################
const userPlantRoutes = require("./userPlantRoutes");
const plantRoutes = require("./plantRoutes");
const usersRoutes = require("./usersRoutes");
const userCompletionRoutes = require("./completionRoutes")
const wellnessChallengesRoutes = require("./wellnessChallengesRoutes")
// ##############################################################
// DEFINE ROUTES
// ##############################################################
router.use("/api/userPlant", userPlantRoutes);
router.use("/api/plants", plantRoutes);
router.use("/api/users", usersRoutes);
router.use("/api/completion", userCompletionRoutes)
router.use("/api/challenges", wellnessChallengesRoutes);


// ##############################################################
// EXPORT ROUTER
// ##############################################################

module.exports = router;