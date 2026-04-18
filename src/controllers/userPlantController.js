const model = require("../models/userPlantModel");

// CHECK IF USER EXIST 
module.exports.checkIfUserExists = (req, res, next) => {
    const data = {
        userId: res.locals.userId
    }
    if (!data.userId){
        return res.status(400).json({
            message: "Missing required data"
        })
    }
    const callback = (error, results, fields) => {
        if (error) {
            console.error("Error checking user:", error);
            return res.status(500).json(error);
        } 
        if (results.length === 0){
            return res.status(404).json({
                message: "User not found"
            });
        } else{
            res.locals.userId = data.userId
            next();
        }  
    }
    model.checkIfUserExists(data, callback);
}

// READ USER PLANT BY ID 
module.exports.readUserPlantById = (req, res, next) => {
    const data = {
        userId: res.locals.userId
    }
    const callback = (error, results, fields) => {
        if (error) {
            console.error("Error readUserPlantById:", error);
            return res.status(500).json(error);
        } 
    return res.status(200).json(results);
        
    }
    model.readUserPlantById(data, callback);
}

// CHECK IF USER AND PLANT EXISTS
module.exports.checkIfUserAndPlantExists = (req, res, next) => {
    const data = {
        userId: res.locals.userId,
        plantId: req.body.plantId
    }

    if (!data.userId || !data.plantId){
        return res.status(400).json({
            message: "Missing required data"
        });
    }

    const callback = (error, results, fields) => {
        if (error) {
            console.error("Error checkIfUserAndPlantExists:", error);
            return res.status(500).json(error);
        } 
        if (results.length === 0){
            return res.status(404).json({
                message: "User or plant does not exists"
            });
        } else{
            res.locals.userId = data.userId
            res.locals.plantId = data.plantId
            res.locals.price = results[0].price;
            next();
        }  
    }
    model.checkIfUserAndPlantExists(data, callback);
}

// CHECK IF USER ALREADY OWN THE TREE 
module.exports.checkIfUserAlreadyOwnTheTree = (req, res, next) => {
    const data = {
        userId: res.locals.userId,
        plantId: res.locals.plantId, 
        price: res.locals.price
    }

    const callback = (error, results, fields) => {
        if (error) {
            console.error("Error checkIfUserAlreadyOwnTheTree:", error);
            return res.status(500).json(error);
        } 
        if (results.length > 0) {
            return res.status(409).json({message: "User already owned the tree"})
        }
        else {
            res.locals.userId = data.userId
            res.locals.plantId = data.plantId
            res.locals.plantPrice = data.price
            next();
            };
        }
    model.checkIfUserAlreadyOwnTheTree(data, callback);
    }

    // CHECK IF USER HAS ENGOUH POINTS 
    module.exports.checkIfUserHasEnoughPoints = (req, res, next) => {
        const data = {
            userId: res.locals.userId,
            plantId: res.locals.plantId, 
            price: res.locals.price
        }
    
        const callback = (error, results, fields) => {
            if (error) {
                console.error("Error checkIfUserHasEnoughPoints:", error);
                return res.status(500).json(error);
            } 
            const userPoints = results[0].points;
            if (userPoints < data.price) {
                return res.status(403).json({ message: "Not enough points to purchase this plant" });
            }
            else {
                res.locals.userId = data.userId
                res.locals.plantId = data.plantId
                res.locals.price = data.price 
                next();
                };
            }
        model.checkIfUserHasEnoughPoints(data, callback);
        }

        // PURCHASE PLANT IF USER AND PLANT EXISTS AND HAVE ENOUGH POINTS 
        module.exports.purchasePlant = (req, res, next) => {
            const data = {
                userId: res.locals.userId,
                plantId: res.locals.plantId,
                price: res.locals.price
            }
        
            const callback = (error, results, fields) => {
                if (error) {
                    console.error("Error purchase plant for user:", error);
                    return res.status(500).json(error);
                } else {
                    res.locals.userId = data.userId
                    res.locals.plantId = data.plantId
                    res.locals.price = data.price
                    next();
                }  
            }
            model.purchasePlant(data, callback);
        }
        
        // DEDUCT USER POINTS
        module.exports.deductUserPoints = (req, res, next) => {
            const data = {
                userId: res.locals.userId,
                plantId: res.locals.plantId,
                price: res.locals.price
            }
        if(!data.price){
            console.log("No price")
        }
            const callback = (error, results, fields) => {
                if (error) {
                    console.error("Error deducting points:", error);
                    return res.status(500).json(error);
                } 
                    return res.status(201).json({
                        message: "Plant purchased successfully",
                        user_id: data.userId,
                        plant_id: data.plantId,
                        points_deducted: data.price
                    });
            }
            model.deductUserPoints(data, callback);
        }


// DELETE PLANT 

module.exports.deletePlant = (req, res, next) => {
    const data = {
        userId: res.locals.userId,
        inventoryId: req.params.inventoryId
    }

    const callback = (error, results, fields) => {
        if (error){
            console.error("Error sellPlantById:", error);
            return res.status(500).json(error);
        }
        if (results.affectedRows === 0) {
            return res.status(404).json({ message: "Item not found or does not belong to user" });
        }
        next(); 
    }
    model.deleteUser(data, callback);
}


module.exports.refundPoint = (req, res, next) => {
    const data = {
        userId: res.locals.userId,
        price: req.body.price
    };

    if (!data.userId || !data.price) {
        return res.status(400).json({
            message: "Missing required data"
        });
    }

    const callback = (error, results) => {
        if (error) {
            console.error("Plant deleted, but points refund failed", error);
            return res.status(500).json(error);
        }

        res.status(200).json({ 
                    message: "Plant sold successfully!",
                    refunded: data.price 
                });
            }
    model.refundPoint(data, callback);
};