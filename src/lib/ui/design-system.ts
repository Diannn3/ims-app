export type IconName =
  | 'home' | 'map' | 'academics' | 'people' | 'tools' | 'search' | 'route'
  | 'calendar' | 'building' | 'book' | 'clock' | 'research' | 'document'
  | 'shield' | 'warning' | 'success' | 'info' | 'close' | 'plus' | 'minus'
  | 'fit' | 'trash' | 'download' | 'upload' | 'next';

export type StatusTone = 'neutral' | 'info' | 'success' | 'warning' | 'danger';
export type SurfaceElevation = 'flat' | 'raised' | 'floating';
export type MotionPreference = 'full' | 'reduced';
export type ControlSize = 'compact' | 'default' | 'large';
export type SheetSnapPoint = 'peek' | 'half' | 'expanded';
export type SearchResultKind = 'room' | 'course' | 'faculty' | 'service' | 'research' | 'resource';

export interface NavigationItem {
  href: string;
  label: string;
  icon: IconName;
  matches?: readonly string[];
}

export const motionDurations = { feedback: 120, state: 180, page: 240 } as const;

export const navigationItems: readonly NavigationItem[] = [
  { href: '/', label: 'Home', icon: 'home' },
  { href: '/map', label: 'Map', icon: 'map' },
  { href: '/academics', label: 'Academics', icon: 'academics', matches: ['/course'] },
  { href: '/people', label: 'People', icon: 'people', matches: ['/faculty', '/consultations'] },
  { href: '/tools/grades', label: 'Tools', icon: 'tools' }
] as const;

export function isNavigationItemActive(item: NavigationItem, pathname: string) {
  if (item.href === '/') return pathname === '/';
  return pathname.startsWith(item.href) || Boolean(item.matches?.some((prefix) => pathname.startsWith(prefix)));
}
