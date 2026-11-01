import type { CSSProperties } from 'react';

const paths = {
  arrowUpRight: <><path d="M6 18 18 6M6 6h12v12" /></>,
  arrowDown: <><path d="M12 4v16m-6-6 6 6 6-6" /></>,
  arrowRight: <><path d="M4 12h16m-6-6 6 6-6 6" /></>,
  search: <><circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 4.5 4.5" /></>,
  bookmark: <><path d="M6 4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v17l-6-4-6 4Z" /></>,
  heart: <><path d="M20.8 5.4a5.5 5.5 0 0 0-7.8 0L12 6.5l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 22l8.8-8.8a5.5 5.5 0 0 0 0-7.8Z" /></>,
  repeat: <><path d="m17 2 4 4-4 4M3 11V8a2 2 0 0 1 2-2h16M7 22l-4-4 4-4m14-1v3a2 2 0 0 1-2 2H3" /></>,
  chat: <><path d="M21 11.5a8.5 8.5 0 0 1-8.5 8.5H4l1-5a8.5 8.5 0 1 1 16-3.5Z" /></>,
  eye: <><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" /><circle cx="12" cy="12" r="3" /></>,
  chevronDown: <><path d="m6 9 6 6 6-6" /></>,
  info: <><circle cx="12" cy="12" r="9" /><path d="M12 11v6m0-10v.1" /></>,
  chip: <><rect x="6" y="6" width="12" height="12" rx="2" /><path d="M9 2v4m6-4v4m-6 12v4m6-4v4M2 9h4m-4 6h4m12-6h4m-4 6h4m-12-5h4v4h-4Z" /></>,
  check: <><path d="m5 12 4 4L19 6" /></>,
  close: <><path d="m6 6 12 12M6 18 18 6" /></>,
  link: <><path d="m10 13 4-4m-6 7-1 1a4 4 0 0 1-6-6l4-4a4 4 0 0 1 6 0m2 4a4 4 0 0 0 6 0l4-4a4 4 0 0 0-6-6l-1 1" transform="translate(1 2) scale(.9)" /></>,
  spark: <><path d="m12 2 2.7 7.3L22 12l-7.3 2.7L12 22l-2.7-7.3L2 12l7.3-2.7Z" /></>,
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 6v6l4 2" /></>,
  x: <><path d="m4 3 16 18h-5L4 3h5l11 18M20 3 4 21" /></>,
};

export type IconName = keyof typeof paths;

export function Icon({ name, size = 18, className = '', style }: {
  name: IconName; size?: number; className?: string; style?: CSSProperties;
}) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={className} style={style}>{paths[name]}</svg>;
}

export function FrogMark({ size = 32 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 40 40" fill="none" aria-hidden="true"><path d="M8 19c-3-8 8-12 12-5 4-7 15-3 12 5 7 14-31 16-24 0Z" fill="currentColor" /><path d="M12 25c4.5 3.5 11.5 3.5 16 0M14 17h1m10 0h1" stroke="#102318" strokeWidth="2.2" strokeLinecap="round" /></svg>;
}
