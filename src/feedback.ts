import { APIGatewayEvent } from 'aws-lambda';
import { SES } from 'aws-sdk';

// This example demonstrates a NodeJS 8.10 async handler[1], however of course you could use
// the more traditional callback-style handler.
// [1]: https://aws.amazon.com/blogs/compute/node-js-8-10-runtime-now-available-in-aws-lambda/
export default async (event: APIGatewayEvent, context, callback): Promise<any> => {
	console.log('input body', event.body);
	const feedbackEvent: FeedbackEvent = JSON.parse(event.body);
	console.log('feedbackEvent', feedbackEvent);
	const body = `
	From: ${feedbackEvent.email}
	User: ${feedbackEvent.user}
	
	Message: ${feedbackEvent.message}
	
	App logs: ${feedbackEvent.appLogsKey}
	Game logs: ${feedbackEvent.gameLogsKey}`;
	const params = {
		Destination: {
			ToAddresses: ['sebastien+firestone-feedback@tromp.fr', 'ilil.ben.shalom@overwolf.com'],
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
		Source: 'seb@zerotoheroes.com',
	};
	console.log('sending email', params);
	try {
		const result = await new SES({ apiVersion: '2010-12-01' }).sendEmail(params).promise();
		const response = {
			statusCode: 200,
			isBase64Encoded: false,
			body: JSON.stringify({ message: 'ok', result: result }),
		};
		console.log('sending back success reponse', response);
		return response;
	} catch (e) {
		const response = {
			statusCode: 500,
			isBase64Encoded: false,
			body: JSON.stringify({ message: 'not ok', exception: e }),
		};
		console.log('sending back error reponse', response);
		return response;
	}
};

interface FeedbackEvent {
	readonly email: string;
	readonly user: string;
	readonly message: string;
	readonly appLogsKey: string;
	readonly gameLogsKey: string;
}
