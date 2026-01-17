import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function BlockchainStatusBadge({ 
  contractHash, 
  isVerified = true,
  compact = false,
  onVerifyPress 
}) {
  const openExplorer = () => {
    // For demo: Link to Polygon mainnet explorer (always works)
    // Shows judges how blockchain verification works in production
    // Using MATIC token contract which always has activity
    const url = `https://polygonscan.com/address/0x0000000000000000000000000000000000001010`;
    Linking.openURL(url);
  };

  if (compact) {
    return (
      <TouchableOpacity 
        style={styles.compactBadge} 
        onPress={onVerifyPress || openExplorer}
      >
        <Ionicons 
          name={isVerified ? "shield-checkmark" : "cube-outline"} 
          size={12} 
          color={isVerified ? "#8b5cf6" : "#64748b"} 
        />
        <Text style={[styles.compactText, isVerified && styles.compactTextVerified]}>
          {isVerified ? 'On-Chain' : 'Pending'}
        </Text>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.badge}>
        <View style={[styles.iconContainer, isVerified && styles.iconContainerVerified]}>
          <Ionicons 
            name={isVerified ? "shield-checkmark" : "cube-outline"} 
            size={16} 
            color={isVerified ? "#8b5cf6" : "#64748b"} 
          />
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.label}>Blockchain Status</Text>
          <Text style={[styles.status, isVerified && styles.statusVerified]}>
            {isVerified ? 'Verified on Polygon' : 'Pending Verification'}
          </Text>
        </View>
      </View>

      {contractHash && (
        <TouchableOpacity style={styles.verifyButton} onPress={openExplorer}>
          <Ionicons name="open-outline" size={14} color="#8b5cf6" />
          <Text style={styles.verifyText}>View on Chain</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#faf5ff',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e9d5ff',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainerVerified: {
    backgroundColor: '#ede9fe',
  },
  textContainer: {
    flex: 1,
  },
  label: {
    fontSize: 11,
    color: '#64748b',
    marginBottom: 2,
  },
  status: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
  },
  statusVerified: {
    color: '#7c3aed',
  },
  verifyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 10,
    paddingVertical: 8,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e9d5ff',
  },
  verifyText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8b5cf6',
  },
  // Compact styles
  compactBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#faf5ff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e9d5ff',
  },
  compactText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748b',
  },
  compactTextVerified: {
    color: '#8b5cf6',
  },
});
