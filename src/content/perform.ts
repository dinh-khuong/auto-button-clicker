
// var debuggerAttached = false

import type { MacroEvent } from "./macro";

function getElement(event: MacroEvent) {
  if (event.type !== "element") {
    return;
  }

  if (event.id === "") {
    return document.getElementsByClassName(event.className).item(event.index);
  } else {
    return document.getElementById(event.id);
  }
}

function attachToTab(tabId: number) {
  const protocolVersion = '1.3'; // Use an appropriate protocol version

  chrome.debugger.attach({ tabId: tabId }, protocolVersion, () => {
    if (chrome.runtime.lastError) {
      console.error(chrome.runtime.lastError.message);
      return;
    }
  });
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

