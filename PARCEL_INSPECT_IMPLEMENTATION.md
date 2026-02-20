# Parcel Inspection Feature Implementation

## Overview
Implemented a complete multi-step parcel inspection workflow for parcels with status="inDelivery" (status=1). Users can review package information, upload packing list images, and perform item-by-item inspection with data capture before marking parcels as "Received" (status=2).

## Implementation Summary

### 1. New Components Created

#### **ParcelInspect.vue** (Main Dialog)
- **Location**: `src/components/parcel/ParcelInspect.vue`
- **Purpose**: Container dialog managing the multi-step inspection workflow
- **Key Features**:
  - Step 1: Package review with packing list image upload
  - Steps 2+: Item-by-item inspection (one item per step)
  - Navigation: Previous/Next buttons between steps
  - Save/Submit with confirmation dialogs
  - Automatic parcel status update to "Received" (2) on final submission
  
- **Props**:
  - `visible` (Boolean): Dialog visibility
  - `parcel` (Object): Full parcel data with itemList
  - `users` (Array): Available users for ownership assignment
  - `token` (String): Authentication token
  - `currentUser` (Object): Current logged-in user
  - `uploadHandlers` (Object): File upload utilities
  - `imageManager` (Object): Image management utilities

- **State Management**:
  - `currentStep` (ref): 1 for package, 2+ for items
  - `currentItemIndex` (ref): Current item position (0-based)
  
- **Computed Properties**:
  - `itemCount`: Total number of items in parcel
  - `currentItem`: Reference to currently displayed item

- **Key Methods**:
  - `nextStep()`: Navigate to next step (package→item1, item1→item2, etc.)
  - `previousStep()`: Navigate to previous step with validation
  - `handleSave(itemData)`: Save current item with confirmation dialog
  - `handleSubmit(itemData)`: Final submission with parcel status update
  - `saveItemData(itemData)`: Comprehensive item update with defaults

- **API Calls**:
  - `updateItem()`: Update individual item data
  - `updateParcel()`: Update parcel status to 2 (Received)

---

#### **ParcelInspectStep1.vue** (Package Review Step)
- **Location**: `src/components/parcel/ParcelInspectStep1.vue`
- **Purpose**: First step - display package information and manage packing list images
- **Key Features**:
  - Read-only display: packageNo, status, processId
  - View "Appearance after Received" images (read-only)
  - Upload/delete Packing List images (editable)
  - Image preview functionality
  
- **Props**:
  - `parcel` (Object): Parcel data
  - `token` (String): Auth token
  - `currentUser` (Object): Current user
  - `uploadHandlers` (Object): Upload utilities
  - `imageManager` (Object): Image management
  
- **State**:
  - `receiverImages` (ref): PACKAGE_RECEIVER images
  - `packingListImages` (reactive): PACKING_LIST images with upload status
  
- **Key Methods**:
  - `loadImages()`: Fetch grouped images for parcel
  - `onPackingImageSelected()`: Handle packing list image uploads
  - `removePackingImage()`: Delete packing list image
  - `previewImage()`: Open image in new window

- **UI Layout**:
  - Row 1: Parcel info (packageNo, status, processId) in gray boxes
  - Row 2: PACKAGE_RECEIVER images (read-only, 3 per row, horizontal scroll)
  - Row 3: PACKING_LIST images (editable, 3 per row, with upload button)
  - Bottom: Cancel, Next buttons

---

#### **ParcelInspectItemStep.vue** (Item Inspection Step)
- **Location**: `src/components/parcel/ParcelInspectItemStep.vue`
- **Purpose**: Item-by-item inspection for each parcel item
- **Key Features**:
  - Display item number (read-only)
  - Edit item quantity
  - Capture customer feedback
  - Select unpacking status (Unpacked/Packed)
  - Enter IQC result (default: "No Defects")
  - Upload item images
  
- **Props**:
  - `parcel` (Object): Parcel reference for defaults
  - `item` (Object): Current item being inspected
  - `itemIndex` (Number): Current item position (0-based)
  - `totalItems` (Number): Total number of items
  - Other standard props (users, token, currentUser, handlers)
  
- **State**:
  - `formData` (reactive): Item inspection data
    - `qty`: Item quantity
    - `customerFeedback`: User feedback
    - `isUnpacked`: Status (0=packed, 1=unpacked)
    - `iqcResult`: Quality result
    - `newImages`: Array of newly uploaded files
  - `itemImages` (ref): Loaded and uploaded images
  
