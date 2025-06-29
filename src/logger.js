/**
 * Logger class for controlled console output based on environment
 * Only outputs in 'local' or 'dev' environments
 */
class Logger {
    constructor() {
        // Get environment from process.env or fallback to import.meta.env
        this.env = this.getEnvironment()
        this.isDevelopment =
            this.env === 'local' || this.env === 'dev' || this.env === 'development'
    }

    /**
     * Get current environment
     * @returns {string} Current environment
     */
    getEnvironment() {
        // For Vite/browser environment
        if (typeof import.meta !== 'undefined' && import.meta.env) {
            return import.meta.env.VITE_ENV || import.meta.env.MODE || 'production'
        }

        // For Node.js environment
        if (typeof process !== 'undefined' && process.env) {
            return process.env.ENV || process.env.NODE_ENV || 'production'
        }

        return 'production'
    }

    /**
     * Log messages (only in development environments)
     * @param {...any} args - Arguments to log
     */
    log(...args) {
        if (this.isDevelopment) {
            console.log(...args)
        }
    }

    /**
     * Log info messages (only in development environments)
     * @param {...any} args - Arguments to log
     */
    info(...args) {
        if (this.isDevelopment) {
            console.info(...args)
        }
    }

    /**
     * Log warning messages (only in development environments)
     * @param {...any} args - Arguments to log
     */
    warn(...args) {
        if (this.isDevelopment) {
            console.warn(...args)
        }
    }

    /**
     * Log error messages (always shown, regardless of environment)
     * @param {...any} args - Arguments to log
     */
    error(...args) {
        console.error(...args)
    }

    /**
     * Log debug messages (only in development environments)
     * @param {...any} args - Arguments to log
     */
    debug(...args) {
        if (this.isDevelopment) {
            console.debug(...args)
        }
    }

    /**
     * Group console logs (only in development environments)
     * @param {string} label - Group label
     */
    group(label) {
        if (this.isDevelopment) {
            console.group(label)
        }
    }

    /**
     * Group console logs collapsed (only in development environments)
     * @param {string} label - Group label
     */
    groupCollapsed(label) {
        if (this.isDevelopment) {
            console.groupCollapsed(label)
        }
    }

    /**
     * End console group (only in development environments)
     */
    groupEnd() {
        if (this.isDevelopment) {
            console.groupEnd()
        }
    }

    /**
     * Console table (only in development environments)
     * @param {any} data - Data to display in table
     */
    table(data) {
        if (this.isDevelopment) {
            console.table(data)
        }
    }

    /**
     * Console time (only in development environments)
     * @param {string} label - Timer label
     */
    time(label) {
        if (this.isDevelopment) {
            console.time(label)
        }
    }

    /**
     * Console time end (only in development environments)
     * @param {string} label - Timer label
     */
    timeEnd(label) {
        if (this.isDevelopment) {
            console.timeEnd(label)
        }
    }

    /**
     * Console trace (only in development environments)
     * @param {...any} args - Arguments to trace
     */
    trace(...args) {
        if (this.isDevelopment) {
            console.trace(...args)
        }
    }

    /**
     * Get current environment info
     * @returns {Object} Environment information
     */
    getEnvInfo() {
        return {
            environment: this.env,
            isDevelopment: this.isDevelopment,
            allowsLogging: this.isDevelopment,
        }
    }
}

// Auto-initialize logger instance
const logger = new Logger()

export default logger
export { Logger }
