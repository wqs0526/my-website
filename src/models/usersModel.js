const pool = require('../services/db');

//MIDDLEWARE TO CHECK IF USERNAME ALREADY TAKEN 
module.exports.checkIfUserExists = (data, callback) => {
    const SQLSTATEMENT = `
    SELECT username, email FROM User
    WHERE username = ? OR email = ?
    `;
    const VALUES = [data.username, data.email]
    pool.query(SQLSTATEMENT, VALUES, callback)
}

//IF THE USERNAME IS NOT TAKEN THEN CREATE USER
module.exports.createNewUser =(data, callback) => {
    const SQLSTATEMENT = `
        INSERT INTO User (username, email, password)
        VALUES (?, ?, ?)
    `;
    const VALUES = [data.username, data.email, data.password];

    pool.query(SQLSTATEMENT, VALUES, callback)
}
// CREATE STREAK ROW WHEN USER CREATED 
module.exports.createStreakRowForUser = (data, callback) => {
    const SQLSTATEMENT = `
        INSERT INTO Streak (
            user_id,
            last_completed_date
        )
        VALUES (?, NULL);
    `;
    const VALUES = [data.userId];

    pool.query(SQLSTATEMENT, VALUES, callback);
};

// CREATE FREE PLANT FOR USER 
module.exports.createFreePlantForUser = (data, callback) => {
    const SQLSTATEMENT = `
        INSERT INTO UserPlant (
            user_id,
            plant_id
        )
        VALUES (?, 1);
    `;
    const VALUES = [data.userId];

    pool.query(SQLSTATEMENT, VALUES, callback);
};
//READ  ALL USER
module.exports.readAllUser = (callback) =>
{
    const SQLSTATEMENT = `
        SELECT 
        user_id, username, points 
        FROM User
        ORDER BY points DESC
;
    `;
    pool.query(SQLSTATEMENT, callback);
}

//READ USER BY ID 
module.exports.readUserById = (data, callback) =>
{
    const SQLSTATEMENT = `
        SELECT 
        username, email, points
        FROM User
        WHERE user_id = ?;
    `;
    const VALUES = [data.userId];

    pool.query(SQLSTATEMENT, VALUES, callback)
}

// UPDATE USERNAME BY USER ID 
module.exports.updateUsername = (data, callback) =>
{
    const SQLSTATEMENT = `
        UPDATE User
        SET username = ?
        WHERE user_id = ?
    `;
    const VALUES = [data.username, data.userId];

    pool.query(SQLSTATEMENT, VALUES, callback);
}

// Login 
module.exports.login = (data, callback) => {
    const SQLSTATEMENT = `
        SELECT *
        FROM \`User\`
        WHERE email = ? ;
    `;
    const VALUES = [data.email];
    pool.query(SQLSTATEMENT, VALUES, callback);
};

// DELETE USER 
module.exports.deleteUser = (data, callback) =>
{
    const SQLSTATEMENT = `
        DELETE FROM User 
        WHERE user_id = ?;
    `;

    const VALUES = [data.userId];

    pool.query(SQLSTATEMENT, VALUES, callback);
}

// CHECK USERNAME 

module.exports.checkUsername = (data, callback) =>
{
    const SQLSTATEMENT = `
        SELECT * 
        FROM User
        WHERE user_id = ?;
    `;
    const VALUES = [data.userId];

    pool.query(SQLSTATEMENT, VALUES, callback)
}
