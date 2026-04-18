const pool = require('../services/db');

// READ COMPLETION BY USER ID 
module.exports.readCompletionByUserId = (data, callback) =>
{
const SQLSTATEMENT = `
        SELECT 
            UserCompletion.completion_id, 
            UserCompletion.challenge_id, 
            UserCompletion.details, 
            UserCompletion.completed_on, 
            WellnessChallenge.points,
            WellnessChallenge.description
        FROM UserCompletion 
        JOIN WellnessChallenge ON UserCompletion.challenge_id = WellnessChallenge.challenge_id
        WHERE UserCompletion.user_id = ?
        ORDER BY UserCompletion.completed_on DESC
        LIMIT 3;
    `;
    const VALUES = [data.userId];

    pool.query(SQLSTATEMENT, VALUES, callback)
}

// MIDDLEWARE TO CHECK IF USER AND CHALLENGE EXISTS 
module.exports.checkAssociationForUserAndChallenge = (data, callback) => {
    const SQLSTATEMENT = `
        SELECT *
            FROM User, WellnessChallenge 
            WHERE User.user_id = ? AND WellnessChallenge.challenge_id = ?;
    `;
    const VALUES = [data.userId, data.challengeId]
    pool.query(SQLSTATEMENT, VALUES, callback)
}

// CREATE COMPLETION BASED ON DETAILS GIVEN
module.exports.createCompletions = (data, callback) => {
    const SQLSTATEMENT = `
    INSERT INTO UserCompletion (challenge_id, user_id, details, completed_on)
    VALUES (?, ?, ?, NOW())
    `;
    const VALUES = [data.challengeId, data.userId, data.details]
    pool.query(SQLSTATEMENT, VALUES, callback)
}

//UPDATE POINTS 
module.exports.updatePoints = (data, callback) =>
{
    const SQLSTATEMENT = `
        UPDATE User 
        JOIN WellnessChallenge 
            ON WellnessChallenge.challenge_id = ? 
        SET User.points = User.points + WellnessChallenge.points
        WHERE User.user_id = ?
    `;
    const VALUES = [data.challengeId, data.userId];

    pool.query(SQLSTATEMENT, VALUES, callback);
}

//UPDATE STREAK 
module.exports.updateStreak = (data, callback) =>
{
    const SQLSTATEMENT = `
        UPDATE Streak
        SET 
            current_streak = CASE
                WHEN last_completed_date = CURDATE() - INTERVAL 1 DAY THEN current_streak + 1
                WHEN last_completed_date < CURDATE() - INTERVAL 1 DAY OR last_completed_date IS NULL THEN 1
                ELSE current_streak
            END,
            longest_streak = CASE
                WHEN last_completed_date = CURDATE() - INTERVAL 1 DAY AND current_streak + 1 > longest_streak THEN current_streak + 1
                WHEN last_completed_date < CURDATE() - INTERVAL 1 DAY AND 1 > longest_streak THEN 1
                ELSE longest_streak
            END,
            last_completed_date = CURDATE()
        WHERE user_id = ?
    `;
    const VALUES = [data.userId];

    pool.query(SQLSTATEMENT, VALUES, callback);
}

// AWARD BONUS POINTS 
module.exports.awardStreakBonus = (data, callback) =>
{
    const SQLSTATEMENT = `
        UPDATE User 
        JOIN Streak ON Streak.user_id = User.user_id
            SET User.points = User.points + 10,
                Streak.last_bonus_date = CURDATE()
        WHERE Streak.user_id = ?
        AND Streak.current_streak >= 5
        AND Streak.last_completed_date = CURDATE()
        AND (Streak.last_bonus_date IS NULL OR Streak.last_bonus_date != CURDATE());
    `;
    const VALUES = [data.userId];

    pool.query(SQLSTATEMENT, VALUES, callback);
}


// Block user if try to complete its own challenge 
module.exports.blockOwnChallengeCompletion = (data, callback) =>
{
    const SQLSTATEMENT = `
        SELECT creator_id
            FROM WellnessChallenge
        WHERE challenge_id = ?;
    `;
    const VALUES = [data.challengeId];

    pool.query(SQLSTATEMENT, VALUES, callback);
}

// READ USER COMPLETTION BY CHALLENGE ID (SEE WHAT USER COMPLETE CERTAIN CHALLENGE)
module.exports.readUserCompletionByChallengeId = (data, callback) =>
{
    const SQLSTATEMENT = `
        SELECT 
            u.user_id, 
            u.username, 
            u.email, 
            c.completed_on, 
            c.details
        FROM UserCompletion c
        JOIN User u ON c.user_id = u.user_id
        WHERE c.challenge_id = ? 
        ORDER BY c.completed_on DESC;
    `;
    VALUE = [data.challengeId]
    pool.query(SQLSTATEMENT, VALUE, callback)
}

// READ CURRENT STREAK 
module.exports.readCurrentStreakById = (data, callback) =>
{
    const SQLSTATEMENT = `
        SELECT current_streak FROM Streak
        WHERE user_id = ?;
    `;
    const VALUES = [data.userId];

    pool.query(SQLSTATEMENT, VALUES, callback)
}

// CHECK COMPLETION DATE 
module.exports.checkCompletionDate = (data, callback) =>
{
    const SQLSTATEMENT = `
        SELECT completed_on FROM UserCompletion
        WHERE user_id = ? AND challenge_id = ?
        ORDER BY completed_on DESC
        LIMIT 1;
    `;
    const VALUES = [data.userId, data.challengeId];

    pool.query(SQLSTATEMENT, VALUES, callback)
}
