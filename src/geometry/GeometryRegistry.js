/**
 * GEOMETRY REGISTRY
 * Mathematical foundation for 8 geometry types in the VIB34D system
 * 
 * Responsibilities:
 * - Define 8 core geometry types (hypercube, tetrahedron, sphere, torus, klein, fractal, wave, crystal)
 * - Provide mathematical definitions and properties
 * - Generate vertices, edges, and projection matrices
 * - Coordinate geometry transitions and morphing
 * - Cache geometry data for performance
 */

class GeometryRegistry extends EventTarget {
    constructor(config = {}) {
        super();
        
        this.config = {
            enableCaching: true,
            enableMorphing: true,
            defaultDensity: 12,
            maxVertices: 10000,
            debugMode: false,
            ...config
        };
        
        // System references
        this.systemController = config.systemController;
        
        // Geometry definitions
        this.geometryTypes = new Map();
        this.geometryCache = new Map();
        this.morphingStates = new Map();
        
        // Mathematical constants
        this.mathConstants = {
            PHI: (1 + Math.sqrt(5)) / 2, // Golden ratio
            TAU: Math.PI * 2,
            SQRT2: Math.sqrt(2),
            SQRT3: Math.sqrt(3)
        };
        
        // Initialize all geometry types
        this.initializeGeometryTypes();
        
        console.log('📐 GeometryRegistry created');
    }
    
    /**
     * GEOMETRY TYPE INITIALIZATION
     */
    
    initializeGeometryTypes() {
        // 0: Hypercube (4D cube)
        this.registerGeometry('hypercube', {
            index: 0,
            name: 'Hypercube',
            description: '4D cube with 16 vertices and 32 edges',
            dimensions: 4,
            vertexCount: 16,
            edgeCount: 32,
            generator: this.generateHypercube.bind(this),
            properties: {
                symmetry: 'cubic',
                projection: 'perspective',
                morphing: 'linear'
            }
        });
        
        // 1: Tetrahedron (4D simplex)
        this.registerGeometry('tetrahedron', {
            index: 1,
            name: 'Tetrahedron',
            description: '4D simplex with 5 vertices',
            dimensions: 4,
            vertexCount: 5,
            edgeCount: 10,
            generator: this.generateTetrahedron.bind(this),
            properties: {
                symmetry: 'tetrahedral',
                projection: 'orthogonal',
                morphing: 'spherical'
            }
        });
        
        // 2: Sphere (4D hypersphere)
        this.registerGeometry('sphere', {
            index: 2,
            name: 'Sphere',
            description: '4D hypersphere with parametric surface',
            dimensions: 4,
            vertexCount: 'variable',
            edgeCount: 'variable',
            generator: this.generateSphere.bind(this),
            properties: {
                symmetry: 'spherical',
                projection: 'stereographic',
                morphing: 'radial'
            }
        });
        
        // 3: Torus (4D hypertorus)
        this.registerGeometry('torus', {
            index: 3,
            name: 'Torus',
            description: '4D hypertorus with dual revolution',
            dimensions: 4,
            vertexCount: 'variable',
            edgeCount: 'variable',
            generator: this.generateTorus.bind(this),
            properties: {
                symmetry: 'toroidal',
                projection: 'cylindrical',
                morphing: 'parametric'
            }
        });
        
        // 4: Klein Bottle (non-orientable 4D surface)
        this.registerGeometry('klein', {
            index: 4,
            name: 'Klein Bottle',
            description: 'Non-orientable 4D surface',
            dimensions: 4,
            vertexCount: 'variable',
            edgeCount: 'variable',
            generator: this.generateKleinBottle.bind(this),
            properties: {
                symmetry: 'non-orientable',
                projection: 'immersion',
                morphing: 'topological'
            }
        });
        
        // 5: Fractal (self-similar 4D structure)
        this.registerGeometry('fractal', {
            index: 5,
            name: 'Fractal',
            description: 'Self-similar 4D structure',
            dimensions: 4,
            vertexCount: 'recursive',
            edgeCount: 'recursive',
            generator: this.generateFractal.bind(this),
            properties: {
                symmetry: 'self-similar',
                projection: 'recursive',
                morphing: 'iterative'
            }
        });
        
        // 6: Wave (4D wave function)
        this.registerGeometry('wave', {
            index: 6,
            name: 'Wave',
            description: '4D wave function visualization',
            dimensions: 4,
            vertexCount: 'dynamic',
            edgeCount: 'dynamic',
            generator: this.generateWave.bind(this),
            properties: {
                symmetry: 'periodic',
                projection: 'amplitude',
                morphing: 'harmonic'
            }
        });
        
        // 7: Crystal (4D crystalline lattice)
        this.registerGeometry('crystal', {
            index: 7,
            name: 'Crystal',
            description: '4D crystalline lattice structure',
            dimensions: 4,
            vertexCount: 'lattice',
            edgeCount: 'lattice',
            generator: this.generateCrystal.bind(this),
            properties: {
                symmetry: 'crystalline',
                projection: 'lattice',
                morphing: 'discrete'
            }
        });
        
        console.log(`📋 Registered ${this.geometryTypes.size} geometry types`);
    }
    
