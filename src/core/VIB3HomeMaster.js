/**
 * VIB3 HOME MASTER
 * Central parameter authority for the VIB34D system
 * 
 * Responsibilities:
 * - Single source of truth for all system parameters
 * - Parameter validation and type checking
 * - Cross-visualizer synchronization
 * - Preset management integration
 * - Performance-aware parameter updates
 */

class VIB3HomeMaster extends EventTarget {
    constructor(config = {}) {
        super();
        
        this.config = {
            maxVisualizers: 20,
            parameterUpdateThrottleMS: 16,
            debugMode: false,
            enablePresets: true,
            enableValidation: true,
            ...config
        };
        
        // System references
        this.systemController = config.systemController;
        this.reactivityBridge = null;
        
        // Master parameter state
        this.parameters = {
            // Core 4D parameters
            dimension: 3.5,
            morphFactor: 0.5,
            rotationSpeed: 0.5,
            
            // Visual parameters
            intensity: 0.8,
            glitchIntensity: 0.5,
            gridDensity: 12.0,
            
            // Interaction parameters
            interactionIntensity: 0.3,
            
            // Geometry parameters
            geometry: 0, // Index of current geometry (0-7)
            
            // Time-based parameters
            globalTime: 0.0,
            animationSpeed: 1.0
        };
        
        // Parameter metadata
        this.parameterMeta = {
            dimension: { min: 3.0, max: 4.5, type: 'float', category: 'core' },
            morphFactor: { min: 0.0, max: 1.5, type: 'float', category: 'core' },
            rotationSpeed: { min: 0.0, max: 2.0, type: 'float', category: 'core' },
            intensity: { min: 0.0, max: 1.0, type: 'float', category: 'visual' },
            glitchIntensity: { min: 0.0, max: 1.0, type: 'float', category: 'visual' },
            gridDensity: { min: 5.0, max: 25.0, type: 'float', category: 'visual' },
            interactionIntensity: { min: 0.0, max: 1.0, type: 'float', category: 'interaction' },
            geometry: { min: 0, max: 7, type: 'int', category: 'geometry' },
            globalTime: { min: 0.0, max: Infinity, type: 'float', category: 'time' },
            animationSpeed: { min: 0.1, max: 3.0, type: 'float', category: 'time' }
        };
        
        // Registered visualizers
        this.registeredVisualizers = new Map();
        
        // Parameter update tracking
        this.updateQueue = [];
        this.lastUpdateTime = 0;
        this.isProcessingUpdates = false;
        
        // Presets integration
        this.currentPreset = null;
        this.presetOverrides = new Map();
        
        console.log('🏠 VIB3HomeMaster created');
    }
    
    /**
     * LIFECYCLE MANAGEMENT
     */
    
    async start() {
        console.log('▶️ Starting VIB3HomeMaster...');
        
        try {
            // Start parameter update loop
            this.startUpdateLoop();
            
            // Initialize time tracking
            this.startTime = performance.now();
            
            console.log('✅ VIB3HomeMaster started');
            
        } catch (error) {
            console.error('❌ VIB3HomeMaster start failed:', error);
            throw error;
        }
    }
    
    async stop() {
        console.log('⏸️ Stopping VIB3HomeMaster...');
        
        // Stop update processing
        this.isProcessingUpdates = false;
        this.updateQueue = [];
        
        console.log('✅ VIB3HomeMaster stopped');
    }
    
    /**
     * SYSTEM INTEGRATION
     */
    
    setReactivityBridge(bridge) {
        this.reactivityBridge = bridge;
        console.log('🔗 VIB3HomeMaster connected to ReactivityBridge');
    }
    
    /**
     * VISUALIZER REGISTRATION
     */
    
    registerVisualizer(instanceId, role = 'content') {
        if (!this.registeredVisualizers) {
            this.registeredVisualizers = new Map();
        }
        
        this.registeredVisualizers.set(instanceId, {
            role: role,
            instanceId: instanceId,
            registeredAt: Date.now(),
            lastUpdate: 0,
            parameterCache: new Map()
        });
        
        console.log(`📝 Visualizer registered: ${instanceId} (${role})`);
        
        // Send current parameters to new visualizer
        this.syncVisualizerParameters(instanceId);
        
        return true;
    }
    
