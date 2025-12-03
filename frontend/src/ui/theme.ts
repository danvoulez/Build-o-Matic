export const theme = {
  brand: {
    primary: '#3b82f6',
    primaryDark: '#2563eb',
    bg: '#0b1220',
    fg: '#e5e7eb',
    card: 'rgba(255,255,255,0.06)'
  }
};

export function cn(...classes: Array<string | false | undefined | null>) {
  return classes.filter(Boolean).join(' ');
}