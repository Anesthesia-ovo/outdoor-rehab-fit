/**
 * Resolve equipment image sources from the i18n equipment list by id.
 * Images cannot be stored in AsyncStorage, so look them up at render time.
 */
export function findEquipmentById(equipmentList, equipmentId) {
	if (!Array.isArray(equipmentList) || equipmentId === undefined || equipmentId === null) {
		return null;
	}
	return equipmentList.find((item) => String(item.id) === String(equipmentId)) || null;
}

export function getEquipmentIcon(equipmentList, equipmentId) {
	const item = findEquipmentById(equipmentList, equipmentId);
	return item?.icon || item?.pic || item?.horizontalPic || null;
}

export const ACTIVITY_TYPE_ICONS = {
	aerobic: require("../assets/icons/outdoor/aerobic.png"),
	balance: require("../assets/icons/outdoor/balance.png"),
	strength: require("../assets/icons/outdoor/muscle.png"),
};
