# Item Image Upload - Implementation Summary

## Feature Description
Implemented image upload functionality for individual parcel items with proper data synchronization and database persistence, following the same pattern as packing list images.

## Technical Requirements Met

✅ **Upload Parameters**
- `moduleType: "ITEM"`
- `recordId: item.itemId`
- `imageType: "ITEM_IMAGE"`

✅ **Image Persistence**
- Images stored in database via backend `/upload` endpoint
- Image metadata maintained in `itemImages` array
- Synchronization before save to ensure data consistency

✅ **Image Loading**
- Existing images loaded when opening parcel for editing
- Images displayed in UI immediately after loading
- Proper data transformation from database format to UI format

## Files Modified

### 1. [src/components/parcel/ParcelItemList.vue](src/components/parcel/ParcelItemList.vue)
**Changes**:
- **Line ~293-360**: Updated `onFilesSelected()` method
  - Uses `uploadHandlers.upload()` with correct parameters
  - Initializes both `_images` (UI) and `itemImages` (data)
  - Stores upload response data with proper image ID

- **Line ~365-390**: Enhanced `removeImage()` method
  - Removes from both `_images` and `itemImages`
  - Calls backend deleteImage API
  - Properly filters deleted images

- **Line ~391-412**: Updated `handleAddItem()` function
  - Initializes `itemImages: []` and `_images: []` for new items

### 2. [src/components/parcel/ParcelDialog.vue](src/components/parcel/ParcelDialog.vue)
**Changes**:
- **Line ~315-330**: Modified `handleSave()` method
  - Calls `syncItemImages()` before emit save
  - Ensures itemImages data is synchronized with UI state

- **Line ~345-365**: Added new `syncItemImages()` function
  - Filters images with IDs (successfully uploaded)
  - Maps to proper object structure: `{id, url, name, type}`
  - Called before save to synchronize UI state with data

### 3. [src/views/parcel/ParcelManagement.vue](src/views/parcel/ParcelManagement.vue)
**Changes**:
- **Line ~119-140**: Updated `addItem()` function
  - Added `_images: []` initialization

- **Line ~188-210**: Enhanced `edit()` function
  - Loads existing itemImages from database
  - Maps itemImages to `_images` for UI display
  - Handles both string URLs and object formats

- **Line ~381-420**: Updated `createDefaultParcel()` function
  - Added `_images: []` in default item initialization

### 4. [src/composables/useParcel.js](src/composables/useParcel.js)
**Changes**:
- **Line ~51-100**: Enhanced `getParcelDetail()` function
  - Normalizes itemImages data from backend
  - Handles both string URLs and object formats
  - Ensures consistent data structure

- **Line ~101-135**: Updated `saveParcel()` function
  - Processes itemImages similar to packingList
  - Preserves image IDs and URLs
  - Removes temporary `_images` field before sending to backend
  - Added logging for debugging

## Data Flow Diagrams

### Upload Flow (New Item Image)
```
User selects file
       ↓
onFilesSelected() creates local preview in _images[]
       ↓
uploadHandlers.upload(file, {
  moduleType: "ITEM",
  recordId: itemId,
  imageType: "ITEM_IMAGE"
})
       ↓
Backend /upload endpoint
  - Saves image file
  - Creates record in image_attachment table
  - Returns {id, url, imageUrl}
       ↓
Add to itemImages[] with {id, url, name, type}
       ↓
User clicks Save
       ↓
syncItemImages() in ParcelDialog
  - Filters images with id from _images
  - Maps to {id, url, name, type}
  - Syncs to itemImages
       ↓
saveParcel() processes itemImages
  - Preserves ID and URL
  - Removes _images temporary field
       ↓
Backend update/add endpoint receives itemImages
       ↓
Images persisted in database ✓
```

