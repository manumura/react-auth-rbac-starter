// Helper to get cookie value by name
export const getCookie = (name: string): string | null => {
  const match = new RegExp(`(^| )${name}=([^;]+)`).exec(document.cookie);
  return match ? decodeURIComponent(match[2]) : null;
};
