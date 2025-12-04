import React from 'react';
import { Page, Text, View, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: { flexDirection: 'column', backgroundColor: '#FFFFFF', padding: 20 },
  header: { fontSize: 20, marginBottom: 20, textAlign: 'center', fontWeight: 'bold' },
  table: { display: 'table', width: 'auto', borderStyle: 'solid', borderWidth: 1, borderRightWidth: 0, borderBottomWidth: 0 },
  tableRow: { margin: 'auto', flexDirection: 'row' },
  tableColHeader: { width: '16.66%', borderStyle: 'solid', borderWidth: 1, borderLeftWidth: 0, borderTopWidth: 0, backgroundColor: '#E0E0E0' },
  tableCol: { width: '16.66%', borderStyle: 'solid', borderWidth: 1, borderLeftWidth: 0, borderTopWidth: 0 },
  tableCellHeader: { margin: 5, fontSize: 10, fontWeight: 'bold', textAlign: 'center' },
  tableCell: { margin: 5, fontSize: 9, textAlign: 'center' },
});

const chunkArray = (array, size) => {
  const result = [];
  for (let i = 0; i < array.length; i += size) result.push(array.slice(i, i + size));
  return result;
};

const ComparisonTablePage = ({ options }) => {
  const optionChunks = chunkArray(options, 5);
  return (
    <>
      {optionChunks.map((chunk, pageIndex) => {
        const filledChunk = [...chunk];
        while (filledChunk.length < 5) filledChunk.push(null);
        return (
          <Page key={pageIndex} size="A4" orientation="landscape" style={styles.page}>
            <Text style={styles.header}>매물 비교표 ({pageIndex + 1}/{optionChunks.length})</Text>
            <View style={styles.table}>
              <View style={styles.tableRow}>
                <View style={styles.tableColHeader}><Text style={styles.tableCellHeader}>구분</Text></View>
                {filledChunk.map((opt, i) => (
                  <View key={i} style={styles.tableCol}>
                    <Text style={styles.tableCellHeader}>
                      {opt ? `${opt.branch?.brand?.alias || opt.branch?.brand?.name || ''} ${opt.branch?.name || ''}` : ''}
                    </Text>
                    <Text style={{ ...styles.tableCell, textAlign: 'left', paddingLeft: 5 }}>
                      {opt ? `옵션${i + 1 + (pageIndex * 5)}. ${opt.name}` : ''}
                    </Text>
                  </View>
                ))}
              </View>
              {[
                { label: '월 임대료', key: 'monthly_fee', format: (val) => val ? `${val.toLocaleString()}원` : '-' },
                { label: '보증금', key: 'deposit', format: (val) => val ? `${val.toLocaleString()}원` : '-' },
                { label: '인실', key: 'capacity', format: (val) => val ? `${val}인실` : '-' },
                { label: '크레딧', key: 'credits', format: (credits) => {
                  if (!credits || !Array.isArray(credits) || credits.length === 0) return '-';
                  return credits.map(credit => {
                    const amount = credit.amount || 0;
                    if (credit.type === 'other') {
                      const customName = credit.customName || '기타';
                      const unit = credit.unit || '크레딧';
                      return `${customName} : 월 ${amount.toLocaleString()} ${unit} 제공`;
                    }
                    const typeMap = { 'monthly': '크레딧', 'printing': '프린팅', 'meeting_room': '미팅룸' };
                    const typeName = typeMap[credit.type] || '크레딧';
                    return `${typeName} : 월 ${amount.toLocaleString()} 크레딧 제공`;
                  }).join(' / ');
                }},
              ].map((row, rowIndex) => (
                <View key={rowIndex} style={styles.tableRow}>
                  <View style={styles.tableColHeader}><Text style={styles.tableCellHeader}>{row.label}</Text></View>
                  {filledChunk.map((opt, i) => (
                    <View key={i} style={styles.tableCol}><Text style={styles.tableCell}>{opt ? row.format(opt[row.key]) : ''}</Text></View>
                  ))}
                </View>
              ))}
            </View>
          </Page>
        );
      })}
    </>
  );
};

export default ComparisonTablePage;
