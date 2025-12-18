import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { Colors } from '../constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

interface PremiumPaywallProps {
  visible: boolean;
  onClose: () => void;
  onSubscribe: () => void;
}

export default function PremiumPaywall({ visible, onClose, onSubscribe }: PremiumPaywallProps) {
  const features = [
    { icon: 'restaurant', text: 'Tüm premium diyetlere erişim' },
    { icon: 'create', text: 'Sınırsız kişisel diyet oluşturma' },
    { icon: 'analytics', text: 'Detaylı beslenme analizi' },
    { icon: 'fitness', text: 'Özel egzersiz planları' },
    { icon: 'chatbubbles', text: 'Öncelikli destek' },
  ];

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Close Button */}
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={28} color={Colors.darkText} />
          </TouchableOpacity>

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <Ionicons name="diamond" size={48} color={Colors.warning} />
            </View>
            <Text style={styles.title}>Premium'
a Geç</Text>
            <Text style={styles.subtitle}>Tüm özelliklerin kilidini aç</Text>
          </View>

          {/* Features */}
          <View style={styles.features}>
            {features.map((feature, index) => (
              <View key={index} style={styles.featureRow}>
                <View style={styles.featureIcon}>
                  <Ionicons name={feature.icon as any} size={20} color={Colors.primary} />
                </View>
                <Text style={styles.featureText}>{feature.text}</Text>
              </View>
            ))}
          </View>

          {/* Pricing */}
          <View style={styles.pricing}>
            <View style={styles.priceCard}>
              <View style={styles.discountBadge}>
                <Text style={styles.discountText}>%37 İNDİRİM</Text>
              </View>
              <Text style={styles.oldPrice}>$7.99</Text>
              <View style={styles.priceRow}>
                <Text style={styles.price}>$4.99</Text>
                <Text style={styles.period}>/ay</Text>
              </View>
              <Text style={styles.priceSubtext}>Ayda sadece $4.99</Text>
            </View>
          </View>

          {/* Subscribe Button */}
          <TouchableOpacity 
            style={styles.subscribeButton} 
            onPress={onSubscribe}
            data-testid="premium-subscribe-button"
          >
            <LinearGradient
              colors={['#7C3AED', '#EC4899']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.gradient}
            >
              <Ionicons name="rocket" size={24} color="#FFFFFF" />
              <Text style={styles.subscribeText}>🎉 ÜCRETSİZ ABONE OL</Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* Terms */}
          <Text style={styles.terms}>
            Şu an için tamamen ücretsiz! Ödeme alınmadan premium özelliklerini kullanabilirsiniz.
          </Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    backgroundColor: Colors.white,
    borderRadius: 24,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 10,
    padding: 8,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.warning + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: Colors.darkText,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.lightText,
    textAlign: 'center',
  },
  features: {
    marginBottom: 24,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  featureIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  featureText: {
    flex: 1,
    fontSize: 15,
    color: Colors.darkText,
    fontWeight: '500',
  },
  pricing: {
    marginBottom: 20,
  },
  priceCard: {
    backgroundColor: Colors.background,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    position: 'relative',
  },
  discountBadge: {
    position: 'absolute',
    top: -10,
    right: 20,
    backgroundColor: Colors.error,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  discountText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: 'bold',
  },
  oldPrice: {
    fontSize: 18,
    color: Colors.lightText,
    textDecorationLine: 'line-through',
    marginBottom: 4,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 4,
  },
  price: {
    fontSize: 48,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  period: {
    fontSize: 18,
    color: Colors.lightText,
    marginLeft: 4,
  },
  priceSubtext: {
    fontSize: 14,
    color: Colors.lightText,
  },
  subscribeButton: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  gradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    gap: 12,
  },
  subscribeText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  terms: {
    fontSize: 11,
    color: Colors.lightText,
    textAlign: 'center',
    lineHeight: 16,
  },
});
