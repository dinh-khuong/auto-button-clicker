import type { Macro, MacroEvent, App } from "./content/macro";

var macros: Array<Macro> = [];
var app: App = {
	createIdx: 0,
	view: "macro-list",
	currentMacroId: -1,
};

function updateGlobal() {
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
		addMacroItem(macroList, macro);
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

function addMacroItem(macrosList: HTMLElement, macro: Macro) {
	let newItem = document.createElement("div");
	newItem.classList.add("macro-item");
	newItem.innerHTML = `
<input class="macro-name" value="${macro.name}"></input>
`;
	(newItem.getElementsByClassName("macro-name").item(0) as HTMLInputElement).addEventListener('change', (event) => {
		macro.name = (event.target as HTMLInputElement).value;
		updateGlobal();
	});
	let editBtn = document.createElement('button');
	editBtn.innerHTML = `<img src="./assets/edit.svg" alt="Edit" width="20" height="20"></img>`;
	editBtn.onclick = () => {
		app.currentMacroId = macro.id;
		app.view = "event-list";
		updateGlobal();
		render();
	};
	let deleteBtn = document.createElement('button');
	deleteBtn.innerHTML = `<img src="./assets/trash.svg" alt="Delete" width="20" height="20"></img>`;
	deleteBtn.onclick = () => {
		macros = macros.filter((ele) => ele.id !== macro.id);
		app.view = "macro-list";
		if (macros.length == 0 || macro.id === app.currentMacroId) {
			app.currentMacroId = -1;
		}
		stopMacro(macro);
		updateGlobal();
		render();
	};

	let playBtn = document.createElement('button');
	playBtn.innerHTML = `${macro.active ?
		`<img src="./assets/pause.svg" alt="Pause" width="20" height="20"></img>` :
		`<img src="./assets/play.svg" alt="Play" width="20" height="20"></img>`
		}`;

	playBtn.onclick = () => {
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

	newItem.appendChild(playBtn);
	newItem.appendChild(editBtn);
	newItem.appendChild(deleteBtn);
	macrosList.appendChild(newItem);
}

function getEventName(event: MacroEvent) {
	switch (event.type) {
		case "id":
			return event.id;
		case "class":
			return event.className;
		case "text":
			return event.text;
	}
}

function addEventItem(eventList: HTMLElement, event: MacroEvent) {
	let newItem = document.createElement("div");
	newItem.classList.add("macro-item");
	newItem.innerHTML = `
<select name="select-type">
	<option value="id">Id</option>
	<option value="class">Class</option>
	<option value="text">Text</option>
</select>
<input name="select-name" class="macro-item-name" value="${getEventName(event)}"/>
<input name="click-count" class="click-count" type="number" value="${event.clickCount}" title="Click count" />
<select name="button" title="Mouse button">
	<option value="left">Left</option>
	<option value="right">Right</option>
</select>
<button class="delete-event">
	<img src="./assets/trash.svg" alt="Delete" width="20" height="20" />
</button>
`;
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

	const selectElements = newItem.getElementsByTagName("select");
	let typeSelect = selectElements.item(0);
	typeSelect.value = event.type;
	typeSelect.addEventListener('change', (_) => {
		event.type = typeSelect.value as typeof event.type;

		updateGlobal();
		render();
	});

	let mouseClick = newItem.getElementsByClassName("click-count").item(0) as HTMLInputElement;
	mouseClick.addEventListener('change', (ev) => {
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
			for (const event of macros[currentMacroIdx].events) {
				addEventItem(eventsList, event);
			}
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

