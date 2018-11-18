# GLOB

A clean and simple glob implementation. Glob can be used to find files in the file-system using patterns.


***ESM***
```javascript
import glob from 'es-modules/distributed-systems/glob/v1+/src/glob.mjs';


// find all .mjs inside the /home/ee directory
const absolutFilePaths = await glob('/home/ee', '**/*.mjs');
```


***NPM***
```javascript
import glob from '@distributed-systems/glob';


// find all .mjs inside the /home/ee directory
const absolutFilePaths = await glob('/home/ee', '**/*.mjs');
```


## Syntax

The patterns passed to the glob function are split by the path separator (/ on unix based systems) and matched individually to the files searched over.

- `/**/` match the the pattern to the right of the two stars, traversing the directory left of the two stars recursively
- `*` matches 0 or more character except for `.` (dot)
- `?` matches 1 character except for `.` (dot)
- `[]` matches a [RegExp](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp) like character class. If the first character inside the brackets is a `!` or a `^` all characters except for those in the class are matched
- `!(pattern|pattern|...)` matches anything except for the provided pattern(s)
- `?(pattern|pattern|...)` matches the provided patterns zero or more times
- `+(pattern|pattern|...)` matches the provided patterns one or more times
- `*(pattern|pattern|...)` matches the provided patterns zero or more times
- `@(pattern|pattern|...)` matches the provided patterns one times


## examples

Find all your test files
```javascript
const testfile = await glob('/home/ee', '**/*.test.mjs');
```


Find all README.md files inside a test directory
```javascript
const testfile = await glob('/home/ee', '**/test/readme.md');
```