    registerGeometry(name, config) {
        this.geometryTypes.set(name, config);
        this.geometryTypes.set(config.index, config); // Allow lookup by index
    }
    
    /**
     * GEOMETRY GENERATORS
     */
    
    generateHypercube(density = 8) {
        const vertices = [];
        const edges = [];
        const colors = [];
        
        // Generate 4D hypercube vertices
        for (let x = 0; x < 2; x++) {
            for (let y = 0; y < 2; y++) {
                for (let z = 0; z < 2; z++) {
                    for (let w = 0; w < 2; w++) {
                        vertices.push(
                            x * 2 - 1, // [-1, 1]
                            y * 2 - 1,
                            z * 2 - 1,
                            w * 2 - 1
                        );
                        
                        // Color based on 4D position
                        colors.push(x, y, z);
                    }
                }
            }
        }
        
        // Generate edges (connect vertices that differ by exactly one coordinate)
        for (let i = 0; i < 16; i++) {
            for (let j = i + 1; j < 16; j++) {
                const v1 = [vertices[i*4], vertices[i*4+1], vertices[i*4+2], vertices[i*4+3]];
                const v2 = [vertices[j*4], vertices[j*4+1], vertices[j*4+2], vertices[j*4+3]];
                
                let diffCount = 0;
                for (let k = 0; k < 4; k++) {
                    if (v1[k] !== v2[k]) diffCount++;
                }
                
                if (diffCount === 1) {
                    edges.push(i, j);
                }
            }
        }
        
        return {
            vertices: new Float32Array(vertices),
            colors: new Float32Array(colors),
            indices: new Uint16Array(edges),
            metadata: {
                type: 'hypercube',
                vertexCount: 16,
                edgeCount: edges.length / 2,
                density: density
            }
        };
    }
    
    generateTetrahedron(density = 6) {
        const vertices = [];
        const edges = [];
        const colors = [];
        
        // 4D tetrahedron vertices (5-cell)
        const sqrt5 = Math.sqrt(5);
        const phi = this.mathConstants.PHI;
        
        const verts = [
            [1, 1, 1, 1],
            [1, -1, -1, 1],
            [-1, 1, -1, 1],
            [-1, -1, 1, 1],
            [0, 0, 0, -Math.sqrt(5)]
        ];
        
        // Normalize vertices
        for (const vertex of verts) {
            const length = Math.sqrt(vertex[0]**2 + vertex[1]**2 + vertex[2]**2 + vertex[3]**2);
            vertices.push(
                vertex[0] / length,
                vertex[1] / length,
                vertex[2] / length,
                vertex[3] / length
            );
            
            // Color based on position
            colors.push(
                (vertex[0] + 1) * 0.5,
                (vertex[1] + 1) * 0.5,
                (vertex[2] + 1) * 0.5
            );
        }
        
        // Connect all vertices (complete graph)
        for (let i = 0; i < 5; i++) {
            for (let j = i + 1; j < 5; j++) {
                edges.push(i, j);
            }
        }
        
        return {
            vertices: new Float32Array(vertices),
            colors: new Float32Array(colors),
            indices: new Uint16Array(edges),
            metadata: {
                type: 'tetrahedron',
                vertexCount: 5,
                edgeCount: 10,
                density: density
            }
        };
    }
    
