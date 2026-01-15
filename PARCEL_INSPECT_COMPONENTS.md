# Parcel Inspection Components - Code Reference

## Component Architecture

```
ParcelInspect (Main Dialog)
├── ParcelInspectStep1 (Package Review)
└── ParcelInspectItemStep (Item Inspection) x N items
```

## Component Details

### ParcelInspect.vue

**Purpose**: Main dialog managing multi-step workflow

**Template Structure**:
```vue
<el-dialog>
  <ParcelInspectStep1 v-if="currentStep === 1" />
  <ParcelInspectItemStep v-else />
</el-dialog>
```

**State**:
- `currentStep` (ref<number>): 1 = package, 2+ = items
- `currentItemIndex` (ref<number>): 0-based item position

**Computed**:
- `itemCount`: `props.parcel.items?.length || 0`
- `currentItem`: `props.parcel.items?.[currentItemIndex.value]`

**Methods**:

```javascript
nextStep() {
  if (currentStep === 1) {
    currentStep = 2
    currentItemIndex = 0
  } else if (currentItemIndex < itemCount - 1) {
    currentItemIndex++
  }
}

previousStep() {
  if (currentStep > 2) {
    currentItemIndex--
  } else if (currentStep === 2) {
    currentStep = 1
  }
}

async handleSave(itemData) {
  // Show confirmation
  await ElMessageBox.confirm('Are you sure to save this item?')
  
  // Save item
  await saveItemData(itemData)
  ElMessage.success('Item saved')
  
  // Move to next if available
  if (currentItemIndex < itemCount - 1) {
    currentItemIndex++
  }
}

async handleSubmit(itemData) {
  // Show confirmation
  await ElMessageBox.confirm('Submit? This will mark parcel as Received.')
  
  // Save final item
  await saveItemData(itemData)
  
  // Update parcel status
  await updateParcel({ parcelId: parcel.parcelId, status: 2 })
  
  ElMessage.success('Parcel received successfully')
  emit('refresh')
  emit('update:visible', false)
}

async saveItemData(itemData) {
  const item = currentItem.value
  const updateData = {
    itemId: item.itemId,
    qty: itemData.qty,
    customerFeedback: itemData.customerFeedback,
    isUnpacked: itemData.isUnpacked,
    iqcResult: itemData.iqcResult,
    itemStatus: 1,
  }
  
  // Set defaults if not present
  if (!item.ownerId) updateData.ownerId = parcel.ownerId
  if (!item.keeperId) updateData.keeperId = currentUser.userId
  if (!item.receiveParcelId) {
    updateData.receiveParcelId = parcel.parcelId
    updateData.receivePackageNo = parcel.packageNo
  }
  if (!item.receivedDate) {
    updateData.receivedDate = new Date().toISOString().split('T')[0]
  }
  
  await updateItem(updateData)
}
```

**Emits**:
- `update:visible` (Boolean): Close dialog
- `refresh` (): Trigger parent data refresh

---

### ParcelInspectStep1.vue

**Purpose**: Package review and packing list image management

**State**:
```javascript
const receiverImages = ref([])        // PACKAGE_RECEIVER images
const packingListImages = reactive([]) // PACKING_LIST images
const packingFileInput = ref(null)    // File input ref
```

**Key Methods**:

```javascript
async loadImages() {
  if (!parcel.parcelId) return
  
  const response = await getGroupedImages('PARCEL', parcel.parcelId)
  
  if (response.code === 1 && response.data) {
    receiverImages.value = response.data.PACKAGE_RECEIVER || []
    packingListImages.value = response.data.PACKING_LIST || []
  }
}

async onPackingImageSelected(event) {
  const files = Array.from(event.target.files || [])
  
  for (const file of files) {
    const tmpUrl = URL.createObjectURL(file)
    const imgEntry = { url: tmpUrl, uploading: true, file }
    packingListImages.push(imgEntry)
    
    try {
      const uploadResponse = await uploadHandlers.upload(file, {
        moduleType: 'PARCEL',
        recordId: parcel.parcelId,
        imageType: 'PACKING_LIST',
      })
      
      imgEntry.id = uploadResponse.recordId || uploadResponse.id
      imgEntry.url = uploadResponse.imageUrl || uploadResponse.url
      imgEntry.uploaded = true
    } catch (e) {
      packingListImages.splice(packingListImages.indexOf(imgEntry), 1)
      ElMessage.error('Failed to upload image')
    } finally {
      imgEntry.uploading = false
    }
  }
  
  event.target.value = ''
}

async removePackingImage(idx) {
  const img = packingListImages[idx]
  
  if (img.id && imageManager?.deleteImage) {
    await imageManager.deleteImage(img.id, true)
  }
  
  packingListImages.splice(idx, 1)
}

previewImage(url) {
  window.open(url, '_blank')
}
```

