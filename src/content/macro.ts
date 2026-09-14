
export type EventCondition = {
  type: "class" | "id" | "text",
  id: string,
  className: string,
  text: string,
  attributeId: string,
  attributes: {},
  checker: "exist" | "non-exist",
  index: number,
};

export type MacroEvent = {
  eventId: number,
  type: "class" | "id" | "text",
  attributeId: string,
  attributes: {},
  id: string,
  className: string,
  text: string,
  index: number,
  clickCount: number,
  button: "left" | "right",
  condition: EventCondition | null,
};

export type Macro = {
  macroId: number,
  id: number,
  active: boolean,
  name: string,
  macroType: "once" | "periodic",
  events: Array<MacroEvent>
};

export type App = {
  currentMacroId: number,
  view: "macro-list" | "event-list",
  createIdx: number,
};