    generateSphere(density = 12) {
        const vertices = [];
        const edges = [];
        const colors = [];
        
        // Generate 4D sphere using spherical coordinates
        for (let i = 0; i <= density; i++) {
            const theta = (i / density) * Math.PI; // 0 to π
            
            for (let j = 0; j <= density; j++) {
                const phi = (j / density) * this.mathConstants.TAU; // 0 to 2π
                
                for (let k = 0; k <= density/2; k++) {
                    const psi = (k / (density/2)) * Math.PI; // 0 to π
                    
                    // 4D spherical coordinates
                    const x = Math.sin(theta) * Math.cos(phi) * Math.sin(psi);
                    const y = Math.sin(theta) * Math.sin(phi) * Math.sin(psi);
                    const z = Math.cos(theta) * Math.sin(psi);
                    const w = Math.cos(psi);
                    
                    vertices.push(x, y, z, w);
                    
                    // Color based on angles
                    colors.push(
                        (theta / Math.PI),
                        (phi / this.mathConstants.TAU),
                        (psi / Math.PI)
                    );
                }
            }
        }
        
        // Generate edges (connect nearby vertices)
        const vertexCount = vertices.length / 4;
        for (let i = 0; i < vertexCount - 1; i++) {
            // Connect to next vertex in sequence
            edges.push(i, i + 1);
            
            // Connect to vertex in next ring
            if (i + density + 1 < vertexCount) {
                edges.push(i, i + density + 1);
            }
        }
        
        return {
            vertices: new Float32Array(vertices),
            colors: new Float32Array(colors),
            indices: new Uint16Array(edges),
            metadata: {
                type: 'sphere',
                vertexCount: vertexCount,
                edgeCount: edges.length / 2,
                density: density
            }
        };
    }
    
    generateTorus(density = 10) {
        const vertices = [];
        const edges = [];
        const colors = [];
        
        const R = 1.0; // Major radius
        const r = 0.3; // Minor radius
        
        // Generate 4D torus
        for (let i = 0; i <= density; i++) {
            const u = (i / density) * this.mathConstants.TAU;
            
            for (let j = 0; j <= density; j++) {
                const v = (j / density) * this.mathConstants.TAU;
                
                for (let k = 0; k <= density/2; k++) {
                    const w = (k / (density/2)) * this.mathConstants.TAU;
                    
                    // 4D torus parametrization
                    const x = (R + r * Math.cos(v)) * Math.cos(u);
                    const y = (R + r * Math.cos(v)) * Math.sin(u);
                    const z = r * Math.sin(v) * Math.cos(w);
                    const w4 = r * Math.sin(v) * Math.sin(w);
                    
                    vertices.push(x, y, z, w4);
                    
                    // Color based on parameters
                    colors.push(
                        (u / this.mathConstants.TAU),
                        (v / this.mathConstants.TAU),
                        (w / this.mathConstants.TAU)
                    );
                }
            }
        }
        
        // Generate edges
        const stepsU = density + 1;
        const stepsV = density + 1;
        const stepsW = density/2 + 1;
        
        for (let i = 0; i < stepsU; i++) {
            for (let j = 0; j < stepsV; j++) {
                for (let k = 0; k < stepsW; k++) {
                    const index = i * stepsV * stepsW + j * stepsW + k;
                    
                    // Connect in u direction
                    if (i < stepsU - 1) {
                        edges.push(index, index + stepsV * stepsW);
                    }
                    
                    // Connect in v direction
                    if (j < stepsV - 1) {
                        edges.push(index, index + stepsW);
                    }
                    
                    // Connect in w direction
                    if (k < stepsW - 1) {
                        edges.push(index, index + 1);
                    }
                }
            }
        }
        
        return {
            vertices: new Float32Array(vertices),
            colors: new Float32Array(colors),
            indices: new Uint16Array(edges),
            metadata: {
                type: 'torus',
                vertexCount: vertices.length / 4,
                edgeCount: edges.length / 2,
                density: density
            }
        };
    }
    
