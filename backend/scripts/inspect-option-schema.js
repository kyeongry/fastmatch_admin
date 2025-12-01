const path = require('path');
const fs = require('fs');
const cwd = process.cwd();
const { getDatabase, closeConnection } = require(path.join(cwd, 'src/config/mongodb'));

async function inspectOptionData() {
    try {
        const db = await getDatabase();
        const collection = db.collection('options');

        // Get one option document
        const option = await collection.findOne({});

        if (option) {
            const output = '=== OPTION DOCUMENT STRUCTURE ===\n' +
                JSON.stringify(option, null, 2) +
                '\n\n=== FIELD NAMES ===\n' +
                Object.keys(option).join('\n');

            fs.writeFileSync(path.join(cwd, 'option_schema_output.txt'), output);
            console.log('✅ Option schema written to option_schema_output.txt');
        } else {
            console.log('No option found in database');
        }

        await closeConnection();
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

inspectOptionData();
