/**
 * PRESET DATABASE
 * Configuration management system for the VIB34D system
 * 
 * Responsibilities:
 * - Store and manage visual/behavioral presets
 * - Provide preset categories and filtering
 * - Handle preset import/export
 * - Validate preset configurations
 * - Support real-time preset switching
 */

class PresetDatabase extends EventTarget {
    constructor(config = {}) {
        super();
        
        this.config = {
            enableValidation: true,
            enableAutoSave: true,
            maxPresets: 100,
            enableCategories: true,
            debugMode: false,
            ...config
        };
        
        // System references
        this.systemController = config.systemController;
        
        // Preset storage
        this.presets = new Map();
        this.categories = new Map();
        this.tags = new Set();
        
        // Current state
        this.currentPreset = null;
        this.defaultPreset = null;
        
        // Validation schemas
        this.schemas = {
            preset: this.createPresetSchema(),
            parameters: this.createParameterSchema()
        };
        
        // Initialize with default presets
        this.initializeDefaultPresets();
        
        console.log('🎨 PresetDatabase created');
    }
    
    /**
     * INITIALIZATION
     */
    
    initializeDefaultPresets() {
        console.log('🏗️ Initializing default presets...');
        
        // Default preset
        this.addPreset({
            id: 'default',
            name: 'Default',
            description: 'Standard VIB34D configuration',
            category: 'system',
            tags: ['default', 'basic'],
            parameters: {
                dimension: 3.5,
                morphFactor: 0.5,
                rotationSpeed: 0.5,
                intensity: 0.8,
                glitchIntensity: 0.5,
                gridDensity: 12.0,
                interactionIntensity: 0.3,
                geometry: 0,
                animationSpeed: 1.0
            },
            visual: {
                colorScheme: 'neon',
                effectIntensity: 0.8,
                particleCount: 1000,
                bloomIntensity: 0.6
            },
            behavior: {
                autoRotation: true,
                mouseResponsive: true,
                keyboardControls: true,
                scrollEffects: true
            }
        });
        
        // Hypercube Focus
        this.addPreset({
            id: 'hypercube_focus',
            name: 'Hypercube Focus',
            description: 'Emphasizes 4D hypercube geometry',
            category: 'geometry',
            tags: ['hypercube', '4d', 'mathematical'],
            parameters: {
                dimension: 4.0,
                morphFactor: 0.0,
                rotationSpeed: 0.3,
                intensity: 1.0,
                glitchIntensity: 0.1,
                gridDensity: 8.0,
                interactionIntensity: 0.8,
                geometry: 0, // Hypercube
                animationSpeed: 0.8
            },
            visual: {
                colorScheme: 'crystalline',
                effectIntensity: 0.9,
                particleCount: 500,
                bloomIntensity: 0.4
            },
            behavior: {
                autoRotation: true,
                mouseResponsive: true,
                keyboardControls: true,
                scrollEffects: false
            }
        });
        
        // Fractal Dreams
        this.addPreset({
            id: 'fractal_dreams',
            name: 'Fractal Dreams',
            description: 'Ethereal fractal geometries with high morphing',
            category: 'artistic',
            tags: ['fractal', 'dreamy', 'organic'],
            parameters: {
                dimension: 3.8,
                morphFactor: 1.2,
                rotationSpeed: 0.2,
                intensity: 0.9,
                glitchIntensity: 0.7,
                gridDensity: 16.0,
                interactionIntensity: 0.6,
                geometry: 5, // Fractal
                animationSpeed: 0.5
            },
            visual: {
                colorScheme: 'aurora',
                effectIntensity: 1.0,
                particleCount: 2000,
                bloomIntensity: 0.8
            },
            behavior: {
                autoRotation: false,
                mouseResponsive: true,
                keyboardControls: true,
                scrollEffects: true
            }
        });
        
        // Wave Interference
        this.addPreset({
            id: 'wave_interference',
            name: 'Wave Interference',
            description: 'Dynamic wave patterns with high responsiveness',
            category: 'dynamic',
            tags: ['wave', 'physics', 'dynamic'],
            parameters: {
                dimension: 3.3,
                morphFactor: 0.8,
                rotationSpeed: 1.0,
                intensity: 0.7,
                glitchIntensity: 0.3,
                gridDensity: 20.0,
                interactionIntensity: 1.0,
                geometry: 6, // Wave
                animationSpeed: 1.5
            },
            visual: {
                colorScheme: 'ocean',
                effectIntensity: 0.8,
                particleCount: 1500,
                bloomIntensity: 0.5
            },
            behavior: {
                autoRotation: true,
                mouseResponsive: true,
                keyboardControls: true,
                scrollEffects: true
            }
        });
        
        // Crystal Matrix
        this.addPreset({
            id: 'crystal_matrix',
            name: 'Crystal Matrix',
            description: 'Precise crystalline structures with minimal effects',
            category: 'technical',
            tags: ['crystal', 'precise', 'minimal'],
            parameters: {
                dimension: 4.2,
                morphFactor: 0.1,
                rotationSpeed: 0.4,
                intensity: 0.9,
                glitchIntensity: 0.0,
                gridDensity: 12.0,
                interactionIntensity: 0.5,
                geometry: 7, // Crystal
                animationSpeed: 0.7
            },
            visual: {
                colorScheme: 'monochrome',
                effectIntensity: 0.3,
                particleCount: 800,
                bloomIntensity: 0.2
            },
            behavior: {
                autoRotation: true,
                mouseResponsive: false,
                keyboardControls: true,
                scrollEffects: false
            }
        });
        
        // Chaos Mode
        this.addPreset({
            id: 'chaos_mode',
            name: 'Chaos Mode',
            description: 'Maximum chaos and glitch effects',
            category: 'experimental',
            tags: ['chaos', 'glitch', 'extreme'],
            parameters: {
                dimension: 3.9,
                morphFactor: 1.5,
                rotationSpeed: 1.8,
                intensity: 1.0,
                glitchIntensity: 1.0,
                gridDensity: 25.0,
                interactionIntensity: 1.0,
                geometry: 5, // Fractal
                animationSpeed: 2.0
            },
            visual: {
                colorScheme: 'rainbow',
                effectIntensity: 1.0,
                particleCount: 3000,
                bloomIntensity: 1.0
            },
            behavior: {
                autoRotation: true,
                mouseResponsive: true,
                keyboardControls: true,
                scrollEffects: true
            }
        });
        
        // Minimal Clean
        this.addPreset({
            id: 'minimal_clean',
            name: 'Minimal Clean',
            description: 'Clean, minimal design for presentations',
            category: 'presentation',
            tags: ['minimal', 'clean', 'professional'],
            parameters: {
                dimension: 3.5,
                morphFactor: 0.0,
                rotationSpeed: 0.1,
                intensity: 0.5,
                glitchIntensity: 0.0,
                gridDensity: 8.0,
                interactionIntensity: 0.2,
                geometry: 0, // Hypercube
                animationSpeed: 0.3
            },
            visual: {
                colorScheme: 'minimal',
                effectIntensity: 0.2,
                particleCount: 200,
                bloomIntensity: 0.1
            },
            behavior: {
                autoRotation: false,
                mouseResponsive: false,
                keyboardControls: true,
                scrollEffects: false
            }
        });
        
        // Setup categories
        this.setupCategories();
        
        // Set default
        this.defaultPreset = this.presets.get('default');
        this.currentPreset = this.defaultPreset;
        
        console.log(`✅ Initialized ${this.presets.size} default presets`);
    }
    
