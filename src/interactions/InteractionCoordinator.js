/**
 * INTERACTION COORDINATOR
 * Unified event handling system for the VIB34D architecture
 * 
 * Responsibilities:
 * - Capture all user interactions (mouse, keyboard, touch, scroll)
 * - Map interactions to VIB3 parameter changes
 * - Handle ecosystem reactions (focused/unfocused element behaviors)
 * - Coordinate with VIB3HomeMaster for parameter updates
 * - Manage gesture recognition and complex interaction patterns
 */

class InteractionCoordinator extends EventTarget {
    constructor(config = {}) {
        super();
        
        this.config = {
            enabledInputs: ['mouse', 'keyboard', 'touch', 'scroll'],
            eventThrottleMS: 16, // ~60fps
            gestureTimeout: 2000,
            debugMode: false,
            ...config
        };
        
        // System references
        this.homeMaster = null;
        this.systemController = null;
        
        // Event state tracking
        this.eventState = {
            mouse: {
                x: 0,
                y: 0,
                velocity: { x: 0, y: 0 },
                isDown: false,
                lastActivity: 0
            },
            keyboard: {
                keysDown: new Set(),
                lastKeyTime: 0,
                keySequence: []
            },
            touch: {
                touches: [],
                lastTouchTime: 0
            },
            scroll: {
                velocity: 0,
                direction: 'none',
                lastScrollTime: 0
            }
        };
        
        // Parameter mappings
        this.parameterMappings = new Map();
        this.setupParameterMappings();
        
        // Event listener tracking
        this.eventListeners = new Map();
        this.lastMousePos = null;
        
        console.log('🎮 InteractionCoordinator created');
    }
    
    /**
     * INITIALIZATION
     */
    
    initialize(homeMaster, systemController) {
        this.homeMaster = homeMaster;
        this.systemController = systemController;
        
        this.setupEventListeners();
        
        console.log('🎮 InteractionCoordinator initialized');
        return Promise.resolve();
    }
    
    setupEventListeners() {
        if (this.config.enabledInputs.includes('mouse')) {
            this.setupMouseEvents();
        }
        
        if (this.config.enabledInputs.includes('keyboard')) {
            this.setupKeyboardEvents();
        }
        
        if (this.config.enabledInputs.includes('touch')) {
            this.setupTouchEvents();
        }
        
        if (this.config.enabledInputs.includes('scroll')) {
            this.setupScrollEvents();
        }
        
        this.setupWindowEvents();
        
        console.log('🎮 Event listeners setup complete');
    }
    
    /**
     * EVENT SETUP
     */
    
    setupMouseEvents() {
        const mouseMove = this.throttle((e) => {
            this.handleMouseMove(e);
        }, this.config.eventThrottleMS);
        
        const mouseDown = (e) => this.handleMouseDown(e);
        const mouseUp = (e) => this.handleMouseUp(e);
        
        this.addEventListeners(document, {
            'mousemove': mouseMove,
            'mousedown': mouseDown,
            'mouseup': mouseUp
        });
        
        // Setup hover events for interactive elements
        this.setupHoverEvents();
        
        console.log('🖱️ Mouse events setup complete');
    }
    
    setupKeyboardEvents() {
        const keyDown = (e) => this.handleKeyDown(e);
        const keyUp = (e) => this.handleKeyUp(e);
        
        this.addEventListeners(document, {
            'keydown': keyDown,
            'keyup': keyUp
        });
        
        console.log('⌨️ Keyboard events setup complete');
    }
    
    setupTouchEvents() {
        const touchStart = (e) => this.handleTouchStart(e);
        const touchMove = this.throttle((e) => {
            this.handleTouchMove(e);
        }, this.config.eventThrottleMS);
        const touchEnd = (e) => this.handleTouchEnd(e);
        
        this.addEventListeners(document, {
            'touchstart': touchStart,
            'touchmove': touchMove,
            'touchend': touchEnd
        });
        
        console.log('👆 Touch events setup complete');
    }
    
    setupScrollEvents() {
        const scroll = this.throttle((e) => {
            this.handleScroll(e);
        }, this.config.eventThrottleMS);
        
        this.addEventListeners(document, {
            'wheel': scroll
        });
        
        console.log('📜 Scroll events setup complete');
    }
    
    setupWindowEvents() {
        const resize = this.throttle(() => {
            this.handleResize();
        }, 100); // Less frequent for resize
        
        this.addEventListeners(window, {
            'resize': resize
        });
        
        console.log('🪟 Window events setup complete');
    }
    
