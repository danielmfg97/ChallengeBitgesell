const morgan = require('morgan');
const fs = require('fs');
const path = require('path');

const logDir = path.join(__dirname, '../../logs');

if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

const accessLogStream = fs.createWriteStream(
  path.join(logDir, 'access.log'),
  { flags: 'a' }
);

morgan.token('timestamp', () => new Date().toISOString());
const format = '[:timestamp] :method :url :status - :response-time ms';

module.exports = morgan(format, {
  stream: accessLogStream,
  skip: (req, res) => req.originalUrl.startsWith('/health')
});
