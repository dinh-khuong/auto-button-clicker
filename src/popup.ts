
document.addEventListener("DOMContentLoaded", () => {
	macroList();

})

function macroList() {
	const element = document.getElementById("main-content");
	element.innerHTML = `
<div class="macro-list">
</div>
`;
}

function createMacro() {
	const element = document.getElementById("main-content");
	element.innerHTML = `
<div class="create-macro">
	<button id="search-btn">Search</button>
</div>
`;
}
