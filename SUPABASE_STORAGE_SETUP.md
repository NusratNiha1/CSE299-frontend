# Supabase Storage Setup for Avatar Uploads

## Step 1: Create the Storage Bucket

You need to create a storage bucket in Supabase for storing avatar images.

### Option A: Using Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard: https://supabase.com/dashboard
2. Navigate to **Storage** in the left sidebar
3. Click **New bucket**
4. Configure the bucket:
   - **Name**: `avatars`
   - **Public bucket**: ✅ **Enable** (check this box)
   - **File size limit**: 5 MB (or your preference)
   - **Allowed MIME types**: Leave empty or add: `image/jpeg, image/png, image/jpg, image/webp`
5. Click **Create bucket**

### Option B: Using SQL

If you prefer SQL, run this in the SQL Editor:

```sql
-- Create the avatars bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true);

-- Set up storage policies to allow authenticated users to upload
CREATE POLICY "Authenticated users can upload avatars"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'avatars');

-- Allow users to update their own avatars
CREATE POLICY "Users can update their own avatars"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow public read access to avatars
CREATE POLICY "Public can view avatars"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');

-- Allow users to delete their own avatars
CREATE POLICY "Users can delete their own avatars"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
```

## Step 2: Verify the Setup

After creating the bucket, verify it's working:

1. Go to **Storage** → **avatars** in your Supabase dashboard
2. You should see an empty bucket
3. The bucket should show as **Public**

## Step 3: Test the Upload

Now try uploading a profile picture in your app:

1. Open the app and navigate to Profile Settings
2. Tap "Change Photo"
3. Select an image from your library
4. Watch the console logs for:
   - "Converting image to blob..."
   - "Uploading to Supabase Storage..."
   - "Upload successful: {...}"
   - "Public URL: https://..."

## Troubleshooting

### Error: "Bucket not found"
- Make sure you created a bucket named exactly `avatars` (lowercase, plural)
- Check in Supabase Dashboard → Storage

### Error: "new row violates row-level security policy"
- The storage policies aren't set up correctly
- Run the SQL policies above
- Make sure the user is authenticated

### Error: "Failed to upload image"
- Check the console logs for the specific error
- Verify the bucket is set to **Public**
- Check that the file size isn't too large

### Images not displaying
- Verify the bucket is set to **Public**
- Check the public URL in the console logs
- Try opening the URL in a browser to see if it's accessible

## Storage Policies Explained

The policies we created:

1. **INSERT**: Authenticated users can upload new avatars
2. **UPDATE**: Users can update their own avatars (based on user ID in filename)
3. **SELECT**: Anyone can view avatars (public read access)
4. **DELETE**: Users can delete their own avatars

## File Naming Convention

The app uses this naming pattern:
```
{user_id}-{timestamp}.{extension}
```

Example: `550e8400-e29b-41d4-a716-446655440000-1732459200000.jpg`

This ensures:
- Unique filenames (no collisions)
- Easy to identify which user owns the file
- Automatic versioning (timestamp)

## Next Steps

Once the bucket is created and configured:
1. ✅ The app is ready to upload images
2. ✅ Images will be stored in Supabase Storage
3. ✅ Public URLs will be automatically generated
4. ✅ Profile pictures will update immediately

No additional configuration needed!
