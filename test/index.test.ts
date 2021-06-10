import pluginTester from "babel-plugin-tester"
import plugin from "babel-plugin-macros"
import fs from "fs-extra"
import { transformsFilePath } from "../src"
import { variant } from "../src/"

test.skip("types", () => {
  // @ts-expect-error
  variant("invalidTransform")

  variant("avif", { rotate: 90 }, { resize: { width: 200 } })
})

pluginTester({
  plugin,
  babelOptions: { filename: __filename },
  tests: {
    "transform function call to string": {
      code: `
        import {variant} from '../../file-depot.macro';

        variant({some: "transform"})
      `,
      output: '"b763fa71f19b62fd4dde15ee14dfb9f3"',
      setup: () => {
        fs.removeSync(transformsFilePath)
      }
    }
  }
})
