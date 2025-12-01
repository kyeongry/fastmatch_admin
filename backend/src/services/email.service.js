const resend = require('../config/email');

const generateVerificationCode = () => {
  return Math.random().toString().slice(2, 8); // 6자리 숫자
};

const sendVerificationEmail = async (email, code) => {
  try {
    const { data, error } = await resend.emails.send({
      from: process.env.EMAIL_FROM || 'FASTMATCH <onboarding@resend.dev>',
      to: email,
      subject: '[FASTMATCH] 이메일 인증 코드',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>이메일 인증 코드</h2>
          <p>FASTMATCH에 가입해주셔서 감사합니다.</p>
          <p>아래의 인증 코드를 입력하여 이메일 인증을 완료해주세요.</p>
          <div style="background-color: #f5f5f5; padding: 20px; text-align: center; margin: 20px 0; border-radius: 5px;">
            <h1 style="color: #333; letter-spacing: 5px; margin: 0;">${code}</h1>
          </div>
          <p style="color: #999; font-size: 12px;">
            이 인증 코드는 10분간 유효합니다.
          </p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="color: #999; font-size: 12px;">
            FASTMATCH<br>
            support@fastmatch.kr
          </p>
        </div>
      `
    });

    if (error) {
      console.error('❌ Resend error:', error);
      throw new Error(error.message);
    }

    console.log('✅ Email sent via Resend:', data?.id);
    return true;
  } catch (error) {
    console.error('❌ Email send error:', error);
    throw new Error('이메일 발송에 실패했습니다');
  }
};

const sendProposalEmail = async ({ to, cc, replyTo, subject, html }) => {
  try {
    const { data, error } = await resend.emails.send({
      from: process.env.EMAIL_FROM || 'FASTMATCH <onboarding@resend.dev>',
      to: Array.isArray(to) ? to : [to],
      cc: cc && cc.length > 0 ? cc : undefined,
      reply_to: replyTo,
      subject,
      html
    });

    if (error) {
      console.error('❌ Resend error:', error);
      throw new Error(error.message);
    }

    console.log('✅ Proposal email sent via Resend:', data?.id);
    return true;
  } catch (error) {
    console.error('❌ Email send error:', error);
    throw new Error('이메일 발송에 실패했습니다');
  }
};

// 제안 요청 이메일 발송
const sendProposalRequestEmail = async (data, sendType) => {
  const {
    to,
    cc,
    replyTo,
    brand,
    manager,
    company_name,
    contact_name,
    contact_position,
    contact_phone,
    contact_email,
    preferred_subway,
    actual_users,
    preferred_capacity,
    move_in_date,
    move_in_period,
    lease_period,
    additional_info,
    requester_name,
    requester_position,
  } = data;

  // 이메일 제목 생성
  const stationText = preferred_subway.replace(/역$/, ''); // "역" 제거
  const roomTypeText = preferred_capacity ? `${preferred_capacity}` : '미정';

  let prefix = '[패스트매치] 공실 문의의 건';
  if (sendType === 'additional') {
    prefix = '[패스트매치] 추가 공실 문의의 건';
  } else if (sendType === 'modified') {
    prefix = '[패스트매치] [변경] 공실 문의의 건';
  }

  const subject = `${prefix}[${company_name} : ${stationText}역 / ${actual_users} ~ ${roomTypeText}인실]`;

  // 입주 기간 변환
  const moveInPeriodMap = {
    early: '초순',
    mid: '중순',
    late: '하순',
    whole: '전체',
  };

  const moveInPeriodText = moveInPeriodMap[move_in_period] || move_in_period;

  // HTML 이메일 템플릿
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: 'Noto Sans KR', Arial, sans-serif; }
        table { border-collapse: collapse; width: 100%; margin: 20px 0; }
        th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
        th { background-color: #f2f2f2; width: 120px; }
        td { width: auto; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { color: #333; margin-bottom: 30px; }
        .footer { color: #555; font-size: 12px; margin-top: 30px; border-top: 1px solid #eee; padding-top: 20px; }
        .logo { margin-bottom: 10px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          ${manager && manager.trim() ?
            `<p>안녕하십니까, <strong>${brand}</strong> <strong>${manager}</strong> 매니저님.</p>
          <p>패스트매치 ${requester_name}${requester_position ? ' ' + requester_position : ''}입니다.</p>` :
            `<p>안녕하십니까, 패스트매치 ${requester_name}${requester_position ? ' ' + requester_position : ''}입니다.</p>`}
        </div>

        <p>신규 고객사 문의가 있어 공유드립니다.</p>

        <table>
          <tr>
            <th>고객사명</th>
            <td>${company_name}</td>
          </tr>
          <tr>
            <th>희망 지하철역</th>
            <td>${preferred_subway}</td>
          </tr>
          <tr>
            <th>희망 인원</th>
            <td>${actual_users}명 ~ ${preferred_capacity ? preferred_capacity + '명' : '미정'}</td>
          </tr>
          <tr>
            <th>입주 예정일</th>
            <td>${move_in_date} (${moveInPeriodText})</td>
          </tr>
          <tr>
            <th>임대 기간</th>
            <td>${lease_period}개월</td>
          </tr>
          <tr>
            <th>추가 정보</th>
            <td>${additional_info ? additional_info.replace(/\n/g, '<br>') : '없음'}</td>
          </tr>
        </table>

        <p>제안 가능한 공실이 있으면 피드백 부탁드립니다.</p>
        <p>감사합니다.</p>

        <div class="footer">
          <div class="logo" style="margin-bottom: 15px;">
            <img src="https://i.ifh.cc/ybzqml.png" alt="SMATCH" style="height: 20px; display: block;">
          </div>
          <p>
            ${requester_name} ${data.requester_name_en || ''}<br>
            ${data.requester_position || ''} | 임대차 솔루션 그룹<br>
            <br>
            ${data.requester_phone || ''}<br>
            ${data.requester_email || replyTo || 'noreply@fastmatch.kr'}<br>
            <br>
            (주) 스매치 코퍼레이션<br>
            서울시 서초구 법원로 4길 11-6, 스매치 서초사옥<br>
            smatch.kr
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    const { data, error } = await resend.emails.send({
      from: process.env.EMAIL_FROM || 'FASTMATCH <onboarding@resend.dev>',
      to: Array.isArray(to) ? to : [to],
      cc: cc && cc.length > 0 ? cc : undefined,
      reply_to: replyTo,
      subject,
      html,
    });

    if (error) {
      console.error('❌ Resend error:', error);
      throw new Error(error.message);
    }

    console.log('✅ Proposal request email sent via Resend:', data?.id);
    return true;
  } catch (error) {
    console.error('❌ Proposal email send error:', error);
    throw new Error('제안 요청 이메일 발송에 실패했습니다');
  }
};

module.exports = {
  generateVerificationCode,
  sendVerificationEmail,
  sendProposalEmail,
  sendProposalRequestEmail
};
