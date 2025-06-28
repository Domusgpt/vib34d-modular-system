/**
 * VISUALIZER POOL
 * Efficient WebGL instance lifecycle management for the VIB34D system
 * 
 * Responsibilities:
 * - Create and destroy visualizer instances
 * - Manage WebGL resource allocation
 * - Handle instance pooling and recycling
 * - Monitor performance across instances
 * - Coordinate with HomeMaster for parameter updates
 * - Provide context loss recovery
 */

class VisualizerPool extends EventTarget {
    constructor(config = {}) {
        super();
        
        this.config = {
            maxInstances: 20,
            enablePooling: true,
            enableRecycling: true,
            enablePerformanceMonitoring: true,
            recycleThreshold: 0.8,
            debugMode: false,
            ...config
        };
        
        // System references
        this.systemController = config.systemController;
        
        // Instance management
        this.instances = new Map();
        this.activeInstances = new Set();
        this.availableInstances = new Set();
        this.failedInstances = new Set();
        this.recoveryAttempts = new Map();
        
        // Visualizer type registry
        this.visualizerTypes = new Map();
        
        // Performance metrics
        this.performanceMetrics = {
            averageFrameTime: 0,
            instancesPerSecond: 0,
            memoryUsage: 0,
            failureRate: 0
        };
        
        // Resource tracking
        this.resourceUsage = {
            totalShaders: 0,
            totalTextures: 0,
            totalBuffers: 0
        };
        
        // Initialize visualizer types
        this.initializeVisualizerTypes();
        
        // Setup context loss recovery
        this.setupContextLossRecovery();
        
        console.log('🏊 VisualizerPool created');
    }
    
    /**
     * VISUALIZER TYPE REGISTRATION
     */
    
    initializeVisualizerTypes() {
        // Register default VIB34D visualizer types
        this.registerVisualizerType('VIB34D_MOIRE', {
            className: 'VIB34D_MOIRE_VISUALIZER',
            defaultRole: 'content',
            resourceProfile: 'medium',
            instanceCount: 0,
            createdInstances: new Set()
        });
        
        this.registerVisualizerType('VIB34D_POLYTOPAL', {
            className: 'VIB34D_POLYTOPAL_VISUALIZER', 
            defaultRole: 'content',
            resourceProfile: 'high',
            instanceCount: 0,
            createdInstances: new Set()
        });
        
        console.log(`📋 Registered ${this.visualizerTypes.size} visualizer types`);
    }
    
    registerVisualizerType(typeName, config) {
        this.visualizerTypes.set(typeName, {
            ...config,
            typeName,
            instanceCount: 0,
            createdInstances: new Set()
        });
        
        console.log(`📝 Visualizer type registered: ${typeName}`);
    }
    
    /**
     * INSTANCE MANAGEMENT
     */
    
    async createInstance(typeName, canvasElement, role = null, config = {}) {
        if (!this.visualizerTypes.has(typeName)) {
            throw new Error(`Unknown visualizer type: ${typeName}`);
        }
        
        if (this.instances.size >= this.config.maxInstances) {
            console.warn('Maximum instances reached, trying to recycle...');
            const recycled = await this.recycleInstance(typeName);
            if (!recycled) {
                throw new Error('Cannot create instance: pool full and no recyclable instances');
            }
        }
        
        const typeConfig = this.visualizerTypes.get(typeName);
        const instanceId = this.generateInstanceId(typeName);
        
        try {
            // Create visualizer instance
            const visualizerClass = window[typeConfig.className];
            if (!visualizerClass) {
                throw new Error(`Visualizer class not found: ${typeConfig.className}`);
            }
            
            const visualizer = new visualizerClass(
                canvasElement,
                role || typeConfig.defaultRole,
                instanceId
            );
            
            // Create instance metadata
            const instance = {
                id: instanceId,
                type: typeName,
                visualizer: visualizer,
                canvas: canvasElement,
                role: role || typeConfig.defaultRole,
                createdAt: Date.now(),
                lastUpdate: Date.now(),
                isActive: true,
                resourceUsage: {
                    shaders: 0,
                    textures: 0,
                    buffers: 0
                },
                config: config
            };
            
            // Register instance
            this.instances.set(instanceId, instance);
            this.activeInstances.add(instanceId);
            
            // Update type statistics
            typeConfig.instanceCount++;
            typeConfig.createdInstances.add(instanceId);
            
            // Register with HomeMaster if available
            if (this.systemController) {
                const homeMaster = this.systemController.getModule('homeMaster');
                if (homeMaster && typeof homeMaster.registerVisualizer === 'function') {
                    homeMaster.registerVisualizer(instanceId, instance.role);
                }
            }
            
            console.log(`🆕 Visualizer instance created: ${instanceId} (${typeName})`);
            
            this.emit('instanceCreated', {
                instanceId,
                type: typeName,
                role: instance.role
            });
            
            return instanceId;
            
        } catch (error) {
            console.error(`Failed to create visualizer instance (${typeName}):`, error);
            this.failedInstances.add(instanceId);
            throw error;
        }
    }
    