    setupCategories() {
        this.categories.set('system', {
            name: 'System',
            description: 'Core system presets',
            color: '#666666'
        });
        
        this.categories.set('geometry', {
            name: 'Geometry',
            description: 'Geometry-focused presets',
            color: '#3498db'
        });
        
        this.categories.set('artistic', {
            name: 'Artistic',
            description: 'Creative and artistic presets',
            color: '#e74c3c'
        });
        
        this.categories.set('dynamic', {
            name: 'Dynamic',
            description: 'High-motion dynamic presets',
            color: '#f39c12'
        });
        
        this.categories.set('technical', {
            name: 'Technical',
            description: 'Precise technical presets',
            color: '#27ae60'
        });
        
        this.categories.set('experimental', {
            name: 'Experimental',
            description: 'Experimental and extreme presets',
            color: '#9b59b6'
        });
        
        this.categories.set('presentation', {
            name: 'Presentation',
            description: 'Professional presentation presets',
            color: '#34495e'
        });
    }
    
    /**
     * PRESET MANAGEMENT
     */
    
    addPreset(presetData) {
        // Validate preset
        if (this.config.enableValidation && !this.validatePreset(presetData)) {
            throw new Error('Invalid preset data');
        }
        
        // Generate ID if not provided
        if (!presetData.id) {
            presetData.id = this.generatePresetId(presetData.name);
        }
        
        // Add metadata
        const preset = {
            ...presetData,
            createdAt: Date.now(),
            updatedAt: Date.now(),
            version: '1.0',
            usage: 0
        };
        
        // Store preset
        this.presets.set(preset.id, preset);
        
        // Update tags
        if (preset.tags) {
            preset.tags.forEach(tag => this.tags.add(tag));
        }
        
        console.log(`🎨 Preset added: ${preset.name} (${preset.id})`);
        
        this.emit('presetAdded', { preset });
        
        return preset.id;
    }
    
