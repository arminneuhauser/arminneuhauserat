import { writable } from 'svelte/store';
import { browser } from "$app/env"

export const scheme = writable(browser && localStorage.getItem("scheme") || "dark")

scheme.subscribe((val) => {
  if (browser) return (localStorage.scheme = val)
})
