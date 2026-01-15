# Parcel Inspection Feature - Visual Architecture & Flow Diagrams

---

## 🏗️ System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Parcel Management System                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌────────────────────────────────────────────────────────────┐   │
│  │  ParcelTable (Component)                                   │   │
│  │  ┌──────────────────────────────────────────────────────┐ │   │
│  │  │ Parcels List                                         │ │   │
│  │  │ ┌─────────────────────────────────────────────────┐ │ │   │
│  │  │ │ [Edit] [Delete] [Export] [Inspect] (status=1)│ │ │   │
│  │  │ └─────────────────────────────────────────────────┘ │ │   │
│  │  └──────────────────────────────────────────────────────┘ │   │
│  │                         ▼                                  │   │
│  │  ┌──────────────────────────────────────────────────────┐ │   │
│  │  │  ParcelInspect Dialog (Multi-Step)                  │ │   │
│  │  │  ┌──────────────────────────────────────────────┐  │ │   │
│  │  │  │  Step 1: Package Review                      │  │ │   │
│  │  │  │  ParcelInspectStep1.vue                      │  │ │   │
│  │  │  │  - View packageNo, status, processId         │  │ │   │
│  │  │  │  - View PACKAGE_RECEIVER images (read-only)  │  │ │   │
│  │  │  │  - Upload PACKING_LIST images                │  │ │   │
│  │  │  │  [Cancel]                        [Next]      │  │ │   │
│  │  │  └──────────────────────────────────────────────┘  │ │   │
│  │  │                      ▼                             │ │   │
│  │  │  ┌──────────────────────────────────────────────┐  │ │   │
│  │  │  │  Steps 2-N: Item Inspection (Loop)          │  │ │   │
│  │  │  │  ParcelInspectItemStep.vue                   │  │ │   │
│  │  │  │  - Item X of Y                               │  │ │   │
│  │  │  │  - Edit: Qty, Feedback, Status, IQC Result  │  │ │   │
│  │  │  │  - Upload: Item Images                       │  │ │   │
│  │  │  │  [Cancel][Previous]     [Save/Next/Submit]   │  │ │   │
│  │  │  └──────────────────────────────────────────────┘  │ │   │
│  │  │                      ▼                             │ │   │
│  │  │  On Submit: Update Parcel Status 1 → 2            │ │   │
│  │  │  Emit: refresh → ParcelTable.search()             │ │   │
│  │  └──────────────────────────────────────────────────────┘ │   │
│  └────────────────────────────────────────────────────────────┘   │
│                                                                      │
│  ┌────────────────────────────────────────────────────────────┐   │
│  │  Backend APIs                                              │   │
│  │  GET /parcels              - List parcels                 │   │
│  │  GET /image/manage/grouped - Get grouped images           │   │
│  │  POST /upload              - Upload images                │   │
│  │  DELETE /image             - Delete images                │   │
│  │  PUT /items                - Update item data             │   │
│  │  PUT /parcels              - Update parcel status         │   │
│  └────────────────────────────────────────────────────────────┘   │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Component Hierarchy & Props Flow

