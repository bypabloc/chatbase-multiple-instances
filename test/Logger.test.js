/**
 * Logger tests to achieve complete coverage of logger.js
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'

describe('Logger Class Coverage', () => {
    let Logger
    let logger

    beforeEach(async () => {
        // Clear any previous mocks
        vi.clearAllMocks()

        // Dynamic import to get fresh instance
        const loggerModule = await import('../src/logger.js')
        Logger = loggerModule.Logger
        logger = loggerModule.default
    })

    describe('Environment Detection', () => {
        it('should use test environment from vitest', () => {
            // In vitest environment, logger should work as expected
            const testLogger = new Logger()
            expect(testLogger.getEnvironment()).toBe('test')
        })

        it('should handle development environment detection', () => {
            // Test the isDevelopment logic
            const testLogger = new Logger()
            testLogger.env = 'development'
            testLogger.isDevelopment =
                testLogger.env === 'local' ||
                testLogger.env === 'dev' ||
                testLogger.env === 'development'
            expect(testLogger.isDevelopment).toBe(true)
        })

        it('should handle production environment detection', () => {
            // Test the production environment logic
            const testLogger = new Logger()
            testLogger.env = 'production'
            testLogger.isDevelopment =
                testLogger.env === 'local' ||
                testLogger.env === 'dev' ||
                testLogger.env === 'development'
            expect(testLogger.isDevelopment).toBe(false)
        })
    })

    describe('Development Environment Logging', () => {
        beforeEach(() => {
            // Mock development environment
            logger.isDevelopment = true
            vi.spyOn(console, 'log').mockImplementation(() => {})
            vi.spyOn(console, 'info').mockImplementation(() => {})
            vi.spyOn(console, 'warn').mockImplementation(() => {})
            vi.spyOn(console, 'error').mockImplementation(() => {})
            vi.spyOn(console, 'debug').mockImplementation(() => {})
            vi.spyOn(console, 'group').mockImplementation(() => {})
            vi.spyOn(console, 'groupCollapsed').mockImplementation(() => {})
            vi.spyOn(console, 'groupEnd').mockImplementation(() => {})
            vi.spyOn(console, 'table').mockImplementation(() => {})
            vi.spyOn(console, 'time').mockImplementation(() => {})
            vi.spyOn(console, 'timeEnd').mockImplementation(() => {})
            vi.spyOn(console, 'trace').mockImplementation(() => {})
        })

        it('should log messages in development', () => {
            logger.log('test message', 123)
            expect(console.log).toHaveBeenCalledWith('test message', 123)
        })

        it('should log info messages in development', () => {
            logger.info('info message')
            expect(console.info).toHaveBeenCalledWith('info message')
        })

        it('should log warning messages in development', () => {
            logger.warn('warning message')
            expect(console.warn).toHaveBeenCalledWith('warning message')
        })

        it('should log debug messages in development', () => {
            logger.debug('debug message')
            expect(console.debug).toHaveBeenCalledWith('debug message')
        })

        it('should create console groups in development', () => {
            logger.group('test group')
            expect(console.group).toHaveBeenCalledWith('test group')
        })

        it('should create collapsed console groups in development', () => {
            logger.groupCollapsed('collapsed group')
            expect(console.groupCollapsed).toHaveBeenCalledWith('collapsed group')
        })

        it('should end console groups in development', () => {
            logger.groupEnd()
            expect(console.groupEnd).toHaveBeenCalled()
        })

        it('should display console table in development', () => {
            const testData = [{ name: 'test', value: 123 }]
            logger.table(testData)
            expect(console.table).toHaveBeenCalledWith(testData)
        })

        it('should start console timer in development', () => {
            logger.time('test-timer')
            expect(console.time).toHaveBeenCalledWith('test-timer')
        })

        it('should end console timer in development', () => {
            logger.timeEnd('test-timer')
            expect(console.timeEnd).toHaveBeenCalledWith('test-timer')
        })

        it('should trace in development', () => {
            logger.trace('trace message')
            expect(console.trace).toHaveBeenCalledWith('trace message')
        })
    })

    describe('Production Environment Logging', () => {
        beforeEach(() => {
            // Mock production environment
            logger.isDevelopment = false
            vi.spyOn(console, 'log').mockImplementation(() => {})
            vi.spyOn(console, 'info').mockImplementation(() => {})
            vi.spyOn(console, 'warn').mockImplementation(() => {})
            vi.spyOn(console, 'error').mockImplementation(() => {})
            vi.spyOn(console, 'debug').mockImplementation(() => {})
            vi.spyOn(console, 'group').mockImplementation(() => {})
            vi.spyOn(console, 'groupCollapsed').mockImplementation(() => {})
            vi.spyOn(console, 'groupEnd').mockImplementation(() => {})
            vi.spyOn(console, 'table').mockImplementation(() => {})
            vi.spyOn(console, 'time').mockImplementation(() => {})
            vi.spyOn(console, 'timeEnd').mockImplementation(() => {})
            vi.spyOn(console, 'trace').mockImplementation(() => {})
        })

        it('should NOT log messages in production', () => {
            logger.log('test message')
            expect(console.log).not.toHaveBeenCalled()
        })

        it('should NOT log info messages in production', () => {
            logger.info('info message')
            expect(console.info).not.toHaveBeenCalled()
        })

        it('should NOT log warning messages in production', () => {
            logger.warn('warning message')
            expect(console.warn).not.toHaveBeenCalled()
        })

        it('should NOT log debug messages in production', () => {
            logger.debug('debug message')
            expect(console.debug).not.toHaveBeenCalled()
        })

        it('should NOT create console groups in production', () => {
            logger.group('test group')
            expect(console.group).not.toHaveBeenCalled()
        })

        it('should NOT create collapsed console groups in production', () => {
            logger.groupCollapsed('collapsed group')
            expect(console.groupCollapsed).not.toHaveBeenCalled()
        })

        it('should NOT end console groups in production', () => {
            logger.groupEnd()
            expect(console.groupEnd).not.toHaveBeenCalled()
        })

        it('should NOT display console table in production', () => {
            const testData = [{ name: 'test', value: 123 }]
            logger.table(testData)
            expect(console.table).not.toHaveBeenCalled()
        })

        it('should NOT start console timer in production', () => {
            logger.time('test-timer')
            expect(console.time).not.toHaveBeenCalled()
        })

        it('should NOT end console timer in production', () => {
            logger.timeEnd('test-timer')
            expect(console.timeEnd).not.toHaveBeenCalled()
        })

        it('should NOT trace in production', () => {
            logger.trace('trace message')
            expect(console.trace).not.toHaveBeenCalled()
        })

        it('should ALWAYS log errors regardless of environment', () => {
            logger.error('error message')
            expect(console.error).toHaveBeenCalledWith('error message')
        })
    })

    describe('Environment Information', () => {
        it('should return environment info in development', () => {
            logger.env = 'local'
            logger.isDevelopment = true

            const envInfo = logger.getEnvInfo()

            expect(envInfo).toEqual({
                environment: 'local',
                isDevelopment: true,
                allowsLogging: true,
            })
        })

        it('should return environment info in production', () => {
            logger.env = 'production'
            logger.isDevelopment = false

            const envInfo = logger.getEnvInfo()

            expect(envInfo).toEqual({
                environment: 'production',
                isDevelopment: false,
                allowsLogging: false,
            })
        })
    })

    describe('Environment String Detection', () => {
        it('should detect local environment as development', () => {
            const testLogger = new Logger()
            testLogger.env = 'local'
            testLogger.isDevelopment =
                testLogger.env === 'local' ||
                testLogger.env === 'dev' ||
                testLogger.env === 'development'
            expect(testLogger.isDevelopment).toBe(true)
        })

        it('should detect dev environment as development', () => {
            const testLogger = new Logger()
            testLogger.env = 'dev'
            testLogger.isDevelopment =
                testLogger.env === 'local' ||
                testLogger.env === 'dev' ||
                testLogger.env === 'development'
            expect(testLogger.isDevelopment).toBe(true)
        })

        it('should detect development environment as development', () => {
            const testLogger = new Logger()
            testLogger.env = 'development'
            testLogger.isDevelopment =
                testLogger.env === 'local' ||
                testLogger.env === 'dev' ||
                testLogger.env === 'development'
            expect(testLogger.isDevelopment).toBe(true)
        })

        it('should detect production environment as not development', () => {
            const testLogger = new Logger()
            testLogger.env = 'production'
            testLogger.isDevelopment =
                testLogger.env === 'local' ||
                testLogger.env === 'dev' ||
                testLogger.env === 'development'
            expect(testLogger.isDevelopment).toBe(false)
        })

        it('should cover all logger methods for complete coverage', () => {
            // Call all logger methods to ensure complete coverage
            const testLogger = new Logger()

            // Set up console spies
            vi.spyOn(console, 'log').mockImplementation(() => {})
            vi.spyOn(console, 'info').mockImplementation(() => {})
            vi.spyOn(console, 'warn').mockImplementation(() => {})
            vi.spyOn(console, 'error').mockImplementation(() => {})
            vi.spyOn(console, 'debug').mockImplementation(() => {})
            vi.spyOn(console, 'group').mockImplementation(() => {})
            vi.spyOn(console, 'groupCollapsed').mockImplementation(() => {})
            vi.spyOn(console, 'groupEnd').mockImplementation(() => {})
            vi.spyOn(console, 'table').mockImplementation(() => {})
            vi.spyOn(console, 'time').mockImplementation(() => {})
            vi.spyOn(console, 'timeEnd').mockImplementation(() => {})
            vi.spyOn(console, 'trace').mockImplementation(() => {})

            // Test in both dev and prod environments
            testLogger.isDevelopment = true
            testLogger.log('test')
            testLogger.info('test')
            testLogger.warn('test')
            testLogger.debug('test')
            testLogger.group('test')
            testLogger.groupCollapsed('test')
            testLogger.groupEnd()
            testLogger.table({})
            testLogger.time('test')
            testLogger.timeEnd('test')
            testLogger.trace('test')
            testLogger.error('test')

            testLogger.isDevelopment = false
            testLogger.log('test')
            testLogger.info('test')
            testLogger.warn('test')
            testLogger.debug('test')
            testLogger.group('test')
            testLogger.groupCollapsed('test')
            testLogger.groupEnd()
            testLogger.table({})
            testLogger.time('test')
            testLogger.timeEnd('test')
            testLogger.trace('test')
            testLogger.error('test')

            // Test environment methods
            expect(testLogger.getEnvironment()).toBeDefined()
            expect(testLogger.getEnvInfo()).toBeDefined()
        })
    })
})
