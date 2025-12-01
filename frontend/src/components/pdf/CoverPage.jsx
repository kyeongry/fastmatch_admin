import React from 'react';
import { Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    padding: 40,
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 80,
    marginBottom: 60,
  },
  logo: {
    width: 200,
    height: 80,
    marginBottom: 20,
  },
  logoText: {
    fontSize: 32,
    fontWeight: 'bold',
    fontFamily: 'NanumGothic',
    color: '#2B5797',
    letterSpacing: 2,
  },
  mainContent: {
    alignItems: 'center',
    marginTop: 100,
  },
  proposalTitle: {
    fontSize: 48,
    fontWeight: 'bold',
    fontFamily: 'NanumGothic',
    color: '#1A1A1A',
    marginBottom: 30,
    textAlign: 'center',
  },
  proposalSubtitle: {
    fontSize: 24,
    fontFamily: 'NanumGothic',
    color: '#666666',
    marginBottom: 15,
    textAlign: 'center',
  },
  companyName: {
    fontSize: 20,
    fontFamily: 'NanumGothic',
    color: '#444444',
    marginTop: 20,
    textAlign: 'center',
  },
  footer: {
    position: 'absolute',
    bottom: 60,
    left: 40,
    right: 40,
    alignItems: 'center',
  },
  date: {
    fontSize: 14,
    fontFamily: 'NanumGothic',
    color: '#888888',
  },
  divider: {
    width: 200,
    height: 3,
    backgroundColor: '#2B5797',
    marginTop: 20,
    marginBottom: 20,
  },
});

const CoverPage = ({ proposal }) => {
  const currentDate = new Date();
  const formattedDate = `${currentDate.getFullYear()}. ${String(currentDate.getMonth() + 1).padStart(2, '0')}. ${String(currentDate.getDate()).padStart(2, '0')}`;

  return (
    <Page size="A4" style={styles.page}>
      <View style={styles.logoContainer}>
        <Text style={styles.logoText}>FASTMATCH</Text>
      </View>

      <View style={styles.mainContent}>
        <View style={styles.divider} />
        <Text style={styles.proposalTitle}>임대 제안서</Text>
        <Text style={styles.proposalSubtitle}>{proposal.document_name || '공유오피스 제안'}</Text>
        <View style={styles.divider} />
        <Text style={styles.companyName}>패스트매치</Text>
      </View>

      <View style={styles.footer}>
        <Text style={styles.date}>{formattedDate}</Text>
      </View>
    </Page>
  );
};

export default CoverPage;
