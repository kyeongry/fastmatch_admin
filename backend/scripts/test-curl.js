require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { exec } = require('child_process');

const key = process.env.KAKAO_REST_API_KEY;
const url = "https://dapi.kakao.com/v2/maps/staticmap?center=127.0639,37.5089&level=3&width=400&height=300";

const cmd = `curl -H "Authorization: KakaoAK ${key}" "${url}"`;

console.log('Running curl...');
exec(cmd, (error, stdout, stderr) => {
    console.log('--- STDOUT ---');
    console.log(stdout);
    console.log('--- STDERR ---');
    console.log(stderr);
});
