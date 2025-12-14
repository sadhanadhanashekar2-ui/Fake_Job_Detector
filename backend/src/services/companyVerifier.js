/**
 * Company Verification Service
 * Analyzes job descriptions to extract and verify company information
 */

class CompanyVerifier {
  /**
   * Extract company name from job description
   */
  static extractCompanyName(jobText) {
    // Common patterns for company mentions
    const patterns = [
      /(?:company|employer|organization|firm|corporation)[\s:]*["']?([^"'\n,]+)["']?/gi,
      /(?:we are|we're|we are a|we're a)[\s:]*([^,\n]+)/gi,
      /(?:at|for|with)[\s]+([A-Z][A-Za-z0-9\s&.,'-]*?)[\s]+(is|are|looking|hiring|seeking)/gi,
      /^([A-Z][A-Za-z0-9\s&.,'-]+?)(?:\s+is hiring|\s+is looking|\s+seeks)/m
    ];

    for (const pattern of patterns) {
      const match = jobText.match(pattern);
      if (match) {
        const companyName = match[1]?.trim() || match[0]?.trim();
        if (companyName && companyName.length > 2 && companyName.length < 100) {
          return companyName;
        }
      }
    }
    return null;
  }

  /**
   * Analyze company information in job description
   * Returns score and indicators
   */
  static analyzeCompanyInfo(jobText) {
    const score = { points: 0, maxPoints: 0 };
    const indicators = {
      companyNamePresent: false,
      websitePresent: false,
      addressPresent: false,
      phonePresent: false,
      emailPresent: false,
      linkedinPresent: false,
      socialMediaPresent: false,
      yearFoundedPresent: false,
      employeeCountPresent: false
    };

    // Check for company name
    const companyName = this.extractCompanyName(jobText);
    if (companyName) {
      indicators.companyNamePresent = true;
      score.points += 2;
    }
    score.maxPoints += 2;

    // Check for website URL
    if (/(?:website|www|https?:\/\/|\.com|\.org|\.net|\.io)/i.test(jobText)) {
      indicators.websitePresent = true;
      score.points += 1.5;
    }
    score.maxPoints += 1.5;

    // Check for physical address
    if (/(?:address|located|office|headquarters|street|suite|floor)\s*[\w\s,.-]+(?:street|avenue|blvd|lane|road|st|ave|rd)/i.test(jobText)) {
      indicators.addressPresent = true;
      score.points += 1.5;
    }
    score.maxPoints += 1.5;

    // Check for phone number
    if (/(?:\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})|(?:\+\d{1,3}[-.\s]?\d{1,14})/g.test(jobText)) {
      indicators.phonePresent = true;
      score.points += 1;
    }
    score.maxPoints += 1;

    // Check for company email
    if (/@[\w.-]+\.\w+/.test(jobText)) {
      indicators.emailPresent = true;
      score.points += 1;
    }
    score.maxPoints += 1;

    // Check for LinkedIn
    if (/linkedin\.com|linkedin/i.test(jobText)) {
      indicators.linkedinPresent = true;
      score.points += 1;
    }
    score.maxPoints += 1;

    // Check for social media
    if (/(facebook|twitter|instagram|youtube|github)\.(com|io|org)|@[\w_]+/i.test(jobText)) {
      indicators.socialMediaPresent = true;
      score.points += 0.5;
    }
    score.maxPoints += 0.5;

    // Check for founding year or company age
    if (/(?:founded|established|since)\s+(?:19|20)\d{2}|(?:\d+\s+year[s]?\s+old|in business)/i.test(jobText)) {
      indicators.yearFoundedPresent = true;
      score.points += 1;
    }
    score.maxPoints += 1;

    // Check for employee count or company size
    if (/(?:employee[s]?|team member[s]?|staff)\s+(?:of\s+)?(?:50|100|500|1000|1,000|10,000|\d+[+-]?)|(?:small|medium|large|enterprise)\s+(?:company|business|organization)/i.test(jobText)) {
      indicators.employeeCountPresent = true;
      score.points += 1;
    }
    score.maxPoints += 1;

    return {
      score: score.maxPoints > 0 ? (score.points / score.maxPoints) * 10 : 0,
      indicators,
      companyName
    };
  }

  /**
   * Red flags for potentially fake companies
   */
  static detectCompanyRedFlags(jobText) {
    const redFlags = [];

    // Generic company names
    if (/^(?:company|business|organization|firm|corporation)$/i.test(this.extractCompanyName(jobText) || '')) {
      redFlags.push('Company name is generic or missing');
    }

    // No verifiable company information
    if (!this.extractCompanyName(jobText)) {
      redFlags.push('No company name provided in job description');
    }

    // Suspicious patterns
    if (/(?:startup|newly formed|just started|brand new)\s+company/i.test(jobText) && 
        !/(?:founded|established)\s+(?:20(?:2[0-9]|19))/i.test(jobText)) {
      redFlags.push('Claims to be startup but no founding information');
    }

    return redFlags;
  }
}

module.exports = CompanyVerifier;
