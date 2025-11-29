/**
 * Centralized Logging Service
 * Provides structured logging with different log levels
 */

const logLevels = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3
};

const currentLogLevel = process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'INFO' : 'DEBUG');

class Logger {
  constructor() {
    this.logLevel = logLevels[currentLogLevel] || logLevels.INFO;
  }

  /**
   * Format log message with timestamp and level
   */
  formatMessage(level, message, meta = {}) {
    const timestamp = new Date().toISOString();
    const metaStr = Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta)}` : '';
    return `[${timestamp}] [${level}] ${message}${metaStr}`;
  }

  /**
   * Log error
   */
  error(message, meta = {}) {
    if (this.logLevel >= logLevels.ERROR) {
      console.error(this.formatMessage('ERROR', message, meta));
    }
  }

  /**
   * Log warning
   */
  warn(message, meta = {}) {
    if (this.logLevel >= logLevels.WARN) {
      console.warn(this.formatMessage('WARN', message, meta));
    }
  }

  /**
   * Log info
   */
  info(message, meta = {}) {
    if (this.logLevel >= logLevels.INFO) {
      console.log(this.formatMessage('INFO', message, meta));
    }
  }

  /**
   * Log debug
   */
  debug(message, meta = {}) {
    if (this.logLevel >= logLevels.DEBUG) {
      console.log(this.formatMessage('DEBUG', message, meta));
    }
  }

  /**
   * Log HTTP request
   */
  http(req, res, responseTime) {
    const logData = {
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      responseTime: `${responseTime}ms`,
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get('user-agent')
    };

    if (res.statusCode >= 500) {
      this.error('HTTP Request', logData);
    } else if (res.statusCode >= 400) {
      this.warn('HTTP Request', logData);
    } else {
      this.info('HTTP Request', logData);
    }
  }
}

// Export singleton instance
module.exports = new Logger();

