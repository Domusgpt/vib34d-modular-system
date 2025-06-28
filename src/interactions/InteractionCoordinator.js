/**
 * INTERACTION COORDINATOR
 * Unified event handling and routing for the VIB34D system
 * 
 * Responsibilities:
 * - Event capture and validation
 * - Gesture recognition and pattern detection
 * - Parameter mapping from user inputs
 * - Event throttling and performance optimization
 * - Ecosystem reaction coordination
 */

class InteractionCoordinator extends EventTarget {
    constructor(config = {}) {
        super();
        
        this.config = {
            eventThrottleMS: 16, // ~60fps
            gestureTimeoutMS: 500,
            debugMode: false,
            enabledInputs: ['mouse', 'keyboard', 'touch', 'scroll'],
            ...config
        };
        
        // References to other systems
        this.systemController = config.systemController;
        this.homeMaster = config.homeMaster;
        
        // Event state tracking
        this.eventState = {
            mouse: {
                x: 0.5,
                y: 0.5,
                isDown: false,
                lastActivity: 0,
                velocity: { x: 0, y: 0 }
            },
            keyboard: {
                keysDown: new Set(),
                lastKeyTime: 0,
                sequences: []
            },
            touch: {
                touches: new Map(),
                gestureState: 'idle'
            },
            scroll: {
                velocity: 0,
                direction: 'idle',
                lastScrollTime: 0
            }
        };
        
        // Throttling management
        this.throttledEvents = new Map();
        this.lastEventTimes = new Map();
        
        // Event listeners storage for cleanup
        this.eventListeners = new Map();
        
        // Gesture patterns
        this.gesturePatterns = new Map();
        this.setupGesturePatterns();
        
        // Parameter mapping configuration
        this.parameterMappings = new Map();
        this.setupParameterMappings();
        
        console.log('🎮 InteractionCoordinator created');
    }
    
    /**
     * LIFECYCLE MANAGEMENT
     */
    
    async start() {
        console.log('▶️ Starting InteractionCoordinator...');
        
        try {
            // Setup event listeners for enabled input types
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
            
            // Setup window events
            this.setupWindowEvents();
            
            console.log('✅ InteractionCoordinator started');
            
        } catch (error) {
            console.error('❌ InteractionCoordinator start failed:', error);
            throw error;
        }
    }
    
    async stop() {
        console.log('⏸️ Stopping InteractionCoordinator...');
        
        // Remove all event listeners
        for (const [element, listeners] of this.eventListeners) {
            for (const [eventType, listener] of listeners) {
                element.removeEventListener(eventType, listener);
            }
        }
        
        this.eventListeners.clear();
        this.throttledEvents.clear();
        this.lastEventTimes.clear();
        
        console.log('✅ InteractionCoordinator stopped');
    }
    
    /**
     * EVENT SETUP
     */
    
