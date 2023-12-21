import chalk from 'chalk';
import cp from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { getPathsFromTemplate } from './features.js';
import { copyToDestination, createDestToSourcesMap } from './files.js';
import { prompt } from './prompt.js';

async function main() {
	console.log(chalk.blue(' ____________'));
	console.log(`${chalk.blue('| ')} ___ _ _  ${chalk.blue(' |')}`);
	console.log(`${chalk.blue('| ')}/ __| | | ${chalk.blue(' |')}`);
	console.log(`${chalk.blue('| ')}\\__ \\_  _|${chalk.blue(' |')}`);
	console.log(`${chalk.blue('| ')}|___/ |_| ${chalk.blue(' |')}`);
	console.log(chalk.blue('|____________|'));

	const promptData = await prompt();

	let start;
	let end;

	if (promptData.deletePathContents) {
		console.log('');
		console.log(`${chalk.blue('[S4]')} Deleting existing path contents...`);
		start = Date.now();
		fs.rmSync(promptData.path, { recursive: true, force: true });
		end = Date.now();
		console.log(`  ✓  ${chalk.green(`Finished in ${end - start}ms`)}`);
	}

	console.log('');
	console.log(`${chalk.blue('[S4]')} Copying template...`);
	start = Date.now();
	const sourcePaths = getPathsFromTemplate(promptData.features);
	const destToSourcesMap = createDestToSourcesMap(promptData.path, sourcePaths);
	copyToDestination(destToSourcesMap, promptData);
	end = Date.now();
	console.log(`  ✓  ${chalk.green(`Finished in ${end - start}ms`)}`);

	console.log('');
	console.log(`${chalk.blue('[S4]')} Installing dependencies...`);
	const installCmd = os.platform().startsWith('win') ? 'yarn.cmd' : 'yarn';
	start = Date.now();
	await spawnPromise(installCmd, ['install'], {
		env: process.env,
		cwd: path.join(process.cwd(), promptData.path),
		stdio: 'inherit',
	});
	end = Date.now();
	console.log(`  ✓  ${chalk.green(`Finished in ${end - start}ms`)}`);

	console.log('');
	console.log(`${chalk.blue('[S4]')} All done! Next steps:`);
	console.log(`${chalk.blue('-')} Navigate to the project folder with ${chalk.green(`cd ${promptData.path}`)}`);
	console.log(`${chalk.blue('-')} Run the compiler in watch mode with ${chalk.green('yarn watch')}`);
	console.log(`${chalk.blue('-')} Run the bot in watch mode with ${chalk.green('yarn dev')}`);
	console.log('');
}

main();

function spawnPromise(command: string, args: readonly string[], options: cp.SpawnOptions): Promise<string> {
	return new Promise((resolve, reject) => {
		cp.spawn(command, args, options)
			.on('close', (code) => {
				resolve((code ?? -1).toString());
			})
			.on('error', (err) => {
				reject(err.message);
			});
	});
}