```
parcel/index.vue (Parent View)
│
├─ token ────────────────────────┐
├─ uploadHandlers ───────────┐   │
├─ imageManager ──────────┐  │   │
│                          │  │   │
▼                          │  │   │
ParcelTable                │  │   │
│                          │  │   │
├─ Props (from parent):    │  │   │
│  ├─ parcels             │  │   │
│  ├─ users               │  │   │
│  ├─ currentUser         │  │   │
│  ├─ token          ◄────┘  │   │
│  ├─ uploadHandlers ◄───────┘   │
│  └─ imageManager ◄─────────────┘
│
├─ State:
│  ├─ inspectDialogVisible
│  └─ inspectParcel
│
├─ Methods:
│  └─ handleInspect(parcel)
│                ▼
└──> ParcelInspect (Dialog)
     │
     ├─ Props (from ParcelTable):
     │  ├─ visible (v-model)
     │  ├─ parcel { parcelId, packageNo, status, itemList[] }
     │  ├─ users[]
     │  ├─ token
     │  ├─ currentUser
     │  ├─ uploadHandlers
     │  └─ imageManager
     │
     ├─ State:
     │  ├─ currentStep (1 or 2+)
     │  └─ currentItemIndex (0-based)
     │
     ├─ Child Components:
     │  ├─ ParcelInspectStep1 (if currentStep === 1)
     │  │  ├─ Props: parcel, token, currentUser, handlers
     │  │  ├─ State: receiverImages[], packingListImages[]
     │  │  └─ Events: @next, @cancel
     │  │
     │  └─ ParcelInspectItemStep (if currentStep > 1)
     │     ├─ Props: parcel, item, itemIndex, totalItems, handlers
     │     ├─ State: formData{}, itemImages[]
     │     └─ Events: @previous, @next, @save, @submit, @cancel
```

---

## 📊 Data Flow Diagram

```
1. USER CLICKS INSPECT BUTTON
   │
   ▼
   ParcelTable.handleInspect(parcel)
   │
   ├─ Load: getParcelDetail(parcelId) ◄─ API
   ├─ Set: inspectParcel = parcel detail
   ├─ Show: ParcelInspect dialog
   │
   ▼
2. STEP 1: PACKAGE REVIEW
   │
   ├─ Load: getGroupedImages('PARCEL', parcelId) ◄─ API
   │        Returns: { PACKAGE_RECEIVER[], PACKING_LIST[] }
   │
   ├─ Display: PACKAGE_RECEIVER images (read-only)
   │
   ├─ User Upload: PACKING_LIST images
   │  ├─ onPackingImageSelected(file)
   │  │  ├─ File → uploadHandlers.upload() ◄─ API
   │  │  ├─ Image added to packingListImages[]
   │  │  └─ UI updates
   │
   ├─ User Delete: PACKING_LIST image
   │  ├─ removePackingImage(index)
   │  │  ├─ imageManager.deleteImage(id) ◄─ API
   │  │  └─ Remove from UI
   │
   ├─ User Click: Next
   │  ├─ currentStep = 2
   │  ├─ currentItemIndex = 0
   │
   ▼
3. STEPS 2-N: ITEM INSPECTION (LOOP)
   │
   ├─ Load: getGroupedImages('ITEM', itemId) ◄─ API
   │        Returns: { [TYPE]: [images] }
   │
   ├─ Display: Item form
   │  ├─ ItemNo (read-only)
   │  ├─ Qty (editable input)
   │  ├─ CustomerFeedback (editable textarea)
   │  ├─ IsUnpacked (editable select)
   │  └─ IQCResult (editable input)
   │
   ├─ Display: Existing item images
   │
   ├─ User Upload: Item images
   │  ├─ onItemImageSelected(file)
   │  │  ├─ File → uploadHandlers.upload() ◄─ API
   │  │  ├─ Image added to itemImages[]
   │  │  └─ newImages[] for later tracking
   │
   ├─ User Delete: Item image
   │  ├─ removeItemImage(index)
   │  │  ├─ imageManager.deleteImage(id) ◄─ API
   │  │  └─ Remove from UI
   │
   ├─ User Click: Save (intermediate items)
   │  ├─ ElMessageBox.confirm('Save?')
   │  │  ├─ User confirms
   │  │  │  ├─ saveItemData(formData)
   │  │  │  │  ├─ updateItem({
   │  │  │  │  │    itemId, qty, customerFeedback,
   │  │  │  │  │    isUnpacked, iqcResult, itemStatus: 1,
   │  │  │  │  │    ownerId, keeperId, receiveParcelId, receivedDate
   │  │  │  │  │  }) ◄─ API
   │  │  │  │  └─ Return to this item
   │  │  │  │
   │  │  │  └─ ElMessage.success()
   │  │  │
   │  │  └─ User cancels: No action
   │
   ├─ User Click: Next (intermediate items)
   │  ├─ Validate: Qty required
   │  ├─ currentItemIndex++
   │  └─ Load next item
   │
   ├─ User Click: Previous
   │  ├─ currentItemIndex--
   │  └─ Load previous item
   │
   ▼ (Last Item Only)
4. FINAL SUBMISSION
   │
   ├─ User Click: Submit
   │  ├─ ElMessageBox.confirm('Submit? Mark as Received?')
   │  │  ├─ User confirms
   │  │  │  ├─ saveItemData(formData)
   │  │  │  │  ├─ updateItem({...}) ◄─ API
   │  │  │  │  └─ Save last item
   │  │  │  │
   │  │  │  ├─ updateParcel({ parcelId, status: 2 }) ◄─ API
   │  │  │  │  └─ Mark as Received
   │  │  │  │
   │  │  │  ├─ ElMessage.success('Parcel received')
   │  │  │  │
   │  │  │  ├─ emit('refresh')
   │  │  │  │  └─ ParcelTable.search() ◄─ Reload parcel list
   │  │  │  │
   │  │  │  └─ Close dialog
   │  │  │
   │  │  └─ User cancels: No action
   │
   ▼
5. TABLE REFRESHED
   │
   ├─ Parcel status: 1 → 2 (Received)
   └─ Inspect button: Hidden (status ≠ 1)
```

