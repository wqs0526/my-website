const pool = require('../services/db');

// CREATE NEW CHALLENGE
module.exports.createNewChallenge = (data, callback) =>
{
    const SQLSTATEMENT = `
        INSERT INTO WellnessChallenge (creator_id, description, points)
        VALUES (?, ?, ?);
    `;
    const VALUES = [data.userId, data.description, data.points];

    pool.query(SQLSTATEMENT, VALUES, callback);
}

// READ ALL CHALLENGES
module.exports.readAllChallenges = (callback) =>
{
    const SQLSTATEMENT = `
    
        SELECT
        WellnessChallenge.challenge_id, 
        WellnessChallenge.creator_id, 
        WellnessChallenge.description, 
        WellnessChallenge.points AS challenge_points, 
        User.user_id, 
        User.username, 
        User.email, 
        User.points AS user_points
        FROM WellnessChallenge 
        JOIN User 
        WHERE User.user_id = WellnessChallenge.creator_id
    `;
    pool.query(SQLSTATEMENT, callback);
}

// DELETE CHALLENGE BY ID 
module.exports.deleteChallengeById = (data, callback) =>
{
    const SQLSTATEMENT = `
        DELETE FROM WellnessChallenge 
        WHERE challenge_id = ?;
    `;

    const VALUES = [data.challengeId];

    pool.query(SQLSTATEMENT, VALUES, callback);
}

// MIDDLEWARE TO CHECK IF USER AND CHALLENGE EXISTS 
module.exports.checkIfUserAndChallengeExists = (data, callback) => {
    const SQLSTATEMENT = `
        SELECT User.user_id, WellnessChallenge.challenge_id
            FROM User, WellnessChallenge 
        WHERE User.user_id = ? AND WellnessChallenge.challenge_id = ?;
    `;
    const VALUES = [data.userId, data.challengeId]
    pool.query(SQLSTATEMENT, VALUES, callback)
}

// UPDATE CHALLENGE BY ID 
module.exports.updateChallengeById =(data, callback) => {
    const SQLSTATEMENT = `
        UPDATE WellnessChallenge
        SET description = ?, points = ?
        WHERE challenge_id = ?
    `;
    const VALUES = [data.description, data.points, data.challengeId];

    pool.query(SQLSTATEMENT, VALUES, callback)
}