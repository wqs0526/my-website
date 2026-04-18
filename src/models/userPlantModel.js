const pool = require('../services/db');

// CHECK IF USER EXIST 
module.exports.checkIfUserExists = (data, callback) => {
    const SQLSTATEMENT = `
    SELECT * FROM User 
    WHERE user_id = ?
    `;
    const VALUES = [data.userId];
    pool.query(SQLSTATEMENT, VALUES, callback);
};
// READ USER PLANT BY ID 
module.exports.readUserPlantById = (data, callback) =>
{
    const SQLSTATEMENT = `
        SELECT 
            UserPlant.user_plant_id AS inventory_id, 
            UserPlant.user_id, 
            UserPlant.plant_id, 
            UserPlant.is_planted, 
            Plant.plant_type, 
            Plant.rarity,
            Plant.price
        FROM UserPlant UserPlant
        INNER JOIN Plant Plant ON UserPlant.plant_id = Plant.plant_id
        WHERE UserPlant.user_id = ?;
    `;
    const VALUES = [data.userId];

    pool.query(SQLSTATEMENT, VALUES, callback)
}

// CHECK IF USER AND PLANT EXISTS 
module.exports.checkIfUserAndPlantExists = (data, callback) => {
    const SQLSTATEMENT = `
        SELECT User.user_id, Plant.plant_id, Plant.price
        FROM User, Plant 
        WHERE User.user_id = ? AND Plant.plant_id = ?;
    `;
    const VALUES = [data.userId, data.plantId]
     
    pool.query(SQLSTATEMENT, VALUES, callback);
};

// CHECK IF USER HAS ENOUGH POINTS 
module.exports.checkIfUserHasEnoughPoints = (data, callback) => {
    const SQLSTATEMENT = `
        SELECT points FROM User
        WHERE user_id = ?;
    `;
    const VALUES = [data.userId];
    pool.query(SQLSTATEMENT, VALUES, callback);
};

// PURCHASE PLANT 
module.exports.purchasePlant = (data, callback) => {
    const SQLSTATEMENT = `
        INSERT INTO UserPlant (user_id, plant_id, is_planted)
        VALUES (?, ?, FALSE);
    `;
    const VALUES = [data.userId, data.plantId];

    pool.query(SQLSTATEMENT, VALUES, callback);
};

// DEDUCT POINTS
module.exports.deductUserPoints = (data, callback) => {
    const SQLSTATEMENT = `
        UPDATE User
        SET points = points - ?
        WHERE user_id = ? AND points >= ?;
    `;
    const VALUES = [data.price, data.userId, data.price];

    pool.query(SQLSTATEMENT, VALUES, callback);
};

// CHECK IF USER OWN THE TREE 
module.exports.checkIfUserOwnsPlant = (data, callback) => {
    const SQLSTATEMENT = `
        SELECT is_planted
        FROM UserPlant
        WHERE user_id = ? AND plant_id = ?;
    `;
    const VALUES = [data.userId, data.plantId];

    pool.query(SQLSTATEMENT, VALUES, callback);
};

// UPDATE PLANT STATUS 
module.exports.updatePlantStatus = (data, callback) => {
    const SQLSTATEMENT = `
        UPDATE UserPlant
        SET is_planted = ?
        WHERE user_id = ? AND plant_id = ?
    `;
    const VALUES = [data.isPlanted, data.userId, data.plantId];

    pool.query(SQLSTATEMENT, VALUES, callback);
};

// DELETE PLANT (SELL)
module.exports.deleteUser = (data, callback) => {
    const SQLSTATEMENT = `
        DELETE FROM UserPlant
        WHERE user_plant_id = ? AND user_id = ?;
    `;
    const VALUES = [data.inventoryId, data.userId];
    pool.query(SQLSTATEMENT, VALUES, callback);
};

// REFUND POINTS 
module.exports.refundPoint = (data, callback) => {
    const SQLSTATEMENT = `
        UPDATE User 
        SET points = points + ? 
        WHERE user_id = ?;
    `;
    const VALUES = [data.price, data.userId];
    pool.query(SQLSTATEMENT, VALUES, callback);
};