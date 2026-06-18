require("dotenv").config();
const fs = require("fs");
const path = require("path");
const mysql = require("mysql2/promise");

async function setupDatabase() {
  const requiredEnv = ["DB_HOST", "DB_PORT", "DB_USER", "DB_PASSWORD", "DB_NAME"];

  for (const key of requiredEnv) {
    if (!process.env[key]) {
      throw new Error(`${key} is required in the environment.`);
    }
  }

  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    multipleStatements: true,
  });

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

  const adminEmail = String(process.env.ADMIN_EMAIL || "").trim().toLowerCase();

  if (adminEmail) {
    await connection.query("UPDATE users SET role = 'admin' WHERE email = ?", [adminEmail]);
  }

  await connection.query(`
    CREATE TABLE IF NOT EXISTS trip_members (
      trip_id INT UNSIGNED NOT NULL,
      user_id INT UNSIGNED NOT NULL,
      added_by INT UNSIGNED NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (trip_id, user_id),
      CONSTRAINT trip_members_trip_fk FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE CASCADE,
      CONSTRAINT trip_members_user_fk FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      CONSTRAINT trip_members_added_by_fk FOREIGN KEY (added_by) REFERENCES users(id) ON DELETE SET NULL
    )
  `);
  await connection.query(`
    CREATE TABLE IF NOT EXISTS memory_members (
      memory_id INT UNSIGNED NOT NULL,
      user_id INT UNSIGNED NOT NULL,
      added_by INT UNSIGNED NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (memory_id, user_id),
      CONSTRAINT memory_members_memory_fk FOREIGN KEY (memory_id) REFERENCES memories(id) ON DELETE CASCADE,
      CONSTRAINT memory_members_user_fk FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      CONSTRAINT memory_members_added_by_fk FOREIGN KEY (added_by) REFERENCES users(id) ON DELETE SET NULL
    )
  `);
  await connection.query(`
    INSERT IGNORE INTO trip_members (trip_id, user_id, added_by)
    SELECT id, created_by, created_by
    FROM trips
    WHERE created_by IS NOT NULL
  `);
  await connection.query(`
    INSERT IGNORE INTO memory_members (memory_id, user_id, added_by)
    SELECT id, created_by, created_by
    FROM memories
    WHERE created_by IS NOT NULL
  `);
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
