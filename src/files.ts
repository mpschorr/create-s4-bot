import fs from 'fs';
import { parse } from 'jsonc-parser';
import os from 'os';
import path from 'path';
import merge from 'ts-deepmerge';
import { fileURLToPath } from 'url';
import { EXTRAS_FILENAME_REGEX } from './features.js';
import { PromptData } from './prompt.js';

/**
 * Gets path of the templates folders (in package installed code!)
 * @param subPath Subpath to get path for (ex. 'extras')
 * @returns Path
 */
export function getTemplatesPath(subPath: string) {
	return path.join(fileURLToPath(import.meta.url), '../templates', subPath);
}

/**
 * Removes the highest (leftmost) parent from a path.
 * @param pathname Path to remove from (ex. 'base\abc\foo.bar')
 * @returns Path with highest parent removed (ex. 'abc\foo.bar')
 */
export function removeHighestParent(pathname: string) {
	return pathname.split(path.sep).slice(1).join(path.sep);
}

/**
 * Removes a feature prefix from a path.
 * @param pathname Path to remove feature prefix from (ex. 'base/src/{feat}index.ts')
 * @returns Path with feature prefix removed (ex. 'base/src/index.ts')
 */
export function removeFeaturePrefix(pathname: string) {
	const parent = path.dirname(pathname);
	const filename = path.basename(pathname);
	const match = filename.match(EXTRAS_FILENAME_REGEX);
	if (match == null) return pathname;
	return path.join(parent, match[2]);
}

/**
 * Creates a map of destination files and where their sources should be copied from.
 * @param destPath Destination path of the bot to create
 * @param sourcePath Path of source template files in module installation
 * @param relativeSourcePaths List of source paths to include (with base | extras parent)
 * @returns Map of destination path -> array of source paths to possibly merge
 */
export function createDestToSourcesMap(destPath: string, relativeSourcePaths: string[]) {
	const templatesPath = getTemplatesPath('.');
	const destToSourcesMap: Map<string, string[]> = new Map();
	for (let i = 0; i < relativeSourcePaths.length; i++) {
		const relativeSourcePath = relativeSourcePaths[i];
		const sourcePath = path.join(templatesPath, relativeSourcePath);
		// Remove template category parent & feature prefix from source path
		const withoutHighestParent = removeHighestParent(relativeSourcePath);
		const withoutFeaturePrefix = removeFeaturePrefix(withoutHighestParent);
		const destFileName = path.resolve(path.join(destPath, withoutFeaturePrefix));
		// Create or insert map value
		const currentSources = destToSourcesMap.get(destFileName);
		if (currentSources !== undefined) {
			destToSourcesMap.set(destFileName, [...currentSources, sourcePath]);
		} else {
			destToSourcesMap.set(destFileName, [sourcePath]);
		}
	}
	return destToSourcesMap;
}

/**
 * Merges file content from source paths. If extension is unsupported, returns content of the first source path.
 * @param ext File extension of paths to merge
 * @param sourcePaths Paths to read & merge content from
 * @returns Merged content
 */
export function getMergedFileContents(ext: string, sourcePaths: string[]) {
	const strategy = getMergeStrategy(ext);
	const fileContents = sourcePaths.map((sourcePath) => fs.readFileSync(sourcePath).toString());
	return strategy(fileContents);
}

/**
 * Returns a function that takes in and merges file contents based on extension.
 * @param ext File extension
 * @returns Function that takes an array of multiple files' contents, and returns a merged version
 */
function getMergeStrategy(ext: string): (fileContents: string[]) => string {
	if (ext === '.json') {
		return (contents) => {
			// Parse all with node-jsonc-parser (JSON with commends)
			const objects: object[] = contents.map((obj) => parse(obj));
			// Perform a deep merge with ts-deepmerge
			const mergedObject = merge(...objects);
			return JSON.stringify(mergedObject, null, 4);
		};
	}
	if (ext === '.gitignore' || ext === '.example') {
		return (contents) => {
			return contents.join(os.EOL);
		};
	}
	// TODO maybe add diff (with line) for ts extension?
	// If unsupported, just get the last one
	return (contents) => contents[contents.length - 1];
}

/**
 * Copies the files to the destination!
 * @param destToSourcesMap Map of destination files to multiple source files from module installation
 * @param promptData Prompt data, for replacing name and description
 */
export function copyToDestination(destToSourcesMap: Map<string, string[]>, promptData: PromptData) {
	for (const [destPath, sourcePaths] of destToSourcesMap.entries()) {
		// Merge contents based on extension
		const ext = path.extname(destPath);
		let mergedContents = getMergedFileContents(ext, sourcePaths);

		// Replace name and description
		mergedContents = mergedContents.replaceAll('{{name}}', promptData.name);
		mergedContents = mergedContents.replaceAll('{{description}}', promptData.description);

		// Create parent directory if it does not exist
		const parentDir = path.dirname(destPath);
		if (!fs.existsSync(parentDir)) {
			fs.mkdirSync(parentDir, { recursive: true });
		}
		// Write merged contents
		fs.writeFileSync(destPath, mergedContents);
	}
}
