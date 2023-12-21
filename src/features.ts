import { readdirSync } from 'fs';
import { basename, dirname, extname, join } from 'path';
import { getTemplatesPath } from './files.js';

// Currently only drizzle, but may be 'this' | 'that'
export type Feature = 'drizzle';

export const EXTRAS_FILENAME_REGEX = /{(.*)}(.*)/;

/**
 * Gets all the file paths that should be copied, given a list of extra features
 * @param features List of extra features to include
 * @returns Tuple containing: Source paths of files to include (from installed package code), and if the path is extra or not
 */
export function getPathsFromTemplate(features: Feature[]): string[] {
	// Gets files in base and extras (IS RELATIVE TO WHERE THE ACTUAL INSTALLED PACKAGE CODE IS!)
	const basePaths = readdirSync(getTemplatesPath('base'), { recursive: true }) as string[];
	const extrasPaths = readdirSync(getTemplatesPath('extras'), { recursive: true }) as string[];

	const filteredExtras = extrasPaths.map((path) => {
		// Base file name (ex. '{feature}file.ext')
		const filename = basename(path);

		// Gets match for the '{feature}file.ext' pattern, if it doesn't then don't include it (return null)
		const match = filename.match(EXTRAS_FILENAME_REGEX);
		if (match == null) return null;

		// Returns if the file is compatible with all features
		const extraFileFeatures = match[1].split(',') as Feature[];
		if (extraFileFeatures.every((feature) => features.includes(feature))) {
			return join('extras', dirname(path), filename);
		}

		// If it's not compatible, don't include it
		return null;
	}) as (string | null)[];

	// Add 'base' parent to base paths, and filter out all extra files that are null
	const basePathsWithParent = basePaths.map((_) => join('base', _));
	const extraNoNulls = filteredExtras.filter((_) => _ != null) as string[];
	const allPaths = [...basePathsWithParent, ...extraNoNulls];
	// console.log(allPaths);
	const allFilePaths = allPaths.filter((path) => extname(path) !== '');
	return allFilePaths;
}
