declare module 'animejs' {
  export interface AnimeParams {
    targets: HTMLElement | HTMLElement[] | NodeList | HTMLCollection | string;
    translateY?: [number, number] | number | string | ((el: HTMLElement, i: number) => number);
    translateX?: [number, number] | number | string | ((el: HTMLElement, i: number) => number);
    opacity?: [number, number] | number | string | ((el: HTMLElement, i: number) => number);
    scale?: [number, number] | number | string | ((el: HTMLElement, i: number) => number);
    rotate?: [number, number] | number | string | ((el: HTMLElement, i: number) => number);
    width?: [number, number] | number | string | ((el: HTMLElement, i: number) => number);
    backgroundColor?: string | [string, string];
    duration?: number;
    easing?: string;
    delay?: number | ((el: HTMLElement, i: number) => number);
    loop?: boolean | number;
    complete?: () => void;
    autoplay?: boolean;
    [key: string]: any; // Allow extra properties for plugin/extension compatibility
  }

  export interface AnimeInstance {
    play(): void;
    pause(): void;
    restart(): void;
    seek(time: number): void;
    reverse(): void;
    finished: Promise<void>;
    remove(targets?: HTMLElement | HTMLElement[] | NodeList | HTMLCollection | string): void;
    // Add more as needed
  }

  interface AnimeStatic {
    (params: AnimeParams): AnimeInstance;
    set(targets: AnimeParams["targets"], props: Partial<AnimeParams>): void;
    stagger(val: number | string): (el: HTMLElement, i: number) => number;
    // Add more static methods as needed
  }
  const anime: AnimeStatic;
  export default anime;
}
