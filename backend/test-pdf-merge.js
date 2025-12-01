const { PDFDocument } = require('pdf-lib');
const fs = require('fs').promises;
const path = require('path');

async function testMerge() {
    try {
        console.log('Creating dummy PDFs...');

        // Create dummy PDF 1
        const pdf1 = await PDFDocument.create();
        const page1 = pdf1.addPage();
        page1.drawText('This is PDF 1');
        const pdf1Bytes = await pdf1.save();

        // Create dummy PDF 2
        const pdf2 = await PDFDocument.create();
        const page2 = pdf2.addPage();
        page2.drawText('This is PDF 2');
        const pdf2Bytes = await pdf2.save();

        console.log('Merging PDFs...');

        // Merge logic
        const mergedPdf = await PDFDocument.create();

        const pdfsToMerge = [pdf1Bytes, pdf2Bytes];

        for (const pdfBytes of pdfsToMerge) {
            const pdf = await PDFDocument.load(pdfBytes);
            const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
            copiedPages.forEach((page) => mergedPdf.addPage(page));
        }

        const mergedPdfBytes = await mergedPdf.save();

        await fs.writeFile('test_merged.pdf', mergedPdfBytes);
        console.log('✅ Successfully merged PDFs into test_merged.pdf');

    } catch (error) {
        console.error('❌ Test failed:', error);
    }
}

testMerge();
