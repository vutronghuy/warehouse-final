<script setup lang="ts">
import { ref, StyleValue, watch } from 'vue';
import DefaultAvatar from './DefaultAvatar/index.vue';

defineOptions({
  inheritAttrs: false,
});

interface Props {
  src: string | undefined;
  alt?: string | null;
  lazy?: boolean;
  defaultAvatarStyles?: Partial<StyleValue>;
  preview?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  lazy: false,
  defaultAvatarStyles: () => ({ fontSize: '18px' }),
  alt: '',
  preview: false,
});

const avatarLoadedError = ref<boolean>(false);

watch(
  () => props.src,
  () => {
    if (props.src) {
      avatarLoadedError.value = false;
    }
  },
  { immediate: true },
);

function handleLoadAvatarError() {
  avatarLoadedError.value = true;
}

function onImageClick() {
  if (props.preview) {
    // openPreviewImage([{ url: props.src || '' }]);
  }
}
</script>
<template>
  <img
    v-if="!avatarLoadedError && src"
    :src="src"
    :alt="alt || 'default'"
    v-bind="$attrs"
    @error="handleLoadAvatarError"
    @click="onImageClick()"
  />

  <slot v-else>
    <DefaultAvatar :name="alt || ''" :customStyles="defaultAvatarStyles" v-bind="$attrs" />
  </slot>
</template>
