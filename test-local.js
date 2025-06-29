const puppeteer = require('puppeteer');
const path = require('path');

async function testLocalFile() {
    console.log('🧪 Testing LOCAL live-test.html file...');
    
    const browser = await puppeteer.launch({ 
        headless: false,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--allow-file-access-from-files']
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
        
        const filePath = 'file://' + path.resolve('/mnt/c/Users/millz/vib34d-fix/live-test.html');
        console.log('📱 Opening local file:', filePath);
        
        await page.goto(filePath, {
            waitUntil: 'networkidle2',
            timeout: 30000
        });
        
        console.log('⏱️ Waiting for initialization...');
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Check if modules loaded properly
        console.log('📦 Checking module loading...');
        const moduleStatus = await page.evaluate(() => {
            return {
                testHomeMaster: typeof window.testHomeMaster !== 'undefined',
                testInteraction: typeof window.testInteraction !== 'undefined',
                generateGeometry: typeof window.generateGeometry !== 'undefined',
                loadPreset: typeof window.loadPreset !== 'undefined',
                systemInstances: typeof systemInstances !== 'undefined'
            };
        });
        
        console.log('📊 Function Availability:');
        Object.entries(moduleStatus).forEach(([key, loaded]) => {
            console.log(`  ${loaded ? '✅' : '❌'} ${key}: ${loaded ? 'Available' : 'Missing'}`);
        });
        
        console.log('🎉 LOCAL TEST COMPLETED!');
        
    } catch (error) {
        console.error('💥 Local test failed:', error);
    } finally {
        await browser.close();
    }
}

// Run the test
testLocalFile().catch(console.error);