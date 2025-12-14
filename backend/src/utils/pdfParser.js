const pdfParse = require('pdf-parse');

class PDFParser {
  async extractTextFromPDF(buffer) {
    try {
      const data = await pdfParse(buffer);
      return data.text;
    } catch (error) {
      throw new Error(`Failed to parse PDF: ${error.message}`);
    }
  }

  cleanText(text) {
    // Remove excessive whitespace and normalize line breaks
    return text
      .replace(/\s+/g, ' ')
      .replace(/\n+/g, '\n')
      .trim();
  }

  async analyzePDF(buffer) {
    const text = await this.extractTextFromPDF(buffer);
    const cleanedText = this.cleanText(text);
    
    return {
      text: cleanedText,
      characterCount: cleanedText.length,
      wordCount: cleanedText.split(/\s+/).length,
      hasText: cleanedText.length > 0
    };
  }
}

module.exports = new PDFParser();