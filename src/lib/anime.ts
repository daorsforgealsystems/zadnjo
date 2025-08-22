// For the version pinned in package.json (animejs@3.x) the ESM entry point
// lives at 'lib/anime.es.js' and it provides a default export we can re-export.
// Using the package's internal ESM file here avoids ABI differences between
// major versions while keeping imports fast and tree-shakable.
import anime from 'animejs/lib/anime.es.js';

export default anime;