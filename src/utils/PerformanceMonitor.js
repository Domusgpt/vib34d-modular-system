/**
 * PERFORMANCE MONITOR
 * Optimization tracking and performance management for the VIB34D system
 * 
 * Responsibilities:
 * - Real-time FPS and frame time monitoring
 * - Memory usage tracking
 * - WebGL performance metrics
 * - Automatic performance optimization
 * - Performance bottleneck detection
 * - Resource usage alerts
 */

class PerformanceMonitor extends EventTarget {
    constructor(config = {}) {
        super();
        
        this.config = {
            targetFPS: 60,
            monitoringInterval: 1000,
            sampleSize: 60,
            enableAutoOptimization: true,
            enableMemoryTracking: true,
            enableWebGLTracking: true,
            warningThresholds: {
                lowFPS: 30,
                highMemory: 100, // MB
                highFrameTime: 33.33 // ms
            },
            criticalThresholds: {
                criticalFPS: 15,
                criticalMemory: 200, // MB
                criticalFrameTime: 66.67 // ms
            },
            debugMode: false,
            ...config
        };
        
        // System references
        this.systemController = config.systemController;
        
        // Monitoring state
        this.isMonitoring = false;
        this.startTime = 0;
        this.lastFrameTime = 0;
        this.frameCount = 0;
        
        // Performance metrics
        this.metrics = {
            fps: {
                current: 0,
                average: 0,
                min: Infinity,
                max: 0,
                samples: []
            },
            frameTime: {
                current: 0,
                average: 0,
                min: Infinity,
                max: 0,
                samples: []
            },
            memory: {
                used: 0,
                total: 0,
                peak: 0,
                samples: []
            },
            webgl: {
                drawCalls: 0,
                textureMemory: 0,
                bufferMemory: 0,
                shaderCompilations: 0
            },
            system: {
                cpuUsage: 0,
                activeVisualizers: 0,
                eventRate: 0,
                parameterUpdates: 0
            }
        };
        
        // Performance history
        this.history = {
            fps: [],
            frameTime: [],
            memory: [],
            events: []
        };
        
        // Optimization state
        this.optimizationLevel = 'normal'; // normal, conservative, aggressive
        this.adaptiveSettings = {
            visualizerCount: 7,
            effectIntensity: 1.0,
            particleCount: 1000,
            renderQuality: 1.0
        };
        
        // Alert system
        this.alerts = {
            active: new Set(),
            history: [],
            suppressedUntil: new Map()
        };
        
        console.log('📊 PerformanceMonitor created');
    }
    
    /**
     * MONITORING LIFECYCLE
     */
    
    startMonitoring() {
        if (this.isMonitoring) {
            console.warn('PerformanceMonitor already running');
            return;
        }
        
        console.log('▶️ Starting performance monitoring...');
        
        this.isMonitoring = true;
        this.startTime = performance.now();
        this.lastFrameTime = this.startTime;
        this.frameCount = 0;
        
        // Start monitoring loops
        this.startFrameMonitoring();
        this.startPeriodicMonitoring();
        
        console.log('✅ Performance monitoring started');
    }
    
    stopMonitoring() {
        if (!this.isMonitoring) {
            console.warn('PerformanceMonitor not running');
            return;
        }
        
        console.log('⏸️ Stopping performance monitoring...');
        
        this.isMonitoring = false;
        
        // Clear intervals
        if (this.frameMonitorId) {
            cancelAnimationFrame(this.frameMonitorId);
        }
        
        if (this.periodicMonitorId) {
            clearInterval(this.periodicMonitorId);
        }
        
        console.log('✅ Performance monitoring stopped');
    }
    
    /**
     * FRAME MONITORING
     */
    
    startFrameMonitoring() {
        const monitorFrame = (timestamp) => {
            if (!this.isMonitoring) return;
            
            this.updateFrameMetrics(timestamp);
            this.frameMonitorId = requestAnimationFrame(monitorFrame);
        };
        
        this.frameMonitorId = requestAnimationFrame(monitorFrame);
    }
    