---

## 🔀 State Transitions

```
┌─────────────────────┐
│  ParcelTable Shown  │
│  (status = 1)       │
└──────────┬──────────┘
           │ Click Inspect
           ▼
┌─────────────────────────────┐
│  ParcelInspect Dialog Opens  │
│  currentStep = 1             │
│  currentItemIndex = 0        │
└──────────┬──────────────────┘
           │ ParcelInspectStep1 Displayed
           ├─ View PACKAGE_RECEIVER (read-only)
           ├─ Upload PACKING_LIST (editable)
           │ Click Next
           │
           ▼
┌─────────────────────────────┐
│  ParcelInspectItemStep      │
│  currentStep = 2            │
│  currentItemIndex = 0       │
│  (Item 1 of N)              │
└──────────┬──────────────────┘
           │ User edits item 1
           ├─ Qty (editable)
           ├─ Feedback (editable)
           ├─ Status (editable)
           ├─ IQC Result (editable)
           ├─ Images (upload/delete)
           │
           ├─ Click Save → saveItemData() → updateItem() API
           │                                  ↓
           │                         Item 1 saved
           │                         Stay on Item 1
           │
           ├─ Click Next → Move to Item 2
           │
           ▼
     (Repeat for Items 2-N-1)
           │
           ▼
┌─────────────────────────────────────┐
│  ParcelInspectItemStep              │
│  currentStep = 2                    │
│  currentItemIndex = N-1             │
│  (Item N of N - LAST ITEM)          │
└──────────┬────────────────────────┘
           │ User edits item N
           │ Click Submit
           │  └─ Confirmation dialog
           │     └─ User confirms
           │        ├─ saveItemData() → updateItem() API
           │        ├─ updateParcel() API → status: 2
           │        └─ emit('refresh')
           │           └─ search()
           │
           ▼
┌──────────────────────────────┐
│  ParcelTable Refreshed       │
│  Parcel status: 1 → 2        │
│  Inspect button: Hidden      │
└──────────────────────────────┘
```

---

## 🖼️ UI Layout Diagram

