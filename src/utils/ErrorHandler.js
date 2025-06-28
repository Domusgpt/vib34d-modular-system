/**
 * ERROR HANDLER
 * Graceful failure management and recovery for the VIB34D system
 * 
 * Responsibilities:
 * - Centralized error catching and logging
 * - Automatic error recovery strategies
 * - User-friendly error reporting
 * - System health monitoring
 * - Fallback mode activation
 * - Debug information collection
 */

class ErrorHandler extends EventTarget {
    constructor(config = {}) {
        super();
        
        this.config = {
            enableAutoRecovery: true,
            enableFallbackMode: true,
            enableUserNotifications: true,
            maxRecoveryAttempts: 3,
            recoveryTimeout: 5000,
            logLevel: 'warn', // error, warn, info, debug
            enableRemoteLogging: false,
            debugMode: false,
            ...config
        };
        
        // System references
        this.systemController = config.systemController;
        
        // Error tracking
        this.errors = {
            history: [],
            categories: new Map(),
            recoveryAttempts: new Map(),
            suppressedErrors: new Set()
        };
        
        // Recovery strategies
        this.recoveryStrategies = new Map();
        this.setupRecoveryStrategies();
        
        // System state
        this.systemHealth = 'healthy'; // healthy, degraded, critical, failed
        this.fallbackMode = false;
        this.lastHealthCheck = Date.now();
        
        // Error categories
        this.errorCategories = {
            'WebGLError': {
                severity: 'high',
                recoverable: true,
                fallbackAvailable: true
            },
            'ShaderCompilationError': {
                severity: 'high',
                recoverable: true,
                fallbackAvailable: true
            },
            'ParameterValidationError': {
                severity: 'medium',
                recoverable: true,
                fallbackAvailable: false
            },
            'ModuleLoadError': {
                severity: 'critical',
                recoverable: false,
                fallbackAvailable: true
            },
            'NetworkError': {
                severity: 'medium',
                recoverable: true,
                fallbackAvailable: false
            },
            'MemoryError': {
                severity: 'high',
                recoverable: true,
                fallbackAvailable: true
            },
            'UserInputError': {
                severity: 'low',
                recoverable: true,
                fallbackAvailable: false
            },
            'UnknownError': {
                severity: 'medium',
                recoverable: false,
                fallbackAvailable: true
            }
        };
        
        // Performance monitoring
        this.performanceMetrics = {
            errorsPerMinute: 0,
            recoverySuccessRate: 0,
            averageRecoveryTime: 0
        };
        
        // Setup global error handlers
        this.setupGlobalHandlers();
        
        console.log('🛡️ ErrorHandler created');
    }
    
    /**
     * INITIALIZATION
     */
    
    setupGlobalHandlers() {
        if (typeof window !== 'undefined') {
            // Catch unhandled errors
            window.addEventListener('error', (event) => {
                this.handleError('UnhandledError', event.error || new Error(event.message), {
                    filename: event.filename,
                    lineno: event.lineno,
                    colno: event.colno
                });
            });
            
            // Catch unhandled promise rejections
            window.addEventListener('unhandledrejection', (event) => {
                this.handleError('UnhandledPromiseRejection', event.reason, {
                    promise: event.promise
                });
            });
            
            // Catch WebGL context loss
            document.addEventListener('webglcontextlost', (event) => {
                this.handleError('WebGLContextLost', new Error('WebGL context lost'), {
                    canvas: event.target
                });
            });
        }
    }
    
