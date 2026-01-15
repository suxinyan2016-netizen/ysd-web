# Parcel Inspection Feature - Quick Reference

## 🎯 Feature Overview
Multi-step parcel inspection workflow for parcels with `status=1` (inDelivery). Users inspect parcels item-by-item and update parcel status to `2` (Received) upon completion.

## 📁 Files Created

| File | Purpose |
|------|---------|
| `ParcelInspect.vue` | Main dialog container - manages workflow and API calls |
| `ParcelInspectStep1.vue` | Step 1 - Package review with packing list upload |
| `ParcelInspectItemStep.vue` | Steps 2+ - Item inspection with data capture |

## 🔗 Integration Points

### ParcelTable.vue
```vue
<!-- Inspect button (status=1 only) -->
<el-button
  v-if="scope.row.status === 1"
  type="warning"
  size="small"
  @click="handleInspect(scope.row)"
>
  <el-icon><Edit /></el-icon> Inspect
</el-button>

<!-- Dialog -->
<ParcelInspect
  v-model:visible="inspectDialogVisible"
  :parcel="inspectParcel"
  :users="users"
  :token="token"
  :current-user="currentUser"
  :upload-handlers="uploadHandlers"
  :image-manager="imageManager"
  @refresh="emit('refresh')"
/>
```

### Parent View (parcel/index.vue)
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

## 🔄 Workflow Stages

| Step | Component | Action |
|------|-----------|--------|
| 1 | ParcelInspectStep1 | View package info, upload packing list images |
| 2-N | ParcelInspectItemStep | Edit item qty/feedback/status, upload images |
| Final | ParcelInspect | Submit → update parcel status 1→2 |

## 📊 Data Flow

### Step 1: Load Images
```javascript
getGroupedImages('PARCEL', parcelId)
  ↓
Display: PACKAGE_RECEIVER (read-only) + PACKING_LIST (editable)
```

### Steps 2+: Item Inspection
```javascript
// Load
getGroupedImages('ITEM', itemId)

// Save
updateItem({
  itemId, qty, customerFeedback, isUnpacked, 
  iqcResult, itemStatus: 1,
  ownerId, keeperId, receiveParcelId, receivedDate
})

// Final Submit
updateParcel({ parcelId, status: 2 })
```

## 🎨 UI Layout

### Step 1 (Package)
```
┌─ Parcel Info (read-only) ───────────────────┐
│ PackageNo: XXX  Status: inDelivery  ProcID: Y│
└─────────────────────────────────────────────┘
┌─ Appearance after Received (read-only) ─────┐
│ [IMG] [IMG] [IMG]  ← scroll                  │
└─────────────────────────────────────────────┘
┌─ Packing List (editable) ───────────────────┐
│ [IMG] [IMG] [+Upload]                       │
└─────────────────────────────────────────────┘
[Cancel]                               [Next]
```

### Steps 2+ (Item)
```
Item X of Y
┌─────────────────────────────────────────────┐
│ ItemNo: A123          Qty: [   10   ]       │
│ CustomerFeedback: [textarea                 │
│                    multiple lines]          │
│ UnpackedStatus: [Packed ▼]  IQCResult: [OK] │
│ Item Images: [IMG] [IMG] [+Upload]          │
└─────────────────────────────────────────────┘
[Cancel] [Previous]                [Save] [Submit]
```

## 📌 Key Props

### ParcelInspect
- `visible`: Boolean - dialog visibility
- `parcel`: Object - { parcelId, packageNo, status, itemList, ... }
- `users`: Array - available users
- `token`: String - auth token
- `currentUser`: Object - { userId, name, ... }
- `uploadHandlers`: Object - { upload(file, config) }
- `imageManager`: Object - { deleteImage(id, soft) }

### ParcelInspectStep1
- `parcel`: Object
- `token`, `currentUser`, `uploadHandlers`, `imageManager`

### ParcelInspectItemStep
- `parcel`, `item`: Objects
- `itemIndex`, `totalItems`: Numbers
- Standard props (token, currentUser, handlers)

## 🔐 Permissions

- Inspect button visible only when `status === 1` (inDelivery)
- Other permission checks inherited from ParcelTable

## 💾 Database Updates

### On Save (intermediate items)
```json
{
  "itemId": "123",
  "qty": 10,
  "customerFeedback": "Good condition",
  "isUnpacked": 1,
  "iqcResult": "No Defects",
  "itemStatus": 1,
  "ownerId": "5",
  "keeperId": "3",
  "receiveParcelId": "parcel123",
  "receivedDate": "2026-01-15"
}
```

### On Submit (parcel)
```json
{
  "parcelId": "parcel123",
  "status": 2
}
```

## 🖼️ Image Handling

### Upload
- Step 1: `moduleType: "PARCEL"`, `imageType: "PACKING_LIST"`
- Steps 2+: `moduleType: "ITEM"`, `imageType: "ITEM_IMAGE"`

### Delete
```javascript
imageManager.deleteImage(imageId, true)  // soft delete
```

### Load
```javascript
getGroupedImages('PARCEL'|'ITEM', recordId)
// Returns: { code: 1, data: { TYPE: [...images] } }
```

## 🔔 Confirmation Dialogs

**Save Confirmation**
- Message: "Are you sure to save this item?"
- Action: Save current item, advance if not last item

**Submit Confirmation**
- Message: "Are you sure to submit? This will mark parcel as Received."
- Action: Save item + update parcel status

## ✅ Testing Checklist

- [ ] Inspect button appears only for status=1 parcels
- [ ] Clicking Inspect opens Step 1 dialog
- [ ] Step 1 loads and displays PACKAGE_RECEIVER images
- [ ] Can upload Packing List images
- [ ] Next button navigates to Step 2 (Item 1)
- [ ] Item form shows all fields
- [ ] Can upload item images
- [ ] Save button saves and shows confirmation
- [ ] Next/Previous navigate through items
- [ ] Submit button on last item
- [ ] Submit updates parcel status to 2
- [ ] Table refreshes showing new status
- [ ] Cancel closes without saving

## 🚀 API Endpoints Required

### Backend Endpoints
- `PUT /items` - Update item inspection data
- `PUT /parcels` - Update parcel status
- `GET /image/manage/grouped?moduleType=...&recordId=...` - Fetch grouped images
- `POST /upload` - Upload files (via uploadHandlers)

## 🔧 Configuration

No additional configuration needed. Uses existing:
- `useParcel` composable (getParcelDetail function)
- `useFileUpload` composable (uploadHandlers, imageManager)
- Element Plus v2.x components

## 📝 Notes

- All image URLs are handled through `getGroupedImages` API
- Inspection is non-blocking - can cancel at any step
- Status automatically changed from 1→2 only on final submission
- Images are persisted immediately on upload (not in batch)
- Each item defaults owner/keeper/dates from parcel if not set

---

**Status**: ✅ Implementation Complete
**Last Updated**: 2026-01-15
**Version**: 1.0