**UI Sections**:
1. Parcel Info (3 columns): packageNo, status, processId
2. PACKAGE_RECEIVER Images (read-only, 3 per row)
3. PACKING_LIST Images (editable, 3 per row)
4. Buttons: Cancel, Next

---

### ParcelInspectItemStep.vue

**Purpose**: Item-by-item inspection and data capture

**State**:
```javascript
const formData = reactive({
  qty: null,
  customerFeedback: '',
  isUnpacked: 1,        // 0=Unpacked, 1=Packed
  iqcResult: 'No Defects',
  newImages: [],
})

const itemImages = ref([])      // Display images
const itemFileInput = ref(null) // File input ref
```

**Key Methods**:

```javascript
async loadItemImages() {
  if (!item.itemId) return
  
  try {
    const response = await getGroupedImages('ITEM', item.itemId)
    
    if (response.code === 1 && response.data) {
      itemImages.value = []
      
      Object.keys(response.data).forEach(imageType => {
        const images = response.data[imageType]
        if (Array.isArray(images)) {
          images.forEach(img => {
            itemImages.value.push({
              id: img.id,
              url: img.imageUrl || img.url,
              name: img.originalName || img.fileName,
              uploaded: true,
            })
          })
        }
      })
    }
  } catch (error) {
    console.error('Failed to load item images:', error)
  }
}

initFormData() {
  formData.qty = item.qty || null
  formData.customerFeedback = item.customerFeedback || ''
  formData.isUnpacked = item.isUnpacked !== undefined ? item.isUnpacked : 1
  formData.iqcResult = item.iqcResult || 'No Defects'
  formData.newImages = []
}

async onItemImageSelected(event) {
  const files = Array.from(event.target.files || [])
  
  for (const file of files) {
    const tmpUrl = URL.createObjectURL(file)
    const imgEntry = { url: tmpUrl, uploading: true, file }
    itemImages.value.push(imgEntry)
    formData.newImages.push(file)
    
    try {
      const uploadResponse = await uploadHandlers.upload(file, {
        moduleType: 'ITEM',
        recordId: item.itemId,
        imageType: 'ITEM_IMAGE',
      })
      
      imgEntry.id = uploadResponse.recordId || uploadResponse.id
      imgEntry.url = uploadResponse.imageUrl || uploadResponse.url
      imgEntry.uploaded = true
    } catch (e) {
      itemImages.value.splice(itemImages.value.indexOf(imgEntry), 1)
      formData.newImages = formData.newImages.filter(f => f !== file)
      ElMessage.error('Failed to upload image')
    } finally {
      imgEntry.uploading = false
    }
  }
  
  event.target.value = ''
}

async removeItemImage(idx) {
  const img = itemImages.value[idx]
  
  try {
    if (img.id && imageManager?.deleteImage) {
      await imageManager.deleteImage(img.id, true)
    }
    itemImages.value.splice(idx, 1)
  } catch (error) {
    ElMessage.error('Failed to delete image')
  }
}

previewImage(url) {
  window.open(url, '_blank')
}

handlePrevious() {
  emit('previous')
}

handleNext() {
  emit('next')
}

handleSave() {
  if (!formData.qty) {
    ElMessage.warning('Please enter quantity')
    return
  }
  emit('save', formData)
}

handleSubmit() {
  if (!formData.qty) {
    ElMessage.warning('Please enter quantity')
    return
  }
  emit('submit', formData)
}

handleCancel() {
  emit('cancel')
}
```

**Lifecycle**:
```javascript
onMounted(() => {
  initFormData()
  loadItemImages()
})

watch(() => item.itemId, () => {
  initFormData()
  loadItemImages()
})
```