    setupMouseEvents() {
        const mouseMove = this.throttle((e) => {\n            this.handleMouseMove(e);\n        }, this.config.eventThrottleMS);\n        \n        const mouseDown = (e) => this.handleMouseDown(e);\n        const mouseUp = (e) => this.handleMouseUp(e);\n        const mouseEnter = (e) => this.handleMouseEnter(e);\n        const mouseLeave = (e) => this.handleMouseLeave(e);\n        \n        this.addEventListeners(document, {\n            'mousemove': mouseMove,\n            'mousedown': mouseDown,\n            'mouseup': mouseUp\n        });\n        \n        // Setup hover events for interactive elements\n        this.setupHoverEvents();\n        \n        console.log('🖱️ Mouse events setup complete');\n    }\n    \n    setupKeyboardEvents() {\n        const keyDown = (e) => this.handleKeyDown(e);\n        const keyUp = (e) => this.handleKeyUp(e);\n        \n        this.addEventListeners(document, {\n            'keydown': keyDown,\n            'keyup': keyUp\n        });\n        \n        console.log('⌨️ Keyboard events setup complete');\n    }\n    \n    setupTouchEvents() {\n        const touchStart = (e) => this.handleTouchStart(e);\n        const touchMove = this.throttle((e) => {\n            this.handleTouchMove(e);\n        }, this.config.eventThrottleMS);\n        const touchEnd = (e) => this.handleTouchEnd(e);\n        \n        this.addEventListeners(document, {\n            'touchstart': touchStart,\n            'touchmove': touchMove,\n            'touchend': touchEnd\n        });\n        \n        console.log('👆 Touch events setup complete');\n    }\n    \n    setupScrollEvents() {\n        const scroll = this.throttle((e) => {\n            this.handleScroll(e);\n        }, this.config.eventThrottleMS);\n        \n        this.addEventListeners(document, {\n            'wheel': scroll\n        });\n        \n        console.log('📜 Scroll events setup complete');\n    }\n    \n    setupWindowEvents() {\n        const resize = this.throttle(() => {\n            this.handleResize();\n        }, 100); // Less frequent for resize\n        \n        this.addEventListeners(window, {\n            'resize': resize\n        });\n        \n        console.log('🪟 Window events setup complete');\n    }\n    \n    setupHoverEvents() {\n        // Setup hover events for blog cards and interactive elements\n        const interactiveElements = document.querySelectorAll('.blog-card, .visualizer-board, .state-dot');\n        \n        interactiveElements.forEach(element => {\n            const mouseEnter = (e) => this.handleElementHover(e, 'enter');\n            const mouseLeave = (e) => this.handleElementHover(e, 'leave');\n            \n            this.addEventListeners(element, {\n                'mouseenter': mouseEnter,\n                'mouseleave': mouseLeave\n            });\n        });\n    }\n    \n    /**\n     * EVENT HANDLERS\n     */\n    \n    handleMouseMove(e) {\n        // Update mouse state\n        this.eventState.mouse.x = e.clientX / window.innerWidth;\n        this.eventState.mouse.y = 1.0 - (e.clientY / window.innerHeight);\n        this.eventState.mouse.lastActivity = Date.now();\n        \n        // Calculate velocity\n        if (this.lastMousePos) {\n            this.eventState.mouse.velocity.x = this.eventState.mouse.x - this.lastMousePos.x;\n            this.eventState.mouse.velocity.y = this.eventState.mouse.y - this.lastMousePos.y;\n        }\n        this.lastMousePos = { x: this.eventState.mouse.x, y: this.eventState.mouse.y };\n        \n        // Map to parameters\n        this.updateParametersFromMouse();\n        \n        // Emit event\n        this.emit('mouseMove', {\n            position: { x: this.eventState.mouse.x, y: this.eventState.mouse.y },\n            velocity: this.eventState.mouse.velocity\n        });\n    }\n    \n    handleMouseDown(e) {\n        this.eventState.mouse.isDown = true;\n        this.eventState.mouse.lastActivity = Date.now();\n        \n        // Map to parameters\n        this.updateParametersFromClick(true);\n        \n        this.emit('mouseDown', { \n            button: e.button,\n            position: { x: this.eventState.mouse.x, y: this.eventState.mouse.y }\n        });\n    }\n    \n    handleMouseUp(e) {\n        this.eventState.mouse.isDown = false;\n        \n        // Map to parameters\n        this.updateParametersFromClick(false);\n        \n        this.emit('mouseUp', { \n            button: e.button,\n            position: { x: this.eventState.mouse.x, y: this.eventState.mouse.y }\n        });\n    }\n    \n    handleElementHover(e, action) {\n        const element = e.currentTarget;\n        const elementType = this.getElementType(element);\n        \n        if (action === 'enter') {\n            this.handleElementFocus(element, elementType);\n        } else {\n            this.handleElementUnfocus(element, elementType);\n        }\n        \n        this.emit('elementHover', {\n            element,\n            elementType,\n            action\n        });\n    }\n    \n    handleKeyDown(e) {\n        this.eventState.keyboard.keysDown.add(e.key);\n        this.eventState.keyboard.lastKeyTime = Date.now();\n        \n        // Handle specific key mappings\n        this.handleKeyMapping(e.key, true);\n        \n        // Check for gesture sequences\n        this.checkKeySequences(e.key);\n        \n        this.emit('keyDown', {\n            key: e.key,\n            code: e.code,\n            keysDown: Array.from(this.eventState.keyboard.keysDown)\n        });\n    }\n    \n    handleKeyUp(e) {\n        this.eventState.keyboard.keysDown.delete(e.key);\n        \n        this.handleKeyMapping(e.key, false);\n        \n        this.emit('keyUp', {\n            key: e.key,\n            code: e.code,\n            keysDown: Array.from(this.eventState.keyboard.keysDown)\n        });\n    }\n    \n    handleScroll(e) {\n        const deltaY = e.deltaY;\n        const now = Date.now();\n        \n        // Update scroll state\n        this.eventState.scroll.velocity = Math.abs(deltaY) / 100;\n        this.eventState.scroll.direction = deltaY > 0 ? 'down' : 'up';\n        this.eventState.scroll.lastScrollTime = now;\n        \n        // Determine if this should trigger layout change or parameter change\n        if (Math.abs(deltaY) > 50) {\n            this.handleLayoutScroll(deltaY);\n        } else {\n            this.updateParametersFromScroll(deltaY);\n        }\n        \n        this.emit('scroll', {\n            delta: deltaY,\n            velocity: this.eventState.scroll.velocity,\n            direction: this.eventState.scroll.direction\n        });\n    }\n    \n    handleResize() {\n        const aspectRatio = window.innerWidth / window.innerHeight;\n        \n        // Update grid density based on aspect ratio\n        if (this.homeMaster) {\n            const newGridDensity = 8.0 + (aspectRatio * 4.0);\n            this.homeMaster.setParameter('gridDensity', newGridDensity, 'resize');\n        }\n        \n        this.emit('resize', {\n            width: window.innerWidth,\n            height: window.innerHeight,\n            aspectRatio\n        });\n    }\n    \n    /**\n     * PARAMETER MAPPING\n     */\n    \n    setupParameterMappings() {\n        // Mouse position → morphFactor and dimension\n        this.parameterMappings.set('mousePosition', {\n            morphFactor: (mouse) => mouse.x * 1.5,\n            dimension: (mouse) => 3.0 + (mouse.y * 1.5)\n        });\n        \n        // Click state → rotation speed and interaction intensity\n        this.parameterMappings.set('clickState', {\n            rotationSpeed: (isDown, baseSpeed = 0.5) => isDown ? Math.min(2.0, baseSpeed + 0.5) : baseSpeed,\n            interactionIntensity: (isDown) => isDown ? 1.0 : 0.3\n        });\n        \n        // Scroll → grid density\n        this.parameterMappings.set('scroll', {\n            gridDensity: (delta, current = 12.0) => {\n                const direction = delta > 0 ? -1 : 1;\n                return Math.max(5.0, Math.min(25.0, current + direction * 1.0));\n            }\n        });\n        \n        // Key mappings → geometry switching\n        this.parameterMappings.set('keyGeometry', {\n            geometry: (key) => {\n                const geometryMap = {\n                    '1': 0, '2': 1, '3': 2, '4': 3,\n                    '5': 4, '6': 5, '7': 6, '8': 7\n                };\n                return geometryMap[key];\n            }\n        });\n    }\n    \n    updateParametersFromMouse() {\n        if (!this.homeMaster) return;\n        \n        const mappings = this.parameterMappings.get('mousePosition');\n        const mouse = this.eventState.mouse;\n        \n        // Update parameters\n        this.homeMaster.setParameter('morphFactor', mappings.morphFactor(mouse), 'mouse');\n        this.homeMaster.setParameter('dimension', mappings.dimension(mouse), 'mouse');\n    }\n    \n    updateParametersFromClick(isDown) {\n        if (!this.homeMaster) return;\n        \n        const mappings = this.parameterMappings.get('clickState');\n        const currentRotationSpeed = this.homeMaster.getParameter('rotationSpeed') || 0.5;\n        \n        this.homeMaster.setParameter('rotationSpeed', mappings.rotationSpeed(isDown, currentRotationSpeed), 'click');\n        this.homeMaster.setParameter('interactionIntensity', mappings.interactionIntensity(isDown), 'click');\n    }\n    \n    updateParametersFromScroll(delta) {\n        if (!this.homeMaster) return;\n        \n        const mappings = this.parameterMappings.get('scroll');\n        const currentGridDensity = this.homeMaster.getParameter('gridDensity') || 12.0;\n        \n        this.homeMaster.setParameter('gridDensity', mappings.gridDensity(delta, currentGridDensity), 'scroll');\n    }\n    \n    handleKeyMapping(key, isDown) {\n        if (!this.homeMaster) return;\n        \n        // Geometry switching (keys 1-8)\n        if (isDown && /^[1-8]$/.test(key)) {\n            const mappings = this.parameterMappings.get('keyGeometry');\n            const geometryIndex = mappings.geometry(key);\n            this.homeMaster.setParameter('geometry', geometryIndex, 'keyboard');\n            return;\n        }\n        \n        // Arrow key fine-tuning\n        if (isDown) {\n            const currentDimension = this.homeMaster.getParameter('dimension') || 3.5;\n            const currentRotationSpeed = this.homeMaster.getParameter('rotationSpeed') || 0.5;\n            \n            switch (key) {\n                case 'ArrowUp':\n                    this.homeMaster.setParameter('dimension', Math.min(4.5, currentDimension + 0.1), 'keyboard');\n                    break;\n                case 'ArrowDown':\n                    this.homeMaster.setParameter('dimension', Math.max(3.0, currentDimension - 0.1), 'keyboard');\n                    break;\n                case 'ArrowLeft':\n                    this.homeMaster.setParameter('rotationSpeed', Math.max(0.0, currentRotationSpeed - 0.1), 'keyboard');\n                    break;\n                case 'ArrowRight':\n                    this.homeMaster.setParameter('rotationSpeed', Math.min(2.0, currentRotationSpeed + 0.1), 'keyboard');\n                    break;\n                case ' ': // Spacebar\n                    const currentGlitch = this.homeMaster.getParameter('glitchIntensity') || 0.5;\n                    this.homeMaster.setParameter('glitchIntensity', currentGlitch > 0.5 ? 0.1 : 0.9, 'keyboard');\n                    break;\n            }\n        }\n    }\n    \n    /**\n     * ECOSYSTEM REACTIONS\n     */\n    \n    handleElementFocus(element, elementType) {\n        // Set focused element data\n        element.setAttribute('data-section-hover', 'true');\n        \n        // Create ecosystem reaction - unfocus other elements\n        const allElements = document.querySelectorAll('.blog-card, .visualizer-board');\n        allElements.forEach(otherElement => {\n            if (otherElement !== element) {\n                otherElement.setAttribute('data-inverse', 'true');\n            }\n        });\n        \n        // Update system parameters for focus state\n        if (this.homeMaster) {\n            this.homeMaster.setParameter('glitchIntensity', 0.8, 'hover');\n            this.homeMaster.setParameter('interactionIntensity', 0.9, 'hover');\n        }\n        \n        // Update CSS variables\n        document.documentElement.style.setProperty('--global-energy', '1.0');\n        \n        this.emit('elementFocused', { element, elementType });\n    }\n    \n    handleElementUnfocus(element, elementType) {\n        // Remove focused state\n        element.removeAttribute('data-section-hover');\n        \n        // Remove ecosystem reaction\n        const allElements = document.querySelectorAll('.blog-card, .visualizer-board');\n        allElements.forEach(otherElement => {\n            otherElement.removeAttribute('data-inverse');\n        });\n        \n        // Return parameters to normal\n        if (this.homeMaster) {\n            this.homeMaster.setParameter('glitchIntensity', 0.5, 'hover');\n            this.homeMaster.setParameter('interactionIntensity', 0.3, 'hover');\n        }\n        \n        // Reset CSS variables\n        document.documentElement.style.setProperty('--global-energy', '0.5');\n        \n        this.emit('elementUnfocused', { element, elementType });\n    }\n    \n    handleLayoutScroll(delta) {\n        // Emit layout change request\n        const direction = delta > 0 ? 1 : -1;\n        this.emit('layoutChangeRequest', { direction });\n    }\n    \n    /**\n     * UTILITY METHODS\n     */\n    \n    getElementType(element) {\n        if (element.classList.contains('blog-card')) return 'card';\n        if (element.classList.contains('visualizer-board')) return 'board';\n        if (element.classList.contains('state-dot')) return 'control';\n        return 'unknown';\n    }\n    \n    addEventListeners(element, events) {\n        if (!this.eventListeners.has(element)) {\n            this.eventListeners.set(element, new Map());\n        }\n        \n        const elementListeners = this.eventListeners.get(element);\n        \n        for (const [eventType, listener] of Object.entries(events)) {\n            element.addEventListener(eventType, listener);\n            elementListeners.set(eventType, listener);\n        }\n    }\n    \n    throttle(func, limit) {\n        let inThrottle;\n        return function(...args) {\n            if (!inThrottle) {\n                func.apply(this, args);\n                inThrottle = true;\n                setTimeout(() => inThrottle = false, limit);\n            }\n        };\n    }\n    \n    // Event handling for system controller\n    handleEvent(eventType, eventData, source) {\n        switch (eventType) {\n            case 'systemError':\n                console.warn('InteractionCoordinator received system error:', eventData);\n                break;\n            case 'parameterUpdate':\n                // Handle parameter updates if needed\n                break;\n            default:\n                if (this.config.debugMode) {\n                    console.log(`InteractionCoordinator received event: ${eventType}`, eventData);\n                }\n        }\n    }\n    \n    // Public API\n    getEventState() {\n        return { ...this.eventState };\n    }\n    \n    setParameterMapping(category, mappings) {\n        this.parameterMappings.set(category, mappings);\n    }\n    \n    enableInput(inputType) {\n        if (!this.config.enabledInputs.includes(inputType)) {\n            this.config.enabledInputs.push(inputType);\n        }\n    }\n    \n    disableInput(inputType) {\n        const index = this.config.enabledInputs.indexOf(inputType);\n        if (index > -1) {\n            this.config.enabledInputs.splice(index, 1);\n        }\n    }\n}\n\n// Export for module system\nexport { InteractionCoordinator };\n\n// Export for global access\nif (typeof window !== 'undefined') {\n    window.InteractionCoordinator = InteractionCoordinator;\n    console.log('🎮 InteractionCoordinator loaded and available globally');\n}