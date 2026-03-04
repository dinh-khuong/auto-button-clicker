export type MacroEvent = {
  type: "element",
  className: string,
  id: string,
  index: number,
} | {
  type: "click",
  position: {
    x: number,
    y: number,
  }
};

export type Macro = {
  id: number,
  active: boolean,
  name: string,
  events: Array<MacroEvent>
};

export type App = {
  currentMacro: number,
  view: "macro-list" | "event-list",
  createIdx: number,
};

