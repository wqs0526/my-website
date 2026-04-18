const model = require("../models/completionModel");

// READ COMPLETION BY USER ID 
module.exports.readCompletionByUserId = (req, res, next) => {
    const data = {
        userId: res.locals.userId
    }
    if (!data.userId) {
        return res.status(400).json({
            message: "Missing required data"
        })
    }
    const callback = (error, results, fields) => {
        if (error) {
            console.error("Error readCompletionByUserId:", error);
            return res.status(500).json(error)
        }
            else return res.status(200).json(results);
        
    }
    model.readCompletionByUserId(data, callback);
}

// MIDDLEWARE TO CHECK IF USER AND CHALLENGE EXISTS 
module.exports.checkAssociationForUserAndChallenge = (req, res, next) => {
    const data = {
        challengeId: req.body.challengeId, 
        userId: res.locals.userId,
        details: req.body.details
    }

    if (!data.challengeId || !data.userId){
        return res.status(400).json({message: "Missing required data"})
    }

    const callback = (error, results, fields) => {
        if (error){
            console.error("Error reading challenge and user", error)
            return res.status(500).json(error)
        }

        if(results.length === 0){
            return res.status(404).json({
                message: "Challenge or User does not exists"
            })
        }
        else {
            res.locals.userId = data.userId
            res.locals.challengeId = data.challengeId
            res.locals.details = data.details
            next()
        }
    }
    model.checkAssociationForUserAndChallenge(data, callback);
}

// MIDDLEWARE TO BLOCK USER FROM COMPLETING OWN CHALLENGE
module.exports.blockOwnChallengeCompletion = (req, res, next) => {
    const data = {
        userId: res.locals.userId,
        challengeId: res.locals.challengeId,
        details: res.locals.details,
    };

    const callback = (error, results, fields) => {
        if (error) {
            console.error("Error checking challenge creator:", error);
            return res.status(500).json(error);
        }
        
        const creatorId = results[0].creator_id;

        if (creatorId === data.userId) {
            return res.status(403).json({
                message: "You cannot complete your own challenge"
            });
        }
        else {
            res.locals.userId = data.userId
            res.locals.challengeId = data.challengeId
            res.locals.details = data.details
            next()
        }
    };

    model.blockOwnChallengeCompletion(data, callback);
};
// CREATE COMPLETION BASED ON DETAILS GIVEN
module.exports.createCompletions = (req, res, next) => {
    const data = {
        userId: res.locals.userId,
        challengeId: res.locals.challengeId,
        details: res.locals.details,
    }

    const callback = (error, results, fields) => {
        if (error) {
            console.error("Error create completion:", error);
            return res.status(500).json(error);
        } else {
            res.locals.userId = data.userId
            res.locals.challengeId = data.challengeId
            res.locals.details = data.details
            res.locals.completeId = results.insertId
            next();
        }  
    }
    model.createCompletions(data, callback);
}

// UPDATE POINTS 
module.exports.updatePoints = (req, res, next) => {
    const data = {
        userId: res.locals.userId,
        challengeId: res.locals.challengeId,
        details: res.locals.details,
        completionId: res.locals.completeId
    }

    const callback = (error, results, fields) => {
        if (error) {
            console.error("Error updating points:", error);
            return res.status(500).json(error);
        } 
        else {
            res.locals.userId = data.userId
            res.locals.challengeId = data.challengeId
            res.locals.details = data.details
            res.locals.completeId = data.completionId
            next();
        }  
    }
    model.updatePoints(data, callback);
}

// UPDATE STREAK 
module.exports.updateStreak = (req, res, next) => {
    const data = {
        userId: res.locals.userId,
        challengeId: res.locals.challengeId,
        details: res.locals.details,
        completionId: res.locals.completeId
    }

    const callback = (error, results, fields) => {
        if (error) {
            console.error("Error updating streak:", error);
            return res.status(500).json(error);
        } 
        else {
            res.locals.userId = data.userId
            res.locals.challengeId = data.challengeId
            res.locals.details = data.details
            res.locals.completeId = data.completionId
            next();
        }  
    }
    model.updateStreak(data, callback);
}

// AWARD STREAK BONUS TO USER 
module.exports.awardStreakBonus = (req, res, next) => {
    const data = {
        userId: res.locals.userId,
        challengeId: res.locals.challengeId,
        details: res.locals.details,
        completionId: res.locals.completeId
    }

    const callback = (error, results, fields) => {
        if (error) {
            console.error("Error updating streak bonus:", error);
            return res.status(500).json(error);
        } 
            return res.status(201).json({
                message: "Challenge completed",
                complete_id: data.completionId,
                challenge_id: data.challengeId,
                user_id: data.userId,
                details: data.details,
            });
    }
    model.awardStreakBonus(data, callback);
}  


// READ USER COMPLETTION BY CHALLENGE ID (SEE WHAT USER COMPLETE CERTAIN CHALLENGE)
module.exports.readUserCompletionByChallengeId = (req, res, next) => {
const data = {
    challengeId: req.params.challengeId
}
    const callback = (error, results, fields) => {
        if (error) {
            console.error("Error readUserCompletionByChallengeId:", error);
            return res.status(500).json(error)
        } else {
            if (results.length === 0){
                return res.status(404).json({
                    message: "Challenge not found"
                });
            } 
            else return res.status(200).json(results);
        }
    }
    model.readUserCompletionByChallengeId(data, callback);
}

// Read current streak 
module.exports.readCurrentStreakById = (req, res, next) => {
    const data = {
        userId:res.locals.userId
    }
    if (!data.userId) {
        return res.status(400).json({
            message: "Missing required data"
        })
    }
    const callback = (error, results, fields) => {
        if (error) {
            console.error("Error readCompletionByUserId:", error);
            return res.status(500).json(error)
        } else {
            if (results.length === 0){
                return res.status(404).json({
                    message: "User streak not found"
                });
            } 
            else return res.status(200).json(results[0].current_streak);
        }
    }
    model.readCurrentStreakById(data, callback);
}

// CHECK COMPLETION DATE

module.exports.checkCompletionDate = (req, res, next) => {
    const data = {
        userId: res.locals.userId,
        challengeId: res.locals.challengeId,
        details: res.locals.details,
    }
    const callback = (error, results, fields) => {
        
        if (error){
            console.error("Error reading challenge and user", error)
            return res.status(500).json(error)
        }
        const today = new Date().toISOString().split('T')[0];
        if (results && results.length > 0) {
            const dbDate = new Date(results[0].completed_on).toISOString().split('T')[0]
                    if(dbDate === today) {
            return res.status(409).json({
                message: "Already completed the challenge"
            })
        }
        }
            res.locals.userId = data.userId
            res.locals.challengeId = data.challengeId
            res.locals.details = data.details
            next()
        
    }
    model.checkCompletionDate(data, callback);
}
