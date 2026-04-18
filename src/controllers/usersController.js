const model = require("../models/usersModel");

//MIDDLEWARE TO CHECK IF USERNAME ALREADY TAKEN 
module.exports.checkIfUserExists = (req, res, next) => {
    const data = {
        username: req.body.username,
        email: req.body.email
    }

    if (!data.username || !data.email){
        return res.status(400).json({
            message: "Username and email required"
        });
    }

    const callback = (error, results, fields) => {
        if (error) {
            console.error("Error checking user:", error);
            return res.status(500).json(error);
        } 
        if (results.length != 0){
            return res.status(409).json({
                message: "Username or email already taken"
            });
        } else{
            res.locals.username = data.username
            res.locals.email = data.email
            next();
        }  
    }
    model.checkIfUserExists(data, callback);
}

//IF THE USERNAME IS NOT TAKEN THEN CREATE USER
module.exports.createNewUser = (req, res, next) => {
    const data = {
        username: req.body.username,
        email: req.body.email,
        password: res.locals.hash
    }

    const callback = (error, results, fields) => {
        if (error) {
            console.error("Error create user:", error);
            return res.status(500).json(error);
        } else{
            res.locals.username = data.username
            res.locals.userId = results.insertId
            next();
        }  
    }
    model.createNewUser(data, callback);
}

// CREATE STREAK ROW
module.exports.createStreakRowForUser = (req, res, next) => {
    const data = {
        userId: res.locals.userId,
        username: res.locals.username
    }

    const callback = (error, results, fields) => {
        if (error) {
            console.error("Error create streak row for user:", error);
            return res.status(500).json(error);
        } else{
            res.locals.userId = data.userId
            next();
        }  
    }
    model.createStreakRowForUser(data, callback);
}

// GIVE USER FREE PLANT
module.exports.createFreePlantForUser = (req, res, next) => {
    const data = {
        userId: res.locals.userId,
        username: res.locals.username
    }

    const callback = (error, results, fields) => {
        if (error) {
            console.error("Error create free plant for user:", error);
            return res.status(500).json(error);
        } 
        next()
    }
    model.createFreePlantForUser(data, callback);
}

//READ  ALL USER
module.exports.readAllUser = (req, res, next) => {
    const callback = (error, results, fields) => {
        if (error) {
            console.error("Error readAllUser:", error);
            return res.status(500).json(error);
        }
        else return res.status(200).json(results)
    }
    model.readAllUser(callback);
}

//READ USER BY ID 
module.exports.readUserById = (req, res, next) => {
    console.log("DEBUG: userId from JWT =", res.locals.userId);
    const data = {
        userId:res.locals.userId
    }

    const callback = (error, results, fields) => {
        if (error) {
            console.error("Error readUserById:", error);
            return res.status(500).json(error)
        } else {
            if (results.length === 0){
                return res.status(404).json({
                    message: "User not found"
                });
            } 
            
            else return res.status(200).json(results[0]);
            
        }
    }
    model.readUserById(data, callback);
}  

// UPDATE USERNAME BY USER ID 
module.exports.updateUsername = (req, res, next) => {
    const data = {
        userId: res.locals.userId, 
        username: req.body.username
    }

    if (!data.userId){
        return res.status(400).json({
            message: "Missing required data"
        })
    }
    const callback = (error, results, fields) => {
        if (error) {
            console.error("Error updateUsernameById:", error);
            return res.status(500).json(error)
        } else {
            if (results.affectedRows === 0){
                return res.status(404).json({
                    message: "User not found"
                });
            } 
            else return res.status(200).json({
                userId: data.userId,
                username: data.username
            });
        }
    }
    model.updateUsername(data, callback);
}  

// Login 
module.exports.login = (req, res, next) => {
    const data = {
        email: req.body.email,
        password: req.body.password
    }

    if (!data.email || !data.password){
        return res.status(400).json({
            message: "Missing required data"
        })
    }
    const callback = (error, results, fields) => {
        if (error){
            console.error("Error reading user", error)
            return res.status(500).json(error)
        }

        if (results.length === 0){
            return res.status(404).json({
                message: "User not found"
            })
        }
        else{
            res.locals.userId = results[0].user_id
            res.locals.hash = results[0].password
            res.locals.message = "Login successful"
            next();
        }
    }
    model.login(data, callback);
}

// DELETE USER
module.exports.deleteUser = (req, res, next) => {
    const data = {
        userId: res.locals.userId 
    }

    const callback = (error, results, fields) => {
        if (error){
            console.error("Error deleteChallengeById:", error);
            return res.status(500).json(error);
        }
            else return res.status(204).send(); // 204 No Content
    }
    model.deleteUser(data, callback);
}

//  CHECK USERNAME 
module.exports.checkUsername = (req, res, next) => {
    const data = {
        userId: res.locals.userId,
        username: req.body.username
    }

    if (!data.username || !data.userId){
        return res.status(400).json({
            message: "Missing required data"
        });
    }

    const callback = (error, results, fields) => {
        if (error) {
            console.error("Error checking user:", error);
            return res.status(500).json(error);
        } 
        if (results.length != 0){
            return res.status(409).json({
                message: "Username taken"
            });
        } else{
            res.locals.username = data.username
            res.locals.userId = data.userId
            next();
        }  
    }
    model.checkIfUserExists(data, callback);
}