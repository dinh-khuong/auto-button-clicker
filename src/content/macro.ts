
export type EventCondition = {
  type: "class" | "id" | "text",
  id: string,
  className: string,
  text: string,
  checker: "exist" | "non-exist",
  index: number,
};

export type MacroEvent = {
  type: "class" | "id" | "text",
  id: string,
  className: string,
  text: string,
  index: number,
  clickCount: number,
  button: "left" | "right",
  condition: EventCondition | null,
};

export type Macro = {
  id: number,
  active: boolean,
  name: string,
  events: Array<MacroEvent>
};

export type App = {
  currentMacroId: number,
  view: "macro-list" | "event-list",
  createIdx: number,
};

