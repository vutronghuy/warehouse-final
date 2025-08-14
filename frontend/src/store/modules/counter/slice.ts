import { defineStore } from 'pinia';

import { ICounter } from './types';

export const useCounterStore = defineStore('counter', {
  state: () =>
    ({
      payload: 2,
    }) as ICounter,

  actions: {
    increment() {
      this.payload++;
    },
  },
});