    updateFrameMetrics(timestamp) {
        this.frameCount++;
        
        // Calculate frame time
        const frameTime = timestamp - this.lastFrameTime;
        this.lastFrameTime = timestamp;
        
        // Skip first frame (often inaccurate)
        if (this.frameCount === 1) return;
        
        // Update frame time metrics
        this.updateMetric('frameTime', frameTime);
        
        // Calculate FPS
        const fps = frameTime > 0 ? 1000 / frameTime : 0;
        this.updateMetric('fps', fps);
        
        // Check for performance issues
        this.checkPerformanceThresholds();
        
        // Trigger auto-optimization if needed
        if (this.config.enableAutoOptimization) {
            this.checkAutoOptimization();
        }
    }
    
    updateMetric(metricName, value) {
        const metric = this.metrics[metricName];
        
        metric.current = value;
        metric.min = Math.min(metric.min, value);
        metric.max = Math.max(metric.max, value);
        
        // Add to samples
        metric.samples.push(value);
        if (metric.samples.length > this.config.sampleSize) {
            metric.samples.shift();
        }
        
        // Calculate average
        metric.average = metric.samples.reduce((sum, val) => sum + val, 0) / metric.samples.length;
    }
    
    /**
     * PERIODIC MONITORING
     */
    
    startPeriodicMonitoring() {
        this.periodicMonitorId = setInterval(() => {
            this.updateMemoryMetrics();
            this.updateSystemMetrics();
            this.updateHistory();
            this.generatePerformanceReport();
        }, this.config.monitoringInterval);
    }
    
    updateMemoryMetrics() {
        if (!this.config.enableMemoryTracking || !performance.memory) {
            return;
        }
        
        const memory = performance.memory;
        
        this.metrics.memory.used = memory.usedJSHeapSize / 1024 / 1024; // MB
        this.metrics.memory.total = memory.totalJSHeapSize / 1024 / 1024; // MB
        this.metrics.memory.peak = Math.max(this.metrics.memory.peak, this.metrics.memory.used);
        
        // Add to samples
        this.metrics.memory.samples.push(this.metrics.memory.used);
        if (this.metrics.memory.samples.length > this.config.sampleSize) {
            this.metrics.memory.samples.shift();
        }
    }
    
    updateSystemMetrics() {
        if (this.systemController) {
            // Get active visualizer count
            const visualizerPool = this.systemController.getModule('visualizerPool');
            if (visualizerPool) {
                this.metrics.system.activeVisualizers = visualizerPool.getActiveCount();
            }
            
            // Get parameter update rate
            const homeMaster = this.systemController.getModule('homeMaster');
            if (homeMaster && homeMaster.getUpdateRate) {
                this.metrics.system.parameterUpdates = homeMaster.getUpdateRate();
            }
        }
    }
    
    updateHistory() {
        const now = Date.now();
        
        // Add current metrics to history
        this.history.fps.push({ timestamp: now, value: this.metrics.fps.current });
        this.history.frameTime.push({ timestamp: now, value: this.metrics.frameTime.current });
        this.history.memory.push({ timestamp: now, value: this.metrics.memory.used });
        
        // Limit history size (keep last hour)
        const oneHourAgo = now - (60 * 60 * 1000);
        this.history.fps = this.history.fps.filter(entry => entry.timestamp > oneHourAgo);
        this.history.frameTime = this.history.frameTime.filter(entry => entry.timestamp > oneHourAgo);
        this.history.memory = this.history.memory.filter(entry => entry.timestamp > oneHourAgo);
    }
    
    /**
     * PERFORMANCE ANALYSIS
     */
    
