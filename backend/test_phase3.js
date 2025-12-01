const axios = require('axios');
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const BASE_URL = 'http://localhost:5000/api';

async function runTests() {
    console.log('🚀 Starting Phase 3 Verification Tests...');

    let testUser;
    let token;

    try {
        // 1. Create Test Admin User
        console.log('\n1️⃣ Creating Test Admin User...');
        const email = `test_admin_${Date.now()}@example.com`;
        const password = 'password123';

        // Create user directly in DB to ensure Admin role
        // We need to hash password but for this test we might need to use the auth service or just insert raw if we can login.
        // Actually, let's register via API then update role.

        try {
            await axios.post(`${BASE_URL}/auth/register`, {
                email,
                password,
                name: 'Test Admin',
                phone: '010-0000-0000'
            });
        } catch (e) {
            // Ignore if already exists (unlikely with timestamp)
        }

        // Update to Admin
        testUser = await prisma.user.findUnique({ where: { email } });
        await prisma.user.update({
            where: { id: testUser.id },
            data: { role: 'admin', email_verified: true } // Ensure verified
        });
        console.log('✅ Test Admin User Created:', email);

        // 2. Login
        console.log('\n2️⃣ Logging in...');
        const loginRes = await axios.post(`${BASE_URL}/auth/login`, {
            email,
            password
        });
        token = loginRes.data.token;
        console.log('✅ Login Successful. Token received.');

        const headers = { Authorization: `Bearer ${token}` };

        // 3. Test External API (KakaoMap)
        console.log('\n3️⃣ Testing External API (Address Search)...');
        try {
            const addressRes = await axios.get(`${BASE_URL}/external/address/search`, {
                params: { query: '강남' },
                headers
            });
            console.log('✅ Address Search Result:', addressRes.data.length > 0 ? 'Found' : 'Empty (Check API Key)');
            if (addressRes.data.length > 0) {
                console.log('   Sample:', addressRes.data[0].mainAddress);
            }
        } catch (error) {
            console.error('❌ Address Search Failed:', error.response?.data || error.message);
        }

        // 4. Test Admin Dashboard
        console.log('\n4️⃣ Testing Admin Dashboard Stats...');
        try {
            const statsRes = await axios.get(`${BASE_URL}/admin/dashboard/stats`, {
                headers
            });
            console.log('✅ Dashboard Stats Retrieved:', statsRes.data.success);
            console.log('   Users:', statsRes.data.data.users.total);
            console.log('   Brands:', statsRes.data.data.brands.total);
        } catch (error) {
            console.error('❌ Dashboard Stats Failed:', error.response?.data || error.message);
        }

    } catch (error) {
        console.error('❌ Test Script Error:', error.message);
        if (error.response) {
            console.error('   Response:', error.response.data);
        }
    } finally {
        // Cleanup
        if (testUser) {
            console.log('\n🧹 Cleaning up test user...');
            await prisma.user.delete({ where: { id: testUser.id } });
            console.log('✅ Cleanup Complete');
        }
        await prisma.$disconnect();
    }
}

runTests();
