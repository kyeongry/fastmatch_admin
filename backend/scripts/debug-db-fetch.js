const path = require('path');
const cwd = process.cwd();
console.log('CWD:', cwd);

require('dotenv').config({ path: path.join(cwd, '.env') });

const modelsPath = path.join(cwd, 'src/models');
const configPath = path.join(cwd, 'src/config/mongodb');

const { getDatabase, closeConnection } = require(configPath);
const ProposalDocumentModel = require(path.join(modelsPath, 'proposalDocument.mongodb'));
const OptionModel = require(path.join(modelsPath, 'option.mongodb'));

async function runDebug() {
    try {
        console.log('🚀 Connecting to MongoDB...');
        // Initialize connection
        await getDatabase();
        console.log('✅ Connected');

        console.log(`\n🔍 Fetching Latest Proposal Document...`);

        const docs = await ProposalDocumentModel.findAll({}, { limit: 1, sort: { created_at: -1 } });
        const doc = docs[0];

        if (!doc) {
            console.error('❌ No documents found!');
            return;
        }

        console.log('📄 Document found:');
        console.log('   ID:', doc._id.toString());
        console.log('   Name:', doc.document_name);
        console.log('   Creator ID:', doc.creator_id.toString());
        console.log('   Selected Options:', doc.selected_options);

        if (!doc.selected_options || doc.selected_options.length === 0) {
            console.warn('⚠️ Selected options array is empty!');
        } else {
            console.log(`\n🔍 Checking ${doc.selected_options.length} options...`);
            for (const optId of doc.selected_options) {
                const opt = await OptionModel.findById(optId);
                if (opt) {
                    console.log(`   ✅ Option found: ${opt._id} (${opt.option_name})`);
                } else {
                    console.error(`   ❌ Option NOT found: ${optId}`);
                }
            }
        }

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await closeConnection();
        console.log('\n👋 Disconnected');
    }
}

runDebug();
