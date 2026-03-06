import type { MacroEvent, EventCondition } from "./macro";

function getElement(event: MacroEvent | EventCondition) {
  switch (event.type) {
    case "id":
      return document.getElementById(event.id);
    case "class":
      return document.getElementsByClassName(event.className).item(event.index);
    case "text":
      const xpath = `//*[normalize-space(text()) = '${event.text}']`;

      const result = document.evaluate(
        xpath,
        document,
        null,
        XPathResult.ORDERED_NODE_ITERATOR_TYPE,
        null
      );
      if (!result && !result.invalidIteratorState) {
        return null;
      }

      let res = result.iterateNext() as HTMLElement | null;
      return res;
  }
}

async function clickElement({ event, success, failed, }: { event: MacroEvent, success: () => void, failed: () => void }) {
  if (event.condition) {
    let element = getElement(event.condition);
    if (!(element && event.condition.checker === "exist" || !element && event.condition.checker === "non-exist")) {
      failed();
      return;
    }
  }

  const element = getElement(event);

  if (element) {
    await attachDebugger();

    const rect = element.getBoundingClientRect();

    await chrome.runtime.sendMessage({
      type: "click",
      position: {
        x: rect.x + rect.width / 2,
        y: rect.y + rect.height / 2,
      },
      button: event.button,
      clickCount: event.clickCount,
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

async function dettachDebugger() {
  await chrome.runtime.sendMessage({
    type: "debug.detach",
  });
}

async function attachDebugger() {
  await chrome.runtime.sendMessage({
    type: "debug.attach",
  });
}

export { clickElement, attachDebugger, dettachDebugger, checkQuerries };