    setupHoverEvents() {
        // Setup hover events for interactive elements
        const interactiveElements = document.querySelectorAll('.module-demo, .status-item, .control-button');
        
        interactiveElements.forEach(element => {
            const mouseEnter = (e) => this.handleElementHover(e, 'enter');
            const mouseLeave = (e) => this.handleElementHover(e, 'leave');
            
            this.addEventListeners(element, {
                'mouseenter': mouseEnter,
                'mouseleave': mouseLeave
            });
        });
    }
    
    /**
     * EVENT HANDLERS
     */
    
    handleMouseMove(e) {
        // Update mouse state
        this.eventState.mouse.x = e.clientX / window.innerWidth;
        this.eventState.mouse.y = 1.0 - (e.clientY / window.innerHeight);
        this.eventState.mouse.lastActivity = Date.now();
        
        // Calculate velocity
        if (this.lastMousePos) {
            this.eventState.mouse.velocity.x = this.eventState.mouse.x - this.lastMousePos.x;
            this.eventState.mouse.velocity.y = this.eventState.mouse.y - this.lastMousePos.y;
        }
        this.lastMousePos = { x: this.eventState.mouse.x, y: this.eventState.mouse.y };
        
        // Map to parameters
        this.updateParametersFromMouse();
        
        // Emit event
        this.emit('mouseMove', {
            position: { x: this.eventState.mouse.x, y: this.eventState.mouse.y },
            velocity: this.eventState.mouse.velocity
        });
    }
    
    handleMouseDown(e) {
        this.eventState.mouse.isDown = true;
        this.eventState.mouse.lastActivity = Date.now();
        
        // Map to parameters
        this.updateParametersFromClick(true);
        
        this.emit('mouseDown', { 
            button: e.button,
            position: { x: this.eventState.mouse.x, y: this.eventState.mouse.y }
        });
    }
    
    handleMouseUp(e) {
        this.eventState.mouse.isDown = false;
        
        // Map to parameters
        this.updateParametersFromClick(false);
        
        this.emit('mouseUp', { 
            button: e.button,
            position: { x: this.eventState.mouse.x, y: this.eventState.mouse.y }
        });
    }
    
    handleElementHover(e, action) {
        const element = e.currentTarget;
        const elementType = this.getElementType(element);
        
        if (action === 'enter') {
            this.handleElementFocus(element, elementType);
        } else {
            this.handleElementUnfocus(element, elementType);
        }
        
        this.emit('elementHover', {
            element,
            elementType,
            action
        });
    }
    
    handleKeyDown(e) {
        this.eventState.keyboard.keysDown.add(e.key);
        this.eventState.keyboard.lastKeyTime = Date.now();
        
        // Handle specific key mappings
        this.handleKeyMapping(e.key, true);
        
        this.emit('keyDown', {
            key: e.key,
            code: e.code,
            keysDown: Array.from(this.eventState.keyboard.keysDown)
        });
    }
    
    handleKeyUp(e) {
        this.eventState.keyboard.keysDown.delete(e.key);
        
        this.handleKeyMapping(e.key, false);
        
        this.emit('keyUp', {
            key: e.key,
            code: e.code,
            keysDown: Array.from(this.eventState.keyboard.keysDown)
        });
    }
    
    handleTouchStart(e) {
        console.log('👆 Touch start detected');
    }
    
    handleTouchMove(e) {
        console.log('👆 Touch move detected');
    }
    
    handleTouchEnd(e) {
        console.log('👆 Touch end detected');
    }
    
    handleScroll(e) {
        const deltaY = e.deltaY;
        const now = Date.now();
        
        // Update scroll state
        this.eventState.scroll.velocity = Math.abs(deltaY) / 100;
        this.eventState.scroll.direction = deltaY > 0 ? 'down' : 'up';
        this.eventState.scroll.lastScrollTime = now;
        
        // Update parameters
        this.updateParametersFromScroll(deltaY);
        
        this.emit('scroll', {
            delta: deltaY,
            velocity: this.eventState.scroll.velocity,
            direction: this.eventState.scroll.direction
        });
    }
    
    handleResize() {
        const aspectRatio = window.innerWidth / window.innerHeight;
        
        this.emit('resize', {
            width: window.innerWidth,
            height: window.innerHeight,
            aspectRatio
        });
    }
    
    /**
     * PARAMETER MAPPING
     */
    