    unregisterVisualizer(instanceId) {
        if (this.registeredVisualizers && this.registeredVisualizers.has(instanceId)) {
            this.registeredVisualizers.delete(instanceId);
            console.log(`📝 Visualizer unregistered: ${instanceId}`);
            return true;
        }
        return false;
    }
    
    /**
     * PARAMETER MANAGEMENT
     */
    
    setParameter(name, value, source = 'api') {
        if (!this.parameters.hasOwnProperty(name)) {
            console.warn(`Unknown parameter: ${name}`);
            return false;
        }
        
        // Validate parameter
        if (this.config.enableValidation) {
            value = this.validateParameter(name, value);
            if (value === null) {
                console.warn(`Invalid value for parameter ${name}`);
                return false;
            }
        }
        
        // Check if value actually changed
        if (this.parameters[name] === value) {
            return true;
        }
        
        // Queue parameter update
        this.queueParameterUpdate(name, value, source);
        
        return true;
    }
    
    getParameter(name) {
        return this.parameters[name];
    }
    
    getAllParameters() {
        return { ...this.parameters };
    }
    
    setParameters(parameterMap, source = 'api') {
        const results = {};
        
        for (const [name, value] of Object.entries(parameterMap)) {
            results[name] = this.setParameter(name, value, source);
        }
        
        return results;
    }
    
    validateParameter(name, value) {
        const meta = this.parameterMeta[name];
        if (!meta) return null;
        
        // Type validation
        if (meta.type === 'float') {
            value = parseFloat(value);
            if (isNaN(value)) return null;
        } else if (meta.type === 'int') {
            value = parseInt(value);
            if (isNaN(value)) return null;
        }
        
        // Range validation
        if (value < meta.min) value = meta.min;
        if (value > meta.max) value = meta.max;
        
        return value;
    }
    
    /**
     * PARAMETER UPDATE PROCESSING
     */
    
    queueParameterUpdate(name, value, source) {
        this.updateQueue.push({
            name,
            value,
            source,
            timestamp: performance.now()
        });
        
        // Prevent queue overflow
        if (this.updateQueue.length > 100) {
            this.updateQueue = this.updateQueue.slice(-50);
        }
    }
    
    processParameterUpdates() {
        if (this.isProcessingUpdates || this.updateQueue.length === 0) {
            return;
        }
        
        this.isProcessingUpdates = true;
        const now = performance.now();
        
        // Process all queued updates
        while (this.updateQueue.length > 0) {
            const update = this.updateQueue.shift();
            this.applyParameterUpdate(update);
        }
        
        // Update global time
        if (this.startTime) {
            this.parameters.globalTime = (now - this.startTime) * 0.001 * this.parameters.animationSpeed;
        }
        
        this.lastUpdateTime = now;
        this.isProcessingUpdates = false;
    }
    
    applyParameterUpdate(update) {
        const { name, value, source } = update;
        
        // Update parameter
        const oldValue = this.parameters[name];
        this.parameters[name] = value;
        
        // Notify reactivity bridge
        if (this.reactivityBridge && typeof this.reactivityBridge.onParameterUpdate === 'function') {
            this.reactivityBridge.onParameterUpdate(name, value, oldValue, source);
        }
        
        // Sync to visualizers
        this.syncParameterToVisualizers(name, value, source);
        
        // Emit parameter change event
        this.emit('parameterChanged', {
            name,
            value,
            oldValue,
            source,
            timestamp: performance.now()
        });
        
        if (this.config.debugMode) {
            console.log(`🎛️ Parameter updated: ${name} = ${value} (${source})`);
        }
    }
    
    /**
     * VISUALIZER SYNCHRONIZATION
     */
    
