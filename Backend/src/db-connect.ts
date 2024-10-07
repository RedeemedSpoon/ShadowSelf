import postgres from 'postgres';

const sql = postgres({
  host: 'localhost',
  port: 5432,
  database: process.env.DB_SERVER,
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
});

export default sql;