    setupRecoveryStrategies() {
        // WebGL recovery
        this.recoveryStrategies.set('WebGLError', async (error, context) => {
            console.log('🔧 Attempting WebGL recovery...');
            
            try {
                // Try to restore WebGL context
                if (context.canvas) {
                    const gl = context.canvas.getContext('webgl') || context.canvas.getContext('experimental-webgl');
                    if (gl) {
                        // Reinitialize shaders and buffers
                        if (context.visualizer && typeof context.visualizer.restoreContext === 'function') {
                            await context.visualizer.restoreContext();
                        }
                        return { success: true, message: 'WebGL context restored' };
                    }
                }
                
                // Fallback: switch to canvas 2D rendering
                return this.activateFallbackRendering();
                
            } catch (recoveryError) {
                return { success: false, message: 'WebGL recovery failed', error: recoveryError };
            }
        });
        
        // Memory error recovery
        this.recoveryStrategies.set('MemoryError', async (error, context) => {
            console.log('🔧 Attempting memory recovery...');
            
            try {
                // Force garbage collection if available
                if (window.gc) {
                    window.gc();
                }
                
                // Reduce system load
                if (this.systemController) {
                    const visualizerPool = this.systemController.getModule('visualizerPool');
                    if (visualizerPool) {
                        // Destroy some visualizers
                        const instances = visualizerPool.getInstancesByRole('bezel');
                        for (let i = 0; i < Math.min(3, instances.length); i++) {
                            await visualizerPool.destroyInstance(instances[i].id);
                        }
                    }
                    
                    // Reduce parameters
                    const homeMaster = this.systemController.getModule('homeMaster');
                    if (homeMaster) {
                        homeMaster.setParameter('gridDensity', 8.0, 'recovery');
                        homeMaster.setParameter('intensity', 0.6, 'recovery');
                    }
                }
                
                return { success: true, message: 'Memory usage reduced' };
                
            } catch (recoveryError) {
                return { success: false, message: 'Memory recovery failed', error: recoveryError };
            }
        });
        
        // Parameter validation recovery
        this.recoveryStrategies.set('ParameterValidationError', async (error, context) => {
            console.log('🔧 Attempting parameter recovery...');
            
            try {
                // Reset to default parameters
                if (this.systemController) {
                    const homeMaster = this.systemController.getModule('homeMaster');
                    const presetDatabase = this.systemController.getModule('presetDatabase');
                    
                    if (homeMaster && presetDatabase) {
                        const defaultPreset = presetDatabase.getDefaultPreset();
                        if (defaultPreset) {
                            await presetDatabase.loadPreset(defaultPreset.id);
                            return { success: true, message: 'Reset to default parameters' };
                        }
                    }
                }
                
                return { success: false, message: 'Could not reset parameters' };
                
            } catch (recoveryError) {
                return { success: false, message: 'Parameter recovery failed', error: recoveryError };
            }
        });
    }
    
    /**
     * ERROR HANDLING
     */
    
    handleError(context, error, metadata = {}) {
        // Classify error
        const category = this.classifyError(error, context);
        const severity = this.errorCategories[category]?.severity || 'medium';
        
        // Create error record
        const errorRecord = {
            id: this.generateErrorId(),
            timestamp: Date.now(),
            context,
            category,
            severity,
            message: error.message || String(error),
            stack: error.stack,
            metadata,
            recovered: false,
            recoveryAttempts: 0
        };
        
        // Check if error should be suppressed
        if (this.shouldSuppressError(errorRecord)) {
            return;
        }
        
        // Log error
        this.logError(errorRecord);
        
        // Store error
        this.errors.history.push(errorRecord);
        this.updateErrorCategories(category);
        
        // Limit error history
        if (this.errors.history.length > 1000) {
            this.errors.history = this.errors.history.slice(-500);
        }
        
        // Update system health
        this.updateSystemHealth(severity);
        
        // Attempt recovery if enabled
        if (this.config.enableAutoRecovery && this.errorCategories[category]?.recoverable) {
            this.attemptRecovery(errorRecord);
        }
        
        // Notify user if enabled
        if (this.config.enableUserNotifications && severity !== 'low') {
            this.notifyUser(errorRecord);
        }
        
        // Emit error event
        this.emit('error', errorRecord);
        
        console.error(`🚨 Error [${category}/${severity}]: ${errorRecord.message}`);
    }
    
    classifyError(error, context) {
        const message = error.message || String(error);
        
        // WebGL errors
        if (message.includes('WebGL') || context.includes('WebGL') || message.includes('CONTEXT_LOST')) {
            return 'WebGLError';
        }
        
        // Shader errors
        if (message.includes('shader') || message.includes('GLSL') || context.includes('Shader')) {
            return 'ShaderCompilationError';
        }
        
        // Memory errors
        if (message.includes('memory') || message.includes('allocation') || context.includes('Memory')) {
            return 'MemoryError';
        }
        
        // Module loading errors
        if (message.includes('import') || message.includes('module') || context.includes('Module')) {
            return 'ModuleLoadError';
        }
        
        // Parameter validation errors
        if (context.includes('Parameter') || context.includes('Validation')) {
            return 'ParameterValidationError';
        }
        
        // Network errors
        if (message.includes('fetch') || message.includes('network') || context.includes('Network')) {
            return 'NetworkError';
        }
        
        // User input errors
        if (context.includes('Input') || context.includes('User')) {
            return 'UserInputError';
        }
        
        return 'UnknownError';
    }
    
