import MenuItemCard from "./MenuItemCard";

export default function CategorySection({ category, onSelectItem }) {
  const items = category?.items || [];

  return (
    <section className="mt-10">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            {category?.name}
          </h2>
          <p className="mt-1 text-base text-slate-600">
            {items.length} item{items.length === 1 ? "" : "s"}
          </p>
        </div>

        <div className="hidden sm:flex items-center gap-2 text-sm text-slate-500">
          <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
          Available
        </div>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {items.map((item) => (
          <MenuItemCard key={item.id} item={item} onSelect={onSelectItem} />
        ))}
      </div>
    </section>
  );
}