# Logging Configuration Documentation

This document explains how to configure logging in the Notifications Microservice using environment variables.

## Environment Variables

The logging system can be controlled through the following environment variables:

### Master Control

- **`ENABLE_LOGGING`** (default: `true`)
  - Master switch for all logging functionality
  - Set to `false` to disable ALL logging
  - When disabled, creates a no-operation logger that does nothing

### Specific Logging Controls

- **`ENABLE_CONSOLE_LOGGING`** (default: `true`)
  - Controls console/terminal output
  - Useful for development and debugging

- **`ENABLE_FILE_LOGGING`** (default: `true`)
  - Controls logging to files in the `logs/` directory
  - Files include: `application-DATE.log`, `error-DATE.log`, `debug-DATE.log`

- **`ENABLE_DEBUG_LOGGING`** (default: `false`)
  - Controls detailed debug logs
  - Automatically disabled in production environment
  - Includes database operations, cache operations, WebSocket events, metrics

- **`ENABLE_SECURITY_LOGGING`** (default: `true`)
  - Controls security-related events
  - Authentication failures, authorization violations, suspicious activities

- **`ENABLE_PERFORMANCE_LOGGING`** (default: `true`)
  - Controls performance metrics and slow operation logging
  - Tracks response times, database query times, etc.

- **`ENABLE_REQUEST_LOGGING`** (default: `true`)
  - Controls HTTP request/response logging (Morgan middleware)
  - Logs all incoming HTTP requests and their responses

### Log Level Control

- **`LOG_LEVEL`** (default: `info`)
  - Options: `error`, `warn`, `info`, `debug`
  - Controls the minimum level of logs to output
  - Automatically adjusted based on `ENABLE_DEBUG_LOGGING`

## Predefined Configurations

### Development Environment
```env
ENABLE_LOGGING=true
ENABLE_CONSOLE_LOGGING=true
ENABLE_FILE_LOGGING=true
ENABLE_DEBUG_LOGGING=true
ENABLE_SECURITY_LOGGING=true
ENABLE_PERFORMANCE_LOGGING=true
ENABLE_REQUEST_LOGGING=true
LOG_LEVEL=debug
```

### Production Environment (Minimal)
```env
ENABLE_LOGGING=true
ENABLE_CONSOLE_LOGGING=false
ENABLE_FILE_LOGGING=true
ENABLE_DEBUG_LOGGING=false
ENABLE_SECURITY_LOGGING=true
ENABLE_PERFORMANCE_LOGGING=false
ENABLE_REQUEST_LOGGING=false
LOG_LEVEL=warn
```

### Testing Environment
```env
ENABLE_LOGGING=false
```

### Performance Monitoring Only
```env
ENABLE_LOGGING=true
ENABLE_CONSOLE_LOGGING=false
ENABLE_FILE_LOGGING=true
ENABLE_DEBUG_LOGGING=false
ENABLE_SECURITY_LOGGING=false
ENABLE_PERFORMANCE_LOGGING=true
ENABLE_REQUEST_LOGGING=false
LOG_LEVEL=error
```

## Log Files

When file logging is enabled, the following files are created in the `logs/` directory:

- **`current.log`** - Symlink to the current day's application log
- **`current-error.log`** - Symlink to the current day's error log
- **`current-debug.log`** - Symlink to the current day's debug log
- **`application-YYYY-MM-DD.log`** - Daily application logs
- **`error-YYYY-MM-DD.log`** - Daily error logs
- **`debug-YYYY-MM-DD.log`** - Daily debug logs
- **`exceptions-YYYY-MM-DD.log`** - Uncaught exceptions
- **`rejections-YYYY-MM-DD.log`** - Unhandled promise rejections

## Log Rotation

- **Max file size**: 20MB for application/error logs, 10MB for debug logs
- **Max retention**: 30 days for application/error logs, 7 days for debug logs
- **Format**: JSON with timestamp, level, message, and metadata

## Performance Impact

- **Console logging**: Minimal impact
- **File logging**: Low impact with async writes
- **Debug logging**: Higher impact, disabled in production by default
- **No logging**: Zero impact when `ENABLE_LOGGING=false`

## Health Check

The logger includes a health check endpoint that reports:
- Logging status (enabled/disabled)
- Configuration of all logging features
- Overall system health

Access via: `GET /health` (includes logger status in response)

## Security Considerations

- **Security logging**: Always enabled in production to track security events
- **Log file permissions**: Ensure log files are properly secured
- **Sensitive data**: Logger automatically sanitizes sensitive information
- **Log retention**: Configure appropriate retention policies for compliance

## Troubleshooting

### No logs appearing
1. Check `ENABLE_LOGGING` is set to `true`
2. Verify the specific logging type is enabled
3. Check file permissions in the `logs/` directory
4. Verify `LOG_LEVEL` allows the log level you're trying to output

### Performance issues
1. Disable `ENABLE_DEBUG_LOGGING` in production
2. Consider disabling `ENABLE_REQUEST_LOGGING` for high-traffic applications
3. Reduce log retention periods
4. Monitor disk space usage

### Too many logs
1. Increase `LOG_LEVEL` to `warn` or `error`
2. Disable unnecessary logging types
3. Adjust log rotation settings

## Example Usage

```javascript
const Logger = require('./utils/logger');

// These will respect the environment variable settings
Logger.debug('Debug information');           // Only if ENABLE_DEBUG_LOGGING=true
Logger.info('General information');          // Always logged if ENABLE_LOGGING=true
Logger.warn('Warning message');              // Always logged if ENABLE_LOGGING=true
Logger.error('Error occurred', error);       // Always logged if ENABLE_LOGGING=true

// Structured logging methods also respect the settings
Logger.logSecurityEvent('login_failed', userId, ip);  // Only if ENABLE_SECURITY_LOGGING=true
Logger.logPerformanceMetric('db_query', 150);         // Only if ENABLE_PERFORMANCE_LOGGING=true
```

## Migration from Previous Versions

If upgrading from a version without conditional logging:
1. Add the new environment variables to your `.env` file
2. Default behavior remains the same (all logging enabled)
3. Gradually disable logging types as needed for your environment
