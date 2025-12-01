const fs = require('fs');
const path = require('path');

const logPath = path.join(__dirname, '../output_v6.txt');

try {
    const content = fs.readFileSync(logPath, 'utf8');
    const lines = content.split('\n');
    // Print all lines
    console.log(content);
} catch (error) {
    console.error('Error reading log:', error);
}
