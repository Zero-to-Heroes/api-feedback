import { CardIds } from '@firestone-hs/reference-data';
import { START_OF_COMBAT_CARD_IDS } from './card-data';
import { FeedbackEvent } from './feedback';

export const isSupportedForBgsReport = (feedbackEvent: FeedbackEvent): boolean => {
	const messageInfo = JSON.parse(feedbackEvent.message);
	const battleInfo = messageInfo.battleInfo;
	return isSupportedForPlayer(battleInfo.playerBoard) && isSupportedForPlayer(battleInfo.opponentBoard);
};

const isSupportedForPlayer = (playerInfo: any): boolean => {
	const player = playerInfo.player;
	const heroPower = player.heroPowerId;
	const board = playerInfo.board;

	const isStormpikesAndScally =
		heroPower === CardIds.VanndarStormpike_LeadTheStormpikes &&
		board.some((e) => e.cardId === CardIds.Scallywag_BGS_061 || e.cardId === CardIds.Scallywag_TB_BaconUps_141);
	const isRapidReanimationIntoStartOfCombat =
		heroPower === CardIds.TeronGorefiend_RapidReanimation &&
		board.some(
			(m) =>
				START_OF_COMBAT_CARD_IDS.includes(m.cardId) &&
				m.enchantments?.some((e) => e.cardId === CardIds.RapidReanimation_ImpendingDeathEnchantment),
		);
	// Maybe not needed, as it's explicitly flagged as "not supported" in Firestone now
	const isZilliaxAssembledEnchantment = board.some((e) =>
		e.enchantments?.some(
			(enchantment) => enchantment.cardId === CardIds.ZilliaxAssembled_ZilliaxAssembledEnchantment_BG29_100_Ge,
		),
	);

	// HS Bug
	const isGlimGuardiandAndWhelpSmugglerBug =
		board.some((e) => e.cardId === CardIds.GlimGuardian_BG29_888 || e.cardId === CardIds.GlimGuardian_BG29_888_G) &&
		board.some((e) => e.cardId === CardIds.WhelpSmuggler_BG21_013 || e.cardId === CardIds.WhelpSmuggler_BG21_013_G);
	// HS Bug
	const isDefiantShipwrightAndAllWilBurnBug =
		heroPower === CardIds.AllWillBurn &&
		board.some(
			(e) => e.cardId === CardIds.DefiantShipwright_BG21_018 || e.cardId === CardIds.DefiantShipwright_BG21_018_G,
		);
	// HS Bug
	const isEmbraceYourRageIntoStartOfCombatBug =
		heroPower === CardIds.EmbraceYourRage && START_OF_COMBAT_CARD_IDS.includes(player.heroPowerInfo);
	// HS Bug
	const isPackTacticsBug = playerInfo.secrets?.some((s) => s.cardId === CardIds.PackTactics_TB_Bacon_Secrets_15);

	const supported =
		!isStormpikesAndScally &&
		!isZilliaxAssembledEnchantment &&
		!isRapidReanimationIntoStartOfCombat &&
		!isGlimGuardiandAndWhelpSmugglerBug &&
		!isEmbraceYourRageIntoStartOfCombatBug &&
		!isPackTacticsBug &&
		!isDefiantShipwrightAndAllWilBurnBug;
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
