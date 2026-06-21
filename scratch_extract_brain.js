const fs = require('fs');
const path = require('path');

const srcPath = path.join('c:', 'Users', 'oooo0', 'Desktop', 'Code', 'site kit - Copia', 'img', 'Logo principal-clean.svg');
const destPath = path.join('c:', 'Users', 'oooo0', 'Desktop', 'Code', 'site kit - Copia', 'img', 'logo-brain.svg');

if (!fs.existsSync(srcPath)) {
    console.error("Source file does not exist:", srcPath);
    process.exit(1);
}

const content = fs.readFileSync(srcPath, 'utf8');

// The SVG has paths with d="...". Let's extract all paths and their d values
const pathRegex = /<path\s+[^>]*d="([^"]+)"[^>]*>/g;
let match;
const allSubPaths = [];

// Let's parse all paths and split their 'd' attribute by 'M'
let pathCount = 0;
const newPaths = [];

// We want to keep subpaths that are part of the brain.
// Let's analyze subpaths by splitting on "M" or "m" (case-insensitive)
const dMatches = [];
let m;
while ((m = pathRegex.exec(content)) !== null) {
    const dAttr = m[1];
    // split by M or m, keeping the M/m prefix
    const parts = dAttr.split(/(?=[Mm])/);
    console.log(`Path ${pathCount++} has ${parts.length} sub-paths.`);
    
    const brainParts = [];
    const textParts = [];
    
    parts.forEach(part => {
        const trimmed = part.trim();
        if (!trimmed) return;
        
        // Find all numbers in the first few characters to check the starting coordinate
        const coords = trimmed.match(/[-+]?[0-9]*\.?[0-9]+/g);
        if (coords && coords.length >= 2) {
            const x = parseFloat(coords[0]);
            const y = parseFloat(coords[1]);
            
            // Check if Y coordinate indicates it is in the brain region
            // Brain is generally at the top (Y < 385), but let's exclude the text at the bottom.
            // Let's print out coordinates to see if there is a clear threshold.
            if (y < 385) {
                brainParts.push(trimmed);
            } else {
                textParts.push(trimmed);
            }
        } else {
            brainParts.push(trimmed);
        }
    });
    
    if (brainParts.length > 0) {
        newPaths.push(brainParts.join(' '));
    }
}

// Generate new SVG content
const newSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="617" height="385" viewBox="0 0 617 385">
<g>
${newPaths.map(d => `<path d="${d}" fill="rgb(201,168,76)" fill-rule="evenodd"/>`).join('\n')}
</g>
</svg>`;

fs.writeFileSync(destPath, newSvg);
console.log("Successfully extracted brain icon to logo-brain.svg! Kept paths:", newPaths.length);
