 // animejs export interop wrapper for Vite/TS across versions.
 // Keeps a stable default export for app code: `import anime from '@/lib/anime'`.
 // Tries default, then named 'anime', then falls back to the module object.
 import * as animeModule from 'animejs';
 
 const animeAny = (animeModule as any);
 const animeResolved = animeAny?.default ?? animeAny?.anime ?? animeAny;
 
 export default animeResolved as any;