    shouldSuppressError(errorRecord) {
        // Check if this specific error is suppressed
        const errorSignature = `${errorRecord.category}:${errorRecord.message}`;
        if (this.errors.suppressedErrors.has(errorSignature)) {
            return true;
        }
        
        // Check for spam (same error repeated quickly)
        const recentSimilar = this.errors.history
            .filter(e => e.category === errorRecord.category && e.message === errorRecord.message)
            .filter(e => Date.now() - e.timestamp < 10000); // Last 10 seconds
        
        if (recentSimilar.length > 5) {
            this.suppressError(errorSignature, 60000); // Suppress for 1 minute
            return true;
        }
        
        return false;
    }
    
    suppressError(errorSignature, duration = 300000) { // 5 minutes default
        this.errors.suppressedErrors.add(errorSignature);
        
        setTimeout(() => {
            this.errors.suppressedErrors.delete(errorSignature);
        }, duration);
    }
    
    /**
     * ERROR RECOVERY
     */
    
    async attemptRecovery(errorRecord) {
        const category = errorRecord.category;
        const attempts = this.errors.recoveryAttempts.get(errorRecord.id) || 0;
        
        if (attempts >= this.config.maxRecoveryAttempts) {
            console.warn(`Max recovery attempts reached for error: ${errorRecord.id}`);
            return false;
        }
        
        this.errors.recoveryAttempts.set(errorRecord.id, attempts + 1);
        errorRecord.recoveryAttempts = attempts + 1;
        
        const strategy = this.recoveryStrategies.get(category);
        if (!strategy) {
            console.warn(`No recovery strategy for error category: ${category}`);
            return false;
        }
        
        try {
            console.log(`🔧 Attempting recovery for ${category} (attempt ${attempts + 1})...`);
            
            const startTime = performance.now();
            const result = await Promise.race([
                strategy(errorRecord, errorRecord.metadata),
                new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('Recovery timeout')), this.config.recoveryTimeout)
                )
            ]);
            const recoveryTime = performance.now() - startTime;
            
            if (result.success) {
                errorRecord.recovered = true;
                errorRecord.recoveryTime = recoveryTime;
                errorRecord.recoveryMessage = result.message;
                
                console.log(`✅ Recovery successful: ${result.message} (${recoveryTime.toFixed(2)}ms)`);
                
                this.emit('errorRecovered', errorRecord);
                this.updatePerformanceMetrics('recovery', true, recoveryTime);
                
                return true;
            } else {
                console.warn(`❌ Recovery failed: ${result.message}`);
                this.updatePerformanceMetrics('recovery', false, recoveryTime);
                
                // Try fallback if available
                if (this.errorCategories[category]?.fallbackAvailable) {
                    return this.activateFallbackMode();
                }
                
                return false;
            }
            
        } catch (recoveryError) {
            console.error(`💥 Recovery attempt failed:`, recoveryError);
            this.updatePerformanceMetrics('recovery', false, 0);
            return false;
        }
    }
    
    async activateFallbackMode() {
        if (this.fallbackMode) {
            return { success: true, message: 'Fallback mode already active' };
        }
        
        console.log('🛡️ Activating fallback mode...');
        
        try {
            this.fallbackMode = true;
            
            // Disable complex features
            if (this.systemController) {
                const homeMaster = this.systemController.getModule('homeMaster');
                if (homeMaster) {
                    homeMaster.setParameter('glitchIntensity', 0.0, 'fallback');
                    homeMaster.setParameter('intensity', 0.5, 'fallback');
                    homeMaster.setParameter('gridDensity', 6.0, 'fallback');
                    homeMaster.setParameter('geometry', 0, 'fallback'); // Simple hypercube
                }
                
                // Destroy non-essential visualizers
                const visualizerPool = this.systemController.getModule('visualizerPool');
                if (visualizerPool) {
                    const bezelInstances = visualizerPool.getInstancesByRole('bezel');
                    for (const instance of bezelInstances) {
                        await visualizerPool.destroyInstance(instance.id);
                    }
                }
            }
            
            this.emit('fallbackModeActivated');
            
            return { success: true, message: 'Fallback mode activated' };
            
        } catch (error) {
            console.error('Failed to activate fallback mode:', error);
            return { success: false, message: 'Fallback activation failed', error };
        }
    }
    
    async activateFallbackRendering() {
        console.log('🎨 Activating fallback rendering...');
        
        try {
            // Switch to canvas 2D rendering
            if (this.systemController) {
                const visualizerPool = this.systemController.getModule('visualizerPool');
                if (visualizerPool && typeof visualizerPool.switchToFallbackRenderer === 'function') {
                    await visualizerPool.switchToFallbackRenderer();
                }
            }
            
            return { success: true, message: 'Fallback rendering activated' };
            
        } catch (error) {
            console.error('Failed to activate fallback rendering:', error);
            return { success: false, message: 'Fallback rendering failed', error };
        }
    }
    
    /**
     * SYSTEM HEALTH MONITORING
     */
    
    updateSystemHealth(errorSeverity) {
        const now = Date.now();
        
        // Count recent errors
        const recentErrors = this.errors.history.filter(e => now - e.timestamp < 60000); // Last minute
        const criticalErrors = recentErrors.filter(e => e.severity === 'critical').length;
        const highErrors = recentErrors.filter(e => e.severity === 'high').length;
        
        let newHealth = 'healthy';
        
        if (criticalErrors > 0 || this.fallbackMode) {
            newHealth = 'critical';
        } else if (highErrors > 3 || recentErrors.length > 10) {
            newHealth = 'degraded';
        } else if (highErrors > 1 || recentErrors.length > 5) {
            newHealth = 'degraded';
        }
        
        if (newHealth !== this.systemHealth) {
            const oldHealth = this.systemHealth;
            this.systemHealth = newHealth;
            
            console.log(`🏥 System health changed: ${oldHealth} → ${newHealth}`);
            
            this.emit('healthChanged', {
                oldHealth,
                newHealth,
                recentErrors: recentErrors.length,
                criticalErrors,
                highErrors
            });
        }
        
        this.lastHealthCheck = now;
    }
    
    /**
     * LOGGING AND NOTIFICATION
     */
    
    logError(errorRecord) {
        const logLevel = this.config.logLevel;
        const { severity, category, message, context } = errorRecord;
        
        const logMessage = `[${category}/${severity}] ${context}: ${message}`;
        
        switch (severity) {
            case 'critical':
            case 'high':
                if (['error', 'warn', 'info', 'debug'].includes(logLevel)) {
                    console.error(logMessage);
                }
                break;
            case 'medium':
                if (['warn', 'info', 'debug'].includes(logLevel)) {
                    console.warn(logMessage);
                }
                break;
            case 'low':
                if (['info', 'debug'].includes(logLevel)) {
                    console.info(logMessage);
                }
                break;
        }
        
        // Remote logging if enabled
        if (this.config.enableRemoteLogging) {
            this.sendToRemoteLogging(errorRecord);
        }
    }
    
    notifyUser(errorRecord) {
        const { severity, category } = errorRecord;
        
        let userMessage = '';
        let actionRequired = false;
        
        switch (category) {
            case 'WebGLError':
                userMessage = 'Graphics rendering issue detected. Attempting automatic recovery.';
                break;
            case 'MemoryError':
                userMessage = 'High memory usage detected. Optimizing performance.';
                break;
            case 'ModuleLoadError':
                userMessage = 'Component loading failed. Switching to fallback mode.';
                actionRequired = true;
                break;
            default:
                if (severity === 'critical') {
                    userMessage = 'A critical error occurred. The system may not function properly.';
                    actionRequired = true;
                } else {
                    userMessage = 'A technical issue was detected and is being resolved.';
                }
        }
        
        this.emit('userNotification', {
            type: severity === 'critical' ? 'error' : 'warning',
            message: userMessage,
            actionRequired,
            errorId: errorRecord.id
        });
    }
    
    sendToRemoteLogging(errorRecord) {
        // Implementation would depend on logging service
        if (this.config.debugMode) {
            console.log('📡 Would send to remote logging:', errorRecord);
        }
    }
    
    /**
     * PERFORMANCE METRICS
     */
    
    updateErrorCategories(category) {
        const count = this.errors.categories.get(category) || 0;
        this.errors.categories.set(category, count + 1);
    }
    
    updatePerformanceMetrics(operation, success, duration) {
        if (operation === 'recovery') {
            const recoveries = this.errors.history.filter(e => e.recovered);
            const total = this.errors.history.filter(e => e.recoveryAttempts > 0);
            
            this.performanceMetrics.recoverySuccessRate = total.length > 0 ? 
                (recoveries.length / total.length) * 100 : 0;
            
            if (success && duration) {
                const averageTimes = recoveries.map(e => e.recoveryTime).filter(t => t);
                this.performanceMetrics.averageRecoveryTime = averageTimes.length > 0 ?
                    averageTimes.reduce((sum, time) => sum + time, 0) / averageTimes.length : 0;
            }
        }
        
        // Calculate errors per minute
        const oneMinuteAgo = Date.now() - 60000;
        const recentErrors = this.errors.history.filter(e => e.timestamp > oneMinuteAgo);
        this.performanceMetrics.errorsPerMinute = recentErrors.length;
    }
    
    /**
     * UTILITY METHODS
     */
    
    generateErrorId() {
        return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    
    clearErrorHistory() {
        this.errors.history = [];
        this.errors.categories.clear();
        this.errors.recoveryAttempts.clear();
        
        console.log('🗑️ Error history cleared');
    }
    
    getErrorStats() {
        const now = Date.now();
        const hourAgo = now - 3600000;
        const dayAgo = now - 86400000;
        
        const recentErrors = this.errors.history.filter(e => e.timestamp > hourAgo);
        const dailyErrors = this.errors.history.filter(e => e.timestamp > dayAgo);
        const recoveredErrors = this.errors.history.filter(e => e.recovered);
        
        return {
            total: this.errors.history.length,
            lastHour: recentErrors.length,
            lastDay: dailyErrors.length,
            recovered: recoveredErrors.length,
            categories: Object.fromEntries(this.errors.categories),
            systemHealth: this.systemHealth,
            fallbackMode: this.fallbackMode,
            performanceMetrics: { ...this.performanceMetrics }
        };
    }
    
    /**
     * EVENT HANDLING FOR SYSTEM CONTROLLER
     */
    
    handleEvent(eventType, eventData, source) {
        if (this.config.debugMode) {
            console.log(`ErrorHandler received event: ${eventType}`, eventData);
        }
    }
    
    /**
     * PUBLIC API
     */
    
    reportError(context, error, metadata = {}) {
        this.handleError(context, error, metadata);
    }
    
    getSystemHealth() {
        return {
            status: this.systemHealth,
            fallbackMode: this.fallbackMode,
            lastCheck: this.lastHealthCheck
        };
    }
    
    getErrorHistory(timeframe = 3600000) { // 1 hour default
        const cutoff = Date.now() - timeframe;
        return this.errors.history.filter(e => e.timestamp > cutoff);
    }
    
    forceFallbackMode() {
        return this.activateFallbackMode();
    }
    
    /**
     * STATUS AND DEBUGGING
     */
    
    getStatus() {
        return {
            systemHealth: this.systemHealth,
            fallbackMode: this.fallbackMode,
            totalErrors: this.errors.history.length,
            suppressedErrors: this.errors.suppressedErrors.size,
            autoRecoveryEnabled: this.config.enableAutoRecovery,
            fallbackModeEnabled: this.config.enableFallbackMode,
            performanceMetrics: { ...this.performanceMetrics }
        };
    }
}

// Export for module system
export { ErrorHandler };

// Export for global access
if (typeof window !== 'undefined') {
    window.ErrorHandler = ErrorHandler;
    console.log('🛡️ ErrorHandler loaded and available globally');
}