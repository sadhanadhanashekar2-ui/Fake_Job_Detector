const CompanyVerifier = require('./companyVerifier');

class FakeJobDetector {
  constructor() {
    this.redFlagPatterns = [
      {
        pattern: /\b(\$?[0-9]{4,5}\s*(k|K)\s*\/?\s*(month|year|yr|annually|annual|hour))\b|\b(salary|pay).{0,50}\$?[0-9]{3,}\b/gi,
        flag: 'UNREALISTIC_SALARY',
        weight: 0.8,
        description: 'Unusually high salary for the position'
      },
      {
        pattern: /\b(immediate\s+hiring|urgently\s+needed|hiring\s+now|apply\s+now|quick\s+hiring)\b/gi,
        flag: 'URGENT_HIRING',
        weight: 0.6,
        description: 'Urgent hiring language often used in scams'
      },
      {
        pattern: /\b(work\s+from\s+home|remote\s+work|wfh).{0,30}\b(high\s+pay|earn\s+big|make\s+money)\b/gi,
        flag: 'WFH_HIGH_PAY_SCAM',
        weight: 0.9,
        description: 'Work from home with high pay is a common scam pattern'
      },
      {
        pattern: /\b(wire\s+money|send\s+money|advance\s+payment|registration\s+fee|processing\s+fee)\b/gi,
        flag: 'REQUEST_MONEY',
        weight: 1.0,
        description: 'Requests for money are strong indicators of fraud'
      },
      {
        pattern: /@(gmail|yahoo|hotmail|outlook)\.(com|net|org)/gi,
        flag: 'PERSONAL_EMAIL_DOMAIN',
        weight: 0.5,
        description: 'Personal email domains instead of company email'
      },
      {
        pattern: /\b([0-9]{3}[-\.\s]?[0-9]{3}[-\.\s]?[0-9]{4}|\(\d{3}\)\s*\d{3}[-\.\s]?\d{4})\b/gi,
        flag: 'CONTACT_INFO_PRESENT',
        weight: -0.2,
        description: 'Legitimate contact information'
      }
    ];

    this.positivePatterns = [
      {
        pattern: /\b(company|corporation|inc|llc|limited|gmbh)\b/gi,
        weight: -0.3,
        description: 'Formal company structure mentioned'
      },
      {
        pattern: /\b(hr@|careers@|jobs@|recruitment@)[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/gi,
        weight: -0.4,
        description: 'Professional email address'
      },
      {
        pattern: /\b(www\.|https?:\/\/)[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/gi,
        weight: -0.3,
        description: 'Company website provided'
      },
      {
        pattern: /\b(401k|health\s+insurance|dental|vision|pto|vacation|benefits)\b/gi,
        weight: -0.5,
        description: 'Legitimate benefits mentioned'
      }
    ];

    this.grammarIndicators = [
      {
        pattern: /\b(you will|you must|you need|you should)\b/gi,
        weight: 0.3,
        description: 'Poor grammar or command-like language'
      },
      {
        pattern: /[A-Z]{4,}/g,
        weight: 0.4,
        description: 'Excessive capitalization (common in scams)'
      },
      {
        pattern: /!!!|\?\?\?|\.{4,}/g,
        weight: 0.3,
        description: 'Excessive punctuation'
      }
    ];
  }

  analyzeText(text) {
    const analysis = {
      redFlags: [],
      positiveFlags: [],
      grammarIssues: [],
      score: 0,
      wordCount: text.split(/\s+/).length,
      salaryMentioned: false,
      companyInfoPresent: false,
      contactInfoPresent: false
    };

    // Check for red flags
    this.redFlagPatterns.forEach(pattern => {
      const matches = text.match(pattern.pattern);
      if (matches) {
        if (pattern.flag === 'UNREALISTIC_SALARY') analysis.salaryMentioned = true;
        if (pattern.flag === 'CONTACT_INFO_PRESENT') analysis.contactInfoPresent = true;
        
        analysis.redFlags.push({
          flag: pattern.flag,
          matches: matches.length,
          severity: this.getSeverity(pattern.weight),
          description: pattern.description
        });
        analysis.score += pattern.weight * matches.length;
      }
    });

    // Check for positive indicators
    this.positivePatterns.forEach(pattern => {
      const matches = text.match(pattern.pattern);
      if (matches) {
        if (pattern.description.includes('company')) analysis.companyInfoPresent = true;
        
        analysis.positiveFlags.push({
          flag: 'POSITIVE_INDICATOR',
          matches: matches.length,
          description: pattern.description
        });
        analysis.score += pattern.weight * matches.length;
      }
    });

    // Check grammar issues
    this.grammarIndicators.forEach(indicator => {
      const matches = text.match(indicator.pattern);
      if (matches) {
        analysis.grammarIssues.push({
          issue: indicator.description,
          matches: matches.length
        });
        analysis.score += indicator.weight * matches.length;
      }
    });

    // Calculate confidence score
    analysis.confidence = Math.min(100, Math.max(0, Math.abs(analysis.score) * 20));
    
    // Calculate grammar score (0-100)
    analysis.grammarScore = Math.max(0, 100 - (analysis.grammarIssues.length * 10));

    return analysis;
  }

  getSeverity(weight) {
    if (weight >= 0.8) return 'HIGH';
    if (weight >= 0.5) return 'MEDIUM';
    return 'LOW';
  }

  predict(text) {
    const analysis = this.analyzeText(text);
    
    // Add company verification analysis
    const companyAnalysis = CompanyVerifier.analyzeCompanyInfo(text);
    const companyRedFlags = CompanyVerifier.detectCompanyRedFlags(text);
    
    // Integrate company analysis into score
    const companyScore = companyAnalysis.score;
    analysis.companyScore = companyScore;
    analysis.companyName = companyAnalysis.companyName;
    analysis.companyIndicators = companyAnalysis.indicators;
    
    // Adjust prediction based on company analysis
    let prediction = 'REAL';
    let adjustedScore = analysis.score;
    
    // If company info is missing or poor, increase suspicious score
    if (companyScore < 3) {
      adjustedScore += 0.5;
    } else if (companyScore > 6) {
      adjustedScore -= 0.3; // Reduce score if company is well-documented
    }
    
    // Add company red flags to analysis
    companyRedFlags.forEach(flag => {
      analysis.redFlags.push({
        description: flag,
        severity: 'MEDIUM'
      });
    });
    
    if (adjustedScore > 1.5) {
      prediction = 'FAKE';
    } else if (adjustedScore > 0.5) {
      prediction = 'UNCERTAIN';
    }

    const explanation = this.generateExplanation(analysis, prediction);
    const recommendations = this.generateRecommendations(analysis);

    return {
      prediction,
      confidence: analysis.confidence,
      explanation,
      recommendations,
      redFlags: analysis.redFlags,
      metadata: {
        wordCount: analysis.wordCount,
        salaryMentioned: analysis.salaryMentioned,
        companyInfoPresent: analysis.companyInfoPresent,
        contactInfoPresent: analysis.contactInfoPresent,
        grammarScore: analysis.grammarScore,
        redFlagCount: analysis.redFlags.length,
        positiveFlagCount: analysis.positiveFlags.length,
        companyScore: companyScore,
        companyName: companyAnalysis.companyName,
        companyIndicators: companyAnalysis.indicators
      }
    };
  }

  generateExplanation(analysis, prediction) {
    const explanations = [];
    
    if (prediction === 'FAKE') {
      explanations.push('This job posting shows several characteristics commonly associated with fake job listings.');
      
      if (analysis.redFlags.some(f => f.severity === 'HIGH')) {
        explanations.push('High severity red flags were detected including potential scam indicators.');
      }
      
      if (analysis.grammarScore < 70) {
        explanations.push('The posting contains grammatical issues often found in fraudulent listings.');
      }
      
      if (analysis.companyScore < 3) {
        explanations.push('Company information is insufficient or missing. Legitimate companies provide verifiable information.');
      }
    } else if (prediction === 'UNCERTAIN') {
      explanations.push('This job posting has some concerning elements but may be legitimate.');
      explanations.push('Proceed with caution and verify through official channels.');
    } else {
      explanations.push('This job posting appears legitimate based on our analysis.');
      
      if (analysis.companyInfoPresent) {
        explanations.push('Company information is clearly provided, which is a good sign.');
      }
      
      if (analysis.companyScore > 6) {
        explanations.push(`Company "${analysis.companyName}" appears well-documented with proper contact and web presence.`);
      }
      
      if (analysis.contactInfoPresent) {
        explanations.push('Professional contact information is included.');
      }
    }

    if (analysis.redFlags.length > 0) {
      explanations.push(`Found ${analysis.redFlags.length} potential red flag(s).`);
    }

    return explanations.join(' ');
  }

  generateRecommendations(analysis) {
    const recommendations = [];
    
    if (!analysis.companyInfoPresent) {
      recommendations.push('Verify the company through official websites and business registries.');
    }
    
    if (analysis.salaryMentioned && analysis.redFlags.some(f => f.flag === 'UNREALISTIC_SALARY')) {
      recommendations.push('Research typical salary ranges for this position in your area.');
    }
    
    if (analysis.redFlags.some(f => f.flag === 'REQUEST_MONEY')) {
      recommendations.push('Never send money to potential employers. Legitimate companies do not ask for payments.');
    }
    
    if (!analysis.contactInfoPresent) {
      recommendations.push('Look for professional contact information (company email, phone, address).');
    }
    
    recommendations.push('Check the employer\'s online presence and reviews.');
    recommendations.push('Be cautious of job postings that seem too good to be true.');
    recommendations.push('Use video interviews when possible to verify the employer.');
    
    return recommendations;
  }
}

module.exports = new FakeJobDetector();