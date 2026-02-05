const { ObjectId } = require('mongodb');

/**
 * 공제증서 스키마
 * 중개사무소 공제증서 관리
 */
const InsuranceCertSchema = {
  name: String,                  // 파일명
  fileUrl: String,               // Cloudinary URL
  validFrom: Date,               // 유효기간 시작
  validTo: Date,                 // 유효기간 종료
  isActive: { type: Boolean, default: false },  // 현재 사용 중
  uploadedAt: { type: Date, default: Date.now },
  uploadedBy: ObjectId
};

// MongoDB Collection 인덱스
const InsuranceCertIndexes = [
  { key: { isActive: 1 } },
  { key: { validTo: 1 } },
  { key: { uploadedAt: -1 } }
];

module.exports = {
  InsuranceCertSchema,
  InsuranceCertIndexes
};
