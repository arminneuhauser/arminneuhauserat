import { writable, derived } from "svelte/store"

// https://svelte.dev/repl/2254c3b9b9ba4eeda05d81d2816f6276?version=3.32.2

const TIMEOUT = 3000

function createNotificationStore (timeout) {
    const _notifications = writable([])

    function send (message, timeout) {
        _notifications.update(state => {
            return [...state, { id: id(), message, timeout }]
        })
    }

    const notifications = derived(_notifications, ($_notifications, set) => {
        set($_notifications)

        $_notifications.forEach($_notification => {
            const timer = setTimeout(() => {
                _notifications.update(state => {
                    state.filter(obj => {
                        if (obj.id === $_notification.id) {
                            state.splice(obj.id, 1);
                        }
                    })

                    return state
                })
            }, $_notification.timeout)
            return () => {
                clearTimeout(timer)
            }
        });
    })

    const { subscribe } = notifications

    return {
        subscribe,
        send: (msg, timeout) => send(msg, timeout)
    }
}

function id() {
    return '_' + Math.random().toString(36).substr(2, 9);
};

export const notifications = createNotificationStore()
