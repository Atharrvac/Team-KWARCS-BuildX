import express from 'express';

const router = express.Router();

// In-memory marketplace (will sync with DB when connected)
let marketplaceListings = [
  { id: 101, sellerId: 1, sellerName: 'Ramesh Kumar', sellerPhone: '+91 98765 43210', crop: 'soybean', quantity: 100, askPrice: 4350, currentMarketPrice: 4320, expiryDate: '2025-01-15', location: 'Indore, MP', quality: 'Grade A', status: 'available', createdAt: new Date().toISOString() },
  { id: 102, sellerId: 2, sellerName: 'Suresh Patel', sellerPhone: '+91 87654 32109', crop: 'mustard', quantity: 75, askPrice: 5900, currentMarketPrice: 5870, expiryDate: '2025-01-20', location: 'Jaipur, RJ', quality: 'Premium', status: 'available', createdAt: new Date().toISOString() },
  { id: 103, sellerId: 3, sellerName: 'Mahesh Singh', sellerPhone: '+91 76543 21098', crop: 'groundnut', quantity: 50, askPrice: 6600, currentMarketPrice: 6550, expiryDate: '2025-02-01', location: 'Junagadh, GJ', quality: 'Grade A', status: 'available', createdAt: new Date().toISOString() },
  { id: 104, sellerId: 4, sellerName: 'Dinesh Yadav', sellerPhone: '+91 65432 10987', crop: 'castor', quantity: 60, askPrice: 6800, currentMarketPrice: 6750, expiryDate: '2025-01-25', location: 'Mehsana, GJ', quality: 'Standard', status: 'available', createdAt: new Date().toISOString() },
];

// Get all available marketplace listings
router.get('/contracts', (req, res) => {
  const { crop, status = 'available' } = req.query;
  let listings = marketplaceListings.filter(l => l.status === status);
  if (crop && crop !== 'all') {
    listings = listings.filter(l => l.crop === crop);
  }
  // Update market prices with slight variation
  listings = listings.map(l => ({
    ...l,
    currentMarketPrice: l.currentMarketPrice + (Math.random() - 0.5) * 20
  }));
  res.json(listings);
});

// Get single listing
router.get('/contracts/:id', (req, res) => {
  const listing = marketplaceListings.find(l => l.id === parseInt(req.params.id));
  if (!listing) return res.status(404).json({ error: 'Listing not found' });
  res.json(listing);
});

// Create new listing (Seller)
router.post('/contracts', (req, res) => {
  const { sellerId, sellerName, sellerPhone, crop, quantity, askPrice, location, quality, expiryDays } = req.body;
  
  if (!crop || !quantity || !askPrice || !location) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const newListing = {
    id: Date.now(),
    sellerId: sellerId || 999,
    sellerName: sellerName || 'Anonymous Seller',
    sellerPhone: sellerPhone || '',
    crop,
    quantity: parseInt(quantity),
    askPrice: parseInt(askPrice),
    currentMarketPrice: parseInt(askPrice) - Math.floor(Math.random() * 50),
    expiryDate: new Date(Date.now() + (parseInt(expiryDays) || 30) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    location,
    quality: quality || 'Standard',
    status: 'available',
    createdAt: new Date().toISOString(),
  };
  
  marketplaceListings.unshift(newListing);
  console.log(`📝 New listing created: ${crop} - ${quantity}qt @ ₹${askPrice}`);
  res.status(201).json(newListing);
});

// Buy a contract (Buyer)
router.post('/contracts/:id/buy', (req, res) => {
  const { buyerId, buyerName } = req.body;
  const listingIndex = marketplaceListings.findIndex(l => l.id === parseInt(req.params.id));
  
  if (listingIndex === -1) return res.status(404).json({ error: 'Listing not found' });
  
  const listing = marketplaceListings[listingIndex];
  if (listing.status !== 'available') {
    return res.status(400).json({ error: 'Contract already sold' });
  }
  
  // Mark as sold
  marketplaceListings[listingIndex] = {
    ...listing,
    status: 'sold',
    buyerId: buyerId || 999,
    buyerName: buyerName || 'Anonymous Buyer',
    soldAt: new Date().toISOString(),
  };
  
  console.log(`✅ Contract sold: ${listing.crop} - ${listing.quantity}qt to ${buyerName}`);
  
  res.json({
    success: true,
    message: 'Contract purchased successfully',
    contract: marketplaceListings[listingIndex],
  });
});

// Update listing (Seller)
router.put('/contracts/:id', (req, res) => {
  const listingIndex = marketplaceListings.findIndex(l => l.id === parseInt(req.params.id));
  if (listingIndex === -1) return res.status(404).json({ error: 'Listing not found' });
  
  const { askPrice, quantity, quality, expiryDays } = req.body;
  marketplaceListings[listingIndex] = {
    ...marketplaceListings[listingIndex],
    ...(askPrice && { askPrice: parseInt(askPrice) }),
    ...(quantity && { quantity: parseInt(quantity) }),
    ...(quality && { quality }),
    ...(expiryDays && { expiryDate: new Date(Date.now() + parseInt(expiryDays) * 24 * 60 * 60 * 1000).toISOString().split('T')[0] }),
    updatedAt: new Date().toISOString(),
  };
  
  res.json(marketplaceListings[listingIndex]);
});

// Delete listing (Seller)
router.delete('/contracts/:id', (req, res) => {
  const listingIndex = marketplaceListings.findIndex(l => l.id === parseInt(req.params.id));
  if (listingIndex === -1) return res.status(404).json({ error: 'Listing not found' });
  
  marketplaceListings.splice(listingIndex, 1);
  res.json({ success: true, message: 'Listing deleted' });
});

// Get marketplace stats
router.get('/stats', (req, res) => {
  const available = marketplaceListings.filter(l => l.status === 'available');
  const sold = marketplaceListings.filter(l => l.status === 'sold');
  
  const cropStats = {};
  available.forEach(l => {
    if (!cropStats[l.crop]) cropStats[l.crop] = { count: 0, totalQuantity: 0, avgPrice: 0 };
    cropStats[l.crop].count++;
    cropStats[l.crop].totalQuantity += l.quantity;
    cropStats[l.crop].avgPrice = (cropStats[l.crop].avgPrice * (cropStats[l.crop].count - 1) + l.askPrice) / cropStats[l.crop].count;
  });
  
  res.json({
    totalListings: marketplaceListings.length,
    available: available.length,
    sold: sold.length,
    totalVolume: available.reduce((sum, l) => sum + l.quantity, 0),
    cropStats,
  });
});

export default router;
