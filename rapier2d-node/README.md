# rapier2d-node

A NodeJS compatibility package for https://rapier.rs JS bindings

Rapier doesn't ship a package currently that works in NodeJS out of the box. The goal of this repo is to publish packages for Rapier which you can just `require` and use on the latest version of Node.

## Installing the package

For **3D**, `npm i -s rapier2d-node`.

Usage:

```js
import RAPIER from 'rapier2d-node'

const world = new RAPIER.World({ x: 0, y: 9.81 })
```

No async import or `await RAPIER.init()` is required.

## Building the packages

1. Install Rust
2. `cargo install wasm-pack`
3. `npm install`
4. `npm run build`

## What this project does

1. Builds with `wasm-pack --target nodejs` instead of `--target web` to produce Node-compatible WASM modules
2. Injects missing globals into Node's global scope (no extra libs, just using Node core stuff):
   a. `self`
   b. `atob`
   c. `performance.now`
3. Removes binding definitions for the opposite dimensionality (removes 3d APIs for the 2d library and vice versa)
4. Copies the TS bindings files from `rapier.js` alongside the WASM module output
5. Compiles the TS to create the fully bound library with the same interface as the web versions

## Testing

I copied a simple test scene from https://github.com/AutomatonSystems/rapier-node to `test/test.js`. You can run `npm test` to execute the script; if you see positions logged and it completes successfully, the library has at least loaded and ran!

## Attributions

This is a clone of https://github.com/a-type/rapier-node. The project seems unmaintained, but credit to a-type for his initial work on this. I will do my best to keep this project in sync with Rapier.js. If I'm behind a version, feel free to open an issue and I will get it updated.

The differences between `rapier-node` and `@a-type/rapier-node` are as follows:

1. Update to the latest Rapier.js source `0.7.6`.
2. Refactored the build chain to be more streamlined.
3. Fixed typescript definition generation _weirdness_.
4. Added README.md to published packages.
5. Swapped out yarn for npm.