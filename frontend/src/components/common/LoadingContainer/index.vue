<script lang="ts" setup>
import { Spin } from 'ant-design-vue';

interface IProps {
  loading: boolean;
}

const props = defineProps<IProps>();
</script>

<template>
  <div v-if="props.loading" class="flex justify-center px-0 py-4">
    <slot name="loading">
      <Spin />
    </slot>
  </div>
  <slot v-else />
</template>
