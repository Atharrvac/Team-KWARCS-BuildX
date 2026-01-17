import AsyncStorage from '@react-native-async-storage/async-storage';
import weatherService from './weatherService';

// HOLX™ Score Calculation Engine
// Hedging Opportunity Level Index - combines multiple factors

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes for fresher data

// Crop base prices and volatility factors
const CROP_DATA = {
  soybean: { basePrice: 4250, volatilityFactor: 1.2, season: 'kharif' },
  mustard: { basePrice: 5700, volatilityFactor: 1.0, season: 'rabi' },
  groundnut: { basePrice: 6500, volatilityFactor: 0.9, season: 'kharif' },
  sunflower: { basePrice: 5200, volatilityFactor: 1.1, season: 'rabi' },
  castor: { basePrice: 5800, volatilityFactor: 1.3, season: 'kharif' },
  rapeseed: { basePrice: 5400, volatilityFactor: 1.0, season: 'rabi' },
};

// District risk profiles based on historical data
const DISTRICT_PROFILES = {
  'Indore': { riskFactor: 1.2, majorCrop: 'soybean', marketAccess: 'high' },
  'Jaipur': { riskFactor: 1.0, majorCrop: 'mustard', marketAccess: 'high' },
  'Latur': { riskFactor: 0.9, majorCrop: 'soybean', marketAccess: 'medium' },
  'Nagpur': { riskFactor: 1.1, majorCrop: 'soybean', marketAccess: 'high' },
  'Akola': { riskFactor: 1.0, majorCrop: 'soybean', marketAccess: 'medium' },
  'Kota': { riskFactor: 0.95, majorCrop: 'mustard', marketAccess: 'high' },
  'Ujjain': { riskFactor: 1.15, majorCrop: 'soybean', marketAccess: 'medium' },
  'Dewas': { riskFactor: 1.1, majorCrop: 'soybean', marketAccess: 'medium' },
  'Rajkot': { riskFactor: 0.85, majorCrop: 'groundnut', marketAccess: 'high' },
  'Junagadh': { riskFactor: 0.9, majorCrop: 'groundnut', marketAccess: 'medium' },
};

class DSSService {
  constructor() {
    this.cache = {};
  }

