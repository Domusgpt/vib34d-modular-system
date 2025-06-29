/**
 * Simple EventEmitter base class for modules that don't extend EventTarget
 */
class EventEmitterBase {
    constructor() {
        this.events = {};
    }
    
    emit(eventName, data) {
        if (!this.events[eventName]) return;
        
        this.events[eventName].forEach(callback => {
            try {
                callback(data);
            } catch (error) {
                console.error(`Error in event handler for ${eventName}:`, error);
            }
        });
    }
    
    on(eventName, callback) {
        if (!this.events[eventName]) {
            this.events[eventName] = [];
        }
        this.events[eventName].push(callback);
    }
    
    off(eventName, callback) {
        if (!this.events[eventName]) return;
        
        this.events[eventName] = this.events[eventName].filter(cb => cb !== callback);
    }
}

// Export for module system
export { EventEmitterBase };

// Export for global access
if (typeof window !== 'undefined') {
    window.EventEmitterBase = EventEmitterBase;
    console.log('📡 EventEmitterBase loaded and available globally');
}