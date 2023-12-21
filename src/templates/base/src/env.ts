import { red } from 'colorette';
import 'dotenv/config';
import z from 'zod';

// Schema
const envSchema = z.object({
	BOT_TOKEN: z.string(),
	NODE_ENV: z.enum(['production', 'development']).default('production'),
});

// Validate
const env = envSchema.safeParse(process.env);
if (!env.success) {
	for (let i = 0; i < env.error.issues.length; i++) {
		const issue = env.error.issues[i];
		console.error(red(`${issue.path.join('')}: ${issue.message}`));
	}
	console.error('!! .env file loaded with errors, see above.');
	process.exit();
}

export default env.data;
