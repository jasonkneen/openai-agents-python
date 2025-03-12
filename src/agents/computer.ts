export type Environment = "mac" | "windows" | "ubuntu" | "browser";
export type Button = "left" | "right" | "wheel" | "back" | "forward";

export interface Computer {
  environment: Environment;
  dimensions: [number, number];
  screenshot(): string;
  click(x: number, y: number, button: Button): void;
  doubleClick(x: number, y: number): void;
  scroll(x: number, y: number, scrollX: number, scrollY: number): void;
  type(text: string): void;
  wait(): void;
  move(x: number, y: number): void;
  keypress(keys: string[]): void;
  drag(path: [number, number][]): void;
}

export interface AsyncComputer {
  environment: Environment;
  dimensions: [number, number];
  screenshot(): Promise<string>;
  click(x: number, y: number, button: Button): Promise<void>;
  doubleClick(x: number, y: number): Promise<void>;
  scroll(x: number, y: number, scrollX: number, scrollY: number): Promise<void>;
  type(text: string): Promise<void>;
  wait(): Promise<void>;
  move(x: number, y: number): Promise<void>;
  keypress(keys: string[]): Promise<void>;
  drag(path: [number, number][]): Promise<void>;
}
