const { createOption, requestDeleteOption, getOptionById, getOptions } = require('./src/services/option.service');
const { approveDeleteRequest, rejectDeleteRequest, getDeleteRequests } = require('./src/services/deleteRequest.service');
const DeleteRequestModel = require('./src/models/deleteRequest.mongodb');
const OptionModel = require('./src/models/option.mongodb');
const BranchModel = require('./src/models/branch.mongodb');
const BrandModel = require('./src/models/brand.mongodb');
const UserModel = require('./src/models/user.mongodb');
const { getDatabase } = require('./src/config/mongodb');
const { ObjectId } = require('mongodb');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

async function runTest() {
    console.log('Starting Delete Process Test...');

    try {
        const db = await getDatabase();

        // 1. Setup: Create dummy user, brand, branch
        const user = await UserModel.create({
            email: `test_${Date.now()}@example.com`,
            password: 'password',
            name: 'Test User',
            role: 'user'
        });
        const userId = user._id.toString();

        const brand = await BrandModel.create({
            name: `Test Brand ${Date.now()}`,
            status: 'active'
        });

        const branch = await BranchModel.create({
            brand_id: brand._id,
            name: `Test Branch ${Date.now()}`,
            address: 'Test Address',
            latitude: 37.5,
            longitude: 127.0,
            status: 'active'
        });
        const branchId = branch._id.toString();

        // 2. Create Option
        console.log('\n--- Creating Option ---');
        const optionData = {
            branch_id: branchId,
            name: 'Test Option',
            category1: 'office',
            capacity: 4,
            monthly_fee: 1000000,
            deposit: 1000000,
            move_in_date_type: 'immediate'
        };
        const option = await createOption(optionData, userId);
        console.log('Option Created:', option.id);

        // 3. Request Delete
        console.log('\n--- Requesting Delete ---');
        await requestDeleteOption(option.id, 'Test Reason', userId, 'user');

        let updatedOption = await getOptionById(option.id);
        console.log('Option Status:', updatedOption.status); // Should be 'delete_requested'

        // Verify visibility in list
        const optionsList = await getOptions();
        const isVisible = optionsList.options.some(o => o.id === option.id);
        console.log('Option Visible in List (Should be true):', isVisible);

        let requests = await getDeleteRequests({ status: 'pending' });
        let request = requests.requests.find(r => r.option_id.toString() === option.id);
        console.log('Delete Request Exists:', !!request);

        // 4. Reject Delete
        console.log('\n--- Rejecting Delete ---');
        if (request) {
            await rejectDeleteRequest(request.id, 'Reject Reason', userId);

            updatedOption = await getOptionById(option.id);
            console.log('Option Status after Reject:', updatedOption.status); // Should be 'active'
            console.log('Delete Request Reason (Should be null/undefined):', updatedOption.delete_request_reason);

            const rejectedRequest = await DeleteRequestModel.findById(request.id);
            console.log('Request Exists after Reject (Should be null/deleted):', !!rejectedRequest);
        }

        // 5. Request Delete Again
        console.log('\n--- Requesting Delete Again ---');
        await requestDeleteOption(option.id, 'Test Reason 2', userId, 'user');

        requests = await getDeleteRequests({ status: 'pending' });
        request = requests.requests.find(r => r.option_id.toString() === option.id);

        // 6. Approve Delete
        console.log('\n--- Approving Delete ---');
        if (request) {
            await approveDeleteRequest(request.id, userId);

            try {
                await getOptionById(option.id);
                console.log('Option Exists after Approve (Should be false):', true);
            } catch (e) {
                console.log('Option Exists after Approve (Should be false):', false);
            }

            const approvedRequest = await DeleteRequestModel.findById(request.id);
            console.log('Request Exists after Approve (Should be null/deleted):', !!approvedRequest);
        }

        // Cleanup
        console.log('\n--- Cleanup ---');
        await UserModel.deleteById(userId);
        await BrandModel.deleteById(brand._id);
        await BranchModel.deleteById(branch._id);
        // Option should be already deleted

    } catch (error) {
        console.error('Test Failed:', error);
    } finally {
        process.exit(0);
    }
}

runTest();
