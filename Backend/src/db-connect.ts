import postgres from 'postgres';

const sql = postgres({
  host: 'localhost',
  port: 5432,
  database: process.env.DB_NAME,
  username: process.env.DB_USER,
  password: process.env.DB_USER_PWD,
});

export default sql;
