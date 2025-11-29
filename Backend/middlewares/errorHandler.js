
class AppError extends Error {
  constructor(message, statusCode = 500, code = null, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }
}

function sendErrorResponse(res, statusCode, message, code = null, details = null) {
  const response = {
    success: false,
    ok: false,
    message: message,
    ...(code && { code }),
    ...(details && process.env.NODE_ENV !== 'production' && { details })
  };

  return res.status(statusCode).json(response);
}


function errorHandler(err, req, res, next) {
  // Log error
  console.error('❌ Error:', {
    message: err.message,
    stack: process.env.NODE_ENV !== 'production' ? err.stack : undefined,
    url: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString()
  });

  // Handle known application errors
  if (err instanceof AppError) {
    return sendErrorResponse(res, err.statusCode, err.message, err.code);
  }

  // Handle MongoDB validation errors
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(e => e.message).join(', ');
    return sendErrorResponse(res, 400, `Validation Error: ${messages}`, 'VALIDATION_ERROR');
  }

  // Handle MongoDB duplicate key errors
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern || {})[0] || 'field';
    return sendErrorResponse(res, 409, `${field} already exists`, 'DUPLICATE_KEY_ERROR');
  }

  // Handle MongoDB cast errors (invalid ObjectId, etc.)
  if (err.name === 'CastError') {
    return sendErrorResponse(res, 400, `Invalid ${err.path}: ${err.value}`, 'CAST_ERROR');
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    return sendErrorResponse(res, 401, 'Invalid token', 'INVALID_TOKEN');
  }

  if (err.name === 'TokenExpiredError') {
    return sendErrorResponse(res, 401, 'Token expired', 'TOKEN_EXPIRED');
  }

  // Handle multer file upload errors
  if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return sendErrorResponse(res, 400, 'File too large', 'FILE_TOO_LARGE');
    }
    return sendErrorResponse(res, 400, `File upload error: ${err.message}`, 'FILE_UPLOAD_ERROR');
  }

  // Default: Internal server error
  const message = process.env.NODE_ENV === 'production'
    ? 'Internal server error'
    : err.message;

  return sendErrorResponse(res, 500, message, 'INTERNAL_SERVER_ERROR', 
    process.env.NODE_ENV !== 'production' ? err.stack : null);
}


function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}


function notFoundHandler(req, res, next) {
  return sendErrorResponse(res, 404, `Route ${req.originalUrl} not found`, 'ROUTE_NOT_FOUND');
}

module.exports = {
  AppError,
  errorHandler,
  asyncHandler,
  notFoundHandler,
  sendErrorResponse
};

