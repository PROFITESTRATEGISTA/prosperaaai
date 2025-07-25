import { ZodSchema } from 'zod';
import { Options, Targets } from "./Options.js";
import { JsonSchema7Type } from "./parseDef.js";
declare const zodToJsonSchema: <Target extends Targets = "jsonSchema7">(schema: ZodSchema<any>, options?: Partial<Options<Target>> | string) => (Target extends "jsonSchema7" ? JsonSchema7Type : object) & {
    $schema?: string;
    definitions?: {
        [key: string]: Target extends "jsonSchema7" ? JsonSchema7Type : Target extends "jsonSchema2019-09" ? JsonSchema7Type : object;
    };
};
export { zodToJsonSchema };
//# sourceMappingURL=zodToJsonSchema.d.ts.map