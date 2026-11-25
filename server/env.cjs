const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '.env') });

const required = ['MYSQL_HOST', 'MYSQL_PORT', 'MYSQL_USER', 'MYSQL_PASSWORD', 'MYSQL_DATABASE'];
const missing = required.filter((key) => !process.env[key]);
const generating = process.argv.some((arg) => arg === 'generate');
if (missing.length && !generating) {
  throw new Error(`server/.env 缺少 ${missing.join('、')}`);
}

if (!missing.length) {
  const user = encodeURIComponent(process.env.MYSQL_USER);
  const password = encodeURIComponent(process.env.MYSQL_PASSWORD);
  const { MYSQL_HOST, MYSQL_PORT, MYSQL_DATABASE } = process.env;
  process.env.DATABASE_URL = `mysql://${user}:${password}@${MYSQL_HOST}:${MYSQL_PORT}/${MYSQL_DATABASE}`;
} else if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = 'mysql://bonnote:bonnote@127.0.0.1:3306/bonnote';
}
