import type { Macro, MacroEvent, App, EventCondition } from "./content/macro";

var macros: Array<Macro> = [];
var app: App = {
  createIdx: 0,
  view: "macro-list",
  currentMacroId: -1,
};

function updateGlobal() {
  chrome.tabs.query({ currentWindow: true, active: true }, (tabs) => {
    for (const tab of tabs) {
      macros.filter(ele => ele.active).forEach(macro => {
        chrome.tabs.sendMessage(tab.id, {
          type: "stop.Macro",
          macro,
        }).then(() => {
            chrome.tabs.sendMessage(tab.id, {
              type: "play.Macro",
              macro,
            });
          });
      });
    }
  });

  chrome.storage.local.set({ macros, app }, () => {
    console.log("Save data", macros, app);
  });
}

function render() {
  if (app.view === "event-list") {
    viewEventList();
  } else {
    viewMacroList();
  }

  if (app.currentMacroId === -1) {
    document.getElementById("create-macro-item").innerHTML = "Create Macro";
  } else {
    document.getElementById("create-macro-item").innerHTML = "Edit Macro";
  }

  document.getElementById("macro-item").addEventListener("click", viewMacroList);
  document.getElementById("create-macro-item").addEventListener("click", viewEventList);
}

document.addEventListener("DOMContentLoaded", () => {
  console.log("DOM Loaded");

  chrome.storage.local.get(["macros", "app"], (result) => {
    if (result.macros) {
      //@ts-ignore
      macros = result.macros;
    }
    if (result.app) {
      //@ts-ignore
      app = result.app;
    }

    render();
  });
})

function viewMacroList() {
  app.view = "macro-list";
  const element = document.getElementById("main-content");

  element.innerHTML = `
<div id="macro-list" class="column-list">
</div>
`;

  const macroList = document.getElementById("macro-list");
  for (const macro of macros) {
    viewMacroItem(macroList, macro);
  }
}

function stopMacro(macro: Macro) {
  chrome.tabs.query({}, (tabs) => {
    for (const tab of tabs) {
      chrome.tabs.sendMessage(tab.id, {
        type: "stop.Macro",
        macro
      });
    }
  });
}

function viewMacroItem(macrosList: HTMLElement, macro: Macro) {
  let newItem = document.createElement("div");
  newItem.classList.add("macro-item");
  newItem.innerHTML = `
<div class="macro-item-name-holder">
  <button>
    ${macro.active ?
    `<img src="./assets/pause.svg" alt="Pause" width="20" height="20"></img>` :
    `<img src="./assets/play.svg" alt="Play" width="20" height="20"></img>`
    }
  </button>
  <input name="macro-name" class="macro-name" value="${macro.name}"></input>
</div>
<div class="macro-item-btn-holder">
  <button><img src="./assets/edit.svg" alt="Edit" width="20" height="20"></img></button>
  <button><img src="./assets/trash.svg" alt="Edit" width="20" height="20"></img></button>
</div>
`;
  (newItem.getElementsByClassName("macro-name").item(0) as HTMLInputElement).addEventListener('change', (event) => {
    macro.name = (event.target as HTMLInputElement).value;
    updateGlobal();
  });

  const functionBtns = newItem.getElementsByTagName("button");
  functionBtns.item(0).onclick = () => {
    macro.active = !macro.active;
    app.view = "macro-list";
    chrome.tabs.query({ currentWindow: true, active: true }, (tabs) => {
      const tab = tabs[0];
      if (macro.active) {
        chrome.tabs.sendMessage(tab.id, {
          type: "play.Macro",
          macro,
        });
      } else {
        chrome.tabs.sendMessage(tab.id, {
          type: "stop.Macro",
          macro
        })
      }
    });
    updateGlobal();
    render();
  };

  functionBtns.item(1).onclick = () => {
    app.currentMacroId = macro.id;
    app.view = "event-list";
    updateGlobal();
    render();
  }

  functionBtns.item(2).onclick = () => {
    macros = macros.filter((ele) => ele.id !== macro.id);
    app.view = "macro-list";
    if (macros.length == 0 || macro.id === app.currentMacroId) {
      app.currentMacroId = -1;
    }
    stopMacro(macro);
    updateGlobal();
    render();
  }

  macrosList.appendChild(newItem);
}

function getEventName(event: MacroEvent | EventCondition) {
  switch (event.type) {
    case "id":
      return event.id;
    case "class":
      return event.className;
    case "text":
      return event.text;
  }
}

function viewConditionEvent(conditionItem: Element, event: MacroEvent, index: number) {
  if (event.condition) {
    conditionItem.innerHTML = `
<select name="condition-event-type" class="condition-event-type">
  <option value="id">Id</option>
  <option value="class">Class</option>
  <option value="text">Text</option>
</select>
<input name="condition-event-name" value="${getEventName(event.condition)}" class="condition-event-name"></input>
<select name="condition-checker-type" class="condition-checker-type">
  <option value="exist">Exist</option>
  <option value="non-exist">Non-exist</option>
</select>
<button class="condition-delete"><img src="./assets/trash.svg" alt="Delete" width="20" height="20" /></button>
`;
    let conditionType = conditionItem.querySelector(".condition-event-type") as HTMLSelectElement;
    let eventName = conditionItem.querySelector(".condition-event-name") as HTMLInputElement;
    let checkerType = conditionItem.querySelector(".condition-checker-type") as HTMLSelectElement;
    let deleteBtn = conditionItem.querySelector(".condition-delete") as HTMLButtonElement;
    console.log("Condition ", event.condition);

    conditionType.value = event.condition.type;
    checkerType.value = event.condition.checker;

    function updateRender() {
      updateGlobal();
      render();
    }

    conditionType.addEventListener('change', (ev) => {
      event.condition.type = (ev.target as HTMLSelectElement).value as typeof event.condition.type;
      updateRender();
    });

    eventName.onblur = () => {
      switch (event.condition.type) {
        case "class":
          event.condition.className = eventName.value;
          break;
        case "id":
          event.condition.id = eventName.value;
          break;
        case "text":
          event.condition.text = eventName.value;
          break;
      }
      updateRender();
    };
    checkerType.onchange = (ev) => {
      event.condition.checker = (ev.target as HTMLSelectElement).value as typeof event.condition.checker;
      updateRender();
    };

    deleteBtn.onclick = () => {
      event.condition = null;
      updateRender();
    };
  } else {
    conditionItem.innerHTML = `
<button class="macro-event-add-condition"><img src="./assets/plus.svg" alt="Add" width="20" height="20"></img></button>
`;
    (conditionItem.getElementsByClassName("macro-event-add-condition").item(0) as HTMLButtonElement).onclick = () => {
      updateGlobal();
      chrome.tabs.query({ active: true, currentWindow: true },
        (tabs) => {
          const currentTab = tabs[0];
          chrome.tabs.sendMessage(currentTab.id, {
            type: "pickup.Condition",
            eventIdx: index,
          });
        }
      );
    }
  }
}

