const sharp = require('sharp');
const fs = require('fs');

const svg = fs.readFileSync('assets/neutron-icon.svg', 'utf8');

function convert(size, out) {
  const svgResized = svg
    .replace('width="256.000000pt"', `width="${size}"`)
    .replace('height="256.000000pt"', `height="${size}"`);
  return sharp(Buffer.from(svgResized)).resize(size, size).png().toFile(out);
}

Promise.all([
  convert(256, 'assets/new-logo-256.png'),
  convert(512, 'assets/new-logo-512.png')
]).then(() => {
  const s256 = fs.statSync('assets/new-logo-256.png').size;
  const s512 = fs.statSync('assets/new-logo-512.png').size;
  console.log(`OK: 256.png (${s256}B), 512.png (${s512}B)`);
}).catch(e => { console.error(e); process.exit(1); });
