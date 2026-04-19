import { createInertiaApp } from '@inertiajs/svelte'
import { mount } from 'svelte'
import axios from 'axios'
import { configureAxiosCSRF } from './Components/helper'

configureAxiosCSRF(axios)

const savedMode = localStorage.getItem('darkMode');
const isDarkMode = savedMode === null
  ? window.matchMedia('(prefers-color-scheme: dark)').matches
  : savedMode === 'true';

if (isDarkMode) {
  document.documentElement.classList.add('dark');
} else {
  document.documentElement.classList.remove('dark');
}

createInertiaApp({
  resolve: name => {
    const pages = import.meta.glob('./Pages/**/*.svelte', { eager: true })
    return pages[`./Pages/${name}.svelte`]
  },
  setup({ el, App, props }) {
    mount(App, { target: el, props })
  },
})
