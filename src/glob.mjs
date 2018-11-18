import path from 'path';
import fs from 'fs';

const { promises: { readdir, lstat } } = fs;



class Glob {
    

    /**
     * resolve the files for all patterns provided
     *
     * @param      {string}          baseDir   base directory to which the
     *                                         patterns must be matched
     * @param      {Array[String]}   patterns  the patterns to match
     * @return     {Promise<Array>}  resolved files
     */
    async resolvePatterns(baseDir, patterns) {
        return (await Promise.all(
            patterns.map(pattern => this.resolvePattern(baseDir, pattern.split(path.sep)))
        )).reduce((storage, files) => {
            return storage.concat(files);
        }, []);
    }




    
    /**
     * resolve all files for a given pattern
     * 
     * @private
     *
     * @param      {string}          baseDir      base directory to which the
     *                                            current patternPart must be
     *                                            matched
     * @param      {string}          patterParts  array containing parts of the
     *                                            pattern (path parts)
     * @param      {boolean}         tryAll       flags if all directories must
     *                                            be traversed recursively
     * @return     {Promise<Array>}  resolved files
     */
    async resolvePattern(baseDir, patterParts, tryAll = false) {
        let currrentPattern = patterParts[0];

        if (currrentPattern === '**') {
            // recursively traverse all directories, matching anything
            tryAll = true;

            // skip the current pattern
            currrentPattern = patterParts[1];
            patterParts = patterParts.slice(1);
        }


        let matchedFiles;
        const files = await readdir(baseDir);


        if (patterParts.length === 1) {
            // files need to match the regexp here since its the 
            // last path part
            
            const regexp = this.buildRegExp(currrentPattern);

            // make sure we're matching files that are actual files that
            // match the pattern
            matchedFiles = (await Promise.all(files.map(async (fileName) => {
                const doesMatch = regexp.test(fileName);
                let lstats;

                if (doesMatch) {
                    const currentPath = path.join(baseDir, fileName);
                    lstats = await lstat(currentPath).catch(e => null);
                }
                
                return {
                    matches: lstats && lstats.isFile() && doesMatch,
                    fileName: fileName,
                };
            }))).filter(result => result.matches).map(result => path.join(baseDir, result.fileName));
        } else {
            // find directories that match the current pattern, follow
            // them by calling this method recursively

            const regexp = this.buildRegExp(currrentPattern);
            const matchingDirectories = (await Promise.all(files.map(async (fileName) => {
                const doesMatch = regexp.test(fileName);
                let lstats;

                if (doesMatch) {
                    const currentPath = path.join(baseDir, fileName);
                    lstats = await lstat(currentPath).catch(e => null);
                }
                
                return {
                    matches: lstats && lstats.isDirectory() && !lstats.isSymbolicLink() && doesMatch,
                    fileName: fileName,
                };
            }))).filter(result => result.matches).map(result => result.fileName);


            // collect files for all directories
            matchedFiles = (await Promise.all(
                matchingDirectories.map(directoryName => this.resolvePattern(path.join(baseDir, directoryName), patterParts.slice(1)))
            )).reduce((storage, files) => {
                return storage.concat(files);
            }, []);
        }




        if (tryAll) {
            // test all directories for all of the sub-patterns

            const allDirectories = (await Promise.all(files.map(async (fileName) => {
                const currentPath = path.join(baseDir, fileName);
                const lstats = await lstat(currentPath).catch(e => null);

                return {
                    matches: lstats && lstats.isDirectory() && !lstats.isSymbolicLink(),
                    fileName: fileName,
                };
            }))).filter(result => result.matches).map(result => result.fileName);

            const tryAllMatchedFiles = (await Promise.all(
                allDirectories.map(directoryName => this.resolvePattern(path.join(baseDir, directoryName), patterParts, true))
            )).reduce((storage, files) => {
                return storage.concat(files);
            }, []);

            return matchedFiles.concat(tryAllMatchedFiles);
        } else return matchedFiles;
    }



    
    /**
     * create a regular expression for a pattern subpart
     * 
     * @private
     *
     * @param      {string}  pattern  The pattern
     * @return     {RegExp}  the regular expression
     */
    buildRegExp(pattern) {
        pattern = pattern
            .replace(/\*/g, '[^\.]*')
            .replace(/\*/g, '[^\.]*')
            .replace(/\?/g, '[^\.]?')
            .replace(/\[\!([^\]]+)\]/g, '[^$1]')
            .replace(/\!\(([^\)]+)\)/g, '(?!$1)')
            .replace(/\+\(([^\)]+)\)/g, '($1)+')
            .replace(/\?\(([^\)]+)\)/g, '($1)?')
            .replace(/\*\(([^\)]+)\)/g, '($1)*')
            .replace(/@\(([^\)]+)\)/g, '($1)');

        return new RegExp(pattern, 'gi');
    }
}





const glob = new Glob();


export default async function(baseDir, ...patterns) {
    return glob.parsePatterns(baseDir, patterns);
}