### Step 1: Package Review
```
┌─────────────────────────────────────────────────────────┐
│ ParcelInspect Dialog                                    │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ ┌─ PARCEL INFO (Read-Only) ──────────────────────────┐ │
│ │ PackageNo: PKG-001  │  Status: inDelivery  │ ProcID│ │
│ └────────────────────────────────────────────────────┘ │
│                                                         │
│ ┌─ APPEARANCE AFTER RECEIVED (Read-Only) ────────────┐ │
│ │ [IMG] [IMG] [IMG]  ← scroll right →                │ │
│ └────────────────────────────────────────────────────┘ │
│                                                         │
│ ┌─ PACKING LIST (Editable) ──────────────────────────┐ │
│ │ [IMG] [IMG] [+Upload]  ← can add/delete            │ │
│ └────────────────────────────────────────────────────┘ │
│                                                         │
│                        [Cancel]  [Next →]               │
└─────────────────────────────────────────────────────────┘
```

### Steps 2+: Item Inspection
```
┌─────────────────────────────────────────────────────────┐
│ ParcelInspect Dialog                                    │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ Item 1 of 3                                             │
│                                                         │
│ ┌─────────────────────────────────────────────────────┐│
│ │ ItemNo: A123 (read-only)  │  Qty: [      10      ] ││
│ └─────────────────────────────────────────────────────┘│
│                                                         │
│ ┌─────────────────────────────────────────────────────┐│
│ │ Customer Feedback:                                  ││
│ │ [                                                   ││
│ │  Item is in good condition                          ││
│ │                                                    ] ││
│ └─────────────────────────────────────────────────────┘│
│                                                         │
│ ┌─────────────────────────────────────────────────────┐│
│ │ Unpacked: [Packed ▼]  │  IQCResult: [No Defects  ]  ││
│ └─────────────────────────────────────────────────────┘│
│                                                         │
│ ┌─ ITEM IMAGES ──────────────────────────────────────┐│
│ │ [IMG] [IMG] [+Upload]                              ││
│ └────────────────────────────────────────────────────┘│
│                                                         │
│    [Cancel]  [← Previous]  [Save]  [Next →]            │
│                                     (or [Submit])       │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## 🔀 Event Flow Diagram

```
User Action                Component               Method              API Call
────────────────────────────────────────────────────────────────────────────────

Click Inspect     ParcelTable.handleInspect()
                  │
                  └─ getParcelDetail()  ◄────────── GET /parcels/:id
                  │
                  └─ Open ParcelInspect dialog
                     └─ currentStep = 1


[Step 1 Displayed]

Upload Image      ParcelInspectStep1
                  │
                  └─ onPackingImageSelected()
                     │
                     └─ uploadHandlers.upload() ◄── POST /upload
                        │
                        └─ Add to packingListImages[]


Delete Image      ParcelInspectStep1
                  │
                  └─ removePackingImage()
                     │
                     └─ imageManager.deleteImage() ◄─ DELETE /image
                        │
                        └─ Remove from UI


Click Next        ParcelInspectStep1
                  │
                  └─ @next event
                     │
                     └─ ParcelInspect.nextStep()
                        │
                        └─ currentStep = 2
                           currentItemIndex = 0


[Steps 2+ Displayed]

Edit Item         ParcelInspectItemStep
                  │
                  ├─ Qty: v-model binding → formData.qty
                  ├─ Feedback: v-model → formData.customerFeedback
                  ├─ Status: v-model → formData.isUnpacked
                  └─ IQC: v-model → formData.iqcResult


Upload Image      ParcelInspectItemStep
                  │
                  └─ onItemImageSelected()
                     │
                     └─ uploadHandlers.upload() ◄── POST /upload
                        │
                        └─ Add to itemImages[]


Click Save        ParcelInspectItemStep
                  │
                  └─ @save event
                     │
                     └─ ParcelInspect.handleSave()
                        │
                        ├─ ElMessageBox.confirm('Save?')
                        │
                        └─ saveItemData()
                           │
                           └─ updateItem() ◄────── PUT /items
                              │
                              └─ ElMessage.success()


Click Next        ParcelInspectItemStep
                  │
                  └─ @next event
                     │
                     └─ ParcelInspect.nextStep()
                        │
                        └─ currentItemIndex++
                           (Load next item)


