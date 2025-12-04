import React from 'react';
import { Page, Text, View, Image, StyleSheet } from '@react-pdf/renderer';

// 비고 텍스트 최대 글자 수 (2줄 기준, PDF 폰트 10pt 기준 약 60자/줄)
export const MEMO_MAX_LENGTH = 120;

// 텍스트 길이에 따른 동적 스타일 계산
const getMemoTextStyle = (text) => {
  const length = text?.length || 0;
  // 1줄 (60자 이하): 기본 스타일
  // 2줄 (61-120자): 폰트 9pt, 줄간격 줄임
  if (length > 60) {
    return {
      fontSize: 9,
      fontFamily: 'NanumGothic',
      color: '#666666',
      lineHeight: 1.4,
    };
  }
  return {
    fontSize: 10,
    fontFamily: 'NanumGothic',
    color: '#666666',
    lineHeight: 1.5,
  };
};

const getMemoBoxStyle = (text) => {
  const length = text?.length || 0;
  if (length > 60) {
    return {
      marginTop: 15,
      padding: 8,
      backgroundColor: '#F8F9FA',
      borderRadius: 4,
      borderWidth: 1,
      borderColor: '#E0E0E0',
    };
  }
  return {
    marginTop: 15,
    padding: 12,
    backgroundColor: '#F8F9FA',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  };
};

const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    padding: 35,
  },
  header: {
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'NanumGothic',
    marginBottom: 20,
    paddingBottom: 10,
    borderBottomWidth: 2,
    borderBottomColor: '#2B5797',
    color: '#2B5797',
  },
  subHeader: {
    fontSize: 14,
    fontWeight: 'bold',
    fontFamily: 'NanumGothic',
    marginTop: 20,
    marginBottom: 15,
    color: '#333333',
  },
  infoGrid: {
    marginTop: 10,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  infoLabel: {
    width: 120,
    fontSize: 11,
    fontWeight: 'bold',
    fontFamily: 'NanumGothic',
    color: '#555555',
  },
  infoValue: {
    flex: 1,
    fontSize: 11,
    fontFamily: 'NanumGothic',
    color: '#333333',
  },
  imageContainer: {
    marginTop: 15,
    height: 250,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#DDDDDD',
    borderRadius: 4,
  },
  imagePlaceholder: {
    fontSize: 10,
    fontFamily: 'NanumGothic',
    color: '#999999',
  },
  memoLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    fontFamily: 'NanumGothic',
    color: '#555555',
    marginBottom: 6,
  },
});

const OptionDetailPage = ({ option }) => {
  const brandName = option.branch?.brand?.alias || option.branch?.brand?.name || '';
  const title = `${brandName} ${option.branch?.name || ''} - ${option.name}`;
  const formatCurrency = (val) => val ? `${val.toLocaleString()}원` : '-';

  const memoText = option.memo || '메모가 없습니다.';
  const descriptionText = option.branch?.description || '지점 설명이 없습니다.';

  return (
    <>
      <Page size="A4" style={styles.page}>
        <Text style={styles.header}>옵션 상세 (1/3): {title}</Text>

        <Text style={styles.subHeader}>지점 정보</Text>
        <View style={styles.infoGrid}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>브랜드</Text>
            <Text style={styles.infoValue}>{brandName || '-'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>지점명</Text>
            <Text style={styles.infoValue}>{option.branch?.name || '-'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>주소</Text>
            <Text style={styles.infoValue}>{option.branch?.address || '-'}</Text>
          </View>
        </View>

        <Text style={styles.subHeader}>지점 외관</Text>
        <View style={styles.imageContainer}>
          <Text style={styles.imagePlaceholder}>외관 이미지</Text>
        </View>

        <View style={getMemoBoxStyle(descriptionText)}>
          <Text style={styles.memoLabel}>지점 소개</Text>
          <Text style={getMemoTextStyle(descriptionText)}>
            {descriptionText}
          </Text>
        </View>
      </Page>

      <Page size="A4" style={styles.page}>
        <Text style={styles.header}>옵션 상세 (2/3): {title}</Text>

        <Text style={styles.subHeader}>임대 조건</Text>
        <View style={styles.infoGrid}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>월 임대료</Text>
            <Text style={styles.infoValue}>{formatCurrency(option.monthly_fee)}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>보증금</Text>
            <Text style={styles.infoValue}>{formatCurrency(option.deposit)}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>관리비</Text>
            <Text style={styles.infoValue}>
              {option.maintenance_fee ? formatCurrency(option.maintenance_fee) : '포함'}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>분류</Text>
            <Text style={styles.infoValue}>
              {option.category1 === 'exclusive_floor' && '전용층'}
              {option.category1 === 'connected_floor' && '연층'}
              {option.category1 === 'separate_floor' && '분리층'}
              {option.category1 === 'exclusive_room' && '전용호실'}
              {option.category1 === 'connected_room' && '연접호실'}
              {option.category1 === 'separate_room' && '분리호실'}
              {(!option.category1) && '-'}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>인실</Text>
            <Text style={styles.infoValue}>{option.capacity ? `${option.capacity}인실` : '-'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>계약 기간</Text>
            <Text style={styles.infoValue}>
              {option.contract_period_type === 'twelve_months' ? '12개월' : '협의'}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>입주 가능일</Text>
            <Text style={styles.infoValue}>
              {option.move_in_date_type === 'immediate' ? '즉시' : option.move_in_date_value || '-'}
            </Text>
          </View>
          {option.credits && option.credits.length > 0 && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>제공 크레딧</Text>
              <View style={{ flex: 1 }}>
                {option.credits.map((credit, idx) => (
                  <Text key={idx} style={styles.infoValue}>
                    • {credit.type === 'monthly' && '월별 제공'}
                    {credit.type === 'printing' && '프린팅'}
                    {credit.type === 'meeting_room' && '미팅룸'}
                    {credit.type === 'other' && '기타'} 크레딧: {credit.amount.toLocaleString()}
                  </Text>
                ))}
              </View>
            </View>
          )}
        </View>

        <View style={getMemoBoxStyle(memoText)}>
          <Text style={styles.memoLabel}>옵션 메모</Text>
          <Text style={getMemoTextStyle(memoText)}>
            {memoText}
          </Text>
        </View>
      </Page>

      {option.floor_plan_url && (
        <Page size="A4" style={styles.page}>
          <Text style={styles.header}>옵션 상세 (3/3): {title}</Text>

          <Text style={styles.subHeader}>평면도</Text>
          <View style={{ marginTop: 15 }}>
            <Image
              src={option.floor_plan_url}
              style={{
                width: '100%',
                maxHeight: 500,
                objectFit: 'contain'
              }}
            />
          </View>
        </Page>
      )}
    </>
  );
};

export default OptionDetailPage;
