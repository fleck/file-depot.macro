import { createMacro, MacroError } from "babel-plugin-macros"
import crypto from "crypto"
import * as t from "@babel/types"
import appRoot from "app-root-path"
import fs from "fs-extra"
import path from "path"
import assert from "assert"
import { Sharp } from "sharp"

type FilterFlags<Base, Condition> = {
  [Key in keyof Base]: Base[Key] extends Condition ? Key : never
}

type AllowedNames<Base, Condition> = FilterFlags<Base, Condition>[keyof Base]

type SubType<Base, Condition> = Pick<Base, AllowedNames<Base, Condition>>

type MethodsWithOptionalArgs = SubType<Sharp, (a: undefined) => Sharp>

type MethodsWithoutAnyArgs = SubType<Sharp, (a: void) => Sharp>

type ChainableMethods = SubType<Sharp, (...args: any) => Sharp>

type MethodsAcceptingAtLeastOneArg = Omit<
  ChainableMethods,
  Exclude<keyof MethodsWithoutAnyArgs, undefined>
>

type Concrete<Type extends { [key: string]: (...args: any) => any }> = {
  [Property in keyof Type]?: Type[Property] extends (a: any, b: void) => Sharp
    ? Exclude<Parameters<Type[Property]>[0], undefined>
    :
        | Exclude<Parameters<Type[Property]>[0], undefined>
        | Parameters<Type[Property]>
}

type MethodsTakingOneArg = Concrete<MethodsAcceptingAtLeastOneArg>

type Variant = (
  ...a: (keyof MethodsWithOptionalArgs | MethodsTakingOneArg)[]
) => string

export type Transform =
  | keyof MethodsWithOptionalArgs
  | Partial<MethodsTakingOneArg>

export const transformsFilePath = path.join(
  appRoot.toString(),
  "storage",
  "validTransforms.json"
)

export const variant: Variant = createMacro(({ references }) => {
  let transforms: { [hashKey: string]: Transform[] } = {}

  references.variant?.forEach(referencePath => {
    assert("name" in referencePath.node)

    const transform: Transform[] = eval(
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

    assert("arguments" in referencePath.parentPath.node)

    referencePath.parentPath.node.arguments.forEach(a => {
      if (a.type === "ObjectExpression") {
        a.properties.forEach(p => {
          if (
            p.type === "ObjectProperty" &&
            p.value.type === "Identifier" &&
            p.value.name === "undefined"
          ) {
            throw new MacroError(
              `using undefined here will NOT result in a transform as we
              serialize these args to JSON. E.g.
              \`JSON.stringify({ avif: undefined })\`
              becomes
              '{}'

              The correct way to call a transform without args is to do

              variant("avif")`
            )
          }
        })
      }
    })

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
