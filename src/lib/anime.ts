// animejs v4 exports named bindings (e.g. `animate`) instead of a default export.
// Many parts of this codebase import the library as a default and call it
// (e.g. `anime({...})`). To remain compatible across animejs versions we
// create a small wrapper: a callable function that forwards to the `animate`
// export and copy other named exports onto it so `anime.timeline`,
// `anime.set`, etc. still work.
import * as animeModule from 'animejs';

type AnyFn = (...args: any[]) => any;

// Callable wrapper that forwards to the `animate` function exported by animejs
const anime = ((params: any, ...rest: any[]) => {
	// prefer the named export `animate` when available
	const fn = (animeModule as any).animate || (animeModule as any).default;
	if (typeof fn === 'function') return fn(params, ...rest);
	// fallback: if the module itself is callable (rare), try calling it
	if (typeof (animeModule as any) === 'function') return (animeModule as AnyFn)(params, ...rest);
	throw new Error('animejs: no callable export found');
}) as AnyFn & Record<string, any>;

// copy named exports so consumers can access helpers like timeline, set, etc.
Object.assign(anime, animeModule);

export default anime;