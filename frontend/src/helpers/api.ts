export const isNotifyWhenFail = (response: any) => {
  if (response?.data?.success) {
    return false;
  }

  if (response?.config?.offNotify) {
    return false;
  }

  return !!response?.data?.message;
};