    async destroyInstance(instanceId) {
        const instance = this.instances.get(instanceId);
        if (!instance) {
            console.warn(`Instance not found: ${instanceId}`);
            return false;
        }
        
        try {
            // Cleanup visualizer
            if (instance.visualizer && typeof instance.visualizer.destroy === 'function') {
                instance.visualizer.destroy();
            }
            
            // Cleanup WebGL context if needed
            if (instance.canvas) {
                const gl = instance.canvas.getContext('webgl') || instance.canvas.getContext('experimental-webgl');
                if (gl && typeof gl.getExtension === 'function') {
                    const loseContext = gl.getExtension('WEBGL_lose_context');
                    if (loseContext) {
                        loseContext.loseContext();
                    }
                }
            }
            
            // Update type statistics
            const typeConfig = this.visualizerTypes.get(instance.type);
            if (typeConfig) {
                typeConfig.instanceCount--;
                typeConfig.createdInstances.delete(instanceId);
            }
            
            // Unregister from HomeMaster
            if (this.systemController) {
                const homeMaster = this.systemController.getModule('homeMaster');
                if (homeMaster && typeof homeMaster.unregisterVisualizer === 'function') {
                    homeMaster.unregisterVisualizer(instanceId);
                }
            }
            
            // Remove from pools
            this.instances.delete(instanceId);
            this.activeInstances.delete(instanceId);
            this.availableInstances.delete(instanceId);
            this.failedInstances.delete(instanceId);
            
            console.log(`🗑️ Visualizer instance destroyed: ${instanceId}`);
            
            this.emit('instanceDestroyed', { instanceId });
            
            return true;
            
        } catch (error) {
            console.error(`Failed to destroy instance ${instanceId}:`, error);
            return false;
        }
    }
    
    async recycleInstance(typeName) {
        // Find least recently used instance of the same type
        let oldestInstance = null;
        let oldestTime = Date.now();
        
        for (const [instanceId, instance] of this.instances) {
            if (instance.type === typeName && instance.lastUpdate < oldestTime) {
                oldestInstance = instance;
                oldestTime = instance.lastUpdate;
            }
        }
        
        if (oldestInstance) {
            console.log(`♻️ Recycling instance: ${oldestInstance.id}`);
            await this.destroyInstance(oldestInstance.id);
            return true;
        }
        
        return false;
    }
    
    /**
     * INITIALIZATION
     */
    
    async initializeDefaultInstances() {
        console.log('🏗️ Initializing default visualizer instances...');
        
        const defaultLayout = [
            { type: 'VIB34D_MOIRE', role: 'board', canvasId: 'visualizer-board' },
            { type: 'VIB34D_MOIRE', role: 'card', canvasId: 'card-home' },
            { type: 'VIB34D_MOIRE', role: 'card', canvasId: 'card-tech' },
            { type: 'VIB34D_MOIRE', role: 'card', canvasId: 'card-media' },
            { type: 'VIB34D_MOIRE', role: 'card', canvasId: 'card-innovation' },
            { type: 'VIB34D_MOIRE', role: 'card', canvasId: 'card-research' },
            { type: 'VIB34D_MOIRE', role: 'bezel', canvasId: 'bezel-1' }
        ];
        
        for (const layout of defaultLayout) {
            // Create canvas if it doesn't exist
            let canvas = document.getElementById(layout.canvasId);
            if (!canvas) {
                console.log(`Creating canvas: ${layout.canvasId}`);
                canvas = this.createCanvas(layout.canvasId, layout.role);
            }
            
            try {
                await this.createInstance(layout.type, canvas, layout.role);
            } catch (error) {
                console.error(`Failed to create default instance for ${layout.canvasId}:`, error);
            }
        }
        
        console.log(`✅ Initialized ${this.activeInstances.size} default instances`);
    }
    