    syncParameterToVisualizers(name, value, source) {
        if (!this.registeredVisualizers) return;
        
        for (const [instanceId, visualizerInfo] of this.registeredVisualizers) {
            // Check if parameter has changed for this visualizer
            const cache = visualizerInfo.parameterCache;
            if (cache.get(name) === value) continue;
            
            // Update cache
            cache.set(name, value);
            visualizerInfo.lastUpdate = performance.now();
            
            // Emit update event for this visualizer
            this.emit('visualizerParameterUpdate', {
                instanceId,
                name,
                value,
                source,
                role: visualizerInfo.role
            });
        }
    }
    
    syncVisualizerParameters(instanceId) {
        if (!this.registeredVisualizers || !this.registeredVisualizers.has(instanceId)) {
            return false;
        }
        
        const visualizerInfo = this.registeredVisualizers.get(instanceId);
        
        // Send all current parameters
        for (const [name, value] of Object.entries(this.parameters)) {
            visualizerInfo.parameterCache.set(name, value);
            
            this.emit('visualizerParameterUpdate', {
                instanceId,
                name,
                value,
                source: 'sync',
                role: visualizerInfo.role
            });
        }
        
        visualizerInfo.lastUpdate = performance.now();
        
        console.log(`🔄 Parameters synced to visualizer: ${instanceId}`);
        return true;
    }
    
    syncAllVisualizers() {
        if (!this.registeredVisualizers) return;
        
        for (const instanceId of this.registeredVisualizers.keys()) {
            this.syncVisualizerParameters(instanceId);
        }
    }
    
    /**
     * INTERACTION HANDLING
     */
    
    handleScrollInteraction(deltaY) {
        const currentGridDensity = this.parameters.gridDensity;
        const direction = deltaY > 0 ? -1 : 1;
        const newGridDensity = Math.max(5.0, Math.min(25.0, currentGridDensity + direction * 1.0));
        
        this.setParameter('gridDensity', newGridDensity, 'scroll');
    }
    
    handleMouseInteraction(x, y, intensity = 0.5) {
        // Map mouse position to morphFactor and dimension
        const morphFactor = x * 1.5;
        const dimension = 3.0 + (y * 1.5);
        
        this.setParameter('morphFactor', morphFactor, 'mouse');
        this.setParameter('dimension', dimension, 'mouse');
        this.setParameter('interactionIntensity', intensity, 'mouse');
    }
    
    handleClickInteraction(x, y, isDown = true) {
        const currentRotationSpeed = this.parameters.rotationSpeed;
        const newRotationSpeed = isDown ? 
            Math.min(2.0, currentRotationSpeed + 0.5) : 
            Math.max(0.0, currentRotationSpeed - 0.3);
            
        this.setParameter('rotationSpeed', newRotationSpeed, 'click');
        this.setParameter('interactionIntensity', isDown ? 1.0 : 0.3, 'click');
    }
    
    handleKeyboardInteraction(key, isDown = true) {
        if (!isDown) return;
        
        // Geometry switching (keys 1-8)
        if (/^[1-8]$/.test(key)) {
            const geometryIndex = parseInt(key) - 1;
            this.setParameter('geometry', geometryIndex, 'keyboard');
            return;
        }
        
        // Parameter fine-tuning
        switch (key) {
            case 'ArrowUp':
                this.adjustParameter('dimension', 0.1);
                break;
            case 'ArrowDown':
                this.adjustParameter('dimension', -0.1);
                break;
            case 'ArrowLeft':
                this.adjustParameter('rotationSpeed', -0.1);
                break;
            case 'ArrowRight':
                this.adjustParameter('rotationSpeed', 0.1);
                break;
            case ' ': // Spacebar - toggle glitch
                const currentGlitch = this.parameters.glitchIntensity;
                this.setParameter('glitchIntensity', currentGlitch > 0.5 ? 0.1 : 0.9, 'keyboard');
                break;
        }
    }
    
    adjustParameter(name, delta) {
        const currentValue = this.parameters[name];
        const newValue = currentValue + delta;
        this.setParameter(name, newValue, 'keyboard');
    }
    
    /**
     * PRESET MANAGEMENT
     */
    
