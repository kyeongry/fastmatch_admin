const cloudinary = require('./src/config/cloudinary');
const { uploadPDFToCloudinary } = require('./src/services/proposalPDF.service');

const testUpload = async () => {
    try {
        console.log('☁️ Testing Cloudinary upload...');

        // Create a dummy PDF buffer (just a string for testing, Cloudinary might complain if it's not a real PDF but let's try)
        // Better to use a minimal valid PDF header
        const pdfBuffer = Buffer.from('%PDF-1.4\n%\n1 0 obj\n<</Type/Catalog/Pages 2 0 R>>\nendobj\n2 0 obj\n<</Type/Pages/Kids[3 0 R]/Count 1>>\nendobj\n3 0 obj\n<</Type/Page/MediaBox[0 0 595 842]>>\nendobj\nxref\n0 4\n0000000000 65535 f\n0000000010 00000 n\n0000000060 00000 n\n0000000117 00000 n\ntrailer\n<</Size 4/Root 1 0 R>>\nstartxref\n178\n%%EOF');

        const fileName = `test_upload_${Date.now()}.pdf`;

        const result = await uploadPDFToCloudinary(pdfBuffer, fileName);

        console.log('✅ Upload successful!');
        console.log('URL:', result.secure_url);
        console.log('Resource Type:', result.resource_type);
        console.log('Format:', result.format);

    } catch (error) {
        console.error('❌ Upload failed:', error);
    }
};

testUpload();
