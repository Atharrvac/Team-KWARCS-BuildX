import express from 'express';
import supabase, { isSupabaseConfigured } from '../db/supabase.js';
import notificationService from '../services/notificationService.js';

const router = express.Router();

if (!global.mockContracts) global.mockContracts = [];

const useSupabase = () => isSupabaseConfigured() && supabase;

// Get all contracts for a user
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { status } = req.query;

    if (useSupabase()) {
      let query = supabase
        .from('contracts')
        .select('*')
        .order('created_at', { ascending: false });

      if (status && status !== 'all') {
        query = query.eq('status', status);
      }

      const { data, error } = await query;

      if (error) throw error;

      const contracts = (data || []).map(c => ({
        id: c.id,
        userId: c.user_id,
        crop: c.crop,
        quantity: parseFloat(c.quantity),
        lockedPrice: parseFloat(c.locked_price),
        currentPrice: parseFloat(c.current_price || c.locked_price),
        status: c.status,
        type: c.type,
        entryDate: c.entry_date,
        expiryDate: c.expiry_date,
        pnl: parseFloat(c.pnl || 0)
      }));

      return res.json(contracts);
    }

    // Mock fallback
    let userContracts = global.mockContracts;
    if (status && status !== 'all') {
      userContracts = userContracts.filter(c => c.status === status);
    }
    res.json(userContracts);
  } catch (error) {
    console.error('Error fetching contracts:', error);
    res.status(500).json({ error: 'Failed to fetch contracts', details: error.message });
  }
});

