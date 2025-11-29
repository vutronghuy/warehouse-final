/**
 * Environment Variables Validation
 * Validates required environment variables when application starts
 */

const requiredEnvVars = [
  'DB_URI',
  'JWT_SECRET'
];

const optionalEnvVars = {
  'MONGO_URI': 'DB_URI', // Alternative to DB_URI
  'PORT': '3003',
  'NODE_ENV': 'development',
  'ADMIN_KEY': null
};

/**
 * Validate required environment variables
 * @throws {Error} If any required variable is missing
 */
function validateEnv() {
  const missing = [];
  const warnings = [];

  // Check required variables
  for (const varName of requiredEnvVars) {
    if (!process.env[varName]) {
      // Check if there's an alternative
      if (varName === 'DB_URI' && process.env.MONGO_URI) {
        // MONGO_URI is alternative to DB_URI
        continue;
      }
      missing.push(varName);
    }
  }

  // Check optional variables and provide warnings
  for (const [varName, defaultValue] of Object.entries(optionalEnvVars)) {
    if (!process.env[varName] && defaultValue === null) {
      warnings.push(`${varName} is not set (optional but recommended)`);
    }
  }

  // Throw error if required variables are missing
  if (missing.length > 0) {
    const errorMsg = `Missing required environment variables: ${missing.join(', ')}\n` +
      `Please set these variables in your .env file or environment.`;
    throw new Error(errorMsg);
  }

  // Log warnings for optional variables
  if (warnings.length > 0 && process.env.NODE_ENV !== 'production') {
    console.warn('⚠️  Environment variable warnings:');
    warnings.forEach(warning => console.warn(`   - ${warning}`));
  }

  // Set defaults for optional variables if not set
  for (const [varName, defaultValue] of Object.entries(optionalEnvVars)) {
    if (!process.env[varName] && defaultValue !== null) {
      process.env[varName] = defaultValue;
      console.log(`ℹ️  Using default value for ${varName}: ${defaultValue}`);
    }
  }

  console.log('✅ Environment variables validated successfully');
  return true;
}

module.exports = { validateEnv };