Click Previous    ParcelInspectItemStep
                  │
                  └─ @previous event
                     │
                     └─ ParcelInspect.previousStep()
                        │
                        └─ currentItemIndex--
                           (Load previous item)


Click Submit      ParcelInspectItemStep
(Last Item)       │
                  └─ @submit event
                     │
                     └─ ParcelInspect.handleSubmit()
                        │
                        ├─ ElMessageBox.confirm('Submit?')
                        │
                        ├─ saveItemData()
                        │  │
                        │  └─ updateItem() ◄────── PUT /items
                        │
                        └─ updateParcel() ◄────── PUT /parcels
                           │
                           ├─ emit('refresh')
                           │  │
                           │  └─ ParcelTable.search() ◄ GET /parcels
                           │
                           └─ Close dialog
                              └─ Parcel status: 1 → 2
                                 Inspect button hidden
```

---

## 📱 Responsive Breakpoints

```
Desktop (≥768px)
├─ Two-column layout (left: info, right: images)
├─ 3 images per row
├─ Full-width buttons

Tablet (480px-767px)
├─ Stacked layout (info above images)
├─ 2 images per row
├─ Wrapped buttons

Mobile (≤479px)
├─ Full-width stacked layout
├─ 1 image per row
├─ Full-width buttons
└─ Horizontal scroll for image list
```

---

## 🔐 Permission & Visibility Rules

```
ParcelTable
├─ Is parcel visible to user?
│  ├─ YES: Show row
│  │  ├─ Edit button: Visible if editPermission && status ≠ 2
│  │  ├─ Delete button: Visible if deletePermission && status ≠ 2
│  │  ├─ Export button: Always visible if viewPermission
│  │  ├─ Inspect button: Visible if viewPermission && status === 1
│  │  │                  └─ Conditional render: v-if="scope.row.status === 1"
│  │  └─ Detail (via packageNo link): Visible
│  │
│  └─ NO: Hide row
│     └─ Show "No permission" message
```

---

## 🔀 Workflow State Machine

```
                    ┌─ Package Review ─┐
                    │   (Step 1)       │
                    │  DISPLAY MODE    │
                    │  - View imgs     │
                    │  - Upload imgs   │
                    └────────┬────────┘
                             │
                             │ Next
                             ▼
                    ┌─ Item 1 Inspect ─┐
                    │   (Step 2)       │
                    │  EDIT MODE       │
                    │  - Edit form     │
                    │  - Upload imgs   │
                    └────────┬────────┘
                             │
            ┌────────────────┼────────────────┐
            │                │                │
            │ Save           │ Next           │
            ▼                ▼                │
         DONE            Item 2 Inspect      │
                            ...              │
                            │                │
                            │ Next           │
                            ▼                │
                      ┌─ Item N Inspect ─┐  │
                      │  (Last Item)     │  │
                      │  EDIT MODE       │  │
                      └────────┬────────┘   │
                               │            │
                     ┌─────────┴─────────┐  │
                     │                   │  │
                  Submit             Previous
                     │                   │
                     ▼                   ▼
              UPDATE STATUS          Step N-1
              1 → 2 (Received)
              │
              ├─ Close Dialog
              ├─ Refresh Table
              ├─ Hide Inspect btn
              └─ Show Success Msg
```

---

## 💾 Data Persistence Points

```
User Action                Database Operation
────────────────────────────────────────────────────
Save Item (intermediate)   UPDATE items SET qty=?, 
                           customerFeedback=?, ...
                           WHERE itemId=?

Submit Item (last)         UPDATE items SET qty=?, 
                           customerFeedback=?, ...
                           WHERE itemId=?
                           +
                           UPDATE parcels SET status=2
                           WHERE parcelId=?

Upload Image (any step)    INSERT images ...
                           or UPDATE existing

Delete Image (any step)    SOFT DELETE image
                           (mark as deleted, not removed)
```

---

**Visual Architecture Complete**  
*All diagrams reference the implementation correctly.*