// Get stats
router.get('/stats/:userId', async (req, res) => {
  try {
    if (useSupabase()) {
      const { data, error } = await supabase.from('contracts').select('*');
      if (error) throw error;

      const contracts = data || [];
      return res.json({
        total: contracts.length,
        active: contracts.filter(c => c.status === 'active').length,
        settled: contracts.filter(c => c.status === 'settled').length,
        expired: contracts.filter(c => c.status === 'expired').length,
        totalPnL: contracts.reduce((sum, c) => sum + parseFloat(c.pnl || 0), 0),
        totalValue: contracts.reduce((sum, c) => sum + (parseFloat(c.locked_price) * parseFloat(c.quantity)), 0)
      });
    }

    const contracts = global.mockContracts;
    res.json({
      total: contracts.length,
      active: contracts.filter(c => c.status === 'active').length,
      settled: contracts.filter(c => c.status === 'settled').length,
      expired: contracts.filter(c => c.status === 'expired').length,
      totalPnL: contracts.reduce((sum, c) => sum + (c.pnl || 0), 0),
      totalValue: contracts.reduce((sum, c) => sum + (c.lockedPrice * c.quantity), 0)
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// Create contract
router.post('/create', async (req, res) => {
  try {
    const { userId, crop, quantity, lockedPrice, expiryDate } = req.body;

    if (useSupabase()) {
      const { data, error } = await supabase
        .from('contracts')
        .insert([{
          crop,
          quantity: parseFloat(quantity),
          locked_price: parseFloat(lockedPrice),
          current_price: parseFloat(lockedPrice),
          status: 'active',
          type: 'futures',
          expiry_date: expiryDate || null,
          pnl: 0
        }])
        .select()
        .single();

      if (error) throw error;

      return res.status(201).json({
        id: data.id,
        crop: data.crop,
        quantity: parseFloat(data.quantity),
        lockedPrice: parseFloat(data.locked_price),
        currentPrice: parseFloat(data.current_price),
        status: data.status,
        type: data.type,
        expiryDate: data.expiry_date,
        pnl: 0
      });
    }

    // Mock fallback
    const newContract = {
      id: Date.now(),
      userId,
      crop,
      quantity,
      lockedPrice,
      currentPrice: lockedPrice,
      status: 'active',
      entryDate: new Date(),
      expiryDate: new Date(expiryDate),
      pnl: 0,
      type: 'futures'
    };
    global.mockContracts.push(newContract);
    res.status(201).json(newContract);
  } catch (error) {
    console.error('Error creating contract:', error);
    res.status(500).json({ error: 'Failed to create contract', details: error.message });
  }
});

// Get single contract
router.get('/:contractId', async (req, res) => {
  try {
    const { contractId } = req.params;

    if (useSupabase()) {
      const { data, error } = await supabase
        .from('contracts')
        .select('*')
        .eq('id', contractId)
        .single();

      if (error || !data) return res.status(404).json({ error: 'Contract not found' });

      return res.json({
        id: data.id,
        crop: data.crop,
        quantity: parseFloat(data.quantity),
        lockedPrice: parseFloat(data.locked_price),
        currentPrice: parseFloat(data.current_price),
        status: data.status,
        pnl: parseFloat(data.pnl || 0)
      });
    }

    const contract = global.mockContracts.find(c => c.id === parseInt(contractId));
    if (!contract) return res.status(404).json({ error: 'Contract not found' });
    res.json(contract);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch contract' });
  }
});

// Settle contract
router.post('/settle/:contractId', async (req, res) => {
  try {
    const { contractId } = req.params;
    const { finalPrice } = req.body;

    if (useSupabase()) {
      const { data: contract } = await supabase
        .from('contracts')
        .select('*')
        .eq('id', contractId)
        .single();

      if (!contract) return res.status(404).json({ error: 'Contract not found' });

      const pnl = (finalPrice - parseFloat(contract.locked_price)) * parseFloat(contract.quantity);

      const { data, error } = await supabase
        .from('contracts')
        .update({ status: 'settled', current_price: finalPrice, pnl: Math.round(pnl) })
        .eq('id', contractId)
        .select()
        .single();

      if (error) throw error;
      return res.json({ contract: data, message: 'Contract settled' });
    }

    const contract = global.mockContracts.find(c => c.id === parseInt(contractId));
    if (!contract) return res.status(404).json({ error: 'Contract not found' });
    
    contract.status = 'settled';
    contract.pnl = (finalPrice - contract.lockedPrice) * contract.quantity;
    res.json({ contract, message: 'Contract settled' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to settle contract' });
  }
});

// Request settlement (buyer -> farmer notification)
router.post('/request-settlement/:contractId', async (req, res) => {
  try {
    const { contractId } = req.params;
    const { buyerId, buyerName } = req.body;

    if (useSupabase()) {
      const { data: contract, error } = await supabase
        .from('contracts')
        .select('*')
        .eq('id', contractId)
        .single();

      if (error || !contract) {
        return res.status(404).json({ error: 'Contract not found' });
      }

      // Store settlement request in database
      const { error: insertError } = await supabase
        .from('settlement_requests')
        .upsert({
          contract_id: contractId,
          buyer_id: buyerId,
          buyer_name: buyerName,
          farmer_id: contract.user_id,
          status: 'pending',
          requested_at: new Date().toISOString()
        }, { onConflict: 'contract_id' });

      // Send real-time notification via WebSocket
      const websocketService = (await import('../services/websocketService.js')).default;
      websocketService.sendToUserById(contract.user_id, {
        type: 'SETTLEMENT_REQUEST_RECEIVED',
        data: {
          contractId,
          buyerId,
          buyerName,
          contractDetails: {
            crop: contract.crop,
            quantity: contract.quantity,
            lockedPrice: contract.locked_price
          },
          message: `${buyerName || 'A buyer'} wants to settle your contract for ${contract.crop}`,
          requestedAt: new Date().toISOString()
        }
      });

      return res.json({ 
        success: true, 
        message: 'Settlement request sent to farmer',
        farmerId: contract.user_id
      });
    }

    res.json({ success: true, message: 'Settlement request sent (mock)' });
  } catch (error) {
    console.error('Error requesting settlement:', error);
    res.status(500).json({ error: 'Failed to request settlement' });
  }
});

// Respond to settlement request (farmer approves/rejects)
router.post('/respond-settlement/:contractId', async (req, res) => {
  try {
    const { contractId } = req.params;
    const { approved, farmerId } = req.body;

    if (useSupabase()) {
      // Get the settlement request
      const { data: request } = await supabase
        .from('settlement_requests')
        .select('*')
        .eq('contract_id', contractId)
        .single();

      if (!request) {
        return res.status(404).json({ error: 'Settlement request not found' });
      }

      // Update settlement request status
      await supabase
        .from('settlement_requests')
        .update({ 
          status: approved ? 'approved' : 'rejected',
          responded_at: new Date().toISOString()
        })
        .eq('contract_id', contractId);

      // If approved, update contract status
      if (approved) {
        const { data: contract } = await supabase
          .from('contracts')
          .select('*')
          .eq('id', contractId)
          .single();

        if (contract) {
          const pnl = (contract.current_price - contract.locked_price) * contract.quantity;
          await supabase
            .from('contracts')
            .update({ status: 'settled', pnl: Math.round(pnl) })
            .eq('id', contractId);
        }
      }

      // Notify buyer via WebSocket
      const websocketService = (await import('../services/websocketService.js')).default;
      websocketService.sendToUserById(request.buyer_id, {
        type: 'SETTLEMENT_RESPONSE_RECEIVED',
        data: {
          contractId,
          approved,
          farmerId,
          message: approved 
            ? 'Farmer approved your settlement request!'
            : 'Farmer declined your settlement request.',
          respondedAt: new Date().toISOString()
        }
      });

      return res.json({ 
        success: true, 
        approved,
        message: approved ? 'Settlement approved' : 'Settlement declined'
      });
    }

    res.json({ success: true, approved, message: 'Response recorded (mock)' });
  } catch (error) {
    console.error('Error responding to settlement:', error);
    res.status(500).json({ error: 'Failed to respond to settlement' });
  }
});

export default router;