**UI Sections**:
1. Step Indicator: "Item X of Y"
2. Row 1: itemNo (read-only), qty (input)
3. Row 2: Customer Feedback (textarea)
4. Row 3: isUnpacked (select), iqcResult (input)
5. Row 4: Item Images (flex layout)
6. Buttons: Cancel, Previous, Next/Save/Submit

---

## Props Flow

```
ParcelInspect
├─ visible: Boolean ✓
├─ parcel: Object {
│  ├─ parcelId ✓
│  ├─ packageNo ✓
│  ├─ status: 1 ✓
│  ├─ itemList: Array [
│  │  ├─ itemId ✓
│  │  ├─ itemNo ✓
│  │  ├─ qty ✓
│  │  ├─ customerFeedback ✓
│  │  ├─ isUnpacked ✓
│  │  └─ ...other fields
│  │ ]
│  └─ ...other fields
├─ users: Array ✓
├─ token: String ✓
├─ currentUser: Object { userId, name, ... } ✓
├─ uploadHandlers: Object { upload() } ✓
└─ imageManager: Object { deleteImage() } ✓
```

## API Contract

### Input: updateItem()
```javascript
{
  itemId: string (required),
  qty: number,
  customerFeedback: string,
  isUnpacked: 0 | 1,
  iqcResult: string,
  itemStatus: 1,
  ownerId?: string,
  keeperId?: string,
  receiveParcelId?: string,
  receivePackageNo?: string,
  receivedDate?: string (YYYY-MM-DD),
}
```

### Input: updateParcel()
```javascript
{
  parcelId: string (required),
  status: 2,
}
```

### Output: getGroupedImages()
```javascript
{
  code: 1 | 0,
  data: {
    [TYPE]: [
      {
        id: string,
        imageUrl: string,
        mimeType: string,
        originalName: string,
        ...
      }
    ]
  }
}
```

### Output: uploadHandlers.upload()
```javascript
{
  recordId: string,
  imageUrl: string,
  id: string,
  ...
}
```

---

## Lifecycle Sequence

```
1. User clicks Inspect button
   ↓
2. ParcelInspect dialog opens
   - Load parcel detail (if needed)
   - Set currentStep = 1
   - Set currentItemIndex = 0
   ↓
3. ParcelInspectStep1 renders
   - Load PACKAGE_RECEIVER images
   - Load PACKING_LIST images
   ↓
4. User clicks Next
   - currentStep = 2
   - currentItemIndex = 0
   ↓
5. ParcelInspectItemStep renders (Item 1)
   - Load item images
   - Initialize form data
   ↓
6. User edits and clicks Save/Next
   - If Save: saveItemData() → stay on item
   - If Next: validateData() → advance to next item
   ↓
7. Repeat step 5-6 for remaining items
   ↓
8. On last item, user clicks Submit
   - Show confirmation
   - saveItemData() for last item
   - updateParcel(status: 2)
   - emit('refresh')
   - Close dialog
   ↓
9. Parent component executes search()
   - Table refreshes showing new status
```

---

## Error Scenarios

| Scenario | Handling |
|----------|----------|
| Image upload fails | Remove from list, show error message |
| API call fails | Show error message, allow retry |
| User cancels confirmation | Dialog stays open, no changes |
| Missing required field | Show validation warning |
| Item missing itemId | Skip image loading |

---

## Testing Helpers

### Mock Parcel
```javascript
{
  parcelId: 'parcel-123',
  packageNo: 'PKG-001',
  status: 1,
  itemList: [
    {
      itemId: 'item-1',
      itemNo: 'A123',
      qty: 10,
      customerFeedback: '',
      isUnpacked: 1,
    },
    {
      itemId: 'item-2',
      itemNo: 'B456',
      qty: 5,
      customerFeedback: '',
      isUnpacked: 1,
    }
  ]
}
```

### Mock Handlers
```javascript
const uploadHandlers = {
  upload: async (file, config) => ({
    recordId: 'img-' + Math.random(),
    imageUrl: URL.createObjectURL(file),
    id: 'img-' + Math.random(),
  })
}

const imageManager = {
  deleteImage: async (id, soft) => {
    console.log('Deleted:', id)
  }
}
```

---

**Version**: 1.0
**Last Updated**: 2026-01-15
