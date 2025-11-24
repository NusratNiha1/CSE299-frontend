import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, User as UserIcon } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '@/contexts/AuthContext';
import { Input } from '@/components/Input';
import { ButtonPrimary } from '@/components/ButtonPrimary';
import { GlassCard } from '@/components/GlassCard';
import { theme } from '@/constants/theme';
import { supabase } from '@/lib/supabase';

export default function ProfileSettingsScreen() {
  const router = useRouter();
  const { profile, updateProfile } = useAuth();
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [username, setUsername] = useState(profile?.username || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || '');
  const [avatarUploading, setAvatarUploading] = useState(false);

  const handleSave = async () => {
    if (!fullName.trim() || !username.trim()) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await updateProfile({ full_name: fullName, username, avatar_url: avatarUrl });
      Alert.alert('Success', 'Profile updated successfully');
      router.back();
    } catch (err: any) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleChangeAvatar = async () => {
    setError('');

    // Request permissions first
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please grant photo library access to change your profile picture.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (result.canceled) return;
    const image = result.assets?.[0];
    if (!image?.uri) return;

    setAvatarUploading(true);

    try {
      // Get the file extension from the URI
      const ext = image.uri.split('.').pop()?.toLowerCase() || 'jpg';
      const fileName = `${profile?.id}-${Date.now()}.${ext}`;

      console.log('Reading image file...');
      // For React Native, we need to read the file as ArrayBuffer
      const response = await fetch(image.uri);
      const arrayBuffer = await response.arrayBuffer();

      console.log('Uploading to Supabase Storage...');
      // Upload to Supabase Storage using ArrayBuffer
      const { data, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, arrayBuffer, {
          contentType: `image/${ext}`,
          upsert: true,
        });

      if (uploadError) {
        console.error('Supabase upload error:', uploadError);
        throw uploadError;
      }

      console.log('Upload successful:', data);

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      console.log('Public URL:', publicUrl);

      // Update profile with new avatar URL
      setAvatarUrl(publicUrl);
      await updateProfile({ avatar_url: publicUrl });
      Alert.alert('Success', 'Profile picture updated!');
    } catch (err: any) {
      console.error('Upload error:', err);
      const errorMessage = err.message || 'Failed to upload image';
      setError(errorMessage);
      Alert.alert('Upload Error', errorMessage);
    } finally {
      setAvatarUploading(false);
    }
  };

  return (
    <LinearGradient
      colors={[theme.colors.background, theme.colors.secondary]}
      style={styles.container}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            {avatarUrl ? (
              <Image
                source={{ uri: avatarUrl }}
                style={{ width: 100, height: 100, borderRadius: 100 }}
                resizeMode="cover"
              />
            ) : (
              <UserIcon size={48} color={theme.colors.primary} />
            )}
          </View>
          <TouchableOpacity style={styles.changeAvatarButton} onPress={handleChangeAvatar} disabled={avatarUploading}>
            <Text style={styles.changeAvatarText}>{avatarUploading ? 'Uploading...' : 'Change Photo'}</Text>
          </TouchableOpacity>
        </View>

        <GlassCard style={styles.formCard}>
          <Input
            label="Full Name"
            placeholder="Enter your full name"
            value={fullName}
            onChangeText={setFullName}
            autoCapitalize="words"
          />
          <Input
            label="Username"
            placeholder="Enter your username"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <ButtonPrimary
            title="Save Changes"
            onPress={handleSave}
            loading={loading}
            style={styles.saveButton}
          />
        </GlassCard>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingTop: 60,
    paddingBottom: theme.spacing.md,
  },
  backButton: {
    padding: theme.spacing.sm,
  },
  headerTitle: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
  },
  scrollContent: {
    padding: theme.spacing.lg,
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: theme.borderRadius.full,
    backgroundColor: 'rgba(1, 204, 102, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: theme.colors.primary,
    marginBottom: theme.spacing.md,
  },
  changeAvatarButton: {
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
  },
  changeAvatarText: {
    color: theme.colors.primary,
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
  },
  formCard: {
    marginBottom: theme.spacing.lg,
  },
  saveButton: {
    marginTop: theme.spacing.md,
  },
  error: {
    color: theme.colors.error,
    fontSize: theme.fontSize.sm,
    textAlign: 'center',
    marginBottom: theme.spacing.md,
  },
});
