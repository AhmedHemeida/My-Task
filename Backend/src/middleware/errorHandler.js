function notFound(req, res) {
  res.status(404).json({ message: `Route ${req.originalUrl} not found` });
}

function errorHandler(err, req, res, next) {
  if (process.env.NODE_ENV !== 'test') console.error(err);

  if (err.name === 'CastError') {
    return res.status(400).json({ message: `Invalid ${err.path}` });
  }
  if (err.name === 'ValidationError') {
    return res.status(400).json({ message: err.message });
  }
  if (err.code === 11000) {
    return res.status(409).json({ message: 'Email is already registered' });
  }

  res.status(err.status || 500).json({ message: err.message || 'Something went wrong' });
}

module.exports = { notFound, errorHandler };
