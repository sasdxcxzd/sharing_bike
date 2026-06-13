/**
 * Express Application Setup.
 * Configures middleware, routes, and error handling.
 */
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const routes = require('./routes/index');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// --- Global Middleware ---
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('[:date[iso]] :method :url :status :response-time ms'));
}

// --- API Routes ---
app.use('/api/v1', routes);

// --- 404 Handler ---
app.use((req, res) => {
  res.status(404).json({
    code: 404,
    message: `Route ${req.method} ${req.originalUrl} not found`,
  });
});

// --- Global Error Handler ---
app.use(errorHandler);

module.exports = app;
