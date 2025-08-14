<template>
  <ConfigProvider :theme="theme">
    <router-view />
  </ConfigProvider>
</template>

<script setup lang="ts">
import { ConfigProvider } from 'ant-design-vue';

import { theme } from '@/shared/constants';
</script>
