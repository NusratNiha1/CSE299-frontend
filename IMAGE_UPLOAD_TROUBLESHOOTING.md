# Image Upload Troubleshooting Guide

## Issue: "Failed to upload image" when uploading profile picture

### Common Causes and Solutions

#### 1. **Cloudinary Upload Preset Not Configured**
The most common issue is that the upload preset `profile_pics` doesn't exist or isn't configured as "unsigned".

**Solution:**
1. Go to your Cloudinary Dashboard: https://cloudinary.com/console
2. Navigate to **Settings** → **Upload**
3. Scroll down to **Upload presets**
4. Either:
   - Find the `profile_pics` preset and ensure it's set to **Unsigned**
   - OR create a new unsigned upload preset:
     - Click "Add upload preset"
     - Set **Signing Mode** to "Unsigned"
     - Set **Preset name** to `profile_pics`
     - Configure any other settings (folder, transformations, etc.)
     - Click "Save"

#### 2. **Wrong Cloud Name**
Verify that `CLOUDINARY_CLOUD_NAME` in `app/settings/profile.tsx` matches your actual Cloudinary cloud name.

**Current value:** `dmpotmxs5`

**To verify:**
1. Go to Cloudinary Dashboard
2. Check the **Cloud name** in the top-left corner
3. Update the constant in the code if it doesn't match

#### 3. **Network/CORS Issues**
While less common in React Native, network issues can occur.

**To debug:**
- Check the console logs when you attempt to upload
- Look for the "Cloudinary response:" log to see the actual error message
- Common errors:
  - `Invalid upload preset` - The preset doesn't exist or is signed
  - `Upload preset must be unsigned` - The preset exists but requires signing
  - `File size too large` - The image exceeds size limits

#### 4. **Image Picker Permissions**
Ensure the app has permission to access the photo library.

**For iOS:** Add to `app.json`:
```json
{
  "expo": {
    "ios": {
      "infoPlist": {
        "NSPhotoLibraryUsageDescription": "This app needs access to your photos to update your profile picture."
      }
    }
  }
}
```

**For Android:** Add to `app.json`:
```json
{
  "expo": {
    "android": {
      "permissions": [
        "READ_EXTERNAL_STORAGE",
        "WRITE_EXTERNAL_STORAGE"
      ]
    }
  }
}
```

### How to Debug

1. **Check Console Logs:**
   - When you try to upload, watch the terminal running `npx expo start`
   - Look for:
     - "Uploading to Cloudinary..."
     - "Cloudinary response: {...}"
     - Any error messages

2. **Test Cloudinary Directly:**
   - Use a tool like Postman to test the upload endpoint
   - URL: `https://api.cloudinary.com/v1_1/dmpotmxs5/image/upload`
   - Method: POST
   - Body: form-data with:
     - `file`: (select an image file)
     - `upload_preset`: profile_pics

3. **Alternative: Use Supabase Storage Instead**
   If Cloudinary continues to have issues, you can switch to Supabase Storage:
   - Supabase provides free storage
   - Already configured in your project
   - See the alternative implementation below

### Alternative Implementation: Supabase Storage

If you prefer to use Supabase Storage instead of Cloudinary, replace the `handleChangeAvatar` function with:

```typescript
const handleChangeAvatar = async () => {
  setError('');
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
    // Get the file extension
    const ext = image.uri.split('.').pop() || 'jpg';
    const fileName = `${profile?.id}-${Date.now()}.${ext}`;
    
    // Convert URI to blob
    const response = await fetch(image.uri);
    const blob = await response.blob();
    
    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('avatars')
      .upload(fileName, blob, {
        contentType: `image/${ext}`,
        upsert: true,
      });
    
    if (error) throw error;
    
    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(fileName);
    
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
```

**Note:** You'll need to:
1. Create an `avatars` bucket in Supabase Storage
2. Set it to public
3. Import supabase: `import { supabase } from '@/lib/supabase';`

### Next Steps

1. Try uploading again and check the console logs
2. Share the error message from the logs
3. Verify your Cloudinary upload preset configuration
4. Consider switching to Supabase Storage if Cloudinary issues persist
