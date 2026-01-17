import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';

const CACHE_KEYS = {
  RECIPES: 'cached_recipes',
  FAVORITES: 'cached_favorites',
  USER_RECIPES: 'cached_user_recipes',
  MEAL_PLANS: 'cached_meal_plans',
  LAST_SYNC: 'last_sync_time',
};

const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

export const CacheService = {
  // Check if device is online
  isOnline: async () => {
    const state = await NetInfo.fetch();
    return state.isConnected;
  },

  // Save data to cache
  saveToCache: async (key, data) => {
    try {
      const cacheData = {
        data,
        timestamp: Date.now(),
      };
      await AsyncStorage.setItem(key, JSON.stringify(cacheData));
    } catch (error) {
      console.error('Error saving to cache:', error);
    }
  },

  // Get data from cache
  getFromCache: async (key, maxAge = CACHE_DURATION) => {
    try {
      const cached = await AsyncStorage.getItem(key);
      if (!cached) return null;

      const { data, timestamp } = JSON.parse(cached);
      const age = Date.now() - timestamp;

      if (age > maxAge) {
        await AsyncStorage.removeItem(key);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error reading from cache:', error);
      return null;
    }
  },

  // Clear specific cache
  clearCache: async (key) => {
    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  },

  // Clear all caches
  clearAllCaches: async () => {
    try {
      const keys = Object.values(CACHE_KEYS);
      await AsyncStorage.multiRemove(keys);
    } catch (error) {
      console.error('Error clearing all caches:', error);
    }
  },

  // Fetch with cache fallback
  fetchWithCache: async (cacheKey, fetchFunction, forceRefresh = false) => {
    const isOnline = await CacheService.isOnline();

    // If offline, return cached data
    if (!isOnline) {
      const cached = await CacheService.getFromCache(cacheKey);
      return { data: cached, fromCache: true, offline: true };
    }

    // If online and not forcing refresh, check cache first
    if (!forceRefresh) {
      const cached = await CacheService.getFromCache(cacheKey);
      if (cached) {
        // Return cached data but fetch fresh data in background
        fetchFunction().then(freshData => {
          CacheService.saveToCache(cacheKey, freshData);
        }).catch(() => {});
        return { data: cached, fromCache: true, offline: false };
      }
    }

    // Fetch fresh data
    try {
      const freshData = await fetchFunction();
      await CacheService.saveToCache(cacheKey, freshData);
      return { data: freshData, fromCache: false, offline: false };
    } catch (error) {
      // If fetch fails, fallback to cache
      const cached = await CacheService.getFromCache(cacheKey, Infinity);
      return { data: cached, fromCache: true, offline: false, error };
    }
  },

  // Queue offline actions
  queueOfflineAction: async (action) => {
    try {
      const queue = await AsyncStorage.getItem('offline_queue');
      const actions = queue ? JSON.parse(queue) : [];
      actions.push({ ...action, timestamp: Date.now() });
      await AsyncStorage.setItem('offline_queue', JSON.stringify(actions));
    } catch (error) {
      console.error('Error queuing offline action:', error);
    }
  },

  // Process offline queue when back online
  processOfflineQueue: async () => {
    try {
      const queue = await AsyncStorage.getItem('offline_queue');
      if (!queue) return;

      const actions = JSON.parse(queue);
      const isOnline = await CacheService.isOnline();

      if (!isOnline) return;

      // Process each action
      for (const action of actions) {
        try {
          await fetch(action.url, {
            method: action.method,
            headers: action.headers,
            body: action.body,
          });
        } catch (error) {
          console.error('Error processing offline action:', error);
        }
      }

      // Clear queue after processing
      await AsyncStorage.removeItem('offline_queue');
    } catch (error) {
      console.error('Error processing offline queue:', error);
    }
  },
};

export { CACHE_KEYS };
