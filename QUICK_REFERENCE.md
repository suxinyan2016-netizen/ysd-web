# Item Image Upload - Quick Reference Card

## Files Modified (4)

| File | Changes | Key Lines |
|------|---------|-----------|
| ParcelItemList.vue | Upload with proper params, image management | 309, 365, 391 |
| ParcelDialog.vue | Sync before save | 327, 345 |
| ParcelManagement.vue | Load images on edit | 119, 207, 381 |
| useParcel.js | Save/load with itemImages | 67, 118 |

## Upload Parameters

```javascript
uploadHandlers.upload(file, {
  moduleType: "ITEM",         // Always "ITEM" for item images
  recordId: item.itemId,      // The item's unique ID
  imageType: "ITEM_IMAGE"     // Identifies image type
})
```

## Data Arrays (Per Item)

```javascript
_images       // ← UI display (temporary, discarded on cancel)
itemImages    // ← Persistent data (sent to backend)
```

## Key Functions

| Function | Location | Purpose |
|----------|----------|---------|
| onFilesSelected() | ParcelItemList.vue:293 | Handle file upload |
| syncItemImages() | ParcelDialog.vue:345 | Sync UI to data before save |
| removeImage() | ParcelItemList.vue:365 | Delete image |
| getParcelDetail() | useParcel.js:51 | Load parcel with images |
| saveParcel() | useParcel.js:101 | Save parcel with images |

## Data Flow (3 Steps)

### 1. Upload
```
File Selected → uploadHandlers.upload(
  moduleType: "ITEM",
  recordId: itemId,
  imageType: "ITEM_IMAGE"
) → Backend → Image ID & URL → Add to itemImages
```

### 2. Save
```
Click Save → syncItemImages() → saveParcel(
  itemImages: [{id, url, name, type}]
) → Backend persists
```

### 3. Load
```
Edit Parcel → getParcelDetail() → Backend returns itemImages → 
Map to _images → Display in UI
```

## Console Logs (Debug)

| Log | Meaning |
|-----|---------|
| `[ParcelDialog] Synced itemImages...` | Images synced before save |
| `[useParcel] saveParcel - 处理后...` | Data being sent to backend |
| Network tab: POST `/upload` | Image upload request |
| Network tab: PUT `/parcel` | Parcel save with images |

## Expected Response Format

```json
// After upload (POST /upload)
{
  "id": 123,
  "url": "/path/to/image.jpg",
  "imageUrl": "/path/to/image.jpg"
}

// Parcel save request (includes itemImages)
{
  "itemList": [
    {
      "itemId": 1,
      "itemImages": [
        {
          "id": 123,
          "url": "/path/to/image.jpg",
          "name": "image.jpg",
          "type": "ITEM_IMAGE"
        }
      ]
    }
  ]
}

// Parcel load response (includes itemImages)
{
  "itemList": [
    {
      "itemId": 1,
      "itemImages": [
        {
          "id": 123,
          "url": "/path/to/image.jpg",
          "name": "image.jpg",
          "type": "ITEM_IMAGE"
        }
      ]
    }
  ]
}
```

## Testing Quick Checklist

- [ ] Upload image to new item
- [ ] Image appears in preview
- [ ] Save parcel
- [ ] Edit parcel
- [ ] Image loads automatically
- [ ] Add more images
- [ ] Delete image
- [ ] All changes persist

## Troubleshooting Quick Fix

| Issue | Check |
|-------|-------|
| Not uploading | console error? uploadHandlers prop? itemId set? |
| Not saving | syncItemImages() called? itemImages in request? |
| Not loading | Backend returning itemImages? _images initialized? |
| Wrong params | moduleType="ITEM"? recordId=itemId? imageType="ITEM_IMAGE"? |

## Backend Must Do

1. Accept POST /upload with: moduleType, recordId, imageType, file
2. Store image file
3. Create database record
4. Return {id, url, imageUrl}
5. Support DELETE image
6. Include itemImages in parcel response
7. Process itemImages in parcel save

## Key Design Pattern

**Dual Array Pattern**:
- `_images`: UI display (added/removed freely during edit)
- `itemImages`: Persistent data (synced before save)
- **syncItemImages()**: Bridge that filters and maps `_images` to `itemImages`

**Why?** Allows users to:
- Preview images before saving
- Cancel without persistence
- Proper data integrity
- Clean separation of concerns

## Performance Notes

✅ Async upload (non-blocking)
✅ Vue reactivity handles UI updates
✅ Minimal memory (temp arrays cleaned)
✅ Single sync call before save
✅ No extra API calls

## Documentation Map

```
FINAL_REPORT.md ← Start here for overview
    ↓
ITEM_IMAGE_TESTING_GUIDE.md ← Run these tests
    ↓
ITEM_IMAGE_UPLOAD_GUIDE.md ← Implementation details
    ↓
ITEM_IMAGE_IMPLEMENTATION_SUMMARY.md ← Data flows
    ↓
IMPLEMENTATION_CHECKLIST.md ← Verification
```

## One-Line Summaries

| File | Summary |
|------|---------|
| ParcelItemList.vue | Handles file upload with correct params |
| ParcelDialog.vue | Syncs images before save |
| ParcelManagement.vue | Loads images on edit |
| useParcel.js | Processes images in save/load |

## Critical Code Locations

```
ModuleType: ParcelItemList.vue:309
RecordId: ParcelItemList.vue:310
ImageType: ParcelItemList.vue:311
SyncCall: ParcelDialog.vue:327
SyncFunc: ParcelDialog.vue:345
LoadImages: ParcelManagement.vue:207
SaveImages: useParcel.js:118
```

## Remember

✅ moduleType always "ITEM"
✅ recordId always item.itemId
✅ imageType always "ITEM_IMAGE"
✅ syncItemImages() called before save
✅ _images used for UI, itemImages for data
✅ Dual array pattern for clean code

---

**Version**: 1.0
**Last Updated**: [Current Date]
**Status**: ✅ READY

