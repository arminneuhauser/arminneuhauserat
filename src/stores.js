import { writable } from 'svelte/store';
import { browser } from "$app/env"

export const scheme = writable(browser && localStorage.getItem("scheme") || "dark")
export const cookieConsent = writable(browser && localStorage.getItem("cookieConsent") || "false")

scheme.subscribe((val) => {
  if (browser) return (localStorage.scheme = val)
})

cookieConsent.subscribe((val) => {
  if (browser) return (localStorage.cookieConsent = val)
})
