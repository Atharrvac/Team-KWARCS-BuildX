// Simple test script for trading service
import tradingService from './src/services/tradingService.js';

async function test() {
  console.log('Testing trading service...');
  
  try {
    // Test opening a position
    console.log('\n1. Opening position...');
    const position = await tradingService.openPosition(1, {
      crop: 'soybean',
      type: 'long',
      quantity: 10,
      entryPrice: 4820
    });
    console.log('Position opened:', position);
    
    // Test getting positions
    console.log('\n2. Getting positions...');
    const positions = await tradingService.getUserPositions(1);
    console.log('Positions:', positions);
    
    // Test P&L summary
    console.log('\n3. Getting P&L summary...');
    const pnl = await tradingService.getPnLSummary(1);
    console.log('P&L Summary:', pnl);
    
    console.log('\n✅ All tests passed!');
  } catch (error) {
    console.error('❌ Test failed:', error);
    console.error('Stack:', error.stack);
  }
}

test();
