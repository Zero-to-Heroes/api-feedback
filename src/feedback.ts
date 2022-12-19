import { APIGatewayEvent } from 'aws-lambda';
import { SES } from 'aws-sdk';

// This example demonstrates a NodeJS 8.10 async handler[1], however of course you could use
// the more traditional callback-style handler.
// [1]: https://aws.amazon.com/blogs/compute/node-js-8-10-runtime-now-available-in-aws-lambda/
export default async (event: APIGatewayEvent, context, callback): Promise<any> => {
	const feedbackEvent: FeedbackEvent = JSON.parse(event.body);

	const body = `
	From: ${feedbackEvent.email}
	User: ${feedbackEvent.user}
	Version: ${feedbackEvent.version}
	
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

interface FeedbackEvent {
	readonly email: string;
	readonly user: string;
	readonly message: string;
	readonly appLogsKey: string;
	readonly gameLogsKey: string;
	readonly version: string;
}
