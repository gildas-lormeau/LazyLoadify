/* global document, addEventListener, MutationObserver, IntersectionObserver, innerHeight, innerWidth */

"use strict";

const SRC_ATTRIBUTE_NAME = "src";
const SRCSET_ATTRIBUTE_NAME = "srcset";
const IMG_TAG_NAME = "IMG";
const VIDEO_TAG_NAME = "VIDEO";
const AUDIO_TAG_NAME = "AUDIO";
const SOURCE_TAG_NAME = "SOURCE";
const IFRAME_TAG_NAME = "IFRAME";
const FRAME_TAG_NAME = "FRAME";
const EMBED_TAG_NAME = "EMBED";
const TAG_NAMES_WITH_SRC_ATTRIBUTE = new Set([IMG_TAG_NAME, VIDEO_TAG_NAME, AUDIO_TAG_NAME, SOURCE_TAG_NAME, IFRAME_TAG_NAME, FRAME_TAG_NAME, EMBED_TAG_NAME]);
const TAG_NAMES_WITH_SRCSET_ATTRIBUTE = new Set([IMG_TAG_NAME, SOURCE_TAG_NAME]);
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
		mutationRecord.addedNodes.forEach(node => {
			if (TAG_NAMES_WITH_SRC_ATTRIBUTE.has(node.tagName)) {
				const boundingClientRect = node.getBoundingClientRect();
				if (
					boundingClientRect.bottom < 0 ||
					boundingClientRect.top > innerHeight ||
					boundingClientRect.left < 0 ||
					boundingClientRect.right > innerWidth
				) {
					observeNodeIntersection(node);
				}
			}
		})
	);
}

function observeNodeIntersection(node) {
	const originalSrc = resetSource(node, SRC_ATTRIBUTE_NAME);
	const originalSrcset = resetSource(node, SRCSET_ATTRIBUTE_NAME);
	const intersectionObserver = new IntersectionObserver((entries, observer) => intersectionObserverCallback(entries, observer, originalSrc, originalSrcset));
	intersectionObserver.observe(node.tagName == SOURCE_TAG_NAME ? node.parentElement : node);
}

function intersectionObserverCallback(entries, observer, originalSrc, originalSrcset) {
	const entry = entries[0];
	if (entry) {
		if (entry.intersectionRatio > MINIMUM_INTERESCTION_RATIO) {
			replaceSource(entry.target, originalSrc, originalSrcset);
			observer.disconnect();
		}
	}
}

function replaceSource(node, originalSrc, originalSrcset) {
	setSource(node, SRC_ATTRIBUTE_NAME, originalSrc);
	if (TAG_NAMES_WITH_SRCSET_ATTRIBUTE.has(node.tagName)) {
		setSource(node, SRCSET_ATTRIBUTE_NAME, originalSrcset);
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