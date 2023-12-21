import { SapphireClient } from '@sapphire/framework';
import { blue, green } from 'colorette';
import { OAuth2Scopes, PermissionFlagsBits } from 'discord.js';
import env from './env';

const client = new SapphireClient({
	intents: [],
	loadApplicationCommandRegistriesStatusListeners: env.NODE_ENV === 'development',
});

// Print client invite on ready
client.on('ready', (_client) => {
	const invite_url = _client.generateInvite({
		scopes: [OAuth2Scopes.Bot, OAuth2Scopes.ApplicationsCommands],
		permissions: [PermissionFlagsBits.SendMessages, PermissionFlagsBits.EmbedLinks],
	});

	console.log();
	console.log(green(`Logged in as ${_client.user.tag}`));
	console.log(blue('vVv Invite the bot with the link below vVv'));
	console.log(invite_url);
	console.log();
});

client.login(env.BOT_TOKEN);
