// Helper to get cookie value by name
export const getCookie = (name: string): string | null => {
  const match = new RegExp(`(^| )${name}=([^;]+)`).exec(document.cookie);
  console.log(`Getting cookie "${name}":`, match ? decodeURIComponent(match[2]) : null); // TODO: Remove debug log
  return match ? decodeURIComponent(match[2]) : null;
};
