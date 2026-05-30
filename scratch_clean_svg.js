const fs = require('fs');
const path = require('path');

const svgPath = path.join(__dirname, 'img', 'logo.svg.svg');
let svgContent = fs.readFileSync(svgPath, 'utf8');

// Find the path that starts with M 0.00 294.00 L 0.00 0.00
const rectRegex = /<path d="\s*M\s+0\.00\s+294\.00\s+L\s+0\.00\s+0\.00\s+L\s+361\.50\s+0\.00\s+L\s+723\.00\s+0\.00\s+L\s+723\.00\s+294\.00\s+L\s+723\.00\s+588\.00\s+L\s+361\.50\s+588\.00\s+L\s+0\.00\s+588\.00\s+L\s+0\.00\s+294\.00\s+Z\s*M\s*([^"]+)" fill="rgb\(254,254,254\)"\/>/;

if (rectRegex.test(svgContent)) {
    console.log("Found background rectangle in white path! Cleaning...");
    const cleanedSvg = svgContent.replace(rectRegex, '<path d="M $1" fill="rgb(254,254,254)" fill-rule="evenodd"/>');
    fs.writeFileSync(path.join(__dirname, 'img', 'logo-clean.svg'), cleanedSvg);
    console.log("Successfully created img/logo-clean.svg!");
} else {
    console.log("Background rectangle regex did not match. Let's inspect the file content.");
}
