<script setup lang="ts">
import { watch, ref, markRaw } from 'vue';
import { useRoute } from 'vue-router';

import DefaultLayout from '@/layouts/default/index.vue';

const route = useRoute();
const layoutComponent = ref();
const isLoaded = ref<boolean>(false);

watch(
  () => route.meta.layout,
  async (layout) => {
    isLoaded.value = false;
    const metaLayout = layout || 'default';

    try {
      const component = metaLayout && (await import(`../../../layouts/${metaLayout}/index.vue`));
      isLoaded.value = true;
      layoutComponent.value = markRaw(component?.default || DefaultLayout);
    } catch (e) {
      isLoaded.value = true;
      layoutComponent.value = markRaw(DefaultLayout);
    }
  },
  { flush: 'pre', immediate: true },
);
</script>

<template>
  <component :is="layoutComponent" :isLoaded="isLoaded"></component>
</template>
