import pdfplumber
import fitz # PyMuPDF
import io

def parse_pdf(file_content: bytes) -> str:
    """
    Attempts to extract text using pdfplumber (for structured PDFs).
    If it fails or returns very little text, falls back to PyMuPDF/OCR.
    """
    extracted_text = ""
    try:
        with pdfplumber.open(io.BytesIO(file_content)) as pdf:
            for page in pdf.pages:
                text = page.extract_text()
                if text:
                    extracted_text += text + "\n"
        
        # If very little text is extracted, it might be a scanned PDF
        if len(extracted_text.strip()) < 100:
            return extract_scanned_pdf(file_content)
            
        return extracted_text
    except Exception as e:
        print(f"pdfplumber failed: {e}")
        return extract_scanned_pdf(file_content)

def extract_scanned_pdf(file_content: bytes) -> str:
    """
    Fallback for scanned PDFs using PyMuPDF (and potentially Tesseract).
    """
    extracted_text = ""
    try:
        # For MVP, we just use fitz text extraction.
        # Adding Tesseract OCR here would involve rasterizing to image and running pytesseract.
        doc = fitz.open(stream=file_content, filetype="pdf")
        for page in doc:
            extracted_text += page.get_text() + "\n"
        return extracted_text
    except Exception as e:
        print(f"PyMuPDF failed: {e}")
        return ""
