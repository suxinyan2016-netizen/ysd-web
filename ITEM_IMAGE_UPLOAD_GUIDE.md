# Item Image Upload Implementation Guide

## Overview
Implemented image upload functionality for parcel items with proper data synchronization and database persistence.

## Changes Made

### 1. ParcelItemList.vue
**File**: [src/components/parcel/ParcelItemList.vue](src/components/parcel/ParcelItemList.vue)

**Changes**:
- Modified `onFilesSelected()` method to use `uploadHandlers.upload()` instead of `imageManager` methods
- Added proper parameters:
  - `moduleType: "ITEM"`
  - `recordId: item.itemId`
  - `imageType: "ITEM_IMAGE"`
- Added logic to sync uploaded images to `item.itemImages` array
- Initialize both `item._images` (for UI preview) and `item.itemImages` (for data persistence)

**Key Code**:
```javascript
uploadResponse = await props.uploadHandlers.upload(file, {
  moduleType: "ITEM",
  recordId: item.itemId || -1,
  imageType: "ITEM_IMAGE",
});
```

### 2. ParcelDialog.vue
**File**: [src/components/parcel/ParcelDialog.vue](src/components/parcel/ParcelDialog.vue)

**Changes**:
- Added `syncItemImages()` function to synchronize item images before save
- Called `syncItemImages()` in `handleSave()` before emitting save event
- Function filters uploaded images (with id) and maps them to proper structure

**Key Code**:
```javascript
const syncItemImages = () => {
  const itemList = props.parcel.items || props.parcel.itemList;
  if (itemList && Array.isArray(itemList)) {
    itemList.forEach((item) => {
      if (item._images && Array.isArray(item._images)) {
        item.itemImages = item._images
          .filter(img => img.id)
          .map(img => ({
            id: img.id,
            url: img.url,
            name: img.name || '',
            type: 'ITEM_IMAGE'
          }));
      }
    });
  }
};
```

### 3. ParcelManagement.vue
**File**: [src/views/parcel/ParcelManagement.vue](src/views/parcel/ParcelManagement.vue)

**Changes**:
- Enhanced `edit()` function to load existing item images when opening a parcel
- Initialize `_images` array from `itemImages` data for UI display
- Ensures images are properly loaded and displayed when editing

**Key Code**:
```javascript
if (item.itemImages && Array.isArray(item.itemImages)) {
  item._images = item.itemImages.map(img => ({
    id: img.id,
    url: img.url || img.imageUrl,
    name: img.name || '',
    uploading: false
  }))
}
```

### 4. useParcel.js Composable
**File**: [src/composables/useParcel.js](src/composables/useParcel.js)

**Changes**:
- Enhanced `getParcelDetail()` to normalize `itemImages` data from backend
- Added `itemImages` handling in `saveParcel()` to persist image data
- Ensures itemImages structure is maintained during save operations

**Key Changes**:
1. In `getParcelDetail()`:
   - Normalize itemImages from backend (handle both string URLs and objects)
   - Map URL strings to proper object structure

2. In `saveParcel()`:
   - Process itemImages similar to packingList
   - Preserve image IDs and URLs
   - Clean up temporary `_images` field before sending to backend

## Data Flow

### Upload Flow (New Item Image):
1. User selects image file in ParcelItemList
2. `onFilesSelected()` creates local preview in `item._images`
3. `uploadHandlers.upload()` sends file to `/upload` endpoint with:
   - `moduleType: "ITEM"`
   - `recordId: itemId`
   - `imageType: "ITEM_IMAGE"`
4. Backend saves to `image_attachment` table
5. Response contains `id` and image URL
6. Image info added to `item.itemImages` for persistence
7. When saving parcel, `syncItemImages()` ensures itemImages is synchronized
8. `saveParcel()` sends itemImages data to backend for storage

### Load Flow (Existing Item Images):
1. User clicks Edit on a parcel
2. `edit()` function calls `getParcelDetail()`
3. `getParcelDetail()` loads itemImages from backend
4. `_images` array is populated from itemImages for UI display
5. Images are immediately visible in the form
6. `onFilesSelected()` can add more images to existing ones

## Database Schema Expected

The backend `image_attachment` table should have:
```sql
- id (primary key)
- moduleType (varchar) - e.g., "ITEM", "PARCEL"
- recordId (integer) - itemId for ITEM_IMAGE
- imageType (varchar) - "ITEM_IMAGE"
- imageUrl (varchar) - URL to image
- uploadTime (timestamp)
```

## Backend API Endpoint

**POST** `/upload`

**Parameters**:
- `moduleType` - "ITEM"
- `recordId` - itemId
- `imageType` - "ITEM_IMAGE"
- `file` - MultipartFile

**Response**:
```json
{
  "id": 123,
  "url": "/path/to/image.jpg",
  "imageUrl": "/path/to/image.jpg",
  "path": "/path/to/image.jpg"
}
```

## Notes

1. **moduleType**: Currently set to "ITEM" based on backend conventions. Adjust if needed.
2. **recordId**: Uses `item.itemId` as the record identifier for backend
3. **Dual Arrays**: 
   - `_images`: Temporary array for UI display during editing
   - `itemImages`: Persistent array for data storage
4. **Sync Before Save**: `syncItemImages()` is called before save to ensure UI state is synchronized with data
5. **Image Loading**: When opening existing items, `getParcelDetail()` loads itemImages and populates `_images` for display

## Testing Checklist

- [ ] Upload new image to item in new parcel
- [ ] Verify image appears in UI
- [ ] Save parcel and verify image is persisted in database
- [ ] Edit existing parcel with items
- [ ] Verify existing images load and display correctly
- [ ] Add additional images to existing items
- [ ] Delete images from items
- [ ] Verify all changes persist after save

## Troubleshooting

### Images not uploading:
- Verify `uploadHandlers.upload` is properly passed from parent component
- Check browser console for upload errors
- Verify itemId is populated before upload

### Images not persisting:
- Verify `syncItemImages()` is being called in `handleSave()`
- Check that backend receives correct parameters (moduleType, recordId, imageType)
- Verify backend stores images in correct table with correct moduleType

### Images not loading on edit:
- Verify `getParcelDetail()` returns itemImages data
- Check that `_images` is properly initialized from itemImages
- Verify image URLs are correct and accessible