- **Key Methods**:
  - `loadItemImages()`: Fetch images for current item
  - `onItemImageSelected()`: Handle image uploads
  - `removeItemImage()`: Delete image with backend call
  - `handleSave()`/`handleNext()`/`handlePrevious()`: Navigation

- **UI Layout**:
  - Step indicator: "Item X of Y"
  - Row 1: itemNo (read-only), qty (editable)
  - Row 2: Customer Feedback textarea
  - Row 3: isUnpacked dropdown, IQC Result input
  - Row 4: Item images (flex layout, one per row)
  - Bottom: Cancel, Previous, Next/Save, Submit buttons

---

### 2. Modified Components

#### **ParcelTable.vue**
- **Changes**:
  - Added Inspect button in Operation column (only visible when status=1)
  - Added imports for ParcelInspect component
  - Added new props: `token`, `uploadHandlers`, `imageManager`
  - Added new state: `inspectDialogVisible`, `inspectParcel`
  - Added new method: `handleInspect(parcel)`
  - Added emit listener: `@refresh` to trigger data refresh
  
- **Button Logic**:
  ```vue
  <el-button
    v-if="scope.row.status === 1"
    type="warning"
    size="small"
    @click="handleInspect(scope.row)"
  >
    <el-icon><Edit /></el-icon> Inspect
  </el-button>
  ```

---

### 3. API Changes

#### **parcel.js** (New/Updated Exports)
- **Added Functions**:
  ```javascript
  // Update single item
  export const updateItem = (item) => request.put('/items', item);
  
  // Update parcel info
  export const updateParcel = (parcel) => request.put('/parcels', parcel);
  
  // Alias for queryInfoApi
  export const getParcelDetail = queryInfoApi;
  ```

- **Expected Backend Endpoints**:
  - `PUT /items` - Update item with inspection data
  - `PUT /parcels` - Update parcel status
  
- **Item Update Payload**:
  ```javascript
  {
    itemId: number,           // Required: item identifier
    qty: number,              // Item quantity
    customerFeedback: string, // User feedback
    isUnpacked: number,       // 0=packed, 1=unpacked
    iqcResult: string,        // Quality result
    itemStatus: 1,            // Mark as inspected
    ownerId?: string,         // Set if not exists (from parcel)
    keeperId?: string,        // Set if not exists (from currentUser)
    receiveParcelId?: string, // Set if not exists (from parcel)
    receivedDate?: string,    // Set if not exists (YYYY-MM-DD)
  }
  ```

- **Parcel Update Payload**:
  ```javascript
  {
    parcelId: string,  // Required: parcel identifier
    status: 2,         // Mark as Received (status=2)
  }
  ```

---

### 4. Parent View Integration

#### **views/parcel/index.vue**
- **Updated ParcelTable Props**:
  ```vue
  <ParcelTable 
    :parcels="filteredParcelList"
    :users="users"
    :current-user="currentUser"
    :token="token"
    :get-parcel-detail="getParcelDetail"
    :upload-handlers="uploadHandlers"
    :image-manager="imageManager"
    @edit="edit"
    @delete="deleteById"
    @selection-change="handleSelectionChange"
    @refresh="search"
  />
  ```

- **Key Points**:
  - `getParcelDetail` from `useParcel` composable
  - `uploadHandlers` from `useFileUpload` composable
  - `imageManager` from `useFileUpload` composable
  - `@refresh="search"` re-executes parcel search to show status updates

---

## Workflow

### User Flow

1. **View Parcel List**
   - User sees ParcelTable with all parcels
   - Inspect button appears only for status=1 (inDelivery)

2. **Click Inspect Button**
   - ParcelInspect dialog opens
   - Shows Step 1 (Package Review)

3. **Step 1: Package Review**
   - View packageNo, status, processId (read-only)
   - View "Appearance after Received" images (read-only)
   - Upload additional Packing List images
   - Click "Next" to proceed

4. **Step 2+: Item Inspection** (repeats for each item)
   - View item number (read-only)
   - Enter item quantity (editable)
   - Add customer feedback
   - Select unpacking status
   - Enter IQC result
   - Upload item images
   - Click "Next" to go to next item OR
   - Click "Save" to save and stay on current item
   
5. **Final Submission**
   - On last item, "Submit" button appears
   - Click "Submit" with confirmation
   - Parcel status changes from 1 (inDelivery) → 2 (Received)
   - Dialog closes and table refreshes

---

## Data Flow

