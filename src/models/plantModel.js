const pool = require('../services/db');

// READ ALL PLANT
module.exports.readAllPlant = (callback) =>
{
    const SQLSTATEMENT = `
        SELECT * FROM Plant
        WHERE price > 0;
    `;
    pool.query(SQLSTATEMENT, callback);
}

// READ PLANT BY ID 
module.exports.readPlantById = (data, callback) =>
{
    const SQLSTATEMENT = `
        SELECT * FROM Plant
        WHERE plant_id = ?;
    `;
    const VALUES = [data.plantId];

    pool.query(SQLSTATEMENT, VALUES, callback)
}
