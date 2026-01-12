// utils/dateWatch.js

import { watch } from 'vue';

export function createDateRangeWatch(dateField, beginField, endField, targetObj) {
  return watch(() => targetObj[dateField], (newVal) => {
    if (newVal?.length === 2) {
      targetObj[beginField] = newVal[0];
      targetObj[endField] = newVal[1];
    } else {
      targetObj[beginField] = '';
      targetObj[endField] = '';
    }
  });
}