    generateKleinBottle(density = 8) {
        const vertices = [];
        const edges = [];
        const colors = [];
        
        // Klein bottle in 4D
        for (let i = 0; i <= density; i++) {
            const u = (i / density) * this.mathConstants.TAU;
            
            for (let j = 0; j <= density; j++) {
                const v = (j / density) * this.mathConstants.TAU;
                
                // Klein bottle parametrization
                const x = (2 + Math.cos(v/2) * Math.sin(u) - Math.sin(v/2) * Math.sin(2*u)) * Math.cos(v);
                const y = (2 + Math.cos(v/2) * Math.sin(u) - Math.sin(v/2) * Math.sin(2*u)) * Math.sin(v);
                const z = Math.sin(v/2) * Math.sin(u) + Math.cos(v/2) * Math.sin(2*u);
                const w = Math.cos(u) * Math.sin(v/2);
                
                vertices.push(x * 0.3, y * 0.3, z * 0.3, w * 0.3);
                
                // Color based on parameters
                colors.push(
                    (Math.sin(u) + 1) * 0.5,
                    (Math.cos(v) + 1) * 0.5,
                    (Math.sin(u + v) + 1) * 0.5
                );
            }
        }
        
        // Generate edges
        const stepsU = density + 1;
        const stepsV = density + 1;
        
        for (let i = 0; i < stepsU; i++) {
            for (let j = 0; j < stepsV; j++) {
                const index = i * stepsV + j;
                
                // Connect in u direction
                if (i < stepsU - 1) {
                    edges.push(index, index + stepsV);
                }
                
                // Connect in v direction
                if (j < stepsV - 1) {
                    edges.push(index, index + 1);
                } else {
                    // Wrap around in v
                    edges.push(index, i * stepsV);
                }
            }
        }
        
        return {
            vertices: new Float32Array(vertices),
            colors: new Float32Array(colors),
            indices: new Uint16Array(edges),
            metadata: {
                type: 'klein',
                vertexCount: vertices.length / 4,
                edgeCount: edges.length / 2,
                density: density
            }
        };
    }
    
    generateFractal(density = 6, iterations = 3) {
        const vertices = [];
        const edges = [];
        const colors = [];
        
        // Start with tetrahedron
        const baseGeometry = this.generateTetrahedron(density);
        
        // Recursively subdivide
        let currentVertices = Array.from(baseGeometry.vertices);
        let currentEdges = Array.from(baseGeometry.indices);
        
        for (let iter = 0; iter < iterations; iter++) {
            const newVertices = [];
            const newEdges = [];
            
            // For each vertex, create smaller copies at fractal positions
            for (let i = 0; i < currentVertices.length; i += 4) {
                const x = currentVertices[i];
                const y = currentVertices[i + 1];
                const z = currentVertices[i + 2];
                const w = currentVertices[i + 3];
                
                // Create fractal branches
                const scale = Math.pow(0.5, iter + 1);
                const branches = [
                    [x + scale, y, z, w],
                    [x - scale, y, z, w],
                    [x, y + scale, z, w],
                    [x, y - scale, z, w],
                    [x, y, z + scale, w],
                    [x, y, z - scale, w],
                    [x, y, z, w + scale],
                    [x, y, z, w - scale]
                ];
                
                for (const branch of branches) {
                    newVertices.push(...branch);
                    
                    // Color based on iteration and position
                    colors.push(
                        (iter / iterations),
                        (Math.abs(branch[0]) + Math.abs(branch[1])) * 0.5,
                        (Math.abs(branch[2]) + Math.abs(branch[3])) * 0.5
                    );
                }
            }
            
            currentVertices = newVertices;
        }
        
        // Generate edges connecting nearby fractal points
        const vertexCount = currentVertices.length / 4;
        for (let i = 0; i < vertexCount; i++) {
            for (let j = i + 1; j < Math.min(i + 8, vertexCount); j++) {
                edges.push(i, j);
            }
        }
        
        return {
            vertices: new Float32Array(currentVertices),
            colors: new Float32Array(colors),
            indices: new Uint16Array(edges),
            metadata: {
                type: 'fractal',
                vertexCount: vertexCount,
                edgeCount: edges.length / 2,
                density: density,
                iterations: iterations
            }
        };
    }
    
    generateWave(density = 12, frequency = 2, amplitude = 0.5) {
        const vertices = [];
        const edges = [];
        const colors = [];
        
        // Generate 4D wave function
        for (let i = 0; i <= density; i++) {
            const x = (i / density) * 4 - 2; // [-2, 2]
            
            for (let j = 0; j <= density; j++) {
                const y = (j / density) * 4 - 2;
                
                for (let k = 0; k <= density; k++) {
                    const z = (k / density) * 4 - 2;
                    
                    // Wave function in 4D
                    const r = Math.sqrt(x*x + y*y + z*z);
                    const w = amplitude * Math.sin(frequency * r) * Math.exp(-r * 0.3);
                    
                    vertices.push(x * 0.5, y * 0.5, z * 0.5, w);
                    
                    // Color based on wave amplitude and position
                    const waveIntensity = (w + amplitude) / (2 * amplitude);
                    colors.push(
                        waveIntensity,
                        (Math.sin(r * frequency) + 1) * 0.5,
                        (Math.cos(r * frequency * 0.5) + 1) * 0.5
                    );
                }
            }
        }
        
        // Generate edges forming wave pattern
        const steps = density + 1;
        
        for (let i = 0; i < steps; i++) {
            for (let j = 0; j < steps; j++) {
                for (let k = 0; k < steps; k++) {
                    const index = i * steps * steps + j * steps + k;
                    
                    // Connect in x direction
                    if (i < steps - 1) {
                        edges.push(index, index + steps * steps);
                    }
                    
                    // Connect in y direction
                    if (j < steps - 1) {
                        edges.push(index, index + steps);
                    }
                    
                    // Connect in z direction
                    if (k < steps - 1) {
                        edges.push(index, index + 1);
                    }
                }
            }
        }
        
        return {
            vertices: new Float32Array(vertices),
            colors: new Float32Array(colors),
            indices: new Uint16Array(edges),
            metadata: {
                type: 'wave',
                vertexCount: vertices.length / 4,
                edgeCount: edges.length / 2,
                density: density,
                frequency: frequency,
                amplitude: amplitude
            }
        };
    }
    
