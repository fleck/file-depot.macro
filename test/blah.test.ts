import pluginTester from "babel-plugin-tester"
import plugin from "babel-plugin-macros"

pluginTester({
  plugin,
  babelOptions: { filename: __filename },
  tests: {
    "transform function call to string": {
      code: `
        import {createVariation} from '../../file-depot.macro';

        createVariation({some: "transform"})
      `,
      output: '"e4e7d76bd2b16c69a7adbed0667a8b0a"'
    }
  }
})
