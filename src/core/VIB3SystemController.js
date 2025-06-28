/**
 * VIB3 SYSTEM CONTROLLER
 * Top-level coordinator for the entire VIB34D reactive system
 * 
 * Responsibilities:
 * - System lifecycle management (init, start, stop, destroy)
 * - Module coordination and communication
 * - Event routing between subsystems
 * - Performance monitoring and optimization
 * - Error handling and recovery
 */

class VIB3SystemController extends EventTarget {
    constructor(config = {}) {
        super();
        
        // System configuration
        this.config = {
            performanceMode: 'high', // high, balanced, power-saver
            debugMode: false,
            maxVisualizers: 20,
            targetFPS: 60,
            eventThrottleMS: 16, // ~60fps event processing
            ...config
        };
        
        // System state
        this.isInitialized = false;
        this.isRunning = false;
        this.systemHealth = 'unknown';
        this.lastPerformanceCheck = 0;
        
        // Module references (initialized lazily)
        this.modules = {
            homeMaster: null,
            reactivityBridge: null,
            interactionCoordinator: null,
            visualizerPool: null,
            geometryRegistry: null,
            presetDatabase: null,
            performanceMonitor: null,
            errorHandler: null
        };
        
        // Event routing
        this.eventRouter = new Map();
        this.setupEventRouting();
        
        // Performance tracking
        this.metrics = {
            frameCount: 0,
            lastFrameTime: 0,
            averageFPS: 0,
            memoryUsage: 0,
            activeVisualizers: 0,
            lastEventTime: 0
        };
        
        console.log('🎛️ VIB3SystemController created with config:', this.config);
    }
    
    /**
     * SYSTEM LIFECYCLE MANAGEMENT
     */
    
    async initialize() {
        if (this.isInitialized) {
            console.warn('VIB3SystemController already initialized');
            return this;
        }
        
        console.log('🚀 Initializing VIB3 System...');
        
        try {
            // Phase 1: Initialize core modules
            await this.initializeCoreModules();
            
            // Phase 2: Initialize managers
            await this.initializeManagers();
            
            // Phase 3: Initialize specialized systems
            await this.initializeSpecializedSystems();
            
            // Phase 4: Setup monitoring and error handling
            await this.initializeMonitoring();
            
            // Phase 5: Validate system integrity
            await this.validateSystemIntegrity();
            
            this.isInitialized = true;
            this.systemHealth = 'healthy';
            
            this.emit('systemInitialized', { 
                timestamp: Date.now(),
                modules: Object.keys(this.modules),
                health: this.systemHealth
            });
            
            console.log('✅ VIB3 System initialized successfully');
            return this;
            
        } catch (error) {
            this.systemHealth = 'error';
            this.handleError('SystemInitialization', error);
            throw error;
        }
    }
    
    async start() {
        if (!this.isInitialized) {
            throw new Error('System must be initialized before starting');
        }
        
        if (this.isRunning) {
            console.warn('VIB3SystemController already running');
            return this;
        }
        
        console.log('▶️ Starting VIB3 System...');
        
        try {
            // Start core systems
            if (this.modules.homeMaster) {
                await this.modules.homeMaster.start();
            }
            
            if (this.modules.reactivityBridge) {
                await this.modules.reactivityBridge.start();
            }
            
            // Start interaction processing
            if (this.modules.interactionCoordinator) {
                await this.modules.interactionCoordinator.start();
            }
            
            // Start visualizer pool
            if (this.modules.visualizerPool) {
                await this.modules.visualizerPool.start();
            }
            
            // Start performance monitoring
            if (this.modules.performanceMonitor) {
                this.modules.performanceMonitor.startMonitoring();
            }
            
            this.isRunning = true;
            this.startMainLoop();
            
            this.emit('systemStarted', { timestamp: Date.now() });
            
            console.log('✅ VIB3 System started successfully');
            return this;
            
        } catch (error) {
            this.systemHealth = 'error';
            this.handleError('SystemStart', error);
            throw error;
        }
    }
    
    async stop() {
        if (!this.isRunning) {
            console.warn('VIB3SystemController not running');
            return this;
        }
        
        console.log('⏸️ Stopping VIB3 System...');
        
        try {
            this.isRunning = false;
            
            // Stop monitoring first
            if (this.modules.performanceMonitor) {
                this.modules.performanceMonitor.stopMonitoring();
            }
            
            // Stop interaction processing
            if (this.modules.interactionCoordinator) {
                await this.modules.interactionCoordinator.stop();
            }
            
            // Stop visualizers
            if (this.modules.visualizerPool) {
                await this.modules.visualizerPool.stop();
            }
            
            // Stop core systems
            if (this.modules.reactivityBridge) {
                await this.modules.reactivityBridge.stop();
            }
            
            if (this.modules.homeMaster) {
                await this.modules.homeMaster.stop();
            }
            
            this.emit('systemStopped', { timestamp: Date.now() });
            
            console.log('✅ VIB3 System stopped successfully');
            return this;
            
        } catch (error) {
            this.handleError('SystemStop', error);
            throw error;
        }
    }
    
