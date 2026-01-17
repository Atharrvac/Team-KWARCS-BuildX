import { createClient } from '@supabase/supabase-js';

// IoT Sensor Database - Separate Supabase instance
const IOT_SUPABASE_URL = 'https://uljffdttlqjjrvyibozo.supabase.co';
const IOT_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVsamZmZHR0bHFqanJ2eWlib3pvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk0NzU2MjYsImV4cCI6MjA3NTA1MTYyNn0.-muGTNTxGdkGe_OXVngpBYlXCceUhfuwptANJ8V2wYE';

export const iotSupabase = createClient(IOT_SUPABASE_URL, IOT_SUPABASE_ANON_KEY);

/**
 * Fetch latest IoT sensor data (moisture & temperature)
 * Table: test
 * Columns: id, created_at, temperature, humidity
 * @returns {Promise<Object>} Sensor data
 */
export const fetchIoTSensorData = async () => {
  try {
    console.log('Fetching IoT sensor data from Supabase...');
    
    const { data, error } = await iotSupabase
      .from('test')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1);
    
    if (error) {
      // Silently handle IoT errors - not critical for app functionality
      console.log('IoT data unavailable:', error.message);
      return {
        success: false,
        error: error.message,
        data: null
      };
    }
    
    if (data && data.length > 0) {
      const record = data[0];
      console.log('IoT data received:', record);
      return {
        success: true,
        data: {
          deviceId: `IOT-SENSOR-${record.id}`,
          moisture: record.humidity, // humidity column = moisture
          temperature: record.temperature,
          timestamp: record.created_at,
          raw: record
        }
      };
    }
    
    return {
      success: false,
      error: 'No sensor data found',
      data: null
    };
  } catch (error) {
    console.error('IoT fetch error:', error);
    return {
      success: false,
      error: error.message,
      data: null
    };
  }
};

/**
 * Fetch all recent sensor readings
 * @param {number} limit - Number of records to fetch
 * @returns {Promise<Object>} Sensor readings
 */
export const fetchRecentReadings = async (limit = 10) => {
  try {
    const { data, error } = await iotSupabase
      .from('test')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (error) {
      return { success: false, error: error.message, data: [] };
    }
    
    return { success: true, data: data || [] };
  } catch (error) {
    return { success: false, error: error.message, data: [] };
  }
};

/**
 * Subscribe to real-time sensor updates
 * @param {Function} callback - Function to call when new data arrives
 * @returns {Object} Subscription object
 */
export const subscribeToSensorData = (callback) => {
  const subscription = iotSupabase
    .channel('iot-sensor-changes')
    .on('postgres_changes', 
      { event: 'INSERT', schema: 'public', table: 'test' },
      (payload) => {
        console.log('Real-time IoT update:', payload.new);
        callback({
          deviceId: `IOT-SENSOR-${payload.new.id}`,
          moisture: payload.new.humidity,
          temperature: payload.new.temperature,
          timestamp: payload.new.created_at,
          raw: payload.new
        });
      }
    )
    .subscribe();
  
  return subscription;
};

export default iotSupabase;
