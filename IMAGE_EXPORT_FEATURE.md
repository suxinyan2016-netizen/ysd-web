# Image Export Feature Implementation

## Overview
Added an "Img Export" button in the ParcelTable Operation column that allows users to export all images from a parcel into a ZIP file.

## Image Data Source
Images are fetched from the image management API:
- **Parcel Images**: `/api/image/manage/grouped?moduleType=PARCEL&recordId={parcelId}`
  - Returns: `PACKAGE_SEND`, `PACKAGE_RECEIVER`, `PACKING_LIST` image groups
- **Item Images**: `/api/image/manage/grouped?moduleType=ITEM&recordId={itemId}`
  - Called for each item in the parcel's itemList
  - Returns: Item-specific image groups

## Features Implemented

### 1. Export Button
- Added "Img Export" button in the Operation column of ParcelTable
- Button is visible to all users with view permission for the parcel

### 2. Image Collection
The export includes the following images:
- **Appearance before Sending** (`imgBySender`)
- **Appearance after Received** (`imgByReceiver`)
- **Packing List** images (renamed as "Packing List-1", "Packing List-2", etc.)
- **Item Images** (renamed with Item# prefix, e.g., "Item#-1", "Item#-2", etc.)

### 3. Export Process
1. Click "Img Export" button
2. System calls `/api/image/manage/grouped?moduleType=PARCEL&recordId={parcelId}` to get parcel images
3. System loads parcel details to get itemList
4. For each item, system calls `/api/image/manage/grouped?moduleType=ITEM&recordId={itemId}` to get item images
5. System counts total images to export
6. If more than 50 images, shows error: "Too many images in this parcel, cannot export. Please download on the page one by one."
7. If 0 images, shows warning: "No images found in this parcel"
8. Shows confirmation dialog with total image count
9. User clicks "Confirm" to start export
10. Progress bar shows download progress
11. ZIP file is generated and downloaded with filename: `{packageNo}.zip`
12. Success message shows number of images exported

### 4. Error Handling
- Skips images with empty or invalid URLs
- Skips non-image files (e.g., PDFs)
- Continues with remaining images if one fails to download
- Shows appropriate error messages for failed operations

### 5. File Naming Convention
- **Appearance before Sending**: "Appearance before Sending.jpg"
- **Appearance after Received**: "Appearance after Received.jpg"
- **Packing List**: "Packing List-1.jpg", "Packing List-2.jpg", etc.
- **Item Images**: "{ItemNo}-1.jpg", "{ItemNo}-2.jpg", etc.

### 6. Progress Dialog
- Shows confirmation message with image count
- Displays progress bar during export
- Shows current operation status
- Displays success message with exported count
- Shows error messages if export fails

## Files Modified

1. **ParcelTable.vue**
   - Added "Img Export" button
   - Added `handleExportImages()` function - calls image management APIs
   - Added `collectImageUrlsFromApi()` function to gather image URLs from API responses
   - Added `confirmExport()` function to perform the export
   - Added `getFileExtension()` helper function
   - Added import: `getGroupedImages` from `@/api/imageManage`
   - Added props: `getParcelDetail`

2. **ParcelManagement.vue**
   - Updated ParcelTable props binding
   - Changed `:parcel-list` to `:parcels`
   - Added `:current-user` prop
   - Added `:get-parcel-detail` prop

3. **index.vue** (views/parcel)
   - Added `getParcelDetail` from useParcel destructuring
   - Added `:get-parcel-detail` prop to ParcelTable

4. **ImageExportDialog.vue** (New Component)
   - Confirmation dialog
   - Progress indicator
   - Success/error messaging

## API Usage
- `GET /api/image/manage/grouped?moduleType=PARCEL&recordId={parcelId}` - Get parcel images
- `GET /api/image/manage/grouped?moduleType=ITEM&recordId={itemId}` - Get item images
- `GET /api/parcel/{parcelId}` - Get parcel details (via getParcelDetail composable)

## Dependencies Added
- `jszip`: For creating ZIP files
- `file-saver`: For saving files to user's computer

## Testing Checklist
- [ ] Click "Img Export" on a parcel with images
- [ ] Verify all images are included in ZIP
- [ ] Verify file naming is correct
- [ ] Test with parcel having >50 images
- [ ] Test with parcel having 0 images
- [ ] Test with invalid image URLs
- [ ] Test with PDF files in packing list (should be skipped)
- [ ] Verify progress bar updates correctly
- [ ] Verify ZIP file downloads with correct packageNo name