    async destroy() {
        console.log('🗑️ Destroying VIB3 System...');
        
        try {
            // Stop if running
            if (this.isRunning) {
                await this.stop();
            }
            
            // Destroy all modules
            for (const [name, module] of Object.entries(this.modules)) {
                if (module && typeof module.destroy === 'function') {
                    await module.destroy();
                }
                this.modules[name] = null;
            }
            
            // Clear event listeners
            this.eventRouter.clear();
            
            this.isInitialized = false;
            this.systemHealth = 'destroyed';
            
            this.emit('systemDestroyed', { timestamp: Date.now() });
            
            console.log('✅ VIB3 System destroyed successfully');
            
        } catch (error) {
            this.handleError('SystemDestroy', error);
            throw error;
        }
    }
    
    /**
     * MODULE INITIALIZATION
     */
    
    async initializeCoreModules() {
        console.log('🔧 Initializing core modules...');
        
        // Initialize VIB3HomeMaster (Central Authority)
        const { VIB3HomeMaster } = await import('./VIB3HomeMaster.js');
        this.modules.homeMaster = new VIB3HomeMaster({
            systemController: this,
            maxVisualizers: this.config.maxVisualizers
        });
        
        // Initialize UnifiedReactivityBridge (Multi-layer Coordinator)
        const { UnifiedReactivityBridge } = await import('./UnifiedReactivityBridge.js');
        this.modules.reactivityBridge = new UnifiedReactivityBridge({
            systemController: this,
            homeMaster: this.modules.homeMaster
        });
        
        // Cross-reference modules
        this.modules.homeMaster.setReactivityBridge(this.modules.reactivityBridge);
    }
    
    async initializeManagers() {
        console.log('🎛️ Initializing managers...');
        
        // Initialize InteractionCoordinator
        const { InteractionCoordinator } = await import('../interactions/InteractionCoordinator.js');
        this.modules.interactionCoordinator = new InteractionCoordinator({
            systemController: this,
            homeMaster: this.modules.homeMaster
        });
        
        // Initialize VisualizerPool
        const { VisualizerPool } = await import('../managers/VisualizerPool.js');
        this.modules.visualizerPool = new VisualizerPool({
            systemController: this,
            maxInstances: this.config.maxVisualizers
        });
    }
    
    async initializeSpecializedSystems() {
        console.log('⚙️ Initializing specialized systems...');
        
        // Initialize GeometryRegistry
        const { GeometryRegistry } = await import('../geometry/GeometryRegistry.js');
        this.modules.geometryRegistry = new GeometryRegistry({
            systemController: this
        });
        
        // Initialize PresetDatabase
        const { PresetDatabase } = await import('../presets/PresetDatabase.js');
        this.modules.presetDatabase = new PresetDatabase({
            systemController: this
        });
    }
    
    async initializeMonitoring() {
        console.log('📊 Initializing monitoring...');
        
        // Initialize PerformanceMonitor
        const { PerformanceMonitor } = await import('../utils/PerformanceMonitor.js');
        this.modules.performanceMonitor = new PerformanceMonitor({
            systemController: this,
            targetFPS: this.config.targetFPS
        });
        
        // Initialize ErrorHandler
        const { ErrorHandler } = await import('../utils/ErrorHandler.js');
        this.modules.errorHandler = new ErrorHandler({
            systemController: this,
            debugMode: this.config.debugMode
        });
    }
    
    async validateSystemIntegrity() {
        console.log('🔍 Validating system integrity...');
        
        const requiredModules = ['homeMaster', 'reactivityBridge', 'interactionCoordinator', 'visualizerPool'];
        
        for (const moduleName of requiredModules) {
            if (!this.modules[moduleName]) {
                throw new Error(`Required module '${moduleName}' failed to initialize`);
            }
        }
        
        console.log('✅ System integrity validated');
    }
    
    /**
     * EVENT ROUTING AND COORDINATION
     */
    
    setupEventRouting() {
        // Define event routing table
        this.eventRouter.set('userInput', ['interactionCoordinator', 'homeMaster']);
        this.eventRouter.set('parameterUpdate', ['homeMaster', 'reactivityBridge', 'visualizerPool']);
        this.eventRouter.set('geometryChange', ['geometryRegistry', 'visualizerPool']);
        this.eventRouter.set('visualizerUpdate', ['visualizerPool', 'performanceMonitor']);
        this.eventRouter.set('systemError', ['errorHandler']);
        this.eventRouter.set('performanceUpdate', ['performanceMonitor']);
    }
    
