import { createMacro } from "babel-plugin-macros"
import crypto from "crypto"
import * as t from "@babel/types"
import appRoot from "app-root-path"
import fs from "fs-extra"
import path from "path"
import assert from "assert"
import type { Sharp } from "sharp"

type FilterFlags<Base, Condition> = {
  [Key in keyof Base]: Base[Key] extends Condition ? Key : never
}

type AllowedNames<Base, Condition> = FilterFlags<Base, Condition>[keyof Base]

type SubType<Base, Condition> = Pick<Base, AllowedNames<Base, Condition>>

type MethodsWithOptionalArgs = SubType<Sharp, (a: undefined) => Sharp>

type MethodsWithoutAnyArgs = SubType<Sharp, (a: void) => Sharp>

type ChainableMethodsThatAcceptArgs = SubType<Sharp, (...args: any) => Sharp>

type MethodsAcceptingAtLeastOneArg = Omit<
  ChainableMethodsThatAcceptArgs,
  Exclude<keyof MethodsWithoutAnyArgs, undefined>
>

type Concrete<Type extends { [key: string]: (...args: any) => any }> = {
  [Property in keyof Type]: Parameters<Type[Property]>[0]
}

type MethodsTakingOneArg = Concrete<MethodsAcceptingAtLeastOneArg>

type Variant = (
  ...a: (keyof MethodsWithOptionalArgs | Partial<MethodsTakingOneArg>)[]
) => string

type Transform = keyof MethodsWithOptionalArgs | Partial<MethodsTakingOneArg>

export const transformsFilePath = path.join(
  appRoot.toString(),
  "storage",
  "validTransforms.json"
)

export const variant: Variant = createMacro(({ references }) => {
  let transforms: {[hashKey: string]: Transform[]} = {}

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