    createCanvas(canvasId, role) {
        const canvas = document.createElement('canvas');
        canvas.id = canvasId;
        canvas.className = `visualizer-canvas ${role}-canvas`;
        
        // Set default dimensions based on role
        switch (role) {
            case 'board':
                canvas.width = 800;
                canvas.height = 600;
                break;
            case 'card':
                canvas.width = 400;
                canvas.height = 300;
                break;
            case 'bezel':
                canvas.width = 200;
                canvas.height = 150;
                break;
            default:
                canvas.width = 400;
                canvas.height = 300;
        }
        
        return canvas;
    }
    
    /**
     * PARAMETER MANAGEMENT
     */
    
    updateInstanceParameters(instanceId, parameters) {
        const instance = this.instances.get(instanceId);
        if (!instance) {
            console.warn(`Cannot update parameters: instance ${instanceId} not found`);
            return false;
        }
        
        try {
            if (instance.visualizer && typeof instance.visualizer.setParameters === 'function') {
                instance.visualizer.setParameters(parameters);
                instance.lastUpdate = Date.now();
                return true;
            }
        } catch (error) {
            console.error(`Failed to update parameters for ${instanceId}:`, error);
            this.failedInstances.add(instanceId);
        }
        
        return false;
    }
    
    updateAllParameters(parameters) {
        let successCount = 0;
        
        for (const instanceId of this.activeInstances) {
            if (this.updateInstanceParameters(instanceId, parameters)) {
                successCount++;
            }
        }
        
        return successCount;
    }
    
    setGeometry(geometryType, instanceId = null) {
        if (instanceId) {
            // Update specific instance
            return this.updateInstanceGeometry(instanceId, geometryType);
        } else {
            // Update all instances
            let successCount = 0;
            for (const id of this.activeInstances) {
                if (this.updateInstanceGeometry(id, geometryType)) {
                    successCount++;
                }
            }
            return successCount;
        }
    }
    
    updateInstanceGeometry(instanceId, geometryType) {
        const instance = this.instances.get(instanceId);
        if (!instance) return false;
        
        try {
            if (instance.visualizer && typeof instance.visualizer.setGeometry === 'function') {
                instance.visualizer.setGeometry(geometryType);
                instance.lastUpdate = Date.now();
                
                this.emit('geometryChanged', { instanceId, geometryType });
                return true;
            }
        } catch (error) {
            console.error(`Failed to set geometry for ${instanceId}:`, error);
        }
        
        return false;
    }
    
    /**
     * PERFORMANCE MONITORING
     */
    
    startPerformanceMonitoring() {
        if (this.config.enablePerformanceMonitoring) {
            setInterval(() => {
                this.updatePerformanceMetrics();
            }, 1000);
            
            console.log('📊 Performance monitoring started');
        }
    }
    
    updatePerformanceMetrics() {
        // Calculate average frame time across all instances
        let totalFrameTime = 0;
        let validInstances = 0;
        
        for (const instance of this.instances.values()) {
            if (instance.visualizer && instance.visualizer.getFrameTime) {
                totalFrameTime += instance.visualizer.getFrameTime();
                validInstances++;
            }
        }
        
        if (validInstances > 0) {
            this.performanceMetrics.averageFrameTime = totalFrameTime / validInstances;
        }
        
        // Update other metrics
        this.performanceMetrics.instancesPerSecond = this.activeInstances.size;
        
        // Emit performance update
        this.emit('performanceUpdate', { ...this.performanceMetrics });
    }
    
    /**
     * CONTEXT LOSS RECOVERY
     */
    
    setupContextLossRecovery() {
        // Monitor for WebGL context loss across all instances
        document.addEventListener('webglcontextlost', (event) => {
            console.warn('WebGL context lost, attempting recovery...');
            event.preventDefault();
            this.handleContextLoss();
        });
        
        document.addEventListener('webglcontextrestored', () => {
            console.log('WebGL context restored');
            this.handleContextRestore();
        });
    }
    
