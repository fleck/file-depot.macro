import pluginTester from "babel-plugin-tester"
import plugin from "babel-plugin-macros"
import fs from "fs-extra"
import { transformsFilePath, variant, Transform } from "../src"
import sharp from "sharp"

test.skip("variant types", () => {
  variant("rotate")

  // @ts-expect-error
  variant("invalidTransform")

  variant("avif", { rotate: 90 }, { resize: { width: 200 } })

  // positional args
  variant("avif", { threshold: [90, { grayscale: true }] })

  variant("flatten", { jpeg: { optimiseScans: true }, threshold: 90 })

  // @ts-expect-error don't allow undefined to be passed
  variant({ avif: undefined })
})

test.skip("other types", () => {
  const v = {}

  const variations = (v as unknown) as { [key: string]: Transform[] }

  const transforms = variations["fakeVariationKey"]

  if (!transforms) return

  let s = sharp()

  transforms.forEach(transform => {
    if (typeof transform === "string") {
      transform
      s = s[transform]()
    } else {
      Object.entries(transform).forEach(([method, args]) => {
        // @ts-expect-error not sure how to properly type this 🤷‍♂️
        s = s[method](args)
      })
    }
  })

  return s
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
