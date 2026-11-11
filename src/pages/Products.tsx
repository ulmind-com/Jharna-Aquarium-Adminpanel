import { Flame, Leaf, PawPrint, Ruler, Sparkles, Sprout, Star, Sun, Tag, Wind } from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api } from "../api";
import DeleteButton from "../components/DeleteButton";
import { resolveStorefrontAsset } from "../config";

export default function Products() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const catFilter = searchParams.get("category_id") || "";
  const [statusFilter, setStatusFilter] = useState("all");

  const [categoryTree, setCategoryTree] = useState<any[]>([]);

  const setCatFilter = (nextCat: string) => {
    const next = new URLSearchParams(searchParams);
    if (nextCat) next.set("category_id", nextCat);
    else next.delete("category_id");
    setSearchParams(next, { replace: true });
  };

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const qs = new URLSearchParams({ limit: "500", admin: "true" });
    if (catFilter) qs.set("category_id", catFilter);
    api
      .get(`/products?${qs.toString()}`)
      .then((data) => {
        if (!cancelled) setItems(Array.isArray(data) ? data : []);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [catFilter]);

  useEffect(() => {
    api.get("/categories/tree").then((data) => setCategoryTree(Array.isArray(data) ? data : [])).catch(() => {});
  }, []);

  const { categoryById, matchingCategoryIds } = useMemo(() => {
    const byId: Record<string, { id: string; name: string; parentName?: string }> = {};
    const descendantMap: Record<string, Set<string>> = {};

    for (const parent of categoryTree) {
      byId[parent.id] = { id: parent.id, name: parent.name };
      const ids = new Set<string>([parent.id]);
      for (const child of parent.children || []) {
        byId[child.id] = { id: child.id, name: child.name, parentName: parent.name };
        ids.add(child.id);
        descendantMap[child.id] = new Set([child.id]);
      }
      descendantMap[parent.id] = ids;
    }

    return {
      categoryById: byId,
      matchingCategoryIds: catFilter ? (descendantMap[catFilter] ?? new Set([catFilter])) : null,
    };
  }, [categoryTree, catFilter]);

  const activeCategory = catFilter ? categoryById[catFilter] : undefined;

  const del = (id: string) => api.del(`/products/${id}`);
  const afterDel = (id: string) => setItems((p) => p.filter((x) => x.id !== id));

  const filteredItems = items.filter((p) => {
    if (search && !p.title.toLowerCase().includes(search.toLowerCase()) && !(p.sku || "").toLowerCase().includes(search.toLowerCase()) && !(p.plant_spec?.scientific_name || "").toLowerCase().includes(search.toLowerCase())) return false;
    if (matchingCategoryIds) {
      const inPrimary = Boolean(p.category_id && matchingCategoryIds.has(p.category_id));
      const inExtra = Array.isArray(p.extra_category_ids) && p.extra_category_ids.some((id: string) => matchingCategoryIds.has(id));
      if (!inPrimary && !inExtra) return false;
    }
    if (statusFilter === "active" && !p.is_active) return false;
    if (statusFilter === "hidden" && p.is_active) return false;
    if (statusFilter === "low_stock" && p.total_stock > (p.low_stock_threshold || 5)) return false;
    if (statusFilter === "bestseller" && !p.is_bestseller) return false;
    return true;
  });

  const addProductHref = catFilter ? `/products/new?category_id=${encodeURIComponent(catFilter)}` : "/products/new";

  return (
    <>
      <div className="between" style={{ flexWrap: "wrap", gap: 12 }}>
        <h1 className="inline-icon" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", margin: 0 }}>
          <Leaf size={24} color="var(--primary)" aria-hidden="true" />
          <span>Plant Inventory</span>
          {activeCategory && (
            <span className="pill green" style={{ fontSize: 12, marginLeft: 4 }}>
              {activeCategory.parentName ? `${activeCategory.parentName} / ` : ""}
              {activeCategory.name}
            </span>
          )}
        </h1>
        <Link to={addProductHref} className="btn">
          {activeCategory ? `+ Add Plant in ${activeCategory.name}` : "+ Add Plant"}
        </Link>
      </div>

      <div className="card" style={{ marginTop: 18, marginBottom: -18, padding: 14, display: "flex", flexWrap: "wrap", gap: 12, background: "var(--primary-50)", border: "1px solid var(--primary-100)" }}>
        <input
          placeholder="Search by name, SKU or scientific name..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ flex: 1, minWidth: 200, margin: 0, padding: "9px 14px" }}
        />
        <select value={catFilter} onChange={e => setCatFilter(e.target.value)} style={{ margin: 0, padding: "9px 14px", width: 220 }}>
          <option value="">All Categories</option>
          {categoryTree.map((parent) => (
            <React.Fragment key={parent.id}>
              <option value={parent.id}>{parent.name}</option>
              {(parent.children || []).map((child: any) => (
                <option key={child.id} value={child.id}>
                  &nbsp;&nbsp;- {child.name}
                </option>
              ))}
            </React.Fragment>
          ))}
        </select>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ margin: 0, padding: "9px 14px", width: 160 }}>
          <option value="all">All Status</option>
          <option value="active">Active Only</option>
          <option value="hidden">Hidden Only</option>
          <option value="low_stock">Low Stock</option>
          <option value="bestseller">Bestsellers</option>
        </select>
      </div>

      <div className="card" style={{ marginTop: 18 }}>
        {loading ? (
          <p className="muted">Loading plants…</p>
        ) : (
          <table>
            <thead>
              <tr><th></th><th>Plant Info</th><th>Specs</th><th>Price</th><th>Stock</th><th>Status</th><th></th></tr>
            </thead>
            <tbody>
              {filteredItems.map((p) => {
                const primaryCat = p.category_id ? categoryById[p.category_id] : undefined;
                const rowThumb = resolveStorefrontAsset(p.images?.[0] || p.sizes?.[0]?.images?.[0]) || "https://via.placeholder.com/60";
                return (
                <React.Fragment key={p.id}>
                  <tr>
                    <td><img className="thumb" src={rowThumb} /></td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{p.title}</div>
                      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 6, marginTop: 3 }}>
                        {primaryCat && (
                          <span className="pill green inline-icon" style={{ fontSize: 10.5, padding: "2px 8px", gap: 4 }}>
                            <Tag size={10} aria-hidden="true" />
                            <span>
                              {primaryCat.parentName ? `${primaryCat.parentName} / ` : ""}
                              {primaryCat.name}
                            </span>
                          </span>
                        )}
                        <span className="muted" style={{ fontSize: 12 }}>
                          {p.plant_spec?.scientific_name && <span style={{ fontStyle: "italic" }}>{p.plant_spec.scientific_name} • </span>}
                          {p.brand && <span>{p.brand} • </span>}
                          {p.sku && <span>SKU: {p.sku}</span>}
                        </span>
                      </div>
                    </td>
                    <td>
                      <div style={{ fontSize: 12, display: "flex", gap: 4, flexWrap: "wrap" }}>
                        {p.plant_spec?.plant_type && <span className="pill green" style={{ fontSize: 10, padding: "2px 8px" }}>{p.plant_spec.plant_type}</span>}
                        {p.plant_spec?.sunlight && <span className="pill blue inline-icon" style={{ fontSize: 10, padding: "2px 8px", gap: 4 }}><Sun size={11} aria-hidden="true" /> {p.plant_spec.sunlight}</span>}
                        {p.plant_spec?.difficulty_level && <span className="pill yellow" style={{ fontSize: 10, padding: "2px 8px" }}>{p.plant_spec.difficulty_level}</span>}
                        {p.plant_spec?.pet_safe && <span className="pill green inline-icon" style={{ fontSize: 10, padding: "2px 8px" }} title="Pet Safe"><PawPrint size={11} aria-hidden="true" /></span>}
                        {p.plant_spec?.air_purifying && <span className="pill blue inline-icon" style={{ fontSize: 10, padding: "2px 8px" }} title="Air Purifying"><Wind size={11} aria-hidden="true" /></span>}
                      </div>
                      <div className="muted inline-icon" style={{ fontSize: 11, marginTop: 4, gap: 6 }}>
                        <span className="inline-icon" style={{ gap: 3 }}>
                          {p.sold_count > 0 && <Flame size={11} color="#ea580c" aria-hidden="true" />}
                          <span>{p.sold_count > 0 ? `${p.sold_count} sold` : "0 sold"}</span>
                        </span>
                        <span>•</span>
                        <span className="inline-icon" style={{ gap: 3 }}>
                          {p.review_count > 0 ? (
                            <>
                              <Star size={11} fill="#f59e0b" color="#f59e0b" aria-hidden="true" />
                              <span>{p.rating?.toFixed(1)} ({p.review_count})</span>
                            </>
                          ) : (
                            <span>No reviews</span>
                          )}
                        </span>
                      </div>
                    </td>
                    <td>
                      {p.struck_price && <span style={{ textDecoration: "line-through", color: "#a79e95", marginRight: 6 }}>₹{p.struck_price}</span>}
                      <b>₹{p.final_price}</b>
                      {p.off_pct > 0 && <span style={{ color: "var(--green)" }}> ({p.off_pct}% off)</span>}
                      {p.price_varies && <div className="muted" style={{ fontSize: 11 }}>₹{p.price_from} – ₹{p.price_to}</div>}
                    </td>
                    <td>
                      <span className="pill" style={{ background: p.total_stock <= 5 ? "#fef2f2" : "var(--primary-100)", color: p.total_stock <= 5 ? "var(--red)" : "var(--primary-dark)" }}>
                        {p.total_stock}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                        {p.is_active ? <span className="pill green" style={{ fontSize: 11 }}>Active</span> : <span className="muted">Hidden</span>}
                        {p.is_bestseller && <span className="pill inline-icon" style={{ fontSize: 10, background: "#fff7ed", color: "#c2410c" }} title="Bestseller"><Flame size={11} aria-hidden="true" /></span>}
                        {p.is_new_arrival && <span className="pill blue inline-icon" style={{ fontSize: 10 }} title="New Arrival"><Sparkles size={11} aria-hidden="true" /></span>}
                      </div>
                    </td>
                    <td className="flex">
                      <Link to={`/products/${p.id}`} className="btn ghost sm">Edit</Link>
                      <DeleteButton confirm={`Delete "${p.title}"?`} onDelete={() => del(p.id)} onDone={() => afterDel(p.id)} />
                    </td>
                  </tr>
                  
                  {p.sizes && p.sizes.length > 0 && p.sizes.map((s: any, i: number) => {
                    const sStock = s.stock || 0;
                    return (
                      <tr key={`${p.id}-size-${i}`} style={{ background: "var(--primary-50)" }}>
                        <td style={{ paddingLeft: 30 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <span style={{ color: "var(--primary-300)", fontSize: 16 }}>↳</span>
                            {s.images?.[0] ? (
                               <img src={resolveStorefrontAsset(s.images[0])} style={{ width: 36, height: 36, borderRadius: 8, objectFit: "cover" }} />
                            ) : (
                               <div style={{ width: 36, height: 36, borderRadius: 8, background: "var(--primary-100)", color: "var(--primary-dark)", display: "flex", alignItems: "center", justifyContent: "center" }}><Sprout size={16} aria-hidden="true" /></div>
                            )}
                          </div>
                        </td>
                        <td>
                          <div style={{ fontSize: 13, color: "var(--text-light)" }}>
                            <span style={{ fontWeight: 600 }}>{s.name}</span>
                            {s.pot_size && <span> • {s.pot_size}</span>}
                            {s.pot_type && <span> • {s.pot_type}</span>}
                          </div>
                        </td>
                        <td>{s.height && <span className="muted inline-icon" style={{ fontSize: 12, gap: 4 }}><Ruler size={12} aria-hidden="true" /> {s.height}</span>}</td>
                        <td>
                          {s.price ? <b style={{ fontSize: 13, color: "var(--text-light)" }}>₹{s.price}</b> : <span className="muted" style={{ fontSize: 12 }}>Base (₹{p.final_price})</span>}
                        </td>
                        <td>
                          <span className="pill" style={{ fontSize: 11, padding: "2px 8px", background: sStock <= 5 ? "#fef2f2" : "var(--primary-100)", color: sStock <= 5 ? "var(--red)" : "var(--primary-dark)" }}>
                            {sStock}
                          </span>
                        </td>
                        <td></td>
                        <td></td>
                      </tr>
                    );
                  })}
                </React.Fragment>
                );
              })}
              {filteredItems.length === 0 && <tr><td colSpan={7} className="muted">No plants found matching filters.</td></tr>}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