    loadPreset(presetData) {
        if (typeof presetData === 'string') {
            // Assume it's a preset name - would need PresetDatabase integration
            console.warn('Preset name loading requires PresetDatabase integration');
            return false;
        }
        
        if (typeof presetData === 'object' && presetData.parameters) {
            this.currentPreset = presetData;
            
            // Apply preset parameters
            for (const [name, value] of Object.entries(presetData.parameters)) {
                this.setParameter(name, value, 'preset');
            }
            
            console.log('🎨 Preset loaded:', presetData.name || 'unnamed');
            return true;
        }
        
        return false;
    }
    
    saveCurrentAsPreset(name) {
        return {
            name,
            timestamp: Date.now(),
            parameters: { ...this.parameters },
            metadata: {
                visualizerCount: this.registeredVisualizers ? this.registeredVisualizers.size : 0,
                version: '1.0'
            }
        };
    }
    
    /**
     * SYSTEM MONITORING
     */
    
    getSystemState() {
        return {
            parameters: { ...this.parameters },
            visualizerCount: this.registeredVisualizers ? this.registeredVisualizers.size : 0,
            updateQueueLength: this.updateQueue.length,
            lastUpdateTime: this.lastUpdateTime,
            currentPreset: this.currentPreset?.name || null,
            isProcessing: this.isProcessingUpdates
        };
    }
    
    getVisualizerInfo() {
        if (!this.registeredVisualizers) return {};
        
        const info = {};
        for (const [instanceId, visualizerInfo] of this.registeredVisualizers) {
            info[instanceId] = {
                role: visualizerInfo.role,
                registeredAt: visualizerInfo.registeredAt,
                lastUpdate: visualizerInfo.lastUpdate,
                parameterCount: visualizerInfo.parameterCache.size
            };
        }
        return info;
    }
    
    /**
     * UPDATE LOOP
     */
    
    startUpdateLoop() {
        const update = () => {
            this.processParameterUpdates();
            requestAnimationFrame(update);
        };
        
        requestAnimationFrame(update);
        console.log('🔄 VIB3HomeMaster update loop started');
    }
    
    /**
     * EVENT HANDLING FOR SYSTEM CONTROLLER
     */
    
    handleEvent(eventType, eventData, source) {
        switch (eventType) {
            case 'userInput':
                this.handleUserInput(eventData, source);
                break;
            case 'parameterUpdate':
                if (eventData.name && eventData.value !== undefined) {
                    this.setParameter(eventData.name, eventData.value, source);
                }
                break;
            case 'systemError':
                console.warn('VIB3HomeMaster received system error:', eventData);
                break;
            default:
                if (this.config.debugMode) {
                    console.log(`VIB3HomeMaster received event: ${eventType}`, eventData);
                }
        }
    }
    
    handleUserInput(eventData, source) {
        switch (eventData.type) {
            case 'mouse':
                this.handleMouseInteraction(eventData.x, eventData.y, eventData.intensity);
                break;
            case 'click':
                this.handleClickInteraction(eventData.x, eventData.y, eventData.isDown);
                break;
            case 'scroll':
                this.handleScrollInteraction(eventData.deltaY);
                break;
            case 'keyboard':
                this.handleKeyboardInteraction(eventData.key, eventData.isDown);
                break;
        }
    }
    
    /**
     * STATUS AND DEBUGGING
     */
    
    getStatus() {
        return {
            totalVisualizers: this.registeredVisualizers ? this.registeredVisualizers.size : 0,
            currentPreset: this.currentPreset?.name || null,
            updateQueueLength: this.updateQueue.length,
            isProcessingUpdates: this.isProcessingUpdates,
            parameterCount: Object.keys(this.parameters).length,
            systemStarted: !!this.startTime
        };
    }
}

// Export for module system
export { VIB3HomeMaster };

// Export for global access
if (typeof window !== 'undefined') {
    window.VIB3HomeMaster = VIB3HomeMaster;
    console.log('🏠 VIB3HomeMaster loaded and available globally');
}