    routeEvent(eventType, eventData, source = 'unknown') {
        const routes = this.eventRouter.get(eventType);
        
        if (!routes) {
            console.warn(`No routes defined for event type: ${eventType}`);
            return;
        }
        
        // Route to all registered handlers
        routes.forEach(moduleName => {
            const module = this.modules[moduleName];
            if (module && typeof module.handleEvent === 'function') {
                try {
                    module.handleEvent(eventType, eventData, source);
                } catch (error) {
                    this.handleError(`EventRouting_${moduleName}`, error);
                }
            }
        });
        
        // Emit system-level event for external listeners
        this.emit(eventType, { ...eventData, source, timestamp: Date.now() });
    }
    
    /**
     * MAIN SYSTEM LOOP
     */
    
    startMainLoop() {
        const loop = () => {
            if (!this.isRunning) return;
            
            try {
                this.updateMetrics();
                this.checkSystemHealth();
                
                // Continue loop
                requestAnimationFrame(loop);
                
            } catch (error) {
                this.handleError('MainLoop', error);
            }
        };
        
        requestAnimationFrame(loop);
    }
    
    updateMetrics() {
        const now = performance.now();
        this.metrics.frameCount++;
        
        if (this.metrics.lastFrameTime > 0) {
            const deltaTime = now - this.metrics.lastFrameTime;
            const currentFPS = 1000 / deltaTime;
            
            // Smooth FPS averaging
            this.metrics.averageFPS = this.metrics.averageFPS * 0.9 + currentFPS * 0.1;
        }
        
        this.metrics.lastFrameTime = now;
        
        // Update memory usage if available
        if (performance.memory) {
            this.metrics.memoryUsage = performance.memory.usedJSHeapSize / 1024 / 1024; // MB
        }
        
        // Update active visualizer count
        if (this.modules.visualizerPool) {
            this.metrics.activeVisualizers = this.modules.visualizerPool.getActiveCount();
        }
    }
    
    checkSystemHealth() {
        // Check FPS health
        if (this.metrics.averageFPS < this.config.targetFPS * 0.8) {
            if (this.systemHealth !== 'performance-warning') {
                this.systemHealth = 'performance-warning';
                this.emit('systemHealthChange', { 
                    health: this.systemHealth, 
                    reason: 'Low FPS',
                    fps: this.metrics.averageFPS 
                });
            }
        } else if (this.systemHealth === 'performance-warning') {
            this.systemHealth = 'healthy';
            this.emit('systemHealthChange', { 
                health: this.systemHealth, 
                reason: 'FPS recovered' 
            });
        }
        
        // Check memory health
        if (this.metrics.memoryUsage > 200) { // 200MB threshold
            if (this.systemHealth !== 'memory-warning') {
                this.systemHealth = 'memory-warning';
                this.emit('systemHealthChange', { 
                    health: this.systemHealth, 
                    reason: 'High memory usage',
                    memory: this.metrics.memoryUsage 
                });
            }
        }
    }
    
    /**
     * ERROR HANDLING
     */
    
    handleError(context, error) {
        console.error(`VIB3SystemController Error [${context}]:`, error);
        
        if (this.modules.errorHandler) {
            this.modules.errorHandler.handleError(context, error);
        }
        
        this.emit('systemError', { context, error, timestamp: Date.now() });
    }
    
    /**
     * PUBLIC API
     */
    
    // Fluent configuration
    withConfig(config) {
        Object.assign(this.config, config);
        return this;
    }
    
    withModule(name, module) {
        this.modules[name] = module;
        return this;
    }
    
    // System status
    getStatus() {
        return {
            isInitialized: this.isInitialized,
            isRunning: this.isRunning,
            health: this.systemHealth,
            metrics: { ...this.metrics },
            modules: Object.keys(this.modules).filter(name => this.modules[name] !== null)
        };
    }
    
    getModule(name) {
        return this.modules[name];
    }
    
    // Parameter management
    async setParameter(name, value, source = 'api') {
        if (this.modules.homeMaster) {
            return await this.modules.homeMaster.setParameter(name, value, source);
        }
        throw new Error('HomeMaster not initialized');
    }
    
    getParameter(name) {
        if (this.modules.homeMaster) {
            return this.modules.homeMaster.getParameter(name);
        }
        throw new Error('HomeMaster not initialized');
    }
    
    // Geometry management
    async setGeometry(geometryType, instanceId = null) {
        if (this.modules.geometryRegistry && this.modules.visualizerPool) {
            const geometry = await this.modules.geometryRegistry.getGeometry(geometryType);
            return await this.modules.visualizerPool.setGeometry(geometry, instanceId);
        }
        throw new Error('Geometry systems not initialized');
    }
    
    // Preset management
    async loadPreset(presetName) {
        if (this.modules.presetDatabase) {
            return await this.modules.presetDatabase.loadPreset(presetName);
        }
        throw new Error('PresetDatabase not initialized');
    }
}

// Export for module system
export { VIB3SystemController };

// Export for global access
if (typeof window !== 'undefined') {
    window.VIB3SystemController = VIB3SystemController;
    console.log('🎛️ VIB3SystemController loaded and available globally');
}