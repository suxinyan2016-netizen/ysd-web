# Item Image Upload - Quick Start & Testing Guide

## What Was Implemented

Item image upload functionality has been successfully implemented with the following features:

✅ Upload images to individual parcel items
✅ Proper backend parameters (moduleType: "ITEM", recordId: itemId, imageType: "ITEM_IMAGE")
✅ Images persist to database when parcel is saved
✅ Existing images load when opening parcel for editing
✅ Multiple images per item support
✅ Delete images from items

## Quick Testing Steps

### Test 1: Upload Image to New Parcel
1. Open Parcel Management
2. Click "Add Parcel" to create new parcel
3. Fill in basic parcel information
4. Under Items section:
   - Add an item (or use the default one)
   - Look for "Item Images (Multiple):" section
   - Click the "+" icon to upload image
5. Select an image file from your computer
6. Verify:
   - Image appears as thumbnail in Item Images grid
   - Image has delete button (X)
7. Click "Save" to save the parcel
8. Check network tab in browser DevTools:
   - Should see POST request to `/upload`
   - Parameters should include: moduleType="ITEM", recordId={itemId}, imageType="ITEM_IMAGE"
9. Verify image is saved in database

### Test 2: Load Existing Images
1. Open Parcel Management
2. Click "Edit" on a parcel that has items with images
3. Verify:
   - Images are loaded and displayed in Item Images section
   - Images show correctly in thumbnail grid
   - Delete buttons work
4. Add a new image to verify upload still works
5. Save parcel and verify both old and new images persist

### Test 3: Multiple Images per Item
1. Create a new parcel
2. Add an item
3. Upload 3-4 different images to the same item
4. Verify:
   - All images appear in grid
   - Can delete individual images
5. Save parcel
6. Re-edit parcel
7. Verify all images are still there

### Test 4: Delete Image
1. Edit parcel with items that have images
2. Hover over an image thumbnail
3. Click the red "X" delete button
4. Verify:
   - Image is removed from UI
   - Image is removed from itemImages data
5. Save parcel
6. Re-edit parcel
7. Verify deleted image is gone

## Code Changes Summary

### Modified Files:
1. **ParcelItemList.vue** - Image upload and removal logic
2. **ParcelDialog.vue** - Sync itemImages before save
3. **ParcelManagement.vue** - Load itemImages on edit
4. **useParcel.js** - Handle itemImages in save/load operations

### Key Implementation Points:
- **moduleType**: "ITEM" (used by backend to identify image type)
- **recordId**: item.itemId (identifies which item owns the image)
- **imageType**: "ITEM_IMAGE" (specific image type for items)
- **Dual arrays**: _images (UI preview) and itemImages (persistent data)
- **Sync mechanism**: syncItemImages() called before save

## Expected Backend Behavior

Your backend should:

1. **On Upload** (POST `/upload`):
   - Receive: moduleType="ITEM", recordId=123, imageType="ITEM_IMAGE", file=...
   - Save image file to storage
   - Create record in image_attachment table
   - Return: {id: 456, url: "/path/to/image.jpg", imageUrl: "/path/to/image.jpg"}

2. **On Save** (PUT/POST parcel):
   - Receive parcel with itemList containing itemImages array
   - Example: itemImages: [{id: 456, url: "...", name: "...", type: "ITEM_IMAGE"}]
   - Store the image metadata/references with the parcel

3. **On Load** (GET parcel):
   - Return parcel with itemList containing itemImages
   - itemImages should be array of {id, url, name, type}

## Browser Console Debugging

When testing, check browser console (F12) for these logs:

**On upload**: `[ParcelDialog] Synced itemImages for item {itemId}:`
- Shows which images were synced to itemImages

**On save**: `[useParcel] saveParcel - 处理后 saveData.itemList itemImages:`
- Shows itemImages data being sent to backend

**Errors**: Check for upload or delete operation errors

## Troubleshooting

### Images not appearing in upload grid
- Verify uploadHandlers prop is passed from parent component
- Check browser console for errors
- Verify itemId is populated

### Images not saving to database
- Check browser console logs to verify syncItemImages was called
- Verify backend receives itemImages in save request
- Check backend logs for image processing errors

### Images not loading on edit
- Check network tab to verify API returns itemImages
- Verify _images is being initialized from itemImages
- Check browser console for any transformation errors

## Next Steps

1. **Test uploads** with various image formats (JPEG, PNG, GIF)
2. **Verify backend** receives correct parameters
3. **Check database** to confirm images are stored with correct moduleType
4. **Test edge cases**: 
   - Very large images
   - Many images (10+) per item
   - Rapid uploads
   - Network failure during upload

## Related Files

See these files for detailed implementation:
- [ITEM_IMAGE_UPLOAD_GUIDE.md](ITEM_IMAGE_UPLOAD_GUIDE.md) - Implementation details
- [ITEM_IMAGE_IMPLEMENTATION_SUMMARY.md](ITEM_IMAGE_IMPLEMENTATION_SUMMARY.md) - Data flows
- [BACKEND_IMAGE_INTEGRATION.md](BACKEND_IMAGE_INTEGRATION.md) - Backend integration
- [PARCELFILEUPLOAD_GUIDE.md](PARCELFILEUPLOAD_GUIDE.md) - Similar packing list implementation

