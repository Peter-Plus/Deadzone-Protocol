import Ajv from 'ajv';
import { readFileSync } from 'node:fs';
import { ValidationReporter } from '../../validator/ValidationReporter.js';
// Reload schemas each validation batch so watch picks up changes without a process restart.
export function schemaValidator() {
  const ajv = new Ajv({ allErrors: true, strict: false, strictNumbers: true });
  for (const kind of ['model', 'animation', 'pose', 'material']) ajv.addSchema(JSON.parse(readFileSync(new URL(`../../../schemas/${kind}.schema.json`, import.meta.url), 'utf8')));
  return (data: unknown, reporter: ValidationReporter): boolean => {
    const version = (data as { schema?: string } | null)?.schema;
    const validate = typeof version === 'string' ? ajv.getSchema(version) : undefined;
    if (!validate) { reporter.error('SCHEMA_VERSION', 'schema', `Unknown schema ${JSON.stringify(version)}.`); return false; }
    if (validate(data)) return true;
    for (const e of validate.errors ?? []) reporter.error('SCHEMA_INVALID', e.instancePath || '$', `${e.message} ${JSON.stringify(e.params)}`);
    return false;
  };
}
