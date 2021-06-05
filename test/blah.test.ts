import pluginTester from "babel-plugin-tester"
import plugin from "babel-plugin-macros"
import fs from "fs-extra"
import { transformsFilePath } from "../src"

pluginTester({
  plugin,
  babelOptions: { filename: __filename },
  tests: {
    "transform function call to string": {
      code: `
        import {createVariation} from '../../file-depot.macro';

        createVariation({some: "transform"})
      `,
      output: '"e4e7d76bd2b16c69a7adbed0667a8b0a"',
      setup: () => {
        fs.removeSync(transformsFilePath)
      }
    }
  }
})