    generateCrystal(density = 8, latticeType = 'cubic') {
        const vertices = [];
        const edges = [];
        const colors = [];
        
        // Crystal lattice patterns
        const latticeVectors = {
            cubic: [
                [1, 0, 0, 0],
                [0, 1, 0, 0],
                [0, 0, 1, 0],
                [0, 0, 0, 1]
            ],
            diamond: [
                [1, 1, 0, 0],
                [1, 0, 1, 0],
                [0, 1, 1, 0],
                [1, 1, 1, 1]
            ]
        };
        
        const vectors = latticeVectors[latticeType] || latticeVectors.cubic;
        
        // Generate crystal lattice points
        for (let i = -density/2; i <= density/2; i++) {
            for (let j = -density/2; j <= density/2; j++) {
                for (let k = -density/2; k <= density/2; k++) {
                    for (let l = -density/2; l <= density/2; l++) {
                        // Lattice point
                        const x = i * vectors[0][0] + j * vectors[1][0] + k * vectors[2][0] + l * vectors[3][0];
                        const y = i * vectors[0][1] + j * vectors[1][1] + k * vectors[2][1] + l * vectors[3][1];
                        const z = i * vectors[0][2] + j * vectors[1][2] + k * vectors[2][2] + l * vectors[3][2];
                        const w = i * vectors[0][3] + j * vectors[1][3] + k * vectors[2][3] + l * vectors[3][3];
                        
                        // Only include points within sphere
                        const r = Math.sqrt(x*x + y*y + z*z + w*w);
                        if (r <= density * 0.5) {
                            vertices.push(x * 0.2, y * 0.2, z * 0.2, w * 0.2);
                            
                            // Color based on lattice position
                            colors.push(
                                (i + density/2) / density,
                                (j + density/2) / density,
                                (k + density/2) / density
                            );
                        }
                    }
                }
            }
        }
        
        // Generate edges connecting nearest neighbors
        const vertexCount = vertices.length / 4;
        const connectionDistance = 0.5;
        
        for (let i = 0; i < vertexCount; i++) {
            for (let j = i + 1; j < vertexCount; j++) {
                const dx = vertices[i*4] - vertices[j*4];
                const dy = vertices[i*4+1] - vertices[j*4+1];
                const dz = vertices[i*4+2] - vertices[j*4+2];
                const dw = vertices[i*4+3] - vertices[j*4+3];
                
                const distance = Math.sqrt(dx*dx + dy*dy + dz*dz + dw*dw);
                
                if (distance < connectionDistance) {
                    edges.push(i, j);
                }
            }
        }
        
        return {
            vertices: new Float32Array(vertices),
            colors: new Float32Array(colors),
            indices: new Uint16Array(edges),
            metadata: {
                type: 'crystal',
                vertexCount: vertexCount,
                edgeCount: edges.length / 2,
                density: density,
                latticeType: latticeType
            }
        };
    }
    
    /**
     * GEOMETRY ACCESS AND MANAGEMENT
     */
    
