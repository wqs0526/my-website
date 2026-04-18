const model = require("../models/plantModel");


// READ ALL PLANT 
module.exports.readAllPlant = (req, res, next) => {
    const callback = (error, results, fields) => {
        if (error) {
            console.error("Error readAllPlant:", error);
            return res.status(500).json(error);
        }
        else return res.status(200).json(results)
    }
    model.readAllPlant(callback);
}

// READ PLANT BY ID
module.exports.readPlantById = (req, res, next) => {
    const data = {
        plantId:req.params.plant_id
    }

    const callback = (error, results, fields) => {
        if (error) {
            console.error("Error readPlantById:", error);
            return res.status(500).json(error);
        } else {
            if (results.length === 0){
                return res.status(404).json({
                    message: "Plant not found"
                });
            } 
            else return res.status(200).json(results);
        }
    }
    model.readPlantById(data, callback);
}