    checkPerformanceThresholds() {
        const { fps, frameTime, memory } = this.metrics;
        const { warningThresholds, criticalThresholds } = this.config;
        
        // FPS checks
        if (fps.current < criticalThresholds.criticalFPS) {
            this.triggerAlert('critical_fps', `Critical FPS: ${fps.current.toFixed(1)}`);
        } else if (fps.current < warningThresholds.lowFPS) {
            this.triggerAlert('low_fps', `Low FPS: ${fps.current.toFixed(1)}`);
        }
        
        // Frame time checks
        if (frameTime.current > criticalThresholds.criticalFrameTime) {
            this.triggerAlert('critical_frame_time', `Critical frame time: ${frameTime.current.toFixed(1)}ms`);
        } else if (frameTime.current > warningThresholds.highFrameTime) {
            this.triggerAlert('high_frame_time', `High frame time: ${frameTime.current.toFixed(1)}ms`);
        }
        
        // Memory checks
        if (memory.used > criticalThresholds.criticalMemory) {
            this.triggerAlert('critical_memory', `Critical memory usage: ${memory.used.toFixed(1)}MB`);
        } else if (memory.used > warningThresholds.highMemory) {
            this.triggerAlert('high_memory', `High memory usage: ${memory.used.toFixed(1)}MB`);
        }
    }
    
    checkAutoOptimization() {
        const { fps, memory } = this.metrics;
        const targetFPS = this.config.targetFPS;
        
        // Determine optimization level based on performance
        let newOptimizationLevel = 'normal';
        
        if (fps.average < targetFPS * 0.5 || memory.used > 150) {
            newOptimizationLevel = 'aggressive';
        } else if (fps.average < targetFPS * 0.8 || memory.used > 100) {
            newOptimizationLevel = 'conservative';
        }
        
        if (newOptimizationLevel !== this.optimizationLevel) {
            this.applyOptimization(newOptimizationLevel);
        }
    }
    
    applyOptimization(level) {
        console.log(`🔧 Applying ${level} optimization...`);
        
        this.optimizationLevel = level;
        
        switch (level) {
            case 'aggressive':
                this.adaptiveSettings = {
                    visualizerCount: 3,
                    effectIntensity: 0.5,
                    particleCount: 200,
                    renderQuality: 0.5
                };
                break;
                
            case 'conservative':
                this.adaptiveSettings = {
                    visualizerCount: 5,
                    effectIntensity: 0.7,
                    particleCount: 500,
                    renderQuality: 0.7
                };
                break;
                
            default: // normal
                this.adaptiveSettings = {
                    visualizerCount: 7,
                    effectIntensity: 1.0,
                    particleCount: 1000,
                    renderQuality: 1.0
                };
        }
        
        // Apply optimizations to system
        this.applyAdaptiveSettings();
        
        this.emit('optimizationApplied', {
            level,
            settings: this.adaptiveSettings
        });
    }
    
    applyAdaptiveSettings() {
        if (!this.systemController) return;
        
        // Apply visualizer count optimization
        const visualizerPool = this.systemController.getModule('visualizerPool');
        if (visualizerPool && visualizerPool.setMaxInstances) {
            visualizerPool.setMaxInstances(this.adaptiveSettings.visualizerCount);
        }
        
        // Apply effect intensity optimization
        const homeMaster = this.systemController.getModule('homeMaster');
        if (homeMaster) {
            homeMaster.setParameter('intensity', this.adaptiveSettings.effectIntensity, 'performance');
        }
    }
    
    /**
     * ALERT SYSTEM
     */
    
    triggerAlert(type, message, severity = 'warning') {
        // Check if alert is suppressed
        const suppressedUntil = this.alerts.suppressedUntil.get(type);
        if (suppressedUntil && Date.now() < suppressedUntil) {
            return;
        }
        
        // Check if alert is already active
        if (this.alerts.active.has(type)) {
            return;
        }
        
        const alert = {
            type,
            message,
            severity,
            timestamp: Date.now(),
            metrics: {
                fps: this.metrics.fps.current,
                frameTime: this.metrics.frameTime.current,
                memory: this.metrics.memory.used
            }
        };
        
        this.alerts.active.add(type);
        this.alerts.history.push(alert);
        
        // Limit alert history
        if (this.alerts.history.length > 100) {
            this.alerts.history = this.alerts.history.slice(-50);
        }
        
        console.warn(`⚠️ Performance Alert [${severity}]: ${message}`);
        
        this.emit('performanceAlert', alert);
        
        // Auto-clear alert after 30 seconds
        setTimeout(() => {
            this.clearAlert(type);
        }, 30000);
    }
    
