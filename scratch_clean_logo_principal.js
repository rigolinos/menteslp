const fs = require('fs');
const path = require('path');

const svgPath = path.join(__dirname, 'img', 'Logo principal.svg');
let svgContent = fs.readFileSync(svgPath, 'utf8');

// Regex to find and remove the bounding box rectangle
const rectRegex = /<path d="\s*M\s+0\.00\s+0\.00\s+L\s+617\.00\s+0\.00\s+L\s+617\.00\s+622\.00\s+L\s+0\.00\s+622\.00\s+Z\s*M\s*([^"]+)" fill="rgb\(1,6,38\)"\/>/;

if (rectRegex.test(svgContent)) {
    console.log("Found background rectangle in Logo principal.svg! Cleaning...");
    const cleanedSvg = svgContent.replace(rectRegex, '<path d="M $1" fill="rgb(1,6,38)" fill-rule="evenodd"/>');
    
    // Also, wait, what about the other paths? 
    // Wait, let's look at the other paths. Are there other fills? 
    // In our grep search, there was only 1 path element in the whole SVG!
    // That means the entire SVG is one single compound path! 
    // Let's verify by writing the cleaned SVG.
    fs.writeFileSync(path.join(__dirname, 'img', 'Logo principal-clean.svg'), cleanedSvg);
    console.log("Successfully created img/Logo principal-clean.svg!");
} else {
    console.log("Background rectangle regex did not match. Let's write a fallback replacement.");
    
    // Fallback: replace the exact bounding box substring
    const exactBox = "M 0.00 0.00 L 617.00 0.00 L 617.00 622.00 L 0.00 622.00 Z";
    if (svgContent.includes(exactBox)) {
        console.log("Found exact bounding box string. Performing fallback replacement...");
        // Replace exactBox + "M " with "M "
        const cleanedSvg = svgContent.replace(exactBox + "M ", "M ");
        fs.writeFileSync(path.join(__dirname, 'img', 'Logo principal-clean.svg'), cleanedSvg);
        console.log("Successfully created img/Logo principal-clean.svg using fallback!");
    } else {
        console.log("Could not find exact bounding box string.");
    }
}
