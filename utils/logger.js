import chalk from 'chalk';

// Logging system
const logger = {
    // Base logging function
    log: (level, message, value = '') => {
        const now = new Date().toLocaleString();

        // Color configuration for different log levels
        const colors = {
            info: chalk.cyanBright,    // Info - Cyan
            warn: chalk.yellow,        // Warning - Yellow
            error: chalk.red,          // Error - Red
            success: chalk.blue,       // Success - Blue
            debug: chalk.magenta,      // Debug - Magenta
        };

        const color = colors[level] || chalk.white;
        const levelTag = `[ ${level.toUpperCase()} ]`;
        const timestamp = `[ ${now} ]`;

        const formattedMessage = `${chalk.cyanBright("[ LitasBot ]")} ${chalk.grey(timestamp)} ${color(levelTag)} ${message}`;

        // Set different colors for log values based on log level
        let formattedValue = ` ${chalk.green(value)}`;
        if (level === 'error') {
            formattedValue = ` ${chalk.red(value)}`;
        } else if (level === 'warn') {
            formattedValue = ` ${chalk.yellow(value)}`;
        }
        if (typeof value === 'object') {
            const valueColor = level === 'error' ? chalk.red : chalk.green;
            formattedValue = ` ${valueColor(JSON.stringify(value))}`;
        }

        console.log(`${formattedMessage}${formattedValue}`);
    },

    // Shortcut methods for different log levels
    info: (message, value = '') => logger.log('info', message, value),
    warn: (message, value = '') => logger.log('warn', message, value),
    error: (message, value = '') => logger.log('error', message, value),
    success: (message, value = '') => logger.log('success', message, value),
    debug: (message, value = '') => logger.log('debug', message, value),
};

export default logger;

