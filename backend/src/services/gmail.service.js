/**
 * Gmail API 서비스 모듈
 * OAuth2를 사용한 Gmail API 기반 이메일 발송
 */

const { google } = require('googleapis');

// OAuth2 클라이언트 설정
const oauth2Client = new google.auth.OAuth2(
  process.env.GMAIL_CLIENT_ID,
  process.env.GMAIL_CLIENT_SECRET,
  'https://developers.google.com/oauthplayground' // redirect URI
);

// Refresh Token 설정
oauth2Client.setCredentials({
  refresh_token: process.env.GMAIL_REFRESH_TOKEN
});

// Gmail API 인스턴스
const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

/**
 * Base64 URL-safe 인코딩
 */
const encodeBase64 = (str) => {
  return Buffer.from(str)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
};

/**
 * UTF-8 Base64 인코딩 (한글 제목 지원)
 */
const encodeSubject = (subject) => {
  return `=?UTF-8?B?${Buffer.from(subject).toString('base64')}?=`;
};

/**
 * 기본 이메일 발송 (HTML)
 * @param {Object} options - 이메일 옵션
 * @param {string|string[]} options.to - 수신자 이메일 (배열 가능)
 * @param {string|string[]} [options.cc] - 참조 이메일 (배열 가능)
 * @param {string} [options.replyTo] - 회신 주소
 * @param {string} options.subject - 제목
 * @param {string} options.html - HTML 본문
 */
const sendEmail = async ({ to, cc, replyTo, subject, html }) => {
  try {
    const toAddresses = Array.isArray(to) ? to.join(', ') : to;
    const fromEmail = process.env.GMAIL_USER || process.env.EMAIL_USER || 'ryong1392@gmail.com';
    const fromName = process.env.EMAIL_FROM_NAME || 'FASTMATCH';

    // MIME 메시지 구성
    let mimeMessage = [
      `From: ${fromName} <${fromEmail}>`,
      `To: ${toAddresses}`,
    ];

    if (cc) {
      const ccAddresses = Array.isArray(cc) ? cc.join(', ') : cc;
      mimeMessage.push(`Cc: ${ccAddresses}`);
    }

    if (replyTo) {
      mimeMessage.push(`Reply-To: ${replyTo}`);
    }

    mimeMessage.push(
      `Subject: ${encodeSubject(subject)}`,
      'MIME-Version: 1.0',
      'Content-Type: text/html; charset=UTF-8',
      '',
      html
    );

    const rawMessage = encodeBase64(mimeMessage.join('\r\n'));

    const response = await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: rawMessage
      }
    });

    console.log('✅ Gmail API: Email sent successfully, messageId:', response.data.id);
    return { success: true, messageId: response.data.id };
  } catch (error) {
    console.error('❌ Gmail API Error:', error.message);
    if (error.response) {
      console.error('   Response status:', error.response.status);
      console.error('   Response data:', JSON.stringify(error.response.data));
    }
    throw new Error(`이메일 발송 실패: ${error.message}`);
  }
};

/**
 * 첨부파일 포함 이메일 발송 (PDF 등)
 * @param {Object} options - 이메일 옵션
 * @param {string|string[]} options.to - 수신자 이메일
 * @param {string|string[]} [options.cc] - 참조 이메일
 * @param {string} [options.replyTo] - 회신 주소
 * @param {string} options.subject - 제목
 * @param {string} options.html - HTML 본문
 * @param {Object[]} [options.attachments] - 첨부파일 배열
 * @param {string} options.attachments[].filename - 파일명
 * @param {Buffer|string} options.attachments[].content - 파일 내용 (Buffer 또는 base64 string)
 * @param {string} [options.attachments[].contentType] - MIME 타입 (기본: application/pdf)
 */
const sendEmailWithAttachment = async ({ to, cc, replyTo, subject, html, attachments = [] }) => {
  try {
    const toAddresses = Array.isArray(to) ? to.join(', ') : to;
    const fromEmail = process.env.GMAIL_USER || process.env.EMAIL_USER || 'ryong1392@gmail.com';
    const fromName = process.env.EMAIL_FROM_NAME || 'FASTMATCH';
    const boundary = `boundary_${Date.now()}`;

    // MIME 헤더
    let mimeMessage = [
      `From: ${fromName} <${fromEmail}>`,
      `To: ${toAddresses}`,
    ];

    if (cc) {
      const ccAddresses = Array.isArray(cc) ? cc.join(', ') : cc;
      mimeMessage.push(`Cc: ${ccAddresses}`);
    }

    if (replyTo) {
      mimeMessage.push(`Reply-To: ${replyTo}`);
    }

    mimeMessage.push(
      `Subject: ${encodeSubject(subject)}`,
      'MIME-Version: 1.0',
      `Content-Type: multipart/mixed; boundary="${boundary}"`,
      '',
      `--${boundary}`,
      'Content-Type: text/html; charset=UTF-8',
      'Content-Transfer-Encoding: base64',
      '',
      Buffer.from(html).toString('base64')
    );

    // 첨부파일 추가
    for (const attachment of attachments) {
      const contentType = attachment.contentType || 'application/pdf';
      const filename = attachment.filename;
      const content = Buffer.isBuffer(attachment.content)
        ? attachment.content.toString('base64')
        : attachment.content;

      // 파일명 인코딩 (한글 지원)
      const encodedFilename = `=?UTF-8?B?${Buffer.from(filename).toString('base64')}?=`;

      mimeMessage.push(
        `--${boundary}`,
        `Content-Type: ${contentType}; name="${encodedFilename}"`,
        'Content-Transfer-Encoding: base64',
        `Content-Disposition: attachment; filename="${encodedFilename}"`,
        '',
        content
      );
    }

    mimeMessage.push(`--${boundary}--`);

    const rawMessage = encodeBase64(mimeMessage.join('\r\n'));

    const response = await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: rawMessage
      }
    });

    console.log('✅ Gmail API: Email with attachment sent, messageId:', response.data.id);
    return { success: true, messageId: response.data.id };
  } catch (error) {
    console.error('❌ Gmail API Error (with attachment):', error.message);
    if (error.response) {
      console.error('   Response status:', error.response.status);
      console.error('   Response data:', JSON.stringify(error.response.data));
    }
    throw new Error(`이메일 발송 실패: ${error.message}`);
  }
};

/**
 * Gmail API 연결 테스트
 */
const testConnection = async () => {
  try {
    const profile = await gmail.users.getProfile({ userId: 'me' });
    console.log('✅ Gmail API connected:', profile.data.emailAddress);
    return { success: true, email: profile.data.emailAddress };
  } catch (error) {
    console.error('❌ Gmail API connection failed:', error.message);
    return { success: false, error: error.message };
  }
};

module.exports = {
  sendEmail,
  sendEmailWithAttachment,
  testConnection
};
