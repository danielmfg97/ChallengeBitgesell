const express = require('express');
const path = require('path');
const logger = require('./middleware/logger');
const itemsRouter = require('./routes/items');
const statsRouter = require('./routes/stats');
const cors = require('cors');
const { getCookie, notFound } = require('./middleware/errorHandler');

const app = express();
const port = process.env.PORT || 3001;

app.use(cors({ origin: 'http://localhost:3000' }));

app.use(express.json());

app.use(logger);

app.use('/api/items', itemsRouter);
app.use('/api/stats', statsRouter);

app.use('*', notFound);

getCookie();

app.listen(port, () => {
  console.log(`Backend running on http://localhost:${port}`);
});