    clearAlert(type) {
        this.alerts.active.delete(type);
    }
    
    /**
     * REPORTING
     */
    
    generatePerformanceReport() {
        const report = {
            timestamp: Date.now(),
            uptime: this.isMonitoring ? Date.now() - this.startTime : 0,
            frameCount: this.frameCount,
            metrics: this.getMetricsSummary(),
            optimizationLevel: this.optimizationLevel,
            activeAlerts: Array.from(this.alerts.active),
            recentAlerts: this.alerts.history.slice(-5)
        };
        
        if (this.config.debugMode) {
            console.log('📊 Performance Report:', report);
        }
        
        this.emit('performanceReport', report);
        
        return report;
    }
    
    getMetricsSummary() {
        return {
            fps: {
                current: this.metrics.fps.current,
                average: this.metrics.fps.average,
                min: this.metrics.fps.min,
                max: this.metrics.fps.max
            },
            frameTime: {
                current: this.metrics.frameTime.current,
                average: this.metrics.frameTime.average,
                min: this.metrics.frameTime.min,
                max: this.metrics.frameTime.max
            },
            memory: {
                used: this.metrics.memory.used,
                peak: this.metrics.memory.peak,
                total: this.metrics.memory.total
            },
            webgl: { ...this.metrics.webgl },
            system: { ...this.metrics.system }
        };
    }
    
    /**
     * EVENT HANDLING FOR SYSTEM CONTROLLER
     */
    
    handleEvent(eventType, eventData, source) {
        switch (eventType) {
            case 'visualizerUpdate':
                // Track visualizer performance impact
                break;
            case 'parameterUpdate':
                this.metrics.system.parameterUpdates++;
                break;
            case 'systemError':
                console.warn('PerformanceMonitor received system error:', eventData);
                break;
            default:
                if (this.config.debugMode) {
                    console.log(`PerformanceMonitor received event: ${eventType}`, eventData);
                }
        }
    }
    
    /**
     * PUBLIC API
     */
    
    getCurrentMetrics() {
        return this.getMetricsSummary();
    }
    
    getOptimizationLevel() {
        return this.optimizationLevel;
    }
    
    setOptimizationLevel(level) {
        if (['normal', 'conservative', 'aggressive'].includes(level)) {
            this.applyOptimization(level);
        }
    }
    
    resetMetrics() {
        // Reset all metrics
        for (const metric of Object.values(this.metrics)) {
            if (metric.samples) {
                metric.current = 0;
                metric.average = 0;
                metric.min = Infinity;
                metric.max = 0;
                metric.samples = [];
            }
        }
        
        this.frameCount = 0;
        this.startTime = performance.now();
        
        console.log('📊 Performance metrics reset');
    }
    
    /**
     * STATUS AND DEBUGGING
     */
    
    getStatus() {
        return {
            isMonitoring: this.isMonitoring,
            uptime: this.isMonitoring ? Date.now() - this.startTime : 0,
            frameCount: this.frameCount,
            optimizationLevel: this.optimizationLevel,
            activeAlerts: this.alerts.active.size,
            memoryUsage: this.metrics.memory.used,
            currentFPS: this.metrics.fps.current,
            averageFPS: this.metrics.fps.average
        };
    }
}

// Export for module system
export { PerformanceMonitor };

// Export for global access
if (typeof window !== 'undefined') {
    window.PerformanceMonitor = PerformanceMonitor;
    console.log('📊 PerformanceMonitor loaded and available globally');
}