    removePreset(presetId) {
        const preset = this.presets.get(presetId);
        if (!preset) {
            return false;
        }
        
        // Prevent deletion of system presets
        if (preset.category === 'system') {
            console.warn('Cannot delete system preset');
            return false;
        }
        
        this.presets.delete(presetId);
        
        console.log(`🗑️ Preset removed: ${preset.name}`);
        
        this.emit('presetRemoved', { presetId, preset });
        
        return true;
    }
    
    getPreset(presetId) {
        return this.presets.get(presetId);
    }
    
    getAllPresets() {
        return Array.from(this.presets.values());
    }
    
    getPresetsByCategory(category) {
        return Array.from(this.presets.values())
            .filter(preset => preset.category === category);
    }
    
    /**
     * VALIDATION
     */
    
    createPresetSchema() {
        return {
            required: ['id', 'name', 'parameters'],
            properties: {
                id: { type: 'string', minLength: 1 },
                name: { type: 'string', minLength: 1 },
                description: { type: 'string' },
                category: { type: 'string' },
                tags: { type: 'array', items: { type: 'string' } },
                parameters: { type: 'object' },
                visual: { type: 'object' },
                behavior: { type: 'object' }
            }
        };
    }
    
    createParameterSchema() {
        return {
            dimension: { type: 'number', min: 3.0, max: 4.5 },
            morphFactor: { type: 'number', min: 0.0, max: 1.5 },
            rotationSpeed: { type: 'number', min: 0.0, max: 2.0 },
            intensity: { type: 'number', min: 0.0, max: 1.0 },
            glitchIntensity: { type: 'number', min: 0.0, max: 1.0 },
            gridDensity: { type: 'number', min: 5.0, max: 25.0 },
            interactionIntensity: { type: 'number', min: 0.0, max: 1.0 },
            geometry: { type: 'integer', min: 0, max: 7 },
            animationSpeed: { type: 'number', min: 0.1, max: 3.0 }
        };
    }
    
    validatePreset(preset) {
        if (!preset.id || !preset.name || !preset.parameters) {
            return false;
        }
        
        // Validate parameters
        return this.validateParameters(preset.parameters);
    }
    
    validateParameters(parameters) {
        const schema = this.schemas.parameters;
        
        for (const [name, value] of Object.entries(parameters)) {
            const paramSchema = schema[name];
            if (!paramSchema) continue;
            
            if (paramSchema.type === 'number' && typeof value !== 'number') {
                return false;
            }
            
            if (paramSchema.type === 'integer' && !Number.isInteger(value)) {
                return false;
            }
            
            if (paramSchema.min !== undefined && value < paramSchema.min) {
                return false;
            }
            
            if (paramSchema.max !== undefined && value > paramSchema.max) {
                return false;
            }
        }
        
        return true;
    }
    
    generatePresetId(name) {
        const baseId = name.toLowerCase().replace(/[^a-z0-9]/g, '_');
        let id = baseId;
        let counter = 1;
        
        while (this.presets.has(id)) {
            id = `${baseId}_${counter}`;
            counter++;
        }
        
        return id;
    }
    
    /**
     * EVENT HANDLING FOR SYSTEM CONTROLLER
     */
    
    handleEvent(eventType, eventData, source) {
        switch (eventType) {
            case 'systemError':
                console.warn('PresetDatabase received system error:', eventData);
                break;
            default:
                if (this.config.debugMode) {
                    console.log(`PresetDatabase received event: ${eventType}`, eventData);
                }
        }
    }
    
    /**
     * STATUS AND DEBUGGING
     */
    
    getStatus() {
        return {
            totalPresets: this.presets.size,
            totalCategories: this.categories.size,
            totalTags: this.tags.size,
            currentPreset: this.currentPreset?.id || null,
            defaultPreset: this.defaultPreset?.id || null,
            validationEnabled: this.config.enableValidation,
            autoSaveEnabled: this.config.enableAutoSave
        };
    }
}

// Export for module system
export { PresetDatabase };

// Export for global access
if (typeof window !== 'undefined') {
    window.PresetDatabase = PresetDatabase;
    console.log('🎨 PresetDatabase loaded and available globally');
}