// Client-side bag (shopping cart) hook.
// Provides a small, synchronous store with subscription support so multiple
// components can read and update the bag consistently. Persists to localStorage.

export type BagItem = {
	id: string;
	name: string;
	price: number;
	src: string;
	qty: number;
};

type BagState = { items: BagItem[] };

const STORAGE_KEY = "musi_bag_v1";

function readStorage(): BagState {
	try {
		const raw = typeof window !== "undefined" ? window.localStorage.getItem(STORAGE_KEY) : null;
		if (!raw) return { items: [] };
		return JSON.parse(raw) as BagState;
	} catch (e) {
		return { items: [] };
	}
}

function writeStorage(state: BagState) {
	try {
		window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
	} catch (e) {
		// ignore
	}
}

// Simple pub/sub store
const subscribers = new Set<() => void>();
let state: BagState = readStorage();

function notify() {
	subscribers.forEach((s) => s());
}

function setState(next: BagState) {
	state = next;
	writeStorage(state);
	notify();
}

export function getBagState() {
	return state;
}

export function subscribe(fn: () => void) {
	subscribers.add(fn);
	return () => subscribers.delete(fn);
}

// Actions
export function addItemToBag(item: BagItem) {
	const next = { ...state };
	const idx = next.items.findIndex((i) => i.id === item.id);
	if (idx >= 0) {
		next.items[idx] = { ...next.items[idx], qty: next.items[idx].qty + item.qty };
	} else {
		next.items = [...next.items, { ...item }];
	}
	setState(next);
}

export function removeItemFromBag(id: string) {
	const next = { ...state, items: state.items.filter((i) => i.id !== id) };
	setState(next);
}

export function updateItemQty(id: string, qty: number) {
	const next = { ...state, items: state.items.map((it) => (it.id === id ? { ...it, qty: Math.max(0, qty) } : it)).filter((i) => i.qty > 0) };
	setState(next);
}

export function clearBag() {
	setState({ items: [] });
}

// React hook
import { useCallback, useSyncExternalStore } from "react";

export function useBag() {
	const snapshot = useSyncExternalStore(subscribe, getBagState, getBagState);

	const addItem = useCallback((item: BagItem) => addItemToBag(item), []);
	const removeItem = useCallback((id: string) => removeItemFromBag(id), []);
	const updateQty = useCallback((id: string, qty: number) => updateItemQty(id, qty), []);
	const clear = useCallback(() => clearBag(), []);

	const items = snapshot.items;
	const totalItems = items.reduce((s, it) => s + it.qty, 0);
	const totalPrice = items.reduce((s, it) => s + it.qty * it.price, 0);

	return {
		items,
		addItem,
		removeItem,
		updateQty,
		clearBag: clear,
		totalItems,
		totalPrice,
	} as const;
}

// initialize state from storage on load (client)
if (typeof window !== "undefined") {
	// in case localStorage changed, keep in sync
	window.addEventListener("storage", () => {
		state = readStorage();
		notify();
	});
}
