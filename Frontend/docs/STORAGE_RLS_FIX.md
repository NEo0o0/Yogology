# Storage RLS Policy Fix for class-images Bucket

## Problem
Admin users are getting "new row violates row-level security policy" when uploading images to the `class-images` bucket.

## Root Cause
The Supabase Storage bucket `class-images` doesn't have proper RLS policies configured to allow authenticated users (especially admins) to upload files.

## Solution
Run the following SQL in your Supabase SQL Editor:

```sql
-- Enable RLS on storage.objects if not already enabled
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Policy 1: Allow authenticated users to upload to class-images bucket
CREATE POLICY "Allow authenticated uploads to class-images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'class-images');

-- Policy 2: Allow public read access to class-images
CREATE POLICY "Allow public read access to class-images"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'class-images');

-- Policy 3: Allow authenticated users to update their uploads
CREATE POLICY "Allow authenticated updates to class-images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'class-images')
WITH CHECK (bucket_id = 'class-images');

-- Policy 4: Allow authenticated users to delete from class-images
CREATE POLICY "Allow authenticated deletes from class-images"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'class-images');
```

## Alternative: Admin-Only Upload
If you want only admins to upload (more restrictive):

```sql
-- Drop the previous INSERT policy if it exists
DROP POLICY IF EXISTS "Allow authenticated uploads to class-images" ON storage.objects;

-- Create admin-only upload policy
CREATE POLICY "Allow admin uploads to class-images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'class-images' 
  AND (
    SELECT role FROM public.profiles WHERE id = auth.uid()
  ) = 'admin'
);
```

## Verification
After applying the policies:
1. Try uploading an image through the ImageUpload component
2. Check that the upload succeeds without RLS errors
3. Verify the image is publicly accessible via the returned URL

## Bucket Configuration
Ensure the `class-images` bucket exists and is configured as:
- **Public bucket**: Yes (for public read access)
- **File size limit**: 5MB (or as needed)
- **Allowed MIME types**: image/* (or specific: image/jpeg, image/png, image/gif, image/webp)
