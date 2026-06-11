require("dotenv").config();
const fs = require("fs");
const path = require("path");
const mysql = require("mysql2/promise");

async function setupDatabase() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    multipleStatements: true,
  });

  await connection.query(`CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME}\``);
  await connection.query(`USE \`${process.env.DB_NAME}\``);

  const [tables] = await connection.query(
    "SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'users'",
    [process.env.DB_NAME]
  );

  if (tables.length > 0) {
    const [columns] = await connection.query(
      "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'users' AND COLUMN_NAME = 'role'",
      [process.env.DB_NAME]
    );

    if (columns.length === 0) {
      await connection.query(
        "ALTER TABLE users ADD COLUMN role ENUM('admin','member') NOT NULL DEFAULT 'member' AFTER invite_code"
      );
    }
  }

  const schema = fs.readFileSync(path.join(__dirname, "..", "schema.sql"), "utf8");
  await connection.query(schema);
  await connection.end();
}

setupDatabase()
  .then(() => {
    console.log("Database schema is ready.");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
