import { variant, Transform } from "./index"
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
