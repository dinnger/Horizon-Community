# horizon-frontend

This template should help get you started developing with Vue 3 in Vite.

## Recommended IDE Setup

[VSCode](https://code.visualstudio.com/) + [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (and disable Vetur).

## Type Support for `.vue` Imports in TS

TypeScript cannot handle type information for `.vue` imports by default, so we replace the `tsc` CLI with `vue-tsc` for type checking. In editors, we need [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) to make the TypeScript language service aware of `.vue` types.

## Customize configuration

See [Vite Configuration Reference](https://vite.dev/config/).

## Project Setup

```sh
npm install
```

### Compile and Hot-Reload for Development

```sh
npm run dev
```

### Type-Check, Compile and Minify for Production

```sh
npm run build
```

## 📋 Development Guidelines

### Store Rules

Before working with stores, please read the [Store Rules](./src/stores/STORE_RULES.md) to understand the architectural principles and restrictions for client-side stores.

**Key Points:**

- Stores should only contain UI state and actions that modify UI state
- No data listings or server data caching in stores
- Use composables and services for data management
- Subscriptions should only be used if they change UI state
