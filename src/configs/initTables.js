// ##############################################################
// REQUIRE MODULES
// ##############################################################
const pool = require("../services/db");

// ##############################################################
// DEFINE SQL STATEMENTS
// ##############################################################

const SQLSTATEMENT = `
DROP TABLE IF EXISTS UserPlant;
DROP TABLE IF EXISTS Plant;
DROP TABLE IF EXISTS Streak;
DROP TABLE IF EXISTS UserCompletion;
DROP TABLE IF EXISTS WellnessChallenge;
DROP TABLE IF EXISTS User;

SET FOREIGN_KEY_CHECKS = 1;

CREATE TABLE User (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    password VARCHAR(255) NOT NULL,
    points INT DEFAULT 20
);

CREATE TABLE WellnessChallenge (
    challenge_id INT AUTO_INCREMENT PRIMARY KEY,
    creator_id INT NOT NULL,
    description TEXT NOT NULL,
    points INT NOT NULL,    
    CONSTRAINT fk_challenge_creator
      FOREIGN KEY (creator_id)
      REFERENCES User(user_id)
      ON DELETE CASCADE
);

CREATE TABLE UserCompletion (
    completion_id INT AUTO_INCREMENT PRIMARY KEY,
    challenge_id INT NOT NULL,
    user_id INT NOT NULL,
    details TEXT,
    completed_on DATETIME DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_completion_challenge
      FOREIGN KEY (challenge_id)
      REFERENCES WellnessChallenge(challenge_id)
      ON DELETE CASCADE,

    CONSTRAINT fk_completion_user
      FOREIGN KEY (user_id)
      REFERENCES User(user_id)
      ON DELETE CASCADE
);

CREATE TABLE Plant (
    plant_id INT AUTO_INCREMENT PRIMARY KEY,
    plant_type VARCHAR(50) NOT NULL,
    price INT NOT NULL,
    rarity TEXT
);

CREATE TABLE UserPlant (
    user_plant_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    plant_id INT NOT NULL,
    is_planted BOOLEAN DEFAULT FALSE,
    CONSTRAINT fk_userplant_user
      FOREIGN KEY (user_id)
      REFERENCES User(user_id)
      ON DELETE CASCADE,

    CONSTRAINT fk_userplant_plant
      FOREIGN KEY (plant_id)
      REFERENCES Plant(plant_id)
      ON DELETE CASCADE
);

CREATE TABLE Streak (
    streak_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    current_streak INT DEFAULT 0,
    longest_streak INT DEFAULT 0,
    last_completed_date DATE,
    last_bonus_date DATE,

    CONSTRAINT fk_streak_user
      FOREIGN KEY (user_id)
      REFERENCES User(user_id)
      ON DELETE CASCADE,

    UNIQUE KEY uq_streak_user (user_id)
);

INSERT INTO User (username, email, password) VALUES
('Lily', 'lily@example.com', 'password123'),
('Kai', 'kai@example.com', 'password123'),
('Aiden', 'aiden@example.com', 'password123');

INSERT INTO WellnessChallenge (creator_id, description, points) VALUES
(1, 'Morning Sunshine - Step outside and get 5 minutes of sunlight', 10),
(1, 'Tiny Adventure - Walk for 10 minutes without using your phone', 15),
(1, 'Hydration Hero - Drink 6 glasses of water today', 10),
(1, 'Mind Reset - Do 5 minutes of deep breathing or meditation', 15),
(2, 'Sleep Guardian - Sleep at least 7 hours tonight', 20),
(2, 'Digital Detox - No social media for 1 hour', 15),
(2, 'Green Fuel - Eat at least one serving of vegetables', 10),
(3, 'Nature Bond - Spend 10 minutes outdoors', 15),
(3, 'Gratitude Bloom - Write down 3 things you are grateful for', 10),
(3, 'Energy Burst - Do any physical activity for 15 minutes', 20);

INSERT INTO Plant (plant_type, price, rarity) VALUES
('Sunflower', 0, 'Common'),  
('Daisy', 15, 'Common'), 
('Tulip', 20, 'Common'), 
('Lavender', 25, 'Rare'),  
('Blue Poppy', 35, 'Rare'), 
('Lily', 45, 'Rare'),
('Rose', 55, 'Epic'), 
('Bird of Paradise', 75, 'Epic'),
('Orchid', 90, 'Legendary'),
('Lotus', 99, 'Legendary'); 

INSERT INTO UserPlant (user_id, plant_id, is_planted) VALUES 
(1, 1, FALSE),
(2, 1, FALSE),
(3, 1, FALSE);

INSERT INTO Streak (user_id, current_streak, longest_streak, last_completed_date, last_bonus_date) VALUES
(1, 4, 5, '2026-1-3', NULL),
(2, 1, 3, '2026-1-3', NULL),
(3, 0, 0, NULL, NULL);
`
// ##############################################################
// RUN SQL STATEMENTS
// ##############################################################
pool.query(SQLSTATEMENT, (error, results, fields) => {
  if (error) {
    console.error("Error creating tables:", error);
  } else {
    console.log("Tables created successfully");
  }
  process.exit();
});