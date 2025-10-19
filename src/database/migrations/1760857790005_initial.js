/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const up = async (pgm) => {
  pgm.sql(`
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp"
  `);

  await pgm.db.query(`
    CREATE TABLE IF NOT EXISTS users
    (
      id            UUID PRIMARY KEY,
      name          TEXT      NOT NULL,
      first_name    TEXT      NOT NULL,
      last_name     TEXT      NOT NULL,
      email         TEXT      NOT NULL,
      avatar_url    TEXT,
      role          TEXT,
      created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);

  const adminUserId = crypto.randomUUID();

  await pgm.db.query(`
    INSERT INTO users (id, name, first_name, last_name, email, role, avatar_url) 
    VALUES ('${adminUserId}', 'Rotten Brain', 'Roman', 'Levenets', 'poison.romka@gmail.com', 'admin', 
      'https://media.licdn.com/dms/image/v2/D4E03AQGcImpBrQACkA/profile-displayphoto-shrink_800_800/B4EZYltacrG0Ac-/0/1744389385337?e=1762387200&v=beta&t=zl4Rwiv3PMGPYN4X5LM2TvkWfXH1yEoWAgWxYiRMRTs'
    );
  `);
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const down = (pgm) => pgm.dropTable('users');
