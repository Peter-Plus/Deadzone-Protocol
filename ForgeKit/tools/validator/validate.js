import { readLibrary, DEFINITIONS } from '../core/library.js';
import { validateLibrary, formatErrors } from './validation.js';
try {
 const library=readLibrary(process.argv[2]);const errors=validateLibrary(library);
 if(errors.length){console.error(formatErrors(errors));process.exitCode=1;}else console.log(`Valid: ${library.entries.length} definitions.`);
}catch(e){console.error(`ERROR [IO_ERROR]\nFile: ${process.argv[2]??DEFINITIONS}\nPath: $\n${e.message}\nFix Hint: 检查目录是否存在且可读。`);process.exitCode=1;}
