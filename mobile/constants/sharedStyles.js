import { StyleSheet, Platform, StatusBar } from 'react-native';

// Safe area padding for different devices
const STATUSBAR_HEIGHT = Platform.OS === 'ios' ? 44 : StatusBar.currentHeight || 0;
const HEADER_PADDING_TOP = Platform.OS === 'ios' ? 50 : 40;

export const sharedStyles = StyleSheet.create({
  // Container
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },

  // Header Styles (White)
  headerWhite: {
    backgroundColor: '#fff',
    paddingTop: HEADER_PADDING_TOP,
    paddingBottom: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },

  // Header Styles (Gradient)
  headerGradient: {
    paddingTop: HEADER_PADDING_TOP,
    paddingBottom: 20,
    paddingHorizontal: 16,
  },

  // Header Content
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },

  headerLeft: {
    flex: 1,
    marginRight: 12,
  },

  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    lineHeight: 24,
  },

  headerTitleWhite: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    lineHeight: 28,
  },

  headerSubtitle: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 2,
    lineHeight: 18,
  },

  headerSubtitleWhite: {
    fontSize: 14,
    color: '#dcfce7',
    marginTop: 4,
    lineHeight: 18,
  },

  headerIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },

  iconButton: {
    padding: 4,
    borderRadius: 20,
  },

  // Location Selector
  locationSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    paddingVertical: 4,
  },

  locationLabel: {
    fontSize: 13,
    color: '#6b7280',
    fontWeight: '400',
  },

  locationText: {
    fontSize: 13,
    color: '#111827',
    fontWeight: '500',
  },

  locationTextWhite: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '500',
  },

  // Content
  content: {
    flex: 1,
  },

  // Section
  section: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    lineHeight: 24,
  },

  sectionSubtitle: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: -8,
    marginBottom: 12,
    lineHeight: 18,
  },

  // Card
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },

  cardElevated: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },

  cardSuccess: {
    backgroundColor: '#f0fdf4',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },

  cardWarning: {
    backgroundColor: '#fef3c7',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#fde68a',
  },

  // Button
  buttonPrimary: {
    backgroundColor: '#16a34a',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
    flexDirection: 'row',
    gap: 6,
  },

  buttonSecondary: {
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    flexDirection: 'row',
    gap: 6,
  },

  buttonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },

  buttonTextSecondary: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },

  // Badge
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },

  badgeSuccess: {
    backgroundColor: '#dcfce7',
  },

  badgeError: {
    backgroundColor: '#fee2e2',
  },

  badgeWarning: {
    backgroundColor: '#fef3c7',
  },

  badgeNeutral: {
    backgroundColor: '#f3f4f6',
  },

  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },

  badgeTextSuccess: {
    color: '#166534',
  },

  badgeTextError: {
    color: '#991b1b',
  },

  badgeTextWarning: {
    color: '#92400e',
  },

  badgeTextNeutral: {
    color: '#6b7280',
  },

  // Text Styles
  textPrimary: {
    fontSize: 14,
    color: '#111827',
    lineHeight: 20,
  },

  textSecondary: {
    fontSize: 13,
    color: '#6b7280',
    lineHeight: 18,
  },

  textSmall: {
    fontSize: 12,
    color: '#6b7280',
    lineHeight: 16,
  },

  textBold: {
    fontWeight: '600',
  },

  textSemibold: {
    fontWeight: '500',
  },

  // Divider
  divider: {
    height: 1,
    backgroundColor: '#e5e7eb',
    marginVertical: 12,
  },

  // Row
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  // Spacing
  mt4: { marginTop: 4 },
  mt8: { marginTop: 8 },
  mt12: { marginTop: 12 },
  mt16: { marginTop: 16 },
  mb4: { marginBottom: 4 },
  mb8: { marginBottom: 8 },
  mb12: { marginBottom: 12 },
  mb16: { marginBottom: 16 },
  ml4: { marginLeft: 4 },
  ml8: { marginLeft: 8 },
  mr4: { marginRight: 4 },
  mr8: { marginRight: 8 },
  p4: { padding: 4 },
  p8: { padding: 8 },
  p12: { padding: 12 },
  p16: { padding: 16 },
  gap4: { gap: 4 },
  gap8: { gap: 8 },
  gap12: { gap: 12 },
  gap16: { gap: 16 },

  // Flex
  flex1: { flex: 1 },
  flexRow: { flexDirection: 'row' },
  flexColumn: { flexDirection: 'column' },
  alignCenter: { alignItems: 'center' },
  alignStart: { alignItems: 'flex-start' },
  alignEnd: { alignItems: 'flex-end' },
  justifyCenter: { justifyContent: 'center' },
  justifyBetween: { justifyContent: 'space-between' },
  justifyAround: { justifyContent: 'space-around' },
  justifyEnd: { justifyContent: 'flex-end' },
});

export default sharedStyles;
