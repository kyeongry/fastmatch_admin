const path = require('path');
const fs = require('fs');
const cwd = process.cwd();
require('dotenv').config({ path: path.join(cwd, '.env') });

const { getDatabase, closeConnection } = require(path.join(cwd, 'src/config/mongodb'));
const { createProposalDocument } = require(path.join(cwd, 'src/services/proposalDocument.service'));
const OptionModel = require(path.join(cwd, 'src/models/option.mongodb'));
const UserModel = require(path.join(cwd, 'src/models/user.mongodb'));

async function runDebug() {
    let logOutput = '';
    const log = (msg) => {
        console.log(msg);
        logOutput += msg + '\n';
    };

    try {
        log('🚀 Connecting to MongoDB...');
        await getDatabase();
        log('✅ Connected');

        // 1. Find a valid user and option to use
        const users = await UserModel.findAll({}, { limit: 1 });
        const options = await OptionModel.findAll({}, { limit: 1 });

        const user = users[0];
        const option = options[0];

        if (!user || !option) {
            log('❌ No user or option found to test with.');
            return;
        }

        log(`👤 Using User: ${user._id}`);
        log(`🏢 Using Option: ${option._id}`);

        // 2. Create a proposal
        const proposalData = {
            document_name: 'Debug Creation Test',
            selected_options: [option._id.toString()],
            option_order: [option._id.toString()],
            option_custom_info: {}
        };

        log('📤 Creating proposal with data: ' + JSON.stringify(proposalData, null, 2));

        const newDoc = await createProposalDocument(proposalData, user._id.toString());

        log('✅ Proposal Created: ' + newDoc.id);
        // newDoc.selected_options might be populated objects or IDs.
        // Let's check length.
        const optionsCount = newDoc.options ? newDoc.options.length : (newDoc.selected_options ? newDoc.selected_options.length : 0);
        log('   Options Count in Return: ' + optionsCount);

        if (optionsCount > 0) {
            log('🎉 SUCCESS: Selected options saved and returned.');
        } else {
            log('❌ FAILURE: Selected options are EMPTY in returned document.');
        }

    } catch (error) {
        log('❌ Error: ' + error.message);
        if (error.stack) log(error.stack);
    } finally {
        await closeConnection();
        fs.writeFileSync('debug_create_result.txt', logOutput);
    }
}

runDebug();
