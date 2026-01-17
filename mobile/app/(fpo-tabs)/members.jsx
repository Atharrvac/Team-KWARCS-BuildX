import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AppHeader from '../../components/AppHeader';

export default function MembersScreen() {
  const members = [
    { id: 1, name: 'Rajesh Kumar', phone: '+91 98765 43210', land: '15 acres', status: 'Active' },
    { id: 2, name: 'Priya Sharma', phone: '+91 98765 43211', land: '20 acres', status: 'Active' },
    { id: 3, name: 'Amit Patel', phone: '+91 98765 43212', land: '12 acres', status: 'Active' },
    { id: 4, name: 'Sunita Devi', phone: '+91 98765 43213', land: '18 acres', status: 'Pending' },
  ];

  return (
    <View style={styles.container}>
      <AppHeader />
      
      <View style={styles.pageHeader}>
        <Text style={styles.title}>FPO Members</Text>
        <Text style={styles.subtitle}>Total: {members.length} members</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#6b7280" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search members..."
            placeholderTextColor="#9ca3af"
          />
        </View>

        <TouchableOpacity style={styles.addButton}>
          <Ionicons name="add-circle" size={24} color="#fff" />
          <Text style={styles.addButtonText}>Add New Member</Text>
        </TouchableOpacity>

        <ScrollView showsVerticalScrollIndicator={false}>
          {members.map((member) => (
            <View key={member.id} style={styles.memberCard}>
              <View style={styles.memberAvatar}>
                <Ionicons name="person" size={24} color="#2d5f3f" />
              </View>
              <View style={styles.memberInfo}>
                <Text style={styles.memberName}>{member.name}</Text>
                <Text style={styles.memberDetail}>{member.phone}</Text>
                <Text style={styles.memberDetail}>Land: {member.land}</Text>
              </View>
              <View style={[styles.statusBadge, member.status === 'Active' ? styles.activeStatus : styles.pendingStatus]}>
                <Text style={styles.statusText}>{member.status}</Text>
              </View>
            </View>
          ))}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  pageHeader: { 
    paddingHorizontal: 20, 
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: { fontSize: 24, fontWeight: 'bold', color: '#1f2937' },
  subtitle: { fontSize: 14, color: '#6b7280', marginTop: 4 },
  content: { flex: 1, padding: 20 },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    gap: 8,
  },
  searchInput: { flex: 1, fontSize: 16 },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2d5f3f',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    gap: 8,
  },
  addButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  memberCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
    gap: 12,
  },
  memberAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#f0f9f4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  memberInfo: { flex: 1 },
  memberName: { fontSize: 16, fontWeight: '600', color: '#1f2937', marginBottom: 4 },
  memberDetail: { fontSize: 12, color: '#6b7280', marginBottom: 2 },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  activeStatus: { backgroundColor: '#d1fae5' },
  pendingStatus: { backgroundColor: '#fef3c7' },
  statusText: { fontSize: 12, fontWeight: '600', color: '#1f2937' },
});
