<script lang="ts" setup>
interface Props {
  isLoaded: boolean;
}

const props = defineProps<Props>();
</script>

<template>
  <div id="__main" class="flex w-full">
    <div id="__content">
      <router-view v-if="props.isLoaded" />
    </div>
  </div>
</template>

<style scoped lang="scss" src="./styles.scss"></style>
