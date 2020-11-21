/* global document, addEventListener, MutationObserver, IntersectionObserver, innerHeight, innerWidth */

"use strict";

const SRC_ATTRIBUTE_NAME = "src";
const SRCSET_ATTRIBUTE_NAME = "srcset";
const POSTER_ATTRIBUTE_NAME = "poster";
const IMG_TAG_NAME = "IMG";
const VIDEO_TAG_NAME = "VIDEO";
const AUDIO_TAG_NAME = "AUDIO";
const SOURCE_TAG_NAME = "SOURCE";
const IFRAME_TAG_NAME = "IFRAME";
const FRAME_TAG_NAME = "FRAME";
const EMBED_TAG_NAME = "EMBED";
const TAG_NAMES_WITH_SRC_ATTRIBUTE = new Set([IMG_TAG_NAME, VIDEO_TAG_NAME, AUDIO_TAG_NAME, SOURCE_TAG_NAME, IFRAME_TAG_NAME, FRAME_TAG_NAME, EMBED_TAG_NAME]);
const TAG_NAMES_WITH_SRCSET_ATTRIBUTE = new Set([IMG_TAG_NAME, SOURCE_TAG_NAME]);
const TAG_NAMES_WITH_POSTER_ATTRIBUTE = new Set([VIDEO_TAG_NAME]);
const UNSENT_READY_STATE = 0;
const HTTP_URL_TEST_REGEXP = /^https?:\/\//;
const DOM_CONTENT_LOADED_EVENT = "DOMContentLoaded";
const EMPTY_DATA_URI = "data:,";
const MUTATION_OBSERVER_OPTIONS = { childList: true, subtree: true };
const MINIMUM_INTERESCTION_RATIO = 0;

observeDocumentMutations();

function observeDocumentMutations() {
	const mutationObserver = new MutationObserver(mutationObserverCallback);
	mutationObserver.observe(document, MUTATION_OBSERVER_OPTIONS);
	addEventListener(DOM_CONTENT_LOADED_EVENT, () => mutationObserver.disconnect());
}

function mutationObserverCallback(mutationsList) {
	mutationsList.forEach(mutationRecord =>
		Array.from(mutationRecord.addedNodes)
			.filter(node => TAG_NAMES_WITH_SRC_ATTRIBUTE.has(node.tagName) && nodeIsHidden(node))
			.forEach(observeNodeIntersection)
	);
}

function nodeIsHidden(node) {
	const boundingClientRect = node.getBoundingClientRect();
	return boundingClientRect.bottom < 0 ||
		boundingClientRect.top > innerHeight ||
		boundingClientRect.left < 0 ||
		boundingClientRect.right > innerWidth;
}

function observeNodeIntersection(node) {
	const src = resetSource(node, SRC_ATTRIBUTE_NAME);
	const srcset = resetSource(node, SRCSET_ATTRIBUTE_NAME);
	const poster = resetSource(node, POSTER_ATTRIBUTE_NAME);
	const intersectionObserver = new IntersectionObserver((entries, observer) => intersectionObserverCallback(entries, node, observer, { src, srcset, poster }));
	intersectionObserver.observe(node.tagName == SOURCE_TAG_NAME ? node.parentElement : node);
}

function intersectionObserverCallback(entries, node, observer, values) {
	const entry = entries[0];
	if (entry) {
		if (entry.intersectionRatio > MINIMUM_INTERESCTION_RATIO) {
			replaceSource(node, values);
			observer.disconnect();
		}
	}
}

function replaceSource(node, values) {
	setSource(node, SRC_ATTRIBUTE_NAME, values.src);
	if (TAG_NAMES_WITH_SRCSET_ATTRIBUTE.has(node.tagName)) {
		setSource(node, SRCSET_ATTRIBUTE_NAME, values.srcset);
	}
	if (TAG_NAMES_WITH_POSTER_ATTRIBUTE.has(node.tagName)) {
		setSource(node, POSTER_ATTRIBUTE_NAME, values.poster);
	}
}

function resetSource(node, attributeName) {
	const originalValue = node[attributeName];
	if (originalValue && originalValue.match(HTTP_URL_TEST_REGEXP)) {
		node[attributeName] = EMPTY_DATA_URI;
		return originalValue;
	}
}

function setSource(node, attributeName, value) {
	if (node[attributeName] == EMPTY_DATA_URI) {
		if (value) {
			node[attributeName] = value;
		} else {
			node.removeAttribute(attributeName);
			if (node.readyState === UNSENT_READY_STATE) {
				node.load();
			}
		}
	}
}