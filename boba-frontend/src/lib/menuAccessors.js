// src/lib/menuAccessors.js

// Adjust these ONLY if your API uses different keys.
// This prevents "assuming" shapes across the codebase.

export const getItemId = (item) => item?.id;
export const getItemName = (item) => item?.name ?? "";
export const getItemDescription = (item) => item?.description ?? "";
export const getItemBasePrice = (item) => item?.basePrice ?? item?.base_price ?? "0.00";
export const getItemImageUrl = (item) => item?.imageUrl ?? item?.image_url ?? null;

export const getItemOptionGroups = (item) => item?.optionGroups ?? item?.option_groups ?? [];

export const getGroupId = (g) => g?.id;
export const getGroupName = (g) => g?.name ?? "";
export const getGroupSelectionType = (g) => g?.selectionType ?? g?.selection_type ?? "single";
export const getGroupIsRequired = (g) => Boolean(g?.isRequired ?? g?.is_required);

export const getGroupOptions = (g) => g?.options ?? [];

export const getOptionId = (o) => o?.id;
export const getOptionLabel = (o) => o?.label ?? "";
export const getOptionPriceDelta = (o) => o?.priceDelta ?? o?.price_delta ?? "0.00";