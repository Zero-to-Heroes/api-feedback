import { CardIds } from '@firestone-hs/reference-data';
import { FeedbackEvent } from './feedback';

export const isSupportedForBgsReport = (feedbackEvent: FeedbackEvent): boolean => {
	const messageInfo = JSON.parse(feedbackEvent.message);
	const battleInfo = messageInfo.battleInfo;
	return isSupportedForPlayer(battleInfo.playerBoard) && isSupportedForPlayer(battleInfo.opponentBoard);
};

const isSupportedForPlayer = (player: any): boolean => {
	const heroPower = player.heroPowerId;
	const board = player.board;
	const isStormpikesAndScally =
		heroPower === CardIds.VanndarStormpike_LeadTheStormpikes &&
		board.some((e) => e.cardId === CardIds.Scallywag_BGS_061 || e.cardId === CardIds.Scallywag_TB_BaconUps_141);
	if (isStormpikesAndScally) {
		console.log(
			'unsupported',
			heroPower,
			board.map((e) => e.cardId),
			player,
		);
	}
	return !isStormpikesAndScally;
};
