<script lang="ts" setup>
interface Props {
  isLoaded: boolean;
}

const props = defineProps<Props>();
</script>

<template>
  <div id="__main">
    <router-view v-if="props.isLoaded" />
  </div>
</template>
