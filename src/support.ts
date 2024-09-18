import { CardIds } from '@firestone-hs/reference-data';
import { BgsBattleInfo } from '@firestone-hs/simulate-bgs-battle/dist/bgs-battle-info';
import { BgsBoardInfo } from '@firestone-hs/simulate-bgs-battle/dist/bgs-board-info';
import { BoardEntity } from '@firestone-hs/simulate-bgs-battle/dist/board-entity';
import { allCards, FeedbackEvent } from './feedback';

export const isSupportedForBgsReport = (feedbackEvent: FeedbackEvent): boolean => {
	const messageInfo = JSON.parse(feedbackEvent.message);
	const battleInfo: BgsBattleInfo = messageInfo.battleInfo;
	return (
		isSupportedForPlayer(battleInfo.playerBoard) &&
		isSupportedForPlayer(battleInfo.opponentBoard) &&
		isSupportedFaceOff(battleInfo)
	);
};

const isSupportedFaceOff = (battleInfo: BgsBattleInfo): boolean => {
	const isScallywagVsRisenRider = isScallywagVsRisenRiderBoard(battleInfo);
	const isScallywagVsScarletSkull = isScallywagVsScarletSkullBoard(battleInfo);
	const isLightningInvocationVsMisfitDragonlingHsBug = isLightningInvocationVsMisfitDragonlingHsBugBoard(battleInfo);
	const isFragrantPhylacteryAndBronzeTimepieceHsBug = isFragrantPhylacteryAndBronzeTimepieceHsBugBoard(battleInfo);
	return (
		!isScallywagVsRisenRider &&
		!isScallywagVsScarletSkull &&
		!isLightningInvocationVsMisfitDragonlingHsBug &&
		!isFragrantPhylacteryAndBronzeTimepieceHsBug
	);
};

const isFragrantPhylacteryAndBronzeTimepieceHsBugBoard = (battleInfo: BgsBattleInfo): boolean => {
	return (
		(battleInfo.playerBoard.player.heroPowerId === CardIds.TamsinRoame_FragrantPhylactery &&
			battleInfo.playerBoard.player.trinkets?.some(
				(t) => t.cardId === CardIds.BronzeTimepiece_BG30_MagicItem_995,
			)) ||
		(battleInfo.opponentBoard.player.heroPowerId === CardIds.TamsinRoame_FragrantPhylactery &&
			battleInfo.opponentBoard.player.trinkets?.some(
				(t) => t.cardId === CardIds.BronzeTimepiece_BG30_MagicItem_995,
			))
	);
};

// An HS bug that is quite persistent, where misfit is buffed before the lightning invocation triggers, thus surviving
const isLightningInvocationVsMisfitDragonlingHsBugBoard = (battleInfo: BgsBattleInfo): boolean => {
	return (
		(hasMisfitDragonling(battleInfo.playerBoard.board) &&
			battleInfo.opponentBoard.player?.heroPowerId === CardIds.LightningInvocationToken) ||
		(hasMisfitDragonling(battleInfo.opponentBoard.board) &&
			battleInfo.playerBoard.player?.heroPowerId === CardIds.LightningInvocationToken)
	);
};

const isScallywagVsRisenRiderBoard = (battleInfo: BgsBattleInfo): boolean => {
	return (
		(hasScallywag(battleInfo.playerBoard.board) && hasRisenRider(battleInfo.opponentBoard.board)) ||
		(hasScallywag(battleInfo.opponentBoard.board) && hasRisenRider(battleInfo.playerBoard.board))
	);
};

const isScallywagVsScarletSkullBoard = (battleInfo: BgsBattleInfo): boolean => {
	return (
		(hasScallywag(battleInfo.playerBoard.board) && hasScarletSkull(battleInfo.opponentBoard.board)) ||
		(hasScallywag(battleInfo.opponentBoard.board) && hasScarletSkull(battleInfo.playerBoard.board))
	);
};

const hasMisfitDragonling = (board: BoardEntity[]): boolean => {
	return board.some(
		(e) => e.cardId === CardIds.MisfitDragonling_BG29_814 || e.cardId === CardIds.MisfitDragonling_BG29_814_G,
	);
};

const hasScallywag = (board: BoardEntity[]): boolean => {
	return board.some((e) => e.cardId === CardIds.Scallywag_BGS_061 || e.cardId === CardIds.Scallywag_TB_BaconUps_141);
};
const hasRisenRider = (board: BoardEntity[]): boolean => {
	return board.some((e) => e.cardId === CardIds.RisenRider_BG25_001 || e.cardId === CardIds.RisenRider_BG25_001_G);
};
const hasScarletSkull = (board: BoardEntity[]): boolean => {
	return board.some(
		(e) => e.cardId === CardIds.ScarletSkull_BG25_022 || e.cardId === CardIds.ScarletSkull_BG25_022_G,
	);
};

const isSupportedForPlayer = (playerInfo: BgsBoardInfo): boolean => {
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
				isStartOfCombat(m.cardId) &&
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
		heroPower === CardIds.EmbraceYourRage && isStartOfCombat(player.heroPowerInfo);
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

const isStartOfCombat = (cardId: string | number): boolean => {
	return allCards.getCard(cardId).text?.toLowerCase().includes('<b>start of combat:</b>');
};