    setupParameterMappings() {
        // Mouse position → morphFactor and dimension
        this.parameterMappings.set('mousePosition', {
            morphFactor: (mouse) => mouse.x * 1.5,
            dimension: (mouse) => 3.0 + (mouse.y * 1.5)
        });
        
        // Click state → rotation speed
        this.parameterMappings.set('clickState', {
            rotationSpeed: (isDown, baseSpeed = 0.5) => isDown ? Math.min(2.0, baseSpeed + 0.5) : baseSpeed
        });
        
        // Scroll → grid density
        this.parameterMappings.set('scroll', {
            gridDensity: (delta, current = 12.0) => {
                const direction = delta > 0 ? -1 : 1;
                return Math.max(5.0, Math.min(25.0, current + direction * 1.0));
            }
        });
        
        // Key mappings → geometry switching
        this.parameterMappings.set('keyGeometry', {
            geometry: (key) => {
                const geometryMap = {
                    '1': 0, '2': 1, '3': 2, '4': 3,
                    '5': 4, '6': 5, '7': 6, '8': 7
                };
                return geometryMap[key];
            }
        });
    }
    
    updateParametersFromMouse() {
        if (!this.homeMaster) return;
        
        const mappings = this.parameterMappings.get('mousePosition');
        const mouse = this.eventState.mouse;
        
        // Update parameters based on mouse position
        if (mappings) {
            try {
                this.homeMaster.setParameter('morphFactor', mappings.morphFactor(mouse), 'mouse');
                this.homeMaster.setParameter('dimension', mappings.dimension(mouse), 'mouse');
            } catch (error) {
                // Fail silently in demo
            }
        }
    }
    
    updateParametersFromClick(isDown) {
        if (!this.homeMaster) return;
        
        const mappings = this.parameterMappings.get('clickState');
        
        if (mappings) {
            try {
                const currentRotationSpeed = this.homeMaster.getParameter('rotationSpeed') || 0.5;
                this.homeMaster.setParameter('rotationSpeed', mappings.rotationSpeed(isDown, currentRotationSpeed), 'click');
            } catch (error) {
                // Fail silently in demo
            }
        }
    }
    
    updateParametersFromScroll(delta) {
        if (!this.homeMaster) return;
        
        const mappings = this.parameterMappings.get('scroll');
        
        if (mappings) {
            try {
                const currentGridDensity = this.homeMaster.getParameter('gridDensity') || 12.0;
                this.homeMaster.setParameter('gridDensity', mappings.gridDensity(delta, currentGridDensity), 'scroll');
            } catch (error) {
                // Fail silently in demo
            }
        }
    }
    
    handleKeyMapping(key, isDown) {
        if (!this.homeMaster || !isDown) return;
        
        // Geometry switching (keys 1-8)
        if (/^[1-8]$/.test(key)) {
            const mappings = this.parameterMappings.get('keyGeometry');
            if (mappings) {
                try {
                    const geometryIndex = mappings.geometry(key);
                    this.homeMaster.setParameter('geometry', geometryIndex, 'keyboard');
                } catch (error) {
                    // Fail silently in demo
                }
            }
        }
    }
    
    /**
     * ECOSYSTEM REACTIONS
     */
    
    handleElementFocus(element, elementType) {
        // Visual feedback
        element.style.transform = 'scale(1.05)';
        element.style.boxShadow = '0 0 20px rgba(0, 255, 136, 0.3)';
        
        this.emit('elementFocused', { element, elementType });
    }
    
    handleElementUnfocus(element, elementType) {
        // Reset visual state
        element.style.transform = 'scale(1.0)';
        element.style.boxShadow = 'none';
        
        this.emit('elementUnfocused', { element, elementType });
    }
    
    /**
     * UTILITY METHODS
     */
    
    getElementType(element) {
        if (element.classList.contains('module-demo')) return 'module';
        if (element.classList.contains('status-item')) return 'status';
        if (element.classList.contains('control-button')) return 'button';
        return 'unknown';
    }
    
    addEventListeners(element, events) {
        if (!this.eventListeners.has(element)) {
            this.eventListeners.set(element, new Map());
        }
        
        const elementListeners = this.eventListeners.get(element);
        
        for (const [eventType, listener] of Object.entries(events)) {
            element.addEventListener(eventType, listener);
            elementListeners.set(eventType, listener);
        }
    }
    
    throttle(func, limit) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }
    
    /**
     * PUBLIC API
     */
    
    getEventState() {
        return { ...this.eventState };
    }
    
    handleEvent(eventType, eventData, source) {
        if (this.config.debugMode) {
            console.log(`InteractionCoordinator received event: ${eventType}`, eventData);
        }
    }
    
    getStatus() {
        return {
            enabledInputs: this.config.enabledInputs,
            activeListeners: this.eventListeners.size,
            lastMouseActivity: this.eventState.mouse.lastActivity,
            mousePosition: {
                x: this.eventState.mouse.x,
                y: this.eventState.mouse.y
            }
        };
    }
}

// Export for module system
export { InteractionCoordinator };

// Export for global access
if (typeof window !== 'undefined') {
    window.InteractionCoordinator = InteractionCoordinator;
    console.log('🎮 InteractionCoordinator loaded and available globally');
}