### Step 1 (Package)
- **Load**: `getGroupedImages('PARCEL', parcelId)` → Display PACKAGE_RECEIVER
- **Action**: Upload PACKING_LIST images via `uploadHandlers.upload()`
- **Save**: No database changes on Step 1 completion

### Steps 2+ (Items)
- **Load**: `getGroupedImages('ITEM', itemId)` → Display existing item images
- **Action**: 
  - Edit qty, customerFeedback, isUnpacked, iqcResult
  - Upload new item images
- **Save**: `updateItem(itemData)` with all fields
- **Final Submit**: 
  - `updateItem()` for last item
  - `updateParcel({ parcelId, status: 2 })` to mark received

---

## Data Persistence

### Save Behavior
- **Item Save** (intermediate items):
  - Updates item fields: qty, customerFeedback, isUnpacked, iqcResult, itemStatus=1
  - Sets defaults for owner/keeper/receivedDate if empty
  - Uploads images to backend
  - Moves to next item

- **Parcel Submit** (last item):
  - Saves final item data
  - Updates parcel status from 1 → 2 (Received)
  - Refreshes table to show new status

---

## Image Handling

### Image Upload Pattern
```javascript
// For Step 1 (Packing List)
uploadHandlers.upload(file, {
  moduleType: "PARCEL",
  recordId: parcelId,
  imageType: "PACKING_LIST"
})

// For Steps 2+ (Item Images)
uploadHandlers.upload(file, {
  moduleType: "ITEM",
  recordId: itemId,
  imageType: "ITEM_IMAGE"
})
```

### Image Delete Pattern
```javascript
imageManager.deleteImage(imageId, true)  // soft delete
```

### Image Loading Pattern
```javascript
getGroupedImages('PARCEL'|'ITEM', recordId)
// Returns: { code: 1, data: { TYPE: [{ id, imageUrl, mimeType, ... }] } }
```

---

## Error Handling

### Confirmation Dialogs
- **Save**: "Are you sure to save this item?"
- **Submit**: "Are you sure to submit? This will mark parcel as Received."

### Error Messages
- Image upload failures caught and displayed
- API call failures show user-friendly messages
- Loading errors with console logging for debugging

---

## Testing Checklist

- [ ] Parcel with status=1 shows Inspect button
- [ ] Click Inspect opens dialog with Step 1
- [ ] Step 1 loads and displays PACKAGE_RECEIVER images
- [ ] Can upload Packing List images in Step 1
- [ ] Next button transitions to Step 2 (first item)
- [ ] Item step shows item number and form fields
- [ ] Can edit qty, feedback, status, iqcResult
- [ ] Can upload item images
- [ ] Save button saves current item and shows confirmation
- [ ] Next button navigates between items
- [ ] Previous button goes back to previous steps
- [ ] Last item shows Submit button instead of Next
- [ ] Submit button saves last item and updates parcel status
- [ ] Table refreshes after submission showing status=2
- [ ] Cancel button at any step closes dialog without saving

---

## Browser Compatibility

- Modern browsers with ES6 support
- Vue 3.x with `<script setup>` syntax
- Element Plus v2.x components
- FormData API for file uploads

---

## Performance Considerations

- Image loading: Lazy load per item (watch-based)
- API calls: Minimal - only on explicit user actions
- No deep watchers on large arrays (uses scalar field watches)
- Image grouping reduces API request count

---

## Future Enhancements

- Bulk item inspection (select multiple items)
- Inspection templates/presets
- Inspection history/audit trail
- Email notifications on completion
- Inspection reports/summaries
- Scheduled inspections
- Integration with warehouse management system

---

## Files Modified/Created

### New Files
1. `src/components/parcel/ParcelInspect.vue`
2. `src/components/parcel/ParcelInspectStep1.vue`
3. `src/components/parcel/ParcelInspectItemStep.vue`

### Modified Files
1. `src/components/parcel/ParcelTable.vue`
   - Added Inspect button
   - Added component imports and state
   - Added props for handlers/managers

2. `src/api/parcel.js`
   - Added `updateItem()` export
   - Added `updateParcel()` export
   - Added `getParcelDetail` alias

3. `src/views/parcel/index.vue`
   - Updated ParcelTable props
   - Added @refresh listener

---

## Summary

The ParcelInspect feature provides a complete workflow for inspecting parcels in transit, capturing detailed item-level data, managing visual documentation through images, and automatically updating system status upon completion. The implementation follows Vue 3 best practices with composable architecture, reactive state management, and proper error handling throughout.
