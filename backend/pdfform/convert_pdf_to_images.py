import sys
import os
from pathlib import Path

# PDF to Image conversion using PyMuPDF (fitz)
# Requires: pip install PyMuPDF pillow

try:
    import fitz  # PyMuPDF
    from PIL import Image
except ImportError:
    print("ERROR: Required libraries not installed")
    print("Please run: pip install PyMuPDF pillow")
    sys.exit(1)

def convert_pdf_to_images(pdf_path, output_dir):
    """
    Convert PDF to PNG images using PyMuPDF
    """
    pdf_name = Path(pdf_path).stem
    output_folder = Path(output_dir) / pdf_name
    output_folder.mkdir(parents=True, exist_ok=True)
    
    print(f"Converting {pdf_name}...")
    
    try:
        # Open PDF
        doc = fitz.open(pdf_path)
        image_paths = []
        
        # Convert each page
        for page_num in range(len(doc)):
            page = doc[page_num]
            
            # Render page to image (200 DPI)
            mat = fitz.Matrix(200/72, 200/72)  # 200 DPI
            pix = page.get_pixmap(matrix=mat)
            
            # Save as PNG
            image_path = output_folder / f"page_{page_num + 1}.png"
            pix.save(str(image_path))
            image_paths.append(str(image_path))
            
            print(f"  - Saved: {image_path}")
        
        doc.close()
        return image_paths
    except Exception as e:
        print(f"ERROR converting {pdf_name}: {e}")
        return []

def main():
    # PDF source directory
    pdf_dir = Path("c:/fastmatch-02/pdfform")
    
    # Output directory for images
    output_dir = Path("c:/fastmatch-02/pdfform/images")
    output_dir.mkdir(exist_ok=True)
    
    # List of PDF files
    pdf_files = [
        "표지.pdf",
        "서비스안내.pdf",
        "옵션상세.pdf",
        "매물비교표.pdf"
    ]
    
    print("=" * 60)
    print("PDF to Image Converter (PyMuPDF) for FASTMATCH")
    print("=" * 60)
    print()
    
    all_images = {}
    
    for pdf_file in pdf_files:
        pdf_path = pdf_dir / pdf_file
        if pdf_path.exists():
            images = convert_pdf_to_images(pdf_path, output_dir)
            all_images[pdf_file] = images
        else:
            print(f"WARNING: {pdf_file} not found")
    
    print()
    print("=" * 60)
    print("Conversion Complete!")
    print("=" * 60)
    print(f"Total PDFs processed: {len(all_images)}")
    print(f"Output directory: {output_dir}")
    print()
    
    for pdf_name, images in all_images.items():
        print(f"{pdf_name}: {len(images)} page(s)")

if __name__ == "__main__":
    main()
