import select from 'select-dom';
import debounce from 'debounce-fn';
import observeEl from './simplified-element-observer';

const handlers = new Set<VoidFunction>();
const observed = new WeakSet();

const run = debounce(() => {
	// Run all callbacks without letting an error stop the loop and without silencing it
	handlers.forEach(async callback => callback());
}, {wait: 200});

// On new page loads, run the callbacks and look for the new elements.
// (addEventListener doesn't add duplicate listeners)
const addListenersOnNewElements = debounce(() => {
	for (const loadMore of select.all('.js-ajax-pagination')) {
		loadMore.addEventListener('page:loaded', run);
		loadMore.addEventListener('page:loaded', addListenersOnNewElements);
	}

	// Outdated comment are loaded later using an include-fragment element
	for (const fragment of select.all('details.outdated-comment > include-fragment')) {
		fragment.addEventListener('load', run);
	}
}, {wait: 50});

const setup = (): void => {
	const discussion = select('.js-discussion');
	if (!discussion || observed.has(discussion)) {
		return;
	}

	observed.add(discussion);

	// When new comments come in via AJAX
	observeEl(discussion, run);

	// When hidden comments are loaded by clicking "Load more..."
	addListenersOnNewElements();
};

export default function (callback: VoidFunction): void {
	setup();
	handlers.add(callback);
}
