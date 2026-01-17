import { useEffect, useRef, useState, useCallback } from 'react';
import { API_URL } from '../constants/api';

// Convert HTTP API URL to WebSocket URL
const getWsUrl = () => {
  const baseUrl = API_URL || 'http://10.250.22.138:3000/api';
  return baseUrl.replace('http', 'ws').replace('/api', '');
};

const WS_URL = getWsUrl();

export function useContractWebSocket(userId) {
  const ws = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const [settlementRequest, setSettlementRequest] = useState(null);
  const [settlementResponse, setSettlementResponse] = useState(null);
  const reconnectTimeout = useRef(null);
  const messageHandlers = useRef(new Map());

  // Connect to WebSocket
  const connect = useCallback(() => {
    if (ws.current?.readyState === WebSocket.OPEN) return;

    try {
      ws.current = new WebSocket(WS_URL);

      ws.current.onopen = () => {
        console.log('🔌 Contract WebSocket connected');
        setIsConnected(true);
        
        // Register user for targeted notifications
        if (userId) {
          ws.current.send(JSON.stringify({
            type: 'REGISTER_USER',
            userId: userId
          }));
        }
      };

      ws.current.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          handleMessage(message);
        } catch (e) {
          console.error('Error parsing WS message:', e);
        }
      };

      ws.current.onclose = () => {
        console.log('🔌 Contract WebSocket disconnected');
        setIsConnected(false);
        // Reconnect after 5 seconds (silent retry)
        reconnectTimeout.current = setTimeout(connect, 5000);
      };

      ws.current.onerror = () => {
        // Silent error - connection issues are handled by onclose
        setIsConnected(false);
      };
    } catch (e) {
      console.error('Failed to connect WebSocket:', e);
    }
  }, [userId]);

  // Handle incoming messages
  const handleMessage = useCallback((message) => {
    console.log('📩 WS Message:', message.type);

    switch (message.type) {
      case 'USER_REGISTERED':
        console.log('✅ User registered for notifications');
        break;

      case 'SETTLEMENT_REQUEST_RECEIVED':
        // ALL users receive settlement request (broadcast)
        // The app will filter based on mode (seller mode shows alert)
        console.log('🔔 Settlement request broadcast received:', message.data);
        setSettlementRequest(message.data);
        break;

      case 'SETTLEMENT_REQUEST_SENT':
        // Buyer confirmation that request was sent
        console.log('✅ Settlement request sent to all farmers');
        break;

      case 'SETTLEMENT_RESPONSE_RECEIVED':
        // ALL users receive settlement response (broadcast)
        // Buyer who made request will see the result
        console.log('📝 Settlement response broadcast received:', message.data);
        setSettlementResponse(message.data);
        break;

      case 'SETTLEMENT_RESPONSE_SENT':
        // Farmer confirmation that response was sent
        console.log('✅ Settlement response sent');
        break;
      
      case 'SETTLEMENT_CLOSED':
        // Settlement was handled by another farmer - clear the request
        console.log('🔒 Settlement closed:', message.data);
        setSettlementRequest(null);
        // Call any registered handlers for this event
        const closedHandler = messageHandlers.current.get('SETTLEMENT_CLOSED');
        if (closedHandler) closedHandler(message);
        break;

      default:
        // Call any registered handlers
        const handler = messageHandlers.current.get(message.type);
        if (handler) handler(message);
    }
  }, []);

  // Send settlement request (buyer -> farmer)
  const sendSettlementRequest = useCallback((data) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({
        type: 'SETTLEMENT_REQUEST',
        data: {
          contractId: String(data.contractId), // Ensure string for UUID comparison
          farmerId: data.farmerId,
          buyerId: userId,
          buyerName: data.buyerName,
          contractDetails: data.contractDetails
        }
      }));
      console.log('📤 Sent settlement request:', { contractId: String(data.contractId) });
      return true;
    }
    console.log('⚠️ WebSocket not connected, cannot send request');
    return false;
  }, [userId]);

  // Send settlement response (farmer -> buyer)
  const sendSettlementResponse = useCallback((contractId, approved) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({
        type: 'SETTLEMENT_RESPONSE',
        data: {
          contractId: String(contractId), // Ensure string for UUID comparison
          approved,
          farmerId: userId
        }
      }));
      console.log('📤 Sent settlement response:', { contractId: String(contractId), approved });
      return true;
    }
    console.log('⚠️ WebSocket not connected, cannot send response');
    return false;
  }, [userId]);

  // Clear settlement request (after handling)
  const clearSettlementRequest = useCallback(() => {
    setSettlementRequest(null);
  }, []);

  // Clear settlement response (after handling)
  const clearSettlementResponse = useCallback(() => {
    setSettlementResponse(null);
  }, []);

  // Register custom message handler
  const onMessage = useCallback((type, handler) => {
    messageHandlers.current.set(type, handler);
    return () => messageHandlers.current.delete(type);
  }, []);

  // Connect on mount
  useEffect(() => {
    if (userId) {
      connect();
    }

    return () => {
      if (reconnectTimeout.current) {
        clearTimeout(reconnectTimeout.current);
      }
      if (ws.current) {
        ws.current.close();
      }
    };
  }, [userId, connect]);

  return {
    isConnected,
    settlementRequest,
    settlementResponse,
    sendSettlementRequest,
    sendSettlementResponse,
    clearSettlementRequest,
    clearSettlementResponse,
    onMessage
  };
}

export default useContractWebSocket;
