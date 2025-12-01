import React from 'react';
import { Page, Text, View, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    padding: 40,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    fontFamily: 'NanumGothic',
    textAlign: 'center',
    marginBottom: 30,
    color: '#2B5797',
    paddingBottom: 15,
    borderBottomWidth: 3,
    borderBottomColor: '#2B5797',
  },
  contentContainer: {
    marginTop: 20,
  },
  section: {
    marginBottom: 25,
    paddingLeft: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    fontFamily: 'NanumGothic',
    color: '#2B5797',
    marginBottom: 10,
  },
  sectionText: {
    fontSize: 11,
    fontFamily: 'NanumGothic',
    color: '#444444',
    lineHeight: 1.6,
    paddingLeft: 15,
  },
  bulletPoint: {
    fontSize: 11,
    fontFamily: 'NanumGothic',
    color: '#2B5797',
    marginRight: 8,
  },
  bulletContainer: {
    flexDirection: 'row',
    marginBottom: 8,
  },
});

const ServiceGuidePage = () => {
  return (
    <Page size="A4" style={styles.page}>
      <Text style={styles.header}>FASTMATCH 서비스 안내</Text>

      <View style={styles.contentContainer}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. 중개 수수료 무료</Text>
          <View style={styles.bulletContainer}>
            <Text style={styles.bulletPoint}>•</Text>
            <Text style={styles.sectionText}>
              패스트매치를 통해 계약하시면 중개 수수료가 전액 무료입니다.
            </Text>
          </View>
          <View style={styles.bulletContainer}>
            <Text style={styles.bulletPoint}>•</Text>
            <Text style={styles.sectionText}>
              임대인과 직접 계약하여 추가 비용이 발생하지 않습니다.
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. 맞춤형 투어 제공</Text>
          <View style={styles.bulletContainer}>
            <Text style={styles.bulletPoint}>•</Text>
            <Text style={styles.sectionText}>
              고객님의 니즈에 맞는 최적의 매물을 선별하여 투어를 제공합니다.
            </Text>
          </View>
          <View style={styles.bulletContainer}>
            <Text style={styles.bulletPoint}>•</Text>
            <Text style={styles.sectionText}>
              전문 컨설턴트가 동행하여 상세한 설명을 제공합니다.
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3. 계약 케어 서비스</Text>
          <View style={styles.bulletContainer}>
            <Text style={styles.bulletPoint}>•</Text>
            <Text style={styles.sectionText}>
              계약 조건 협의부터 입주까지 전 과정을 전문가가 케어해 드립니다.
            </Text>
          </View>
          <View style={styles.bulletContainer}>
            <Text style={styles.bulletPoint}>•</Text>
            <Text style={styles.sectionText}>
              계약서 검토 및 법률 자문 서비스를 제공합니다.
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>4. 제휴 혜택</Text>
          <View style={styles.bulletContainer}>
            <Text style={styles.bulletPoint}>•</Text>
            <Text style={styles.sectionText}>
              이사, 청소, 인테리어 등 다양한 제휴 업체의 할인 혜택을 제공합니다.
            </Text>
          </View>
          <View style={styles.bulletContainer}>
            <Text style={styles.bulletPoint}>•</Text>
            <Text style={styles.sectionText}>
              입주 후 필요한 모든 서비스를 원스톱으로 지원합니다.
            </Text>
          </View>
        </View>
      </View>
    </Page>
  );
};

export default ServiceGuidePage;
