import fs from 'fs';
import i from 'inquirer';
import { Feature } from './features.js';

export type PromptData = {
	name: string;
	description: string;
	path: string;
	deletePathContents?: boolean;
	features: Feature[];
};

export async function prompt() {
	return (await i.prompt([
		{
			type: 'input',
			name: 'name',
			message: 'What will your bot be named?',
			validate: (input) => (input.length > 0 ? true : 'Name must be defined'),
		},
		{
			type: 'input',
			name: 'description',
			message: 'What is the description of your bot?',
		},
		{
			type: 'input',
			name: 'path',
			message: 'Where will your bot be located?',
			default: './my-cool-bot',
		},
		{
			type: 'confirm',
			name: 'deletePathContents',
			message: 'This location is not empty. Would you like to empty it and continue?',
			default: false,
			when: (answers) => fs.existsSync(answers.path) && fs.readdirSync(answers.path).length > 0,
			validate: (input) => {
				if (!input) process.exit();
			},
		},
		{
			type: 'checkbox',
			name: 'features',
			message: 'What features would you like to enable?',
			choices: [{ name: ' Database (with Drizzle ORM)', value: 'drizzle' }],
		},
	])) as PromptData;
}
