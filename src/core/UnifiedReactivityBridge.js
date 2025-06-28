/**
 * UNIFIED REACTIVITY BRIDGE
 * Coordinates CSS, JS, and WebGL synchronization for the VIB34D system
 */

class UnifiedReactivityBridge extends EventTarget {
    constructor(config = {}) {
        super();
        
        this.config = {
            enableCSSSync: true,
            enableJSSync: true,
            enableWebGLSync: true,
            debugMode: false,
            ...config
        };
        
        // State management
        this.state = {
            cssProperties: new Map(),
            jsVariables: new Map(),
            webglUniforms: new Map()
        };
        
        // Synchronization queues
        this.syncQueue = [];
        this.isProcessing = false;
        
        console.log('🌉 UnifiedReactivityBridge created');
    }
    
    /**
     * INITIALIZATION
     */
    
    initialize() {
        this.setupCSSObserver();
        this.setupEventListeners();
        
        console.log('🌉 UnifiedReactivityBridge initialized');
        return Promise.resolve();
    }
    
    setupCSSObserver() {
        if (!this.config.enableCSSSync) return;
        
        // Monitor CSS custom properties
        const observer = new MutationObserver((mutations) => {
            mutations.forEach(mutation => {
                if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
                    this.handleCSSChange(mutation.target);
                }
            });
        });
        
        observer.observe(document.documentElement, {
            attributes: true,
            subtree: true,
            attributeFilter: ['style']
        });
    }
    
    setupEventListeners() {
        // Listen for parameter changes
        document.addEventListener('vib3-parameter-change', (event) => {
            this.handleParameterChange(event.detail);
        });
        
        // Listen for system events
        document.addEventListener('vib3-system-update', (event) => {
            this.handleSystemUpdate(event.detail);
        });
    }
    
    /**
     * SYNCHRONIZATION METHODS
     */
    
    sync(property, value, source = 'js') {
        const syncData = {
            property,
            value,
            source,
            timestamp: Date.now()
        };
        
        this.syncQueue.push(syncData);
        
        if (!this.isProcessing) {
            this.processSyncQueue();
        }
    }
    
    async processSyncQueue() {
        this.isProcessing = true;
        
        while (this.syncQueue.length > 0) {
            const syncData = this.syncQueue.shift();
            await this.processSyncItem(syncData);
        }
        
        this.isProcessing = false;
    }
    
    async processSyncItem(syncData) {
        const { property, value, source } = syncData;
        
        try {
            // Update CSS if enabled and not from CSS source
            if (this.config.enableCSSSync && source !== 'css') {
                this.updateCSS(property, value);
            }
            
            // Update JS variables if enabled and not from JS source
            if (this.config.enableJSSync && source !== 'js') {
                this.updateJS(property, value);
            }
            
            // Update WebGL uniforms if enabled and not from WebGL source
            if (this.config.enableWebGLSync && source !== 'webgl') {
                this.updateWebGL(property, value);
            }
            
            // Emit sync event
            this.emit('property-synced', { property, value, source });
            
        } catch (error) {
            console.error('Sync error:', error);
            this.emit('sync-error', { property, value, source, error });
        }
    }
    
    /**
     * UPDATE METHODS
     */
    
    updateCSS(property, value) {
        const cssProperty = `--vib3-${property}`;
        document.documentElement.style.setProperty(cssProperty, value);
        this.state.cssProperties.set(property, value);
        
        if (this.config.debugMode) {
            console.log(`🎨 CSS updated: ${cssProperty} = ${value}`);
        }
    }
    
    updateJS(property, value) {
        // Update global VIB3 state if available
        if (window.VIB3_STATE) {
            window.VIB3_STATE[property] = value;
        }
        
        this.state.jsVariables.set(property, value);
        
        // Emit JS update event
        const event = new CustomEvent('vib3-js-update', {
            detail: { property, value }
        });
        document.dispatchEvent(event);
        
        if (this.config.debugMode) {
            console.log(`📜 JS updated: ${property} = ${value}`);
        }
    }
    
    updateWebGL(property, value) {
        this.state.webglUniforms.set(property, value);
        
        // Emit WebGL update event for visualizers
        const event = new CustomEvent('vib3-webgl-update', {
            detail: { property, value }
        });
        document.dispatchEvent(event);
        
        if (this.config.debugMode) {
            console.log(`🔺 WebGL updated: ${property} = ${value}`);
        }
    }
    
    /**
     * EVENT HANDLERS
     */
    
    handleCSSChange(element) {
        const style = getComputedStyle(element);
        
        // Check for VIB3 custom properties
        for (let i = 0; i < style.length; i++) {
            const property = style[i];
            if (property.startsWith('--vib3-')) {
                const value = style.getPropertyValue(property);
                const cleanProperty = property.replace('--vib3-', '');
                
                if (this.state.cssProperties.get(cleanProperty) !== value) {
                    this.sync(cleanProperty, value, 'css');
                }
            }
        }
    }
    
    handleParameterChange(detail) {
        const { parameter, value } = detail;
        this.sync(parameter, value, 'parameter');
    }
    
    handleSystemUpdate(detail) {
        const { updates } = detail;
        
        Object.entries(updates).forEach(([property, value]) => {
            this.sync(property, value, 'system');
        });
    }
    
    /**
     * UTILITY METHODS
     */
    
    getState() {
        return {
            css: Object.fromEntries(this.state.cssProperties),
            js: Object.fromEntries(this.state.jsVariables),
            webgl: Object.fromEntries(this.state.webglUniforms)
        };
    }
    
    reset() {
        this.state.cssProperties.clear();
        this.state.jsVariables.clear();
        this.state.webglUniforms.clear();
        this.syncQueue = [];
        
        console.log('🔄 UnifiedReactivityBridge reset');
    }
    
    /**
     * PUBLIC API
     */
    
    syncProperty(property, value, source = 'api') {
        this.sync(property, value, source);
    }
    
    syncMultiple(properties, source = 'api') {
        Object.entries(properties).forEach(([property, value]) => {
            this.sync(property, value, source);
        });
    }
    
    getProperty(property) {
        return {
            css: this.state.cssProperties.get(property),
            js: this.state.jsVariables.get(property),
            webgl: this.state.webglUniforms.get(property)
        };
    }
}

// Export for module system
export { UnifiedReactivityBridge };

// Export for global access
if (typeof window !== 'undefined') {
    window.UnifiedReactivityBridge = UnifiedReactivityBridge;
    console.log('🌉 UnifiedReactivityBridge loaded and available globally');
}