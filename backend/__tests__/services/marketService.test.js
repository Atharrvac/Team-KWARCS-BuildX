import { getMarketData } from '../../src/services/marketService.js';

describe('Market Service', () => {
  it('should fetch market data', async () => {
    const marketData = await getMarketData();
    expect(marketData).toBeDefined();
    expect(Array.isArray(marketData)).toBe(true);
  });
});
