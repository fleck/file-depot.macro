import { createMacro } from "babel-plugin-macros"
import crypto from "crypto"
import * as t from "@babel/types"
import appRoot from "app-root-path"
import fs from "fs-extra"
import path from "path"
import assert from "assert"

type Variant = (transform: unknown) => string

type Transform = []

export const transformsFilePath = path.join(
  appRoot.toString(),
  "storage",
  "validTransforms.json"
)

export const variant: Variant = createMacro(({ references }) => {
  let transforms: any = {}

  references.variant?.forEach(referencePath => {
    assert("name" in referencePath.node)

    const transform: Transform = eval(
      `${referencePath.parentPath
        .getSource()
        .replace(`${referencePath.node.name}(`, "[")
        .slice(0, -1) + "]"}`
    )

    const hash = crypto
      .createHash("md5")
      .update(JSON.stringify(transform))
      .digest("hex")

    transforms[hash] = transform

    referencePath.parentPath.replaceWith(t.stringLiteral(hash))
  })

  fs.readJSON(transformsFilePath)
    .then(existingTransforms => {
      fs.writeJson(transformsFilePath, {
        ...existingTransforms,
        ...transforms
      })
    })
    .catch(async () => {
      await fs.ensureFile(transformsFilePath)

      await fs.writeJSON(transformsFilePath, transforms)
    })

  return { keepImport: false }
})

export default variant
