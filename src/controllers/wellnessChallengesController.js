const model = require("../models/wellnessChallengesModel");

// CREATE NEW CHALLENGE 
module.exports.createNewChallenge = (req, res, next) => {
    const data = {
        description: req.body.description,
        userId: res.locals.userId,
        points: req.body.points
    }
    if (!data.description || !data.userId || !data.points){
        return res.status(400).json({
            message: "Missing required data"
        });
    }

    const callback = (error, results, fields) => {
        if (error) {
            console.error("Error createNewChallenge:", error);
            return res.status(500).json(error);
        } else {
            return res.status(201).json({
            message: "Challenge created", 
            challenge_id: results.insertId,
            description: data.description,
            creator_id: data.userId,
            points: data.points
        });
        }
    }
    model.createNewChallenge(data, callback);
}

// GET ALL WELLNESS CHALLENGES 
module.exports.readAllChallenges = (req, res, next) => {
    const callback = (error, results, fields) => {
        if (error) {
            console.error("Error readAllChallenges:", error);
            return res.status(500).json(error);
        }
        else return res.status(200).json(results)
    }
    model.readAllChallenges(callback);
}

// DELETE CHALLENGE BY ID 
module.exports.deleteChallengeById = (req, res, next) => {
    const data = {
        challengeId: res.locals.challengeId,
        userId: res.locals.userId 
    }

    const callback = (error, results, fields) => {
        if (error){
            console.error("Error deleteChallengeById:", error);
            return res.status(500).json(error);
        }
            else return res.status(204).send(); // 204 No Content
        
    }
    model.deleteChallengeById(data, callback);
}

// MIDDLEWARE TO CHECK IF USER AND CHALLENGE EXISTS 
module.exports.checkIfUserAndChallengeExists = (req, res, next) => {
    const data = {
        challengeId: req.body.challengeId,
        userId: res.locals.userId,
    }

    if (!data.userId|| !data.challengeId){
        return res.status(400).json({
            message: "User ID and challenge ID is required"
        });
    }

    const callback = (error, results, fields) => {
        if (error) {
            return res.status(500).json(error);
        } 
        if (results.length === 0){
            return res.status(404).json({
                message: "Challenge or user not found"
            });
        } else{
            res.locals.userId = data.userId
            res.locals.challengeId = data.challengeId
            next();
        }  
    }
    model.checkIfUserAndChallengeExists(data, callback);
}

// UPDATE CHALLENGE BY ID 
module.exports.updateChallengeById = (req, res, next) => {
    const data = {
        challengeId: res.locals.challengeId,
        userId: res.locals.userId, 
        description: req.body.description,
        points: req.body.points
    }
    if (!data.challengeId || !data.userId || !data.description || !data.points){
        return res.status(400).json({
            message: "Missing required data"
        });
    }
    const callback = (error, results, fields) => {
        if (error) {
            console.error("Error updateChallengeById:", error);
            return res.status(500).json(error);
        } 
            else return res.status(200).json({
                message: "Challenge successfully updated", 
                challenge_id: data.challengeId,
                description: data.description,
                creator_id: data.userId,
                points: data.points
            }) 
        
    }
    model.updateChallengeById(data, callback);
}