### Load Flow (Existing Item Images)
```
User clicks Edit Parcel
       ↓
edit() function called
       ↓
getParcelDetail(parcelId)
       ↓
Backend returns itemList with itemImages
       ↓
getParcelDetail normalizes itemImages:
  - String URLs → {url, name, type}
  - Objects → preserved as-is
       ↓
edit() maps itemImages to _images:
  - {id, url, name, uploading: false}
       ↓
ParcelItemList displays _images in UI
       ↓
Images visible in form ✓
```

## Key Implementation Details

### Dual Array Pattern
The implementation uses two arrays per item for proper separation of concerns:

1. **`_images`** - Temporary array for UI display
   - Used during editing/uploading
   - Contains preview URLs and upload status
   - Discarded on cancel

2. **`itemImages`** - Persistent array for data storage
   - Contains uploaded image metadata (id, url, name, type)
   - Synchronized from `_images` before save
   - Sent to backend for persistence

### Synchronization Strategy
- **Before Save**: `syncItemImages()` filters uploaded images from `_images` and syncs to `itemImages`
- **Before Load**: `getParcelDetail()` normalizes itemImages format
- **On Edit Open**: `edit()` maps itemImages to `_images` for display

### Image Identification
- **Upload Response**: Backend returns `id` field
- **Persistence**: Image ID stored with metadata
- **Deletion**: Image ID used to identify which image to delete
- **Sync Filter**: Only images with `id` field are synced (prevents orphaned previews)

## Database Expectations

Backend should store item images with:
```
Table: image_attachment
- id: Integer (primary key)
- moduleType: String = "ITEM"
- recordId: Integer = itemId
- imageType: String = "ITEM_IMAGE"
- imageUrl: String (URL to image file)
- uploadTime: Timestamp (optional)
```

When retrieving parcel details, backend should return:
```json
{
  "itemList": [
    {
      "itemId": 123,
      "itemImages": [
        {
          "id": 456,
          "url": "/path/to/image.jpg",
          "name": "image.jpg",
          "type": "image/*"
        }
      ]
    }
  ]
}
```

## Testing Scenarios

### Scenario 1: Upload New Image to New Parcel
1. Create new parcel
2. Add item
3. Upload image to item
4. Verify image appears in preview
5. Save parcel
6. Verify image persists in database

### Scenario 2: Upload Image to Existing Parcel
1. Edit existing parcel
2. Add image to existing item
3. Verify image appears
4. Save parcel
5. Edit parcel again
6. Verify image is loaded and still present

### Scenario 3: Delete Image
1. Edit parcel with items that have images
2. Delete an image
3. Verify image removed from UI
4. Save parcel
5. Edit parcel again
6. Verify deleted image is gone

### Scenario 4: Multiple Images
1. Add multiple images to single item
2. Add images to multiple items
3. Verify all images appear correctly
4. Save and re-edit parcel
5. Verify all images persist and load

## Debugging Tips

### Upload Not Working
- Check console for error messages
- Verify itemId is populated before upload
- Verify uploadHandlers is passed from parent
- Check network tab for failed requests to /upload

### Images Not Persisting
- Verify syncItemImages() is called before save
- Check ParcelDialog.vue handleSave() method
- Verify saveParcel() includes itemImages in save data
- Check browser console for logs

### Images Not Loading on Edit
- Verify getParcelDetail() returns itemImages
- Check if itemImages is being mapped to _images
- Verify image URLs are correct
- Check if images exist in backend storage

## Related Documentation
- [ITEM_IMAGE_UPLOAD_GUIDE.md](ITEM_IMAGE_UPLOAD_GUIDE.md) - Detailed implementation guide
- [PARCELFILEUPLOAD_GUIDE.md](PARCELFILEUPLOAD_GUIDE.md) - Packing list implementation
- [UPLOAD_IMPROVEMENTS.md](UPLOAD_IMPROVEMENTS.md) - Parameter fix details
- [TEST_GUIDE.md](TEST_GUIDE.md) - Testing instructions

