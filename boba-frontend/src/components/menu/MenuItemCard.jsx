export default function MenuItemCard({ item, onSelect }) {
  const price = item?.basePrice ?? item?.base_price ?? "";
  const hasImage = !!item?.imageUrl;

  return (
    <button
      type="button"
      onClick={() => onSelect?.(item)}
      className="group w-full text-left rounded-2xl border border-slate-200 bg-white shadow-sm
                 hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 transition
                 overflow-hidden"
    >
      {/* Image area: full image, no cropping */}
     <div className="border-b border-slate-200 bg-white">
        <div className="aspect-[16/7] sm:aspect-[16/8] w-full max-h-44 sm:max-h-45 flex items-start justify-center overflow-hidden">
          {hasImage ? (
            <img
              src={item.imageUrl}
              alt={item?.name || "Menu item"}
              className="h-full w-full object-contain object-top p-2"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full grid place-items-center text-slate-400 text-sm">
              No image
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-4 bg-slate-50">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-lg font-extrabold leading-snug text-slate-900 line-clamp-2 ">
            {item?.name}
          </h3>
          <span className="shrink-0 text-base font-bold text-slate-900">
            {price ? `ETB ${price}` : ""}
          </span>
        </div>

        {item?.description ? (
          <p className="mt-1 text-base text-slate-600 line-clamp-2">
            {item.description}
          </p>
        ) : (
          <p className="mt-1 text-base text-slate-400 italic">No description</p>
        )}

        <div className="mt-4 flex items-center justify-between">
          {/* <span className="text-sm font-semibold text-slate-600">
            {item?.optionGroups?.length
              ? `${item.optionGroups.length} option group(s)`
              : "No options"}
          </span> */}

          <span className="text-sm font-bold text-white bg-slate-900 px-3 py-2 rounded-xl
                           group-hover:bg-slate-800 transition">
            Order Now
          </span>
        </div>
      </div>
    </button>
  );
}