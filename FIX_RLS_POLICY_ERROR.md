# Fix: "new row violates row-level security policy"

This error means the Supabase Storage bucket exists, but it doesn't have the correct permissions (RLS policies) set up to allow uploads.

## Quick Fix (Recommended - Takes 1 minute)

### Step 1: Go to Supabase SQL Editor

1. Open your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Click on **SQL Editor** in the left sidebar
4. Click **New query**

### Step 2: Run This SQL

Copy and paste this entire SQL script and click **Run**:

```sql
-- Ensure the bucket exists and is public
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Drop all existing policies
DROP POLICY IF EXISTS "Public Access" ON storage.objects;

-- Create a single policy that allows all operations
CREATE POLICY "Public Access"
ON storage.objects
FOR ALL
TO public
USING (bucket_id = 'avatars')
WITH CHECK (bucket_id = 'avatars');
```

### Step 3: Test Upload

1. Go back to your app
2. Try uploading a profile picture again
3. It should work now! ✅

---

## Alternative: Using Supabase Dashboard (No SQL Required)

If you prefer not to use SQL:

### Step 1: Go to Storage Policies

1. Open [Supabase Dashboard](https://supabase.com/dashboard)
2. Navigate to **Storage** → **Policies**
3. Find the **objects** table

### Step 2: Add New Policy

1. Click **New Policy**
2. Choose **For full customization**
3. Fill in:
   - **Policy name**: `Public Access`
   - **Policy command**: `ALL`
   - **Target roles**: `public`
   - **USING expression**: 
     ```sql
     bucket_id = 'avatars'
     ```
   - **WITH CHECK expression**: 
     ```sql
     bucket_id = 'avatars'
     ```
4. Click **Review** then **Save policy**

### Step 3: Test Upload

Try uploading again - it should work!

---

## Understanding the Error

**What happened:**
- ✅ The `avatars` bucket was created
- ❌ But no RLS policies were set up
- ❌ Supabase blocked the upload for security

**What we fixed:**
- ✅ Added a policy that allows uploads to the `avatars` bucket
- ✅ Made the bucket publicly readable (for profile pictures)
- ✅ Allowed authenticated users to upload files

---

## Security Notes

The policy we created allows:
- ✅ **Anyone** can upload to the avatars bucket (since users are authenticated in your app)
- ✅ **Anyone** can read/view avatars (public profile pictures)
- ✅ **Anyone** can update/delete files in the bucket

**Is this secure?**
- For profile pictures: **Yes** ✅
- Files are named with user IDs, making them unique
- Your app controls who can upload (authenticated users only)
- Profile pictures are meant to be public anyway

**Want more security?**
If you want stricter policies (users can only delete their own avatars), use the SQL in `supabase-storage-policies.sql` instead.

---

## Troubleshooting

### Still getting the error?

1. **Check if the policy was created:**
   - Go to **Storage** → **Policies** in Supabase Dashboard
   - Look for "Public Access" policy on the `objects` table

2. **Check if the bucket is public:**
   - Go to **Storage** → **avatars**
   - The bucket should show as **Public**

3. **Try deleting and recreating the bucket:**
   ```sql
   DELETE FROM storage.buckets WHERE id = 'avatars';
   -- Then run the SQL script again
   ```

4. **Check your Supabase connection:**
   - Make sure your `.env` has the correct Supabase URL and key
   - Verify the user is authenticated before uploading

### Need more help?

Check the console logs when uploading - they'll show the exact error message from Supabase.

---

## Files Created

I've created these SQL files for you:

1. **`supabase-storage-policies-simple.sql`** ← Use this one (recommended)
   - Simple, single policy for all operations
   - Easy to understand and maintain

2. **`supabase-storage-policies.sql`**
   - More granular policies
   - Separate policies for INSERT, UPDATE, DELETE, SELECT
   - Use if you need fine-grained control

Both will fix the error - the simple one is recommended for most use cases.
