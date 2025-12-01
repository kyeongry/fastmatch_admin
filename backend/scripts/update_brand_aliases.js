const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '../.env' }); // Adjust path if needed

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/fastmatch';

const brandAliases = {
    '메리히어': 'M',
    '마이크로웨이브': 'M',
    '헬로먼데이': 'H',
    '메가프로젝트': 'M',
    '작심': 'J',
    '지랩스(가라지)': 'G',
    '지랩스': 'G', // Variation
    '가라지': 'G', // Variation
    '테드스페이스': 'T',
    '스페이스에이드': 'S',
    '플레이스캠프': 'P',
    '무신사': 'M',
    '비전포트': 'V',
    '두드림': 'D',
    'SSC': 'S',
    '팀타운': 'T',
    'TEC': 'T',
    '스튜디오오스카': 'S',
    'CEO SUITE': 'C',
    'CEO 스위트': 'C', // Variation
    '하품': 'H',
    '에그스테이션': 'E',
    '트리니티': 'T',
    '넥스트데이': 'N',
    '핀포인트': 'P',
    '캔버스랩': 'C',
    '워크플렉스': 'W',
    '워크앤올': 'W',
    '마이워크스페이스': 'M',
    '리저스': 'R',
    '스페이시즈': 'S',
    '리저스/스페이시즈': 'R/S',
    '스테이지나인': 'S',
    '저스트코': 'J',
    '위워크': 'W',
    '스파크플러스': 'S',
    '패스트파이브': 'F'
};

async function migrate() {
    const client = new MongoClient(MONGODB_URI);

    try {
        await client.connect();
        console.log('✅ Connected to MongoDB');

        const db = client.db();
        const collection = db.collection('brands');

    } finally {
        await client.close();
    }
}

migrate();
