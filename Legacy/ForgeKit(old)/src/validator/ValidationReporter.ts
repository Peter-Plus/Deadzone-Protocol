export interface Issue { severity: 'ERROR'|'WARNING'; code: string; file: string; path: string; message: string; hint: string }
export class ValidationReporter {
  issues: Issue[] = [];
  constructor(public file: string) {}
  error(code: string, path: string, message: string, hint = 'Correct this field according to schemas/ and rules/.') { this.issues.push({ severity: 'ERROR', code, file: this.file, path, message, hint }); }
  warning(code: string, path: string, message: string, hint = 'Review the source definition.') { this.issues.push({ severity: 'WARNING', code, file: this.file, path, message, hint }); }
  get ok() { return !this.issues.some(i => i.severity === 'ERROR'); }
  format() { return this.issues.map(i => `${i.severity} [${i.code}]\nFile: ${i.file}\nPath: ${i.path || '$'}\n${i.message}\nFix: ${i.hint}`).join('\n\n'); }
}
