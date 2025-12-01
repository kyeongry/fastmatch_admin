import React from 'react';
import { Document, Font } from '@react-pdf/renderer';
import CoverPage from './CoverPage';
import ComparisonTablePage from './ComparisonTablePage';
import ServiceGuidePage from './ServiceGuidePage';
import OptionDetailPage from './OptionDetailPage';

// Register Korean fonts
Font.register({
  family: 'NanumGothic',
  fonts: [
    { src: '/fonts/NanumGothic-Regular.ttf', fontWeight: 'normal' },
    { src: '/fonts/NanumGothic-Bold.ttf', fontWeight: 'bold' },
  ],
});

const ProposalPDF = ({ proposal }) => {
  const options = proposal.options || proposal.selected_options || [];
  return (
    <Document>
      <CoverPage proposal={proposal} />
      <ComparisonTablePage options={options} />
      <ServiceGuidePage />
      {options.map((option, index) => (
        <OptionDetailPage key={index} option={option} index={index} />
      ))}
    </Document>
  );
};

export default ProposalPDF;
