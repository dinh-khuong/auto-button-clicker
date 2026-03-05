import { clickElement, dettachDebugger } from './perform';
import { type MacroEvent, type Macro } from './macro';

var macros: Array<Macro> = [];
// var app: App = {
//   createIdx: 0,
//   view: "macro-list",
//   currentMacro: -1,
// };

function updateData(callback: () => void) {
  chrome.storage.local.get(["macros"], (result) => {
    if (result.macros) {
      //@ts-ignore
      macros = result.macros;
    }
    // if (result.app) {
    //   //@ts-ignore
    //   app = result.app;
    // }

    callback();
  });
}

updateData(() => {
  console.log("Run macro", macros);
  macros.filter((ele) => ele.active).forEach(runMacro);
});

var stopingIds = [];

function runMacro(macro: Macro) {
  console.log("Run macro", macros);

  function oneEvent(index: number, prevIdx: number) {
    if (stopingIds.includes(macro.id)) {
      stopingIds = stopingIds.filter((ele) => ele !== macro.id);
      return;
    }

    if (index >= macro.events.length) {
      setTimeout(() => {
        oneEvent(0, -1);
      }, 500);
      return;
    }

    const event = macro.events[index];
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

setInterval(() => {
  if (macros.filter((ele) => ele.active).length === 0) {
    dettachDebugger();
  }
}, 1000);


const boxElement = document.createElement("div");
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

chrome.runtime.onMessage.addListener((message: any, sender: chrome.runtime.MessageSender, sendResponse: (response?: any) => void) => {
  switch (message.type) {
    case "pickup.Element":
      document.addEventListener('mouseover', drawBoundingBox, { passive: true });
      document.addEventListener('click', addNewMacro, { passive: true });
      updateData(() => { });
      break;
    case "play.Macro":
      runMacro(message.macro);
      break;
    case "stop.Macro":
      stopingIds.push(message.macro.id);
      break;
  }
})

function addNewMacro(event: PointerEvent) {
  if (!event.target) {
    return;
  }
  const currentElement = event.target as HTMLElement;

  const eleId = currentElement.id;
  const eleClasses = currentElement.classList.toString();

  let macroEvent: MacroEvent = {
    id: eleId,
    type: "class",
    text: currentElement.textContent.length < 128 ? currentElement.textContent : "",
    className: eleClasses,
    clickCount: 1,
    button: event.button == 0 ? "left" : "right",
    index: 0,
  };

  const candidates = document.getElementsByClassName(eleClasses);
  for (const candidate of candidates) {
    if (candidate === currentElement) {
      break;
    }
    macroEvent.index += 1;
  }

  boxElement.style.width = "0"
  boxElement.style.height = "0";
  boxElement.style.left = "0";
  boxElement.style.top = "0";

  chrome.runtime.sendMessage({
    type: "popup.MacroEvent",
    macro: macroEvent,
  })

  // console.log("New event: ", macroEvent);
  document.removeEventListener('mouseover', drawBoundingBox);
  document.removeEventListener('click', addNewMacro);
}


