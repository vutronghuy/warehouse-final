<template>
  <div class="flex bg-ghtk text-white" :style="customStyles">
    <div class="m-auto text-white font-medium">{{ getFirstLetter() }}</div>
  </div>
</template>

<script lang="ts" setup>
import { size } from 'lodash';
import { asciify } from '@/helpers';
import { StyleValue } from 'vue';

const props = withDefaults(defineProps<{ name?: string; customStyles: Partial<StyleValue> }>(), {
  name: '',
});

function getFirstLetter() {
  if (props.name) {
    const str = asciify(props.name).trim().split(' ');

    if (size(str) === 1) {
      return (str[0].charAt(0) + str[0].charAt(1)).toUpperCase();
    }

    return (str[0].charAt(0) + str[size(str) - 1].charAt(0)).toUpperCase();
  }

  return 'NF';
}
</script>
