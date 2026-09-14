import { clickElement, dettachDebugger } from './perform';
import { type MacroEvent, type Macro, type EventCondition, type App } from './macro';

var macros: Array<Macro> = [];
var app: App = {
  createIdx: 0,
  view: "macro-list",
  currentMacroId: -1,
};

function getData(callback: () => void) {
  chrome.storage.local.get(["macros", "app"], (result) => {
    if (result.macros) {
      //@ts-ignore
      macros = result.macros;
    }
    if (result.app) {
      //@ts-ignore
      app = result.app;
    }

    callback();
  });
}

function setData() {
  chrome.storage.local.set({ macros, app });
}

getData(() => {
  console.log("Run macro", macros);
  macros.filter((ele) => ele.active).forEach(runMacro);
});

var stopingIds = [];

function runMacro(macro: Macro) {
  // console.log("Run macro", macros);

  function oneEvent(index: number, prevIdx: number) {
    if (stopingIds.includes(macro.id)) {
      stopingIds = stopingIds.filter((ele) => ele !== macro.id);
      return;
    }

    if (index >= macro.events.length && macro.macroType === "periodic") {
      setTimeout(() => {
        oneEvent(0, -1);
      }, 500);
      return;
    }

    const event = macro.events[index] ?? null;
    console.log(event, index)
    if (!event) {
      return;
    }

    clickElement({
      event,
      success: () => {
        setTimeout(() => {
          oneEvent(index + 1, index);
        }, 500);
      },
      failed: () => {
        if (index === prevIdx) {
          dettachDebugger();
        }
        setTimeout(() => {
          oneEvent(index, index);
        }, 500);
      }
    });

  }

  oneEvent(0, -1);
}

// setInterval(() => {
//   if (macros.filter((ele) => ele.active).length === 0) {
//     dettachDebugger();
//   }
// }, 1000);


const boxElement = document.createElement("div");
boxElement.style.display = "none";
boxElement.id = "auto-click-box";
boxElement.style.position = "fixed";
boxElement.style.zIndex = "1000";
boxElement.style.border = "2px #26bbd9 solid";
boxElement.style.backgroundColor = 'transparent';
boxElement.style.pointerEvents = "none";

document.body.appendChild(boxElement);

function drawBoundingBox(event: Event) {
  if (!event.target) {
    return;
  }

  const currentElement = event.target as HTMLElement;

  const rectElement = currentElement.getBoundingClientRect();
  boxElement.style.width = `${rectElement.width}px`;
  boxElement.style.height = `${rectElement.height}px`;

  boxElement.style.left = `${rectElement.x}px`;
  boxElement.style.top = `${rectElement.y}px`;
}

chrome.runtime.onMessage.addListener((message: any, _sender: chrome.runtime.MessageSender, _sendResponse: (response?: any) => void) => {
  switch (message.type) {
    case "pickup.Element":
      boxElement.style.display = "";
      document.addEventListener('mouseover', drawBoundingBox, { passive: true });
      document.addEventListener('click', addNewMacro, { capture: true, once: true });
      getData(() => { });
      break;
    case "pickup.Condition":
      boxElement.style.display = "";
      document.addEventListener('mouseover', drawBoundingBox, { passive: true });

      function addNewCondition(event: PointerEvent) {
        if (!event.target) {
          return;
        }
        _addNewCondition(event, message.eventIdx);

        document.removeEventListener('mouseover', drawBoundingBox);
      }

      document.addEventListener('click', addNewCondition, { once: true, capture: true });
      getData(() => { });
      break;
    case "play.Macro":
      console.log("Run macro", message.macro)
      runMacro(message.macro);
      break;
    case "stop.Macro":
      stopingIds.push(message.macro.id);
      break;
  }
})

function _addNewCondition(event: PointerEvent, eventIdx: number) {
  event.preventDefault();
  event.stopPropagation();

  const currentElement = event.target as HTMLElement;
  const eleId = currentElement.id;
  const eleClasses = currentElement.classList.toString();
  const allAttributes = getAllHtmlElementAttributes(currentElement);

  let eventCondition: EventCondition = {
    type: "class",
    id: eleId,
    className: eleClasses,
    attributeId: "class",
    attributes: allAttributes,
    text: currentElement.textContent.length < 128 ? currentElement.textContent : "",
    index: 0,
    checker: "exist",
  };

  boxElement.style.display = "none";

  if (app.currentMacroId !== -1) {
    const macroIdx = macros.findIndex((ele) => ele.id === app.currentMacroId);
    if (macroIdx !== -1) {
      macros[macroIdx].events[eventIdx].condition = eventCondition;
      setData();
    }
  }
}
function getAllHtmlElementAttributes(element: HTMLElement) {
  const allAttributes = {};

  Array.from(element.attributes).forEach(attr => {
    allAttributes[attr.name] = attr.value;
  });

  return allAttributes;
}

function addNewMacro(event: PointerEvent) {
  if (!event.target) {
    return;
  }
  event.preventDefault();
  event.stopPropagation();
  const currentElement = event.target as HTMLElement;

  const eleId = currentElement.id;
  const eleClasses = currentElement.classList.toString();
  const allAttributes = getAllHtmlElementAttributes(currentElement);

  let macroEvent: MacroEvent = {
    eventId: app.createIdx++,
    attributeId: "",
    attributes: allAttributes,
    type: "class",
    id: eleId,
    className: eleClasses,
    text: currentElement.textContent.length < 128 ? currentElement.textContent : "",
    index: 0,
    clickCount: 1,
    button: event.button == 0 ? "left" : "right",
    condition: null,
  };

  const candidates = document.getElementsByClassName(eleClasses);
  for (const candidate of candidates) {
    if (candidate === currentElement) {
      break;
    }
    macroEvent.index += 1;
  }

  boxElement.style.display = "none";

  if (app.currentMacroId !== -1) {
    const index = macros.findIndex((ele) => ele.id === app.currentMacroId);
    if (index !== -1) {
      macros[index].events.push(macroEvent);
      setData();
    }
  }

  document.removeEventListener('mouseover', drawBoundingBox);
}


