import { createMacro } from "babel-plugin-macros"
import crypto from "crypto"
import * as t from "@babel/types"
import appRoot from "app-root-path"
import fs from "fs-extra"
import path from "path"

type CreateVariation = (transform: unknown) => string

type Transform = { [key: string]: unknown }

export const transformsFilePath = path.join(
  appRoot.toString(),
  "validTransforms.json"
)

export const createVariation: CreateVariation = createMacro(
  ({ references }) => {
    let transforms: any = {}

    references.createVariation?.forEach(referencePath => {
      referencePath.parentPath.traverse({
        ObjectExpression: objectExpressionPath => {
          const transform: Transform = eval(
            `(${objectExpressionPath.getSource()})`
          )

          const hash = crypto
            .createHash("md5")
            .update(JSON.stringify(transform))
            .digest("hex")

          transforms[hash] = transform

          referencePath.parentPath.replaceWith(t.stringLiteral(hash))

          objectExpressionPath.stop()
        }
      })
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
  }
)

export default createVariation
