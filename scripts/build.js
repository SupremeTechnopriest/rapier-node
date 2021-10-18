import { resolve } from 'path'
import fs from 'fs-extra'
import { execSync } from 'child_process'
import globby from 'globby'
import ora from 'ora'
import cpy from 'cpy'

const OUTPUT_2D = resolve('./rapier2d-node/dist')
const OUTPUT_3D = resolve('./rapier3d-node/dist')
const RAPIER_SRC = resolve('./rapier.js')
const SRC = resolve('./src')

function removeWrongDimensionDefinitions (text, is2d) {
  if (is2d) {
    return text.replace(/^ *\/\/ *#if +DIM3[\s\S]*?(?=#endif)#endif/gm, '')
  } else {
    return text.replace(/^ *\/\/ *#if +DIM2[\s\S]*?(?=#endif)#endif/gm, '')
  }
}

async function transformFilesForDimension (dir, is2d) {
  const tsFiles = await globby(`${dir}/**/*.ts`)
  tsFiles.forEach((filePath) => {
    const contents = fs.readFileSync(filePath, { encoding: 'utf-8' })
    fs.writeFileSync(
      filePath,
      removeWrongDimensionDefinitions(contents, is2d),
      { encoding: 'utf-8' }
    )
  })
}

(async () => {
  const clearProgress = ora('Cleaning dist directories').start()
  try {
    await fs.emptyDir(OUTPUT_2D)
    await fs.emptyDir(OUTPUT_3D)
    clearProgress.succeed()
  } catch (err) {
    clearProgress.fail()
    throw err
  }

  /**
   * This will output JS and WASM files into the dist directory. These files represent
   * "raw" Rapier without bindings. We still need to use the bindings files in the rapier.js
   * project to provide a proper module API.
   */
  const buildProgress = ora('Building WASM modules').start()
  try {
    execSync(
      `wasm-pack build --target nodejs --out-dir ${OUTPUT_2D} ${RAPIER_SRC}/rapier2d`
    )
    execSync(
      `wasm-pack build --target nodejs --out-dir ${OUTPUT_3D} ${RAPIER_SRC}/rapier3d`
    )
    buildProgress.succeed()
  } catch (err) {
    buildProgress.fail()
    throw err
  }
  

  /**
   * We copy the TS sources for the bindings out of the cloned rapier.js project repo,
   * but exclude raw.ts as this will be rewritten by us to point to the WASM output above.
   */
  const copyTSProgress = ora('Copying TS bindings').start()
  try {
    await cpy([`./**`], OUTPUT_2D, {
      cwd: `${RAPIER_SRC}/src.ts`,
      parents: true,
      overwrite: true,
      filter: (file) => file.name !== 'raw.ts'
    })
    await cpy([`./**`], OUTPUT_3D, {
      cwd: `${RAPIER_SRC}/src.ts`,
      parents: true,
      overwrite: true,
      filter: (file) => file.name !== 'raw.ts'
    })
    copyTSProgress.succeed()
  } catch (err) {
    copyTSProgress.fail()
    throw err
  } 

  /**
   * Copy shimmed source files.
   */
  const shimCopyProgress = ora('Adding raw.ts shims').start()
  try {
    await fs.copy(`${SRC}/raw-2d.ts`, `${OUTPUT_2D}/raw.ts`)
    await fs.copy(`${SRC}/globals.ts`, `${OUTPUT_2D}/globals.ts`)
    await fs.copy(`${SRC}/raw-3d.ts`, `${OUTPUT_3D}/raw.ts`)
    await fs.copy(`${SRC}/globals.ts`, `${OUTPUT_3D}/globals.ts`)
    shimCopyProgress.succeed()
  } catch (err) {
    shimCopyProgress.fail()
    throw err
  }

  /**
   * Dedupe typescript definitions.
   */
  const dedupeProgress = ora('Removing #if defs for opposite dimension').start()
  try {
    await transformFilesForDimension(OUTPUT_2D, true)
    await transformFilesForDimension(OUTPUT_3D, false)
    dedupeProgress.succeed()
  } catch (err) {
    dedupeProgress.fail()
    throw err
  }

  /**
   * Remove unused files from dist.
   */
  const remove = ['package.json', 'README.md', 'LICENSE', '.gitignore']
  const removeProgress = ora('Removing unused files from output').start()
  try {
    for (const file of remove) {
      await fs.remove(`${OUTPUT_2D}/${file}`)
      await fs.remove(`${OUTPUT_3D}/${file}`)
    }
    removeProgress.succeed()
  } catch (err) {
    removeProgress.fail()
    throw err
  }

  /**
   * Compile TypeScript.
   */
  const compileProgress = ora('Compiling TS bindings').start()
  try {
    execSync(`tsc`, {
      cwd: resolve('./rapier2d-node')
    })
    execSync(`tsc`, {
      cwd: resolve('./rapier3d-node')
    })
    compileProgress.succeed()
  } catch (err) {
    compileProgress.fail()
    console.error(err.stdout.toString())
    throw err
  }
})();
