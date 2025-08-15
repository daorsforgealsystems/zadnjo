declare module 'animejs' {
  export interface AnimeParams {
    targets: HTMLElement;
    translateY: [number, number];
    opacity: [number, number];
    duration: number;
    easing: string;
    loop?: boolean;
  }

  export interface AnimeInstance {
    pause(): void;
  }

  const anime: (params: AnimeParams) => AnimeInstance;
  export default anime;
}
