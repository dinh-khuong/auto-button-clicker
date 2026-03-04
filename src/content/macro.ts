export type MacroEvent = {
  type: "class" | "id" | "text",
  id: string,
  className: string,
  text: string,
  index: number,
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

