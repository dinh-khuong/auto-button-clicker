import type { MacroEvent } from "./macro";

function getElement(event: MacroEvent) {
  switch (event.type) {
    case "id":
      return document.getElementById(event.id);
    case "class":
      return document.getElementsByClassName(event.className).item(event.index);
    case "text":
      ///TODO add get element by text
      return null;
  }
}

function clickElement({ event, button, success, failed, }: { event: MacroEvent, button: string, success: () => void, failed: () => void }) {
  const element = getElement(event);

  if (element) {
    console.log("Click", element);
    chrome.runtime.sendMessage({
      type: "debug.attach",
    });

    const rect = element.getBoundingClientRect();

    chrome.runtime.sendMessage({
      type: "click",
      position: {
        x: rect.x + rect.width / 2,
        y: rect.y + rect.height / 2,
      },
      button,
    })

    success();
  } else {
    failed();
  }
}

function checkQuerries(querries: Array<string>) {
  for (const query of querries) {
    const ele = document.querySelector(query);
    if (!ele) {
      return false;
    }
  }

  return true;
}

function dettachDebugger() {
  chrome.runtime.sendMessage({
    type: "debug.detach",
  });
}

export { clickElement, dettachDebugger, checkQuerries };