    async handleContextLoss() {
        // Mark all instances as needing recovery
        for (const instanceId of this.activeInstances) {
            this.recoveryAttempts.set(instanceId, 0);
        }
        
        this.emit('contextLost', { affectedInstances: Array.from(this.activeInstances) });
    }
    
    async handleContextRestore() {
        // Attempt to restore all instances
        const restoredInstances = [];
        
        for (const [instanceId, attempts] of this.recoveryAttempts) {
            if (attempts < 3) { // Max 3 recovery attempts
                try {
                    const instance = this.instances.get(instanceId);
                    if (instance && instance.visualizer && typeof instance.visualizer.restoreContext === 'function') {
                        await instance.visualizer.restoreContext();
                        restoredInstances.push(instanceId);
                    }
                } catch (error) {
                    console.error(`Failed to restore instance ${instanceId}:`, error);
                    this.recoveryAttempts.set(instanceId, attempts + 1);
                }
            }
        }
        
        // Clear successful recoveries
        for (const instanceId of restoredInstances) {
            this.recoveryAttempts.delete(instanceId);
        }
        
        this.emit('contextRestored', { restoredInstances });
    }
    
    /**
     * UTILITY METHODS
     */
    
    generateInstanceId(typeName) {
        const timestamp = Date.now().toString(36);
        const random = Math.random().toString(36).substr(2, 9);
        return `${typeName}_${timestamp}_${random}`;
    }
    
    getInstance(instanceId) {
        return this.instances.get(instanceId);
    }
    
    getActiveCount() {
        return this.activeInstances.size;
    }
    
    getInstancesByRole(role) {
        const instances = [];
        for (const instance of this.instances.values()) {
            if (instance.role === role) {
                instances.push(instance);
            }
        }
        return instances;
    }
    
    getInstancesByType(typeName) {
        const instances = [];
        for (const instance of this.instances.values()) {
            if (instance.type === typeName) {
                instances.push(instance);
            }
        }
        return instances;
    }
    
    /**
     * STATUS AND DEBUGGING
     */
    
    getStatus() {
        return {
            totalInstances: this.instances.size,
            activeInstances: this.activeInstances.size,
            availableInstances: this.availableInstances.size,
            failedInstances: this.failedInstances.size,
            registeredTypes: this.visualizerTypes.size,
            performanceMetrics: { ...this.performanceMetrics },
            resourceUsage: { ...this.resourceUsage }
        };
    }
    
    getDetailedStatus() {
        const typeBreakdown = {};
        for (const [typeName, typeConfig] of this.visualizerTypes) {
            typeBreakdown[typeName] = {
                instanceCount: typeConfig.instanceCount,
                createdInstances: Array.from(typeConfig.createdInstances)
            };
        }
        
        return {
            ...this.getStatus(),
            typeBreakdown,
            instances: Array.from(this.instances.values()).map(instance => ({
                id: instance.id,
                type: instance.type,
                role: instance.role,
                createdAt: instance.createdAt,
                lastUpdate: instance.lastUpdate,
                isActive: instance.isActive
            }))
        };
    }
    
    /**
     * EVENT HANDLING FOR SYSTEM CONTROLLER
     */
    
    handleEvent(eventType, eventData, source) {
        switch (eventType) {
            case 'parameterUpdate':
                if (eventData.name && eventData.value !== undefined) {
                    this.updateAllParameters({ [eventData.name]: eventData.value });
                }
                break;
            case 'geometryChange':
                if (eventData.geometryType) {
                    this.setGeometry(eventData.geometryType);
                }
                break;
            case 'visualizerUpdate':
                // Handle specific visualizer updates
                break;
            case 'systemError':
                console.warn('VisualizerPool received system error:', eventData);
                break;
            default:
                if (this.config.debugMode) {
                    console.log(`VisualizerPool received event: ${eventType}`, eventData);
                }
        }
    }
}

// Export for module system
export { VisualizerPool };

// Export for global access
if (typeof window !== 'undefined') {
    window.VisualizerPool = VisualizerPool;
    console.log('🏊 VisualizerPool loaded and available globally');
}