function viewEventItem(eventList: HTMLElement, event: MacroEvent, eventIdx: number) {
  let newItem = document.createElement("div");
  newItem.classList.add("macro-event-item");
  newItem.innerHTML = `
<div class="macro-event-condition">
</div>
<div class="macro-event-button">
  <select name="select-type" class="select-type">
    <option value="id">Id</option>
    <option value="class">Class</option>
    <option value="text">Text</option>
  </select>
  <input name="select-name" class="macro-item-name" value="${getEventName(event)}"></input>
  <input name="click-count" class="click-count" type="number" value="${event.clickCount}" title="Click count" />
  <select name="button" title="Mouse button">
    <option value="left">Left</option>
    <option value="right">Right</option>
  </select>
  <button class="delete-event">
    <img src="./assets/trash.svg" alt="Delete" width="20" height="20" />
  </button>
</div>
`;
  const conditionElement = newItem.getElementsByClassName("macro-event-condition").item(0);
  viewConditionEvent(conditionElement, event, eventIdx);

  let inputName = newItem.getElementsByClassName("macro-item-name").item(0) as HTMLInputElement;
  inputName.addEventListener('blur', () => {
    switch (event.type) {
      case "class":
        event.className = inputName.value;
        break;
      case "id":
        event.id = inputName.value;
        break;
      case "text":
        event.text = inputName.value;
        break;
    }

    updateGlobal();
    render();
  })

  const selectElements = newItem.querySelector(".macro-event-button").getElementsByTagName("select");
  let typeSelect = selectElements.item(0);
  typeSelect.value = event.type;
  typeSelect.addEventListener('change', (_) => {
    event.type = typeSelect.value as typeof event.type;

    updateGlobal();
    render();
  });

  let mouseClick = newItem.getElementsByClassName("click-count").item(0) as HTMLInputElement;
  mouseClick.addEventListener('change', () => {
    let value = mouseClick.valueAsNumber;
    if (value < 0) {
      value = 0;
    } else if (value > 4) {
      value = 4;
    }
    event.clickCount = value;
    mouseClick.value = value.toString();
  });

  mouseClick.addEventListener('blur', () => {
    updateGlobal();
    render();
  })

  let mouseBtn = selectElements.item(1);
  mouseBtn.value = "left";
  mouseBtn.addEventListener('change', (ev) => {
    event.button = (ev.target as HTMLSelectElement).value as typeof event.button;
  });

  let deleteBtn = newItem.getElementsByClassName("delete-event").item(0) as HTMLButtonElement;
  deleteBtn.addEventListener('click', () => {
    let index = macros.findIndex((ele) => ele.id == app.currentMacroId);
    let events = macros[index].events;
    macros[index].events = events.filter((ele) => ele.id != event.id);

    updateGlobal();
    render();
  });

  eventList.appendChild(newItem);
}

function viewEventList() {
  app.view = "event-list";
  const element = document.getElementById("main-content");
  element.innerHTML = `
<div class="create-macro">
  <div class="create-macro-btn-holder">
    ${app.currentMacroId === -1 ?
    `<button id="new-macro">New Macro</button>` :
    `<button id="pickup-btn">Pickup</button><button id="stop-btn">Stop</button>`
    }
  </div>
  <div id="events-list" class="column-list">
  </div>
</div>
`;
  if (app.currentMacroId == -1) {
    document.getElementById("new-macro").addEventListener('click', () => {
      app.createIdx++;
      macros.push({
        id: app.createIdx,
        name: "new macro",
        active: false,
        events: [],
      });
      app.view = "event-list";
      app.currentMacroId = app.createIdx;
      updateGlobal();
      render();
    });
  } else {
    const currentMacroIdx = macros.findIndex((ele) => ele.id === app.currentMacroId);
    if (currentMacroIdx != -1) {
      const eventsList = document.getElementById("events-list");
      macros[currentMacroIdx].events.forEach((event, idx) => {
        viewEventItem(eventsList, event, idx);
      });
    }
    document.getElementById("pickup-btn").addEventListener('click', () => {
      chrome.tabs.query({ active: true, currentWindow: true },
        (tabs) => {
          const currentTab = tabs[0];
          chrome.tabs.sendMessage(currentTab.id, {
            type: "pickup.Element",
          });
        }
      );
    });

    document.getElementById("stop-btn").addEventListener('click', () => {
      app.currentMacroId = -1;
      app.view = "macro-list";

      updateGlobal();
      render();
    });
  }
}

