import { CardIds } from '@firestone-hs/reference-data';
import { START_OF_COMBAT_CARD_IDS } from './card-data';
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
	// HS Bug
	const isGlimGuardiandAndWhelpSmugglerBug =
		board.some((e) => e.cardId === CardIds.GlimGuardian_BG29_888 || e.cardId === CardIds.GlimGuardian_BG29_888_G) &&
		board.some((e) => e.cardId === CardIds.WhelpSmuggler_BG21_013 || e.cardId === CardIds.WhelpSmuggler_BG21_013_G);
	// HS Bug
	const isEmbraceYourRageIntoStartOfCombat =
		player.heroPowerId === CardIds.EmbraceYourRage &&
		START_OF_COMBAT_CARD_IDS.includes(player.heroPowerInfo);
	const supported =
		!isStormpikesAndScally && !isGlimGuardiandAndWhelpSmugglerBug && !isEmbraceYourRageIntoStartOfCombat;
	if (!supported) {
		console.log(
			'unsupported',
			heroPower,
			board.map((e) => e.cardId),
			player,
		);
	}
	return supported;
};
