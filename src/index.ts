import { createMacro } from "babel-plugin-macros"
import crypto from "crypto"
import * as t from "@babel/types"

type CreateVariation = () => string

export const createVariation: CreateVariation = createMacro(
  ({ references }) => {
    let refs: any = {}

    references.createVariation?.forEach(referencePath => {
      referencePath.parentPath.traverse({
        ObjectExpression: objectExpressionPath => {
          const transform: { [key: string]: unknown } = eval(
            `(${objectExpressionPath.getSource()})`
          )

          const hash = crypto
            .createHash("md5")
            .update(JSON.stringify(transform))
            .digest("hex")

          refs[hash] = transform

          referencePath.parentPath.replaceWith(t.stringLiteral(hash))
        }
      })
    })
    console.log(JSON.stringify(refs))
  }
)

export default createVariation
