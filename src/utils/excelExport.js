import * as XLSX from 'xlsx'

export function exportJsonToXlsx(jsonArray = [], sheetName = 'Sheet1', fileName = null) {
  try {
    if (!Array.isArray(jsonArray)) jsonArray = []
    const worksheet = XLSX.utils.json_to_sheet(jsonArray)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName)

    const timestamp = new Date().toISOString().split('T')[0]
    const outName = fileName || `${sheetName}_${timestamp}.xlsx`
    XLSX.writeFile(workbook, outName)
    return outName
  } catch (err) {
    console.error('exportJsonToXlsx error', err)
    throw err
  }
}