    async getGeometry(geometryName, options = {}) {
        const geometryType = this.geometryTypes.get(geometryName) || this.geometryTypes.get(parseInt(geometryName));
        
        if (!geometryType) {
            throw new Error(`Unknown geometry type: ${geometryName}`);
        }
        
        // Check cache
        const cacheKey = `${geometryType.name}_${JSON.stringify(options)}`;
        if (this.config.enableCaching && this.geometryCache.has(cacheKey)) {
            return this.geometryCache.get(cacheKey);
        }
        
        // Generate geometry
        const geometry = geometryType.generator(options.density || this.config.defaultDensity, ...Object.values(options));
        
        // Add type information
        geometry.type = geometryType.name;
        geometry.index = geometryType.index;
        geometry.properties = geometryType.properties;
        
        // Cache if enabled
        if (this.config.enableCaching) {
            this.geometryCache.set(cacheKey, geometry);
        }
        
        console.log(`📐 Generated geometry: ${geometryType.name} (${geometry.metadata.vertexCount} vertices)`);
        
        return geometry;
    }
    
    getGeometryList() {
        const geometries = [];
        
        for (const [key, geometry] of this.geometryTypes) {
            if (typeof key === 'string') { // Skip numeric indices
                geometries.push({
                    name: geometry.name,
                    index: geometry.index,
                    description: geometry.description,
                    properties: geometry.properties
                });
            }
        }
        
        return geometries.sort((a, b) => a.index - b.index);
    }
    
    getGeometryByIndex(index) {
        return this.geometryTypes.get(index);
    }
    
    /**
     * MORPHING AND TRANSITIONS
     */
    
    createMorphingGeometry(fromGeometry, toGeometry, progress) {
        if (!this.config.enableMorphing) {
            return progress < 0.5 ? fromGeometry : toGeometry;
        }
        
        // Simple linear interpolation for now
        const fromVerts = fromGeometry.vertices;
        const toVerts = toGeometry.vertices;
        
        // Handle different vertex counts by padding or truncating
        const minLength = Math.min(fromVerts.length, toVerts.length);
        const morphedVertices = new Float32Array(minLength);
        
        for (let i = 0; i < minLength; i++) {
            morphedVertices[i] = fromVerts[i] * (1 - progress) + toVerts[i] * progress;
        }
        
        // Interpolate colors
        const fromColors = fromGeometry.colors;
        const toColors = toGeometry.colors;
        const colorLength = Math.min(fromColors.length, toColors.length);
        const morphedColors = new Float32Array(colorLength);
        
        for (let i = 0; i < colorLength; i++) {
            morphedColors[i] = fromColors[i] * (1 - progress) + toColors[i] * progress;
        }
        
        return {
            vertices: morphedVertices,
            colors: morphedColors,
            indices: fromGeometry.indices, // Use source indices
            metadata: {
                type: 'morphed',
                fromType: fromGeometry.type,
                toType: toGeometry.type,
                progress: progress
            }
        };
    }
    
    /**
     * CACHE MANAGEMENT
     */
    
    clearCache() {
        this.geometryCache.clear();
        console.log('🗑️ Geometry cache cleared');
    }
    
    getCacheStats() {
        return {
            cacheSize: this.geometryCache.size,
            geometryTypes: this.geometryTypes.size / 2, // Divide by 2 because we store by name and index
            memoryEstimate: this.estimateCacheMemory()
        };
    }
    
    estimateCacheMemory() {
        let totalBytes = 0;
        
        for (const geometry of this.geometryCache.values()) {
            totalBytes += geometry.vertices.byteLength;
            totalBytes += geometry.colors.byteLength;
            totalBytes += geometry.indices.byteLength;
        }
        
        return totalBytes;
    }
    
    /**
     * EVENT HANDLING FOR SYSTEM CONTROLLER
     */
    
    handleEvent(eventType, eventData, source) {
        switch (eventType) {
            case 'geometryChange':
                if (eventData.geometryType !== undefined) {
                    this.emit('geometryRequested', { 
                        geometryType: eventData.geometryType,
                        source 
                    });
                }
                break;
            case 'systemError':
                console.warn('GeometryRegistry received system error:', eventData);
                break;
            default:
                if (this.config.debugMode) {
                    console.log(`GeometryRegistry received event: ${eventType}`, eventData);
                }
        }
    }
    
    /**
     * STATUS AND DEBUGGING
     */
    
    getStatus() {
        return {
            registeredGeometries: this.geometryTypes.size / 2,
            cachedGeometries: this.geometryCache.size,
            memoryUsage: this.estimateCacheMemory(),
            morphingEnabled: this.config.enableMorphing,
            cachingEnabled: this.config.enableCaching
        };
    }
}

// Export for module system
export { GeometryRegistry };

// Export for global access
if (typeof window !== 'undefined') {
    window.GeometryRegistry = GeometryRegistry;
    console.log('📐 GeometryRegistry loaded and available globally');
}