  // Main function: Get complete DSS analysis
  async getFullAnalysis(district = 'Indore', crop = 'soybean') {
    const cacheKey = `dss_v3_${district}_${crop}`; // v3 for new AgriVol calculation
    
    const cached = await this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      // Fetch all required data in parallel
      const [weather, forecast, marketData] = await Promise.all([
        weatherService.getCurrentWeather(district),
        weatherService.getForecast(district),
        this.getMarketData(crop),
      ]);

      // Calculate all scores
      const weatherScore = this.calculateWeatherScore(weather, forecast);
      const marketScore = this.calculateMarketScore(marketData, crop);
      const sentimentScore = this.calculateSentimentScore(marketData, weather);
      const policyScore = this.calculatePolicyScore();
      
      // Calculate final HOLX score (weighted average)
      const holxScore = this.calculateHOLXScore({
        weatherScore,
        marketScore,
        sentimentScore,
        policyScore,
        district,
        crop,
      });

      // Generate recommendations
      const recommendation = this.generateRecommendation(holxScore, weather, forecast, marketData);
      
      // Calculate district-wise AgriVol scores
      const districtScores = await this.calculateDistrictScores(crop);

      const analysis = {
        holxScore: holxScore.score,
        holxBreakdown: holxScore.breakdown,
        holxTrend: holxScore.trend,
        
        weather: {
          current: weather,
          forecast: forecast,
          score: weatherScore,
          impact: this.getWeatherImpact(weatherScore),
        },
        
        market: {
          ...marketData,
          score: marketScore,
          trend: marketData.trend,
          volatility: marketData.volatility,
        },
        
        sentiment: {
          score: sentimentScore.score,
          label: sentimentScore.label,
          factors: sentimentScore.factors,
        },
        
        policy: {
          score: policyScore.score,
          label: policyScore.label,
          updates: policyScore.updates,
        },
        
        recommendation,
        districts: districtScores,
        
        metadata: {
          district,
          crop,
          updatedAt: new Date().toISOString(),
          isLive: weather.isLive && !weather.isDemo,
        },
      };

      await this.saveToCache(cacheKey, analysis);
      return analysis;

    } catch (error) {
      console.error('DSS Analysis error:', error);
      return this.getFallbackAnalysis(district, crop);
    }
  }

  // Calculate Weather Score (0-100)
  calculateWeatherScore(weather, forecast) {
    let score = 70; // Base score
    
    // Temperature impact (-20 to +10)
    const temp = weather.temperature;
    if (temp >= 25 && temp <= 32) {
      score += 10; // Optimal
    } else if (temp > 38 || temp < 15) {
      score -= 20; // Extreme
    } else if (temp > 35 || temp < 20) {
      score -= 10; // Suboptimal
    }
    
    // Humidity impact (-15 to +5)
    const humidity = weather.humidity;
    if (humidity >= 40 && humidity <= 70) {
      score += 5; // Optimal
    } else if (humidity > 85 || humidity < 25) {
      score -= 15; // Extreme
    } else {
      score -= 5;
    }
    
    // Rain forecast impact (-25 to +5)
    if (forecast && forecast.rainAlert) {
      const rainDays = forecast.forecast.filter(d => d.rainChance > 50).length;
      if (rainDays >= 3) {
        score -= 25; // Heavy rain expected
      } else if (rainDays >= 1) {
        score -= 10; // Some rain expected
      }
    } else {
      score += 5; // Clear weather
    }
    
    // Wind impact (-10 to 0)
    if (weather.windSpeed > 30) {
      score -= 10;
    } else if (weather.windSpeed > 20) {
      score -= 5;
    }
    
    return Math.max(0, Math.min(100, Math.round(score)));
  }

  // Calculate Market Score (0-100)
  calculateMarketScore(marketData, crop) {
    let score = 50; // Base score
    
    // Price trend impact (-20 to +30)
    const priceChange = marketData.priceChange7d;
    if (priceChange > 5) {
      score += 30; // Strong uptrend - hedge opportunity
    } else if (priceChange > 2) {
      score += 20;
    } else if (priceChange > 0) {
      score += 10;
    } else if (priceChange < -5) {
      score -= 20; // Strong downtrend
    } else if (priceChange < -2) {
      score -= 10;
    }
    
    // Volatility impact (+10 to +25)
    if (marketData.volatility === 'High') {
      score += 25; // High volatility = more hedging opportunity
    } else if (marketData.volatility === 'Moderate') {
      score += 15;
    } else {
      score += 10;
    }
    
    // Volume impact (-5 to +10)
    if (marketData.volumeTrend === 'increasing') {
      score += 10;
    } else if (marketData.volumeTrend === 'decreasing') {
      score -= 5;
    }
    
    return Math.max(0, Math.min(100, Math.round(score)));
  }

  // Calculate Sentiment Score
  calculateSentimentScore(marketData, weather) {
    let score = 50;
    const factors = [];
    
    // Market sentiment
    if (marketData.priceChange7d > 3) {
      score += 20;
      factors.push({ factor: 'Price Rising', impact: '+20', positive: true });
    } else if (marketData.priceChange7d < -3) {
      score -= 15;
      factors.push({ factor: 'Price Falling', impact: '-15', positive: false });
    }
    
    // Weather sentiment
    if (weather.condition === 'Clear' || weather.condition === 'Clouds') {
      score += 10;
      factors.push({ factor: 'Good Weather', impact: '+10', positive: true });
    } else if (weather.condition === 'Rain' || weather.condition === 'Thunderstorm') {
      score -= 10;
      factors.push({ factor: 'Rain Expected', impact: '-10', positive: false });
    }
    
    // Seasonal factor
    const month = new Date().getMonth();
    if (month >= 9 && month <= 11) { // Oct-Dec harvest season
      score += 15;
      factors.push({ factor: 'Harvest Season', impact: '+15', positive: true });
    } else if (month >= 6 && month <= 8) { // Jul-Sep monsoon
      score -= 5;
      factors.push({ factor: 'Monsoon Season', impact: '-5', positive: false });
    }
    
    // Global factors (simulated based on date)
    const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0)) / 86400000);
    if (dayOfYear % 7 < 4) {
      score += 5;
      factors.push({ factor: 'Global Demand Up', impact: '+5', positive: true });
    }
    
    score = Math.max(0, Math.min(100, Math.round(score)));
    
    let label = 'Neutral';
    if (score >= 70) label = 'Bullish';
    else if (score >= 55) label = 'Slightly Bullish';
    else if (score <= 30) label = 'Bearish';
    else if (score <= 45) label = 'Slightly Bearish';
    
    return { score, label, factors };
  }

  // Calculate Policy Score
  calculatePolicyScore() {
    // Simulated policy factors - in production, this would fetch from govt APIs
    const updates = [
      { title: 'MSP Announcement', impact: 'Positive', date: '2025-12-15' },
      { title: 'Export Policy', impact: 'Neutral', date: '2025-12-01' },
      { title: 'Subsidy Scheme', impact: 'Positive', date: '2025-11-20' },
    ];
    
    let score = 60; // Base neutral score
    
    updates.forEach(update => {
      if (update.impact === 'Positive') score += 10;
      else if (update.impact === 'Negative') score -= 10;
    });
    
    score = Math.max(0, Math.min(100, score));
    
    let label = 'Neutral';
    if (score >= 70) label = 'Supportive';
    else if (score <= 40) label = 'Restrictive';
    
    return { score, label, updates };
  }

  // Calculate final HOLX Score
  calculateHOLXScore({ weatherScore, marketScore, sentimentScore, policyScore, district, crop }) {
    // Weights for different factors
    const weights = {
      weather: 0.25,
      market: 0.35,
      sentiment: 0.25,
      policy: 0.15,
    };
    
    // District risk adjustment
    const districtProfile = DISTRICT_PROFILES[district] || { riskFactor: 1.0 };
    const riskMultiplier = districtProfile.riskFactor;
    
    // Calculate weighted score
    let baseScore = (
      weatherScore * weights.weather +
      marketScore * weights.market +
      sentimentScore.score * weights.sentiment +
      policyScore.score * weights.policy
    );
    
    // Apply district risk factor
    let finalScore = Math.round(baseScore * riskMultiplier);
    finalScore = Math.max(0, Math.min(100, finalScore));
    
    // Determine trend based on components
    let trend = 'stable';
    if (marketScore > 70 && sentimentScore.score > 60) {
      trend = 'rising';
    } else if (marketScore < 40 && sentimentScore.score < 40) {
      trend = 'falling';
    }
    
    return {
      score: finalScore,
      trend,
      breakdown: {
        weather: { score: weatherScore, weight: weights.weather * 100, contribution: Math.round(weatherScore * weights.weather) },
        market: { score: marketScore, weight: weights.market * 100, contribution: Math.round(marketScore * weights.market) },
        sentiment: { score: sentimentScore.score, weight: weights.sentiment * 100, contribution: Math.round(sentimentScore.score * weights.sentiment) },
        policy: { score: policyScore.score, weight: weights.policy * 100, contribution: Math.round(policyScore.score * weights.policy) },
      },
    };
  }

  // Generate recommendation based on HOLX score
  generateRecommendation(holxScore, weather, forecast, marketData) {
    const score = holxScore.score;
    let action, percentage, timeframe, confidence, reason;
    
    if (score >= 75) {
      action = 'Hedge Now';
      percentage = 70;
      timeframe = '3-5 days';
      confidence = Math.min(95, 75 + Math.round((score - 75) * 0.8));
      reason = 'High price volatility and favorable conditions indicate strong hedging opportunity.';
    } else if (score >= 60) {
      action = 'Hedge Partially';
      percentage = 50;
      timeframe = '7 days';
      confidence = Math.min(90, 65 + Math.round((score - 60) * 0.5));
      reason = 'Moderate opportunity - consider hedging a portion of your stock.';
    } else if (score >= 45) {
      action = 'Watch & Wait';
      percentage = 30;
      timeframe = '10-14 days';
      confidence = 60;
      reason = 'Market conditions are neutral. Monitor for better entry points.';
    } else {
      action = 'Hold';
      percentage = 0;
      timeframe = 'Wait for signal';
      confidence = 70;
      reason = 'Current conditions do not favor hedging. Wait for market improvement.';
    }
    
    // Adjust based on weather
    if (forecast && forecast.rainAlert && forecast.forecast.filter(d => d.rainChance > 60).length >= 2) {
      reason += ' Heavy rain expected - consider early harvest and hedging.';
      percentage = Math.min(80, percentage + 10);
    }
    
    // Generate AI-style recommendation text
    const cropName = marketData.crop || 'oilseed';
    const priceDirection = marketData.priceChange7d > 0 ? 'rise' : 'fall';
    const pricePercent = Math.abs(marketData.priceChange7d).toFixed(1);
    
    const aiText = `"${cropName.charAt(0).toUpperCase() + cropName.slice(1)} prices expected to ${priceDirection} by ${pricePercent}% based on ${holxScore.trend === 'rising' ? 'bullish' : holxScore.trend === 'falling' ? 'bearish' : 'neutral'} sentiment. ${action === 'Hedge Now' || action === 'Hedge Partially' ? `Hedge ${percentage}% of your stock within ${timeframe}.` : 'Monitor market conditions closely.'}"`;
    
    return {
      action,
      percentage,
      timeframe,
      confidence,
      reason,
      aiText,
      riskLevel: score >= 70 ? 'High Opportunity' : score >= 50 ? 'Moderate' : 'Low',
    };
  }

  // Get weather impact description
  getWeatherImpact(score) {
    if (score >= 80) return { level: 'Favorable', description: 'Excellent conditions for crop operations' };
    if (score >= 60) return { level: 'Good', description: 'Generally favorable with minor concerns' };
    if (score >= 40) return { level: 'Moderate', description: 'Some weather risks to monitor' };
    return { level: 'Challenging', description: 'Weather conditions may impact crop quality' };
  }

  // Get market data (simulated with realistic patterns)
  async getMarketData(crop) {
    const cropInfo = CROP_DATA[crop] || CROP_DATA.soybean;
    
    // Generate realistic price based on date and volatility
    const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0)) / 86400000);
    const seasonalFactor = Math.sin((dayOfYear / 365) * Math.PI * 2) * 0.1;
    const randomFactor = (Math.sin(dayOfYear * 0.5) * 0.05);
    
    const currentPrice = Math.round(cropInfo.basePrice * (1 + seasonalFactor + randomFactor));
    const priceChange7d = parseFloat(((Math.sin(dayOfYear * 0.3) * 5) + (Math.random() * 2 - 1)).toFixed(1));
    const priceChange30d = parseFloat((priceChange7d * 2.5 + (Math.random() * 3 - 1.5)).toFixed(1));
    
    // Determine volatility
    let volatility = 'Low';
    if (Math.abs(priceChange7d) > 4 || cropInfo.volatilityFactor > 1.1) {
      volatility = 'High';
    } else if (Math.abs(priceChange7d) > 2 || cropInfo.volatilityFactor > 1.0) {
      volatility = 'Moderate';
    }
    
    return {
      crop,
      currentPrice,
      priceChange7d,
      priceChange30d,
      volatility,
      trend: priceChange7d > 1 ? 'Bullish' : priceChange7d < -1 ? 'Bearish' : 'Neutral',
      volumeTrend: Math.random() > 0.4 ? 'increasing' : 'stable',
      mspPrice: Math.round(cropInfo.basePrice * 0.95),
      futuresPrice: Math.round(currentPrice * (1 + priceChange7d / 200)),
    };
  }

  // Calculate scores for all districts - REAL DATA from Open-Meteo API
  async calculateDistrictScores(crop) {
    const districts = Object.keys(DISTRICT_PROFILES);
    const scores = [];
    
    console.log('📊 Calculating real AgriVol scores for all districts...');
    
    // Fetch weather for all districts in parallel for speed
    const weatherPromises = districts.map(district => 
      weatherService.getCurrentWeather(district).catch(e => null)
    );
    const forecastPromises = districts.map(district => 
      weatherService.getForecast(district).catch(e => null)
    );
    
    const [weatherResults, forecastResults] = await Promise.all([
      Promise.all(weatherPromises),
      Promise.all(forecastPromises),
    ]);
    
    for (let i = 0; i < districts.length; i++) {
      const district = districts[i];
      const weather = weatherResults[i];
      const forecast = forecastResults[i];
      const profile = DISTRICT_PROFILES[district];
      
      if (!weather) {
        scores.push({
          name: district,
          score: 50,
          volatility: 'Moderate',
          recommendation: 'Watch',
          isLive: false,
        });
        continue;
      }
      
      // Calculate comprehensive AgriVol score based on REAL weather data
      let agriVolScore = 40; // Base score
      
      // === TEMPERATURE RISK (0-25 points) ===
      const temp = weather.temperature;
      if (temp > 42) {
        agriVolScore += 25; // Extreme heat - very high risk
      } else if (temp > 38) {
        agriVolScore += 20; // High heat stress
      } else if (temp > 35) {
        agriVolScore += 12; // Moderate heat
      } else if (temp < 10) {
        agriVolScore += 18; // Cold stress
      } else if (temp < 15) {
        agriVolScore += 8; // Cool
      } else if (temp >= 25 && temp <= 32) {
        agriVolScore -= 5; // Optimal - reduce risk
      }
      
      // === HUMIDITY RISK (0-15 points) ===
      const humidity = weather.humidity;
      if (humidity > 90) {
        agriVolScore += 15; // Very high - disease risk
      } else if (humidity > 80) {
        agriVolScore += 10; // High humidity
      } else if (humidity < 20) {
        agriVolScore += 12; // Very dry - drought stress
      } else if (humidity < 30) {
        agriVolScore += 6; // Dry conditions
      } else if (humidity >= 45 && humidity <= 65) {
        agriVolScore -= 3; // Optimal
      }
      
      // === WEATHER CONDITION RISK (0-20 points) ===
      const condition = weather.condition;
      if (condition === 'Thunderstorm') {
        agriVolScore += 20; // Severe weather
      } else if (condition === 'Rain') {
        agriVolScore += 12; // Rain impact
      } else if (condition === 'Drizzle') {
        agriVolScore += 5; // Light rain
      } else if (condition === 'Fog') {
        agriVolScore += 8; // Visibility/disease risk
      } else if (condition === 'Clear') {
        agriVolScore -= 2; // Good conditions
      }
      
      // === WIND RISK (0-10 points) ===
      const windSpeed = weather.windSpeed || 0;
      if (windSpeed > 40) {
        agriVolScore += 10; // Storm winds
      } else if (windSpeed > 25) {
        agriVolScore += 6; // High wind
      } else if (windSpeed > 15) {
        agriVolScore += 2; // Moderate wind
      }
      
      // === FORECAST RISK (0-15 points) ===
      if (forecast && forecast.forecast) {
        const rainDays = forecast.forecast.filter(d => d.rainChance > 60).length;
        const heavyRainDays = forecast.forecast.filter(d => d.rainfall > 20).length;
        const extremeTempDays = forecast.forecast.filter(d => d.tempMax > 40 || d.tempMin < 10).length;
        
        if (heavyRainDays >= 2) {
          agriVolScore += 15; // Heavy rain forecast
        } else if (rainDays >= 3) {
          agriVolScore += 10; // Multiple rain days
        } else if (rainDays >= 1) {
          agriVolScore += 4; // Some rain expected
        }
        
        if (extremeTempDays >= 2) {
          agriVolScore += 8; // Extreme temps coming
        }
      }
      
      // === DISTRICT RISK PROFILE ===
      agriVolScore = Math.round(agriVolScore * profile.riskFactor);
      
      // === CROP-SPECIFIC ADJUSTMENT ===
      const cropInfo = CROP_DATA[crop] || CROP_DATA.soybean;
      agriVolScore = Math.round(agriVolScore * cropInfo.volatilityFactor);
      
      // === SEASONAL ADJUSTMENT ===
      const month = new Date().getMonth();
      const isKharifSeason = month >= 5 && month <= 10; // Jun-Nov
      const isRabiSeason = month >= 10 || month <= 2; // Nov-Mar
      
      if (cropInfo.season === 'kharif' && isKharifSeason) {
        agriVolScore += 5; // Active season - more volatility
      } else if (cropInfo.season === 'rabi' && isRabiSeason) {
        agriVolScore += 5;
      }
      
      // Clamp score
      agriVolScore = Math.max(15, Math.min(98, agriVolScore));
      
      // Determine volatility level
      let volatility = 'Low';
      if (agriVolScore >= 70) {
        volatility = 'High';
      } else if (agriVolScore >= 50) {
        volatility = 'Moderate';
      }
      
      // Generate recommendation based on score
      let recommendation = 'Hold';
      if (agriVolScore >= 75) {
        recommendation = 'Hedge Now';
      } else if (agriVolScore >= 55) {
        recommendation = 'Watch';
      }
      
      // Calculate risk factors for display
      const riskFactors = [];
      if (temp > 35) riskFactors.push('Heat');
      if (humidity > 80) riskFactors.push('Humidity');
      if (condition === 'Rain' || condition === 'Thunderstorm') riskFactors.push('Rain');
      if (windSpeed > 20) riskFactors.push('Wind');
      
      scores.push({
        name: district,
        score: agriVolScore,
        volatility,
        recommendation,
        weather: condition,
        temperature: Math.round(temp),
        humidity: Math.round(humidity),
        windSpeed: Math.round(windSpeed),
        feelsLike: weather.feelsLike,
        riskFactors,
        forecast: forecast ? {
          rainAlert: forecast.rainAlert,
          totalRainfall: forecast.totalRainfall,
        } : null,
        isLive: weather.isLive && !weather.isDemo,
        state: weather.state,
      });
      
      console.log(`📍 ${district}: Score=${agriVolScore}, Temp=${temp}°C, ${condition}, Volatility=${volatility}`);
    }
    
    // Sort by score descending (highest risk first)
    return scores.sort((a, b) => b.score - a.score);
  }

  // Fallback analysis when API fails
  getFallbackAnalysis(district, crop) {
    return {
      holxScore: 65,
      holxBreakdown: {
        weather: { score: 70, weight: 25, contribution: 18 },
        market: { score: 65, weight: 35, contribution: 23 },
        sentiment: { score: 60, weight: 25, contribution: 15 },
        policy: { score: 60, weight: 15, contribution: 9 },
      },
      holxTrend: 'stable',
      weather: { score: 70, impact: { level: 'Good', description: 'Generally favorable' } },
      market: { currentPrice: 4500, priceChange7d: 2.5, volatility: 'Moderate', trend: 'Bullish' },
      sentiment: { score: 60, label: 'Slightly Bullish', factors: [] },
      policy: { score: 60, label: 'Neutral', updates: [] },
      recommendation: {
        action: 'Watch & Wait',
        percentage: 40,
        timeframe: '7 days',
        confidence: 65,
        reason: 'Market conditions are moderately favorable.',
        aiText: '"Monitor market conditions and consider partial hedging."',
        riskLevel: 'Moderate',
      },
      districts: [],
      metadata: { district, crop, updatedAt: new Date().toISOString(), isLive: false },
    };
  }

  // Cache helpers
  async getFromCache(key) {
    try {
      const cached = await AsyncStorage.getItem(key);
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < CACHE_DURATION) {
          return data;
        }
      }
    } catch (e) {}
    return null;
  }

  async saveToCache(key, data) {
    try {
      await AsyncStorage.setItem(key, JSON.stringify({ data, timestamp: Date.now() }));
    } catch (e) {}
  }
}

export const dssService = new DSSService();
export default dssService;
