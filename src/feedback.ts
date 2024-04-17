import { getConnection } from '@firestone-hs/aws-lambda-utils';
import { GameType } from '@firestone-hs/reference-data';
import { APIGatewayEvent } from 'aws-lambda';
import { SES } from 'aws-sdk';
import { isSupportedForBgsReport } from './support';

const minRequiredVersionForBgsFeedback = '13.11.2';
const stopBgsEmails = true;
const supportedGameModes = [GameType.GT_BATTLEGROUNDS];

// This example demonstrates a NodeJS 8.10 async handler[1], however of course you could use
// the more traditional callback-style handler.
// [1]: https://aws.amazon.com/blogs/compute/node-js-8-10-runtime-now-available-in-aws-lambda/
export default async (event: APIGatewayEvent, context, callback): Promise<any> => {
	const feedbackEvent: FeedbackEvent = JSON.parse(event.body);

	let reviewLink = '';
	// Temporarily disable it
	if (feedbackEvent.email === 'automated-email-bg-sim@firestoneapp.com') {
		await handleBgsSimTerminalFailure(feedbackEvent);

		const isSupportedForReport = isSupportedForBgsReport(feedbackEvent);
		const currentVersion = feedbackEvent.version;
		// If the current version is lower than the minimum required version, we don't send the email
		// Versions are in the format Major.minor.patch
		const currentVersionParts = currentVersion.split('.');
		const minVersionParts = minRequiredVersionForBgsFeedback.split('.');
		// Compare versions
		const currentVersionNumber =
			parseInt(currentVersionParts[0]) * 10000 +
			parseInt(currentVersionParts[1]) * 100 +
			parseInt(currentVersionParts[2]);
		const minVersionNumber =
			parseInt(minVersionParts[0]) * 10000 + parseInt(minVersionParts[1]) * 100 + parseInt(minVersionParts[2]);

		const messageInfo = JSON.parse(feedbackEvent.message);
		reviewLink = `Review: http://replays.firestoneapp.com/?reviewId=${messageInfo.reviewId}&turn=${
			2 * messageInfo.currentTurn + 1
		}&action=0`;

		if (!isSupportedForReport) {
			console.debug('board not supported', reviewLink);
			const response = {
				statusCode: 200,
				isBase64Encoded: false,
				body: JSON.stringify({ message: 'ok', result: 'unsupported-boards' }),
			};
			return response;
		}
		if (
			stopBgsEmails ||
			currentVersionNumber < minVersionNumber ||
			!supportedGameModes.includes(+messageInfo.gameType)
		) {
			console.debug('not notifying', stopBgsEmails, currentVersionNumber, minVersionNumber);
			const response = {
				statusCode: 200,
				isBase64Encoded: false,
				body: JSON.stringify({ message: 'ok', result: 'version-too-old' }),
			};
			return response;
		}
	}

	const body = `
	From: ${feedbackEvent.email}
	User: ${feedbackEvent.user}
	Version: ${feedbackEvent.version}
	SubPlan: ${feedbackEvent.subscription}
	
	${reviewLink}
	Message: ${feedbackEvent.message}
	
	App logs: https://s3-us-west-2.amazonaws.com/com.zerotoheroes.support/${feedbackEvent.appLogsKey}
	Game logs: https://s3-us-west-2.amazonaws.com/com.zerotoheroes.support/${feedbackEvent.gameLogsKey}`;
	const params: SES.Types.SendEmailRequest = {
		Destination: {
			ToAddresses: ['support@firestoneapp.com'],
		},
		Message: {
			Subject: {
				Charset: 'UTF-8',
				Data: 'Firestone feedback form',
			},
			Body: {
				Text: {
					Charset: 'UTF-8',
					Data: body,
				},
			},
		},
		Source: 'seb@firestoneapp.com',
		ReplyToAddresses: [feedbackEvent.email ?? 'seb@firestoneapp.com'],
	} as SES.Types.SendEmailRequest;
	const result = await new SES({ apiVersion: '2010-12-01' }).sendEmail(params).promise();

	const response = {
		statusCode: 200,
		isBase64Encoded: false,
		body: JSON.stringify({ message: 'ok', result: result }),
	};
	return response;
};

const handleBgsSimTerminalFailure = async (feedbackEvent: FeedbackEvent) => {
	// Increment the `analytics_bgs_terminal_failures.failures` field in the DB for the `date` key (date is YYYY-MM-DD)
	// If no entry exists for the date, create it
	// If the entry exists, increment the value
	const mysql = await getConnection();
	const message = JSON.parse(feedbackEvent.message);
	try {
		const date = new Date().toISOString().slice(0, 10);
		const existingEntry: readonly any[] = await mysql.query(
			`SELECT * FROM analytics_bgs_terminal_failures WHERE date = ? AND gameType = ? AND version = ?`,
			[date, message.gameType ?? -1, feedbackEvent.version],
		);
		if (existingEntry && existingEntry.length > 0) {
			await mysql.query(
				`UPDATE analytics_bgs_terminal_failures SET failures = failures + 1 WHERE date = ? AND gameType = ? AND version = ?`,
				[date, message.gameType ?? -1, feedbackEvent.version],
			);
		} else {
			await mysql.query(
				`INSERT INTO analytics_bgs_terminal_failures(date, gameType, version, failures) VALUES (?, ?, ?, 1)`,
				[date, message.gameType ?? -1, feedbackEvent.version],
			);
		}
	} finally {
		await mysql.end();
	}
};

export interface FeedbackEvent {
	readonly email: string;
	readonly user: string;
	readonly message: string;
	readonly appLogsKey: string;
	readonly gameLogsKey: string;
	readonly gameType: GameType;
	readonly version: string;
	readonly subscription: string;
}
