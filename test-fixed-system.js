const puppeteer = require('puppeteer');

async function testFixedSystem() {
    console.log('🚀 Testing FIXED VIB34D GitHub Pages deployment...');
    
    const browser = await puppeteer.launch({ 
        headless: false,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    try {
        const page = await browser.newPage();
        
        // Enable console logging from the page
        page.on('console', msg => {
            const type = msg.type();
            const text = msg.text();
            console.log(`[PAGE ${type.toUpperCase()}] ${text}`);
        });
        
        // Enable error logging
        page.on('pageerror', error => {
            console.error(`[PAGE ERROR] ${error.message}`);
        });
        
        // Enable resource load failures
        page.on('requestfailed', request => {
            console.error(`[RESOURCE FAILED] ${request.url()} - ${request.failure().errorText}`);
        });
        
        console.log('📱 Navigating to FIXED GitHub Pages...');
        await page.goto('https://domusgpt.github.io/vib34d-modular-system/live-test.html', {
            waitUntil: 'networkidle2',
            timeout: 30000
        });
        
        console.log('⏱️ Waiting for initialization...');
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        // Check if modules loaded properly
        console.log('📦 Checking module loading...');
        const moduleStatus = await page.evaluate(() => {
            return {
                VIB3SystemController: typeof window.VIB3SystemController !== 'undefined',
                VIB3HomeMaster: typeof window.VIB3HomeMaster !== 'undefined',
                VisualizerPool: typeof window.VisualizerPool !== 'undefined',
                GeometryRegistry: typeof window.GeometryRegistry !== 'undefined',
                PresetDatabase: typeof window.PresetDatabase !== 'undefined',
                PerformanceMonitor: typeof window.PerformanceMonitor !== 'undefined',
                ErrorHandler: typeof window.ErrorHandler !== 'undefined',
                testHomeMaster: typeof window.testHomeMaster !== 'undefined'
            };
        });
        
        console.log('📊 Module Status:');
        Object.entries(moduleStatus).forEach(([key, loaded]) => {
            console.log(`  ${loaded ? '✅' : '❌'} ${key}: ${loaded ? 'Loaded' : 'Missing'}`);
        });
        
        // Test button functionality
        console.log('🖱️ Testing button clicks...');
        try {
            // Test HomeMaster button
            await page.click('button[onclick="testHomeMaster()"]');
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Test Geometry button
            await page.click('button[onclick="generateGeometry()"]');
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Test Performance button
            await page.click('button[onclick="startPerformanceMonitoring()"]');
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            console.log('✅ All button tests passed!');
        } catch (error) {
            console.error('❌ Button test failed:', error.message);
        }
        
        // Check output content
        console.log('📋 Checking output content...');
        const outputs = await page.evaluate(() => {
            const elements = [
                'homemaster-output',
                'pool-output', 
                'geometry-output',
                'preset-output',
                'performance-output',
                'error-output'
            ];
            
            const results = {};
            elements.forEach(id => {
                const element = document.getElementById(id);
                results[id] = element ? element.textContent.trim() : 'Element not found';
            });
            
            return results;
        });
        
        console.log('📝 Output Content:');
        Object.entries(outputs).forEach(([id, content]) => {
            const hasContent = content && content.length > 0 && content !== 'Element not found';
            console.log(`  ${hasContent ? '✅' : '❌'} ${id}: ${hasContent ? 'Has content' : 'Empty or missing'}`);
            if (hasContent) {
                console.log(`    Preview: ${content.substring(0, 60)}${content.length > 60 ? '...' : ''}`);
            }
        });
        
        // Take final screenshot
        console.log('📸 Taking final screenshot...');
        await page.screenshot({ 
            path: '/mnt/c/Users/millz/vib34d-fix/fixed-system-test.png',
            fullPage: true 
        });
        
        console.log('🎉 FIXED SYSTEM TEST COMPLETED!');
        
    } catch (error) {
        console.error('💥 Test failed:', error);
    } finally {
        await browser.close();
    }
}

// Run the test
testFixedSystem().catch(console.error);