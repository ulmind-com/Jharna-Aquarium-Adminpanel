import { type CSSProperties, useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowDown,
  ArrowUp,
  Check,
  ExternalLink,
  FolderPlus,
  Image as ImageIcon,
  Layers,
  Package,
  Pencil,
  Plus,
  Search,
  SlidersHorizontal,
  Sparkles,
  Sprout,
  Upload,
  X,
} from "lucide-react";
import { api, uploadImage } from "../api";
import DeleteButton from "../components/DeleteButton";
import { STOREFRONT_URL, resolveStorefrontAsset } from "../config";

interface CategoryNode {
  id: string;
  name: string;
  slug: string;
  parent_id?: string | null;
  blurb?: string | null;
  image?: string | null;
  hero_image?: string | null;
  image_scale?: number | null;
  order?: number;
  product_count?: number;
  direct_product_count?: number;
  children?: CategoryNode[];
}

interface CategoryDraft {
  id: string;
  name: string;
  slug: string;
  blurb: string;
  image: string;
  hero_image: string;
  image_scale: number;
  isTopLevel: boolean;
}

interface BannerState {
  tone: "success" | "error";
  text: string;
  createdCat?: { id: string; name: string; slug: string };
}

const toSlug = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

const isSpaceFilterTree = (cat: CategoryNode) => (cat.order ?? 0) >= 90 || cat.slug === "shop-by-space";

const storefrontCategoryUrl = (slug: string) => `${STOREFRONT_URL}/category/${encodeURIComponent(slug)}`;

function CategoryThumb({
  src,
  alt,
  size = 48,
  round = false,
}: {
  src?: string | null;
  alt: string;
  size?: number;
  round?: boolean;
}) {
  const [broken, setBroken] = useState(false);
  const resolved = resolveStorefrontAsset(src);

  useEffect(() => {
    setBroken(false);
  }, [resolved]);

  const boxStyle: CSSProperties = {
    width: size,
    height: size,
    borderRadius: round ? "50%" : 12,
    border: "1px solid #d1e7d8",
    background: "#f3faf5",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    flexShrink: 0,
  };

  if (!resolved || broken) {
    return (
      <span style={boxStyle} aria-hidden="true">
        <ImageIcon size={Math.round(size * 0.42)} color="#7a9a86" />
      </span>
    );
  }

  return (
    <span style={boxStyle}>
      <img
        src={resolved}
        alt={alt}
        onError={() => setBroken(true)}
        style={{ width: "100%", height: "100%", objectFit: "contain", padding: round ? 6 : 4 }}
      />
    </span>
  );
}

function StorefrontTilePreview({
  name,
  image,
  scalePct,
}: {
  name: string;
  image?: string | null;
  scalePct: number;
}) {
  const [broken, setBroken] = useState(false);
  const resolved = resolveStorefrontAsset(image);

  useEffect(() => {
    setBroken(false);
  }, [resolved]);

  const scale = scalePct > 0 && scalePct !== 100 ? scalePct / 100 : 1;

  return (
    <div className="cat-preview-shell">
      <span className="cat-preview-eyebrow">
        <Sparkles size={12} aria-hidden="true" />
        Storefront Home Preview
      </span>
      <div className="cat-preview-circle">
        {resolved && !broken ? (
          <img
            src={resolved}
            alt={name || "Category preview"}
            onError={() => setBroken(true)}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "contain",
              transform: scale !== 1 ? `scale(${scale})` : undefined,
              transition: "transform 0.15s ease",
            }}
          />
        ) : (
          <span className="cat-preview-placeholder">
            <Sprout size={28} color="#15803d" />
          </span>
        )}
      </div>
      <div className="cat-preview-title">{name.trim() || "New Category"}</div>
      <div className="cat-preview-sub">Appears live in Our Categories & Header Nav</div>
    </div>
  );
}

function CategoryEditPanel({
  draft,
  uploadingKey,
  saving,
  onChange,
  onUpload,
  onCancel,
  onSave,
}: {
  draft: CategoryDraft;
  uploadingKey: string | null;
  saving: boolean;
  onChange: (patch: Partial<CategoryDraft>) => void;
  onUpload: (key: string, file: File | undefined, cb: (url: string) => void) => void;
  onCancel: () => void;
  onSave: () => void;
}) {
  const imgBusy = uploadingKey === `edit-img-${draft.id}`;
  const heroBusy = uploadingKey === `edit-hero-${draft.id}`;

  return (
    <div className="cat-edit-panel">
      <div className="cat-edit-grid">
        <div className="cat-edit-fields">
          <div className="cat-form-row">
            <div>
              <label>Category Name</label>
              <input
                value={draft.name}
                onChange={(e) => onChange({ name: e.target.value })}
                placeholder="e.g. Aquatic Plants"
              />
            </div>
            <div>
              <label>URL Slug (/category/...)</label>
              <input
                value={draft.slug}
                onChange={(e) => onChange({ slug: toSlug(e.target.value) })}
                placeholder="aquatic-plants"
              />
            </div>
          </div>

          <div style={{ marginTop: 12 }}>
            <label>Tagline / Blurb</label>
            <input
              value={draft.blurb}
              onChange={(e) => onChange({ blurb: e.target.value })}
              placeholder="Short description shown in navigation & category header"
            />
          </div>

          <div className="cat-form-row" style={{ marginTop: 12 }}>
            <div>
              <label>Category Photo URL or Upload</label>
              <div className="cat-input-with-btn">
                <input
                  value={draft.image}
                  onChange={(e) => onChange({ image: e.target.value })}
                  placeholder="https://... or /images/category-*.png"
                />
                <label className="btn ghost sm" style={{ cursor: "pointer", whiteSpace: "nowrap" }}>
                  <Upload size={14} aria-hidden="true" />
                  <span>{imgBusy ? "Uploading..." : "Upload"}</span>
                  <input
                    type="file"
                    accept="image/*"
                    hidden
                    disabled={imgBusy}
                    onChange={(e) => onUpload(`edit-img-${draft.id}`, e.target.files?.[0], (url) => onChange({ image: url }))}
                  />
                </label>
                {draft.image && (
                  <button
                    type="button"
                    className="btn ghost sm"
                    title="Clear photo"
                    onClick={() => onChange({ image: "" })}
                  >
                    <X size={14} aria-hidden="true" />
                  </button>
                )}
              </div>
            </div>

            <div>
              <label>Category Page Banner (optional wide hero)</label>
              <div className="cat-input-with-btn">
                <input
                  value={draft.hero_image}
                  onChange={(e) => onChange({ hero_image: e.target.value })}
                  placeholder="Optional custom banner URL"
                />
                <label className="btn ghost sm" style={{ cursor: "pointer", whiteSpace: "nowrap" }}>
                  <Upload size={14} aria-hidden="true" />
                  <span>{heroBusy ? "Uploading..." : "Banner"}</span>
                  <input
                    type="file"
                    accept="image/*"
                    hidden
                    disabled={heroBusy}
                    onChange={(e) =>
                      onUpload(`edit-hero-${draft.id}`, e.target.files?.[0], (url) => onChange({ hero_image: url }))
                    }
                  />
                </label>
                {draft.hero_image && (
                  <button
                    type="button"
                    className="btn ghost sm"
                    title="Reset to default storefront banner"
                    onClick={() => onChange({ hero_image: "" })}
                  >
                    <X size={14} aria-hidden="true" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {draft.isTopLevel && (
            <div className="cat-scale-bar">
              <div className="between" style={{ marginBottom: 6 }}>
                <span className="inline-icon" style={{ fontSize: 13, fontWeight: 600, color: "#1e293b" }}>
                  <SlidersHorizontal size={14} color="#15803d" aria-hidden="true" />
                  Home Tile Image Scale
                </span>
                <span style={{ fontWeight: 700, color: "#15803d", fontSize: 13 }}>{draft.image_scale}%</span>
              </div>
              <input
                type="range"
                min={70}
                max={160}
                step={5}
                value={draft.image_scale}
                onChange={(e) => onChange({ image_scale: Number(e.target.value) })}
                style={{ width: "100%", accentColor: "#16a34a", margin: 0, padding: 0 }}
              />
            </div>
          )}
        </div>

        {draft.isTopLevel && (
          <StorefrontTilePreview name={draft.name} image={draft.image} scalePct={draft.image_scale} />
        )}
      </div>

      <div className="cat-edit-footer">
        <button type="button" className="btn ghost sm" onClick={onCancel} disabled={saving}>
          Cancel
        </button>
        <button type="button" className="btn sm" onClick={onSave} disabled={saving || Boolean(uploadingKey)}>
          <Check size={15} aria-hidden="true" />
          <span>{saving ? "Saving..." : "Save Changes"}</span>
        </button>
      </div>
    </div>
  );
}

export default function Categories() {
  const [tree, setTree] = useState<CategoryNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [banner, setBanner] = useState<BannerState | null>(null);
  const [uploadingKey, setUploadingKey] = useState<string | null>(null);

  // Create top-level category state
  const [newName, setNewName] = useState("");
  const [newSlug, setNewSlug] = useState("");
  const [slugEdited, setSlugEdited] = useState(false);
  const [newBlurb, setNewBlurb] = useState("");
  const [newImg, setNewImg] = useState("");
  const [newHero, setNewHero] = useState("");
  const [showCreateMedia, setShowCreateMedia] = useState(false);
  const [creating, setCreating] = useState(false);

  // Inline edit state (shared for top-level & sub-categories)
  const [draft, setDraft] = useState<CategoryDraft | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);

  // Inline add sub-category state
  const [addingSubFor, setAddingSubFor] = useState<string | null>(null);
  const [subName, setSubName] = useState("");
  const [subSlug, setSubSlug] = useState("");
  const [subSlugEdited, setSubSlugEdited] = useState(false);
  const [subImg, setSubImg] = useState("");
  const [savingSub, setSavingSub] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await api.get<CategoryNode[]>("/categories/tree?include_counts=true");
      setTree(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setBanner({ tone: "error", text: err?.message || "Failed to load categories" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleUpload = async (key: string, file: File | undefined, cb: (url: string) => void) => {
    if (!file) return;
    setUploadingKey(key);
    setBanner(null);
    try {
      const url = await uploadImage(file);
      cb(url);
    } catch (err: any) {
      setBanner({ tone: "error", text: err?.message || "Photo upload failed" });
    } finally {
      setUploadingKey(null);
    }
  };

  const handleCreateTop = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = newName.trim();
    const cleanSlug = toSlug(newSlug || cleanName);
    if (!cleanName || !cleanSlug) {
      setBanner({ tone: "error", text: "Please enter a category name and valid slug." });
      return;
    }
    setCreating(true);
    setBanner(null);
    try {
      const created = await api.post<CategoryNode>("/categories", {
        name: cleanName,
        slug: cleanSlug,
        parent_id: null,
        blurb: newBlurb.trim() || null,
        image: newImg.trim() || null,
        hero_image: newHero.trim() || null,
      });
      setNewName("");
      setNewSlug("");
      setSlugEdited(false);
      setNewBlurb("");
      setNewImg("");
      setNewHero("");
      setShowCreateMedia(false);
      await load();
      setBanner({
        tone: "success",
        text: `Category "${created.name}" created and live on your storefront.`,
        createdCat: { id: created.id, name: created.name, slug: created.slug },
      });
    } catch (err: any) {
      setBanner({ tone: "error", text: err?.message || "Could not create category" });
    } finally {
      setCreating(false);
    }
  };

  const openAddSub = (parentId: string) => {
    setAddingSubFor(parentId);
    setSubName("");
    setSubSlug("");
    setSubSlugEdited(false);
    setSubImg("");
    setDraft(null);
  };

  const handleCreateSub = async (parent: CategoryNode) => {
    const cleanName = subName.trim();
    const cleanSlug = toSlug(subSlug || `${parent.slug}-${cleanName}`);
    if (!cleanName || !cleanSlug) {
      setBanner({ tone: "error", text: "Please enter a sub-category name." });
      return;
    }
    setSavingSub(true);
    setBanner(null);
    try {
      const created = await api.post<CategoryNode>("/categories", {
        name: cleanName,
        slug: cleanSlug,
        parent_id: parent.id,
        image: subImg.trim() || null,
      });
      setAddingSubFor(null);
      await load();
      setBanner({
        tone: "success",
        text: `Sub-category "${created.name}" added under "${parent.name}".`,
        createdCat: { id: created.id, name: created.name, slug: created.slug },
      });
    } catch (err: any) {
      setBanner({ tone: "error", text: err?.message || "Could not create sub-category" });
    } finally {
      setSavingSub(false);
    }
  };

  const startEdit = (node: CategoryNode, isTopLevel: boolean) => {
    setAddingSubFor(null);
    setDraft({
      id: node.id,
      name: node.name || "",
      slug: node.slug || "",
      blurb: node.blurb || "",
      image: node.image || "",
      hero_image: node.hero_image || "",
      image_scale: Math.round((node.image_scale || 1) * 100),
      isTopLevel,
    });
  };

  const saveEdit = async () => {
    if (!draft) return;
    const cleanName = draft.name.trim();
    const cleanSlug = toSlug(draft.slug || cleanName);
    if (!cleanName || !cleanSlug) {
      setBanner({ tone: "error", text: "Name and slug cannot be empty." });
      return;
    }
    setSavingEdit(true);
    setBanner(null);
    try {
      await api.patch(`/categories/${draft.id}`, {
        name: cleanName,
        slug: cleanSlug,
        blurb: draft.blurb.trim() || null,
        image: draft.image.trim() || null,
        hero_image: draft.hero_image.trim() || null,
        ...(draft.isTopLevel ? { image_scale: draft.image_scale / 100 } : {}),
      });
      setDraft(null);
      await load();
      setBanner({ tone: "success", text: `Updated "${cleanName}". Changes are live on the storefront.` });
    } catch (err: any) {
      setBanner({ tone: "error", text: err?.message || "Update failed" });
    } finally {
      setSavingEdit(false);
    }
  };

  const quickUploadPhoto = (nodeId: string, file: File | undefined) => {
    handleUpload(`row-${nodeId}`, file, async (url) => {
      await api.patch(`/categories/${nodeId}`, { image: url });
      await load();
      setBanner({ tone: "success", text: "Category photo updated." });
    });
  };

  const reorderSiblings = async (siblings: CategoryNode[], idx: number, dir: -1 | 1) => {
    const target = idx + dir;
    if (target < 0 || target >= siblings.length) return;
    const nextIds = siblings.map((item) => item.id);
    const [moved] = nextIds.splice(idx, 1);
    nextIds.splice(target, 0, moved);
    try {
      await api.put("/categories/order", { ids: nextIds });
      await load();
    } catch (err: any) {
      setBanner({ tone: "error", text: err?.message || "Reorder failed" });
    }
  };

  const shopCategories = useMemo(() => tree.filter((c) => !isSpaceFilterTree(c)), [tree]);
  const spaceTrees = useMemo(() => tree.filter((c) => isSpaceFilterTree(c)), [tree]);

  const stats = useMemo(() => {
    const subCount = tree.reduce((sum, c) => sum + (c.children?.length || 0), 0);
    const mappedCount = shopCategories.reduce((sum, c) => sum + (c.product_count ?? 0), 0);
    return {
      top: shopCategories.length,
      sub: subCount,
      mapped: mappedCount,
    };
  }, [tree, shopCategories]);

  const filteredTree = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return tree;
    return tree.filter((c) => {
      if (c.name.toLowerCase().includes(q) || c.slug.toLowerCase().includes(q)) return true;
      return (c.children || []).some(
        (child) => child.name.toLowerCase().includes(q) || child.slug.toLowerCase().includes(q),
      );
    });
  }, [tree, search]);

  return (
    <>
      <style>{`
        .cat-topbar {
          display: flex;
          flex-wrap: wrap;
          justify-content: space-between;
          align-items: flex-end;
          gap: 16px;
          margin-bottom: 20px;
        }
        .cat-metrics {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(175px, 1fr));
          gap: 12px;
          margin-bottom: 20px;
        }
        .cat-metric-card {
          background: #fff;
          border: 1px solid var(--border);
          border-radius: 16px;
          padding: 14px 18px;
          display: flex;
          align-items: center;
          gap: 12px;
          box-shadow: var(--shadow-sm);
        }
        .cat-metric-icon {
          width: 40px;
          height: 40px;
          border-radius: 12px;
          background: var(--primary-50);
          color: var(--primary-dark);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .cat-metric-value {
          font-size: 20px;
          font-weight: 800;
          color: #0f172a;
          line-height: 1.1;
        }
        .cat-metric-label {
          font-size: 12px;
          font-weight: 600;
          color: var(--muted);
          margin-top: 2px;
        }
        .cat-banner {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 12px 16px;
          border-radius: 14px;
          margin-bottom: 18px;
          font-size: 13.5px;
          font-weight: 600;
        }
        .cat-banner.success {
          background: #ecfdf5;
          border: 1px solid #a7f3d0;
          color: #065f46;
        }
        .cat-banner.error {
          background: #fef2f2;
          border: 1px solid #fecaca;
          color: #991b1b;
        }
        .cat-studio-card {
          background: linear-gradient(145deg, #ffffff 0%, #f6fbf7 100%);
          border: 1px solid #d9ece0;
          border-radius: 20px;
          padding: 22px;
          box-shadow: var(--shadow);
          margin-bottom: 22px;
        }
        .cat-create-grid {
          display: grid;
          grid-template-columns: minmax(0, 1fr) 240px;
          gap: 22px;
          align-items: stretch;
        }
        .cat-form-row {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
        }
        .cat-input-with-btn {
          display: flex;
          gap: 8px;
          align-items: center;
        }
        .cat-input-with-btn input {
          flex: 1;
          min-width: 0;
        }
        .cat-preview-shell {
          background: #135233;
          border-radius: 18px;
          padding: 16px 14px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          color: #fff;
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.14);
        }
        .cat-preview-eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          color: #bbf7d0;
          margin-bottom: 12px;
        }
        .cat-preview-circle {
          width: 96px;
          height: 96px;
          border-radius: 50%;
          background: #fff;
          padding: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.18);
        }
        .cat-preview-placeholder {
          width: 100%;
          height: 100%;
          border-radius: 50%;
          background: #eef6f1;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }
        .cat-preview-title {
          margin-top: 10px;
          font-size: 14px;
          font-weight: 700;
          color: #fff;
          max-width: 180px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .cat-preview-sub {
          margin-top: 4px;
          font-size: 11px;
          color: rgba(255, 255, 255, 0.72);
          line-height: 1.35;
        }
        .cat-toolbar {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 14px;
        }
        .cat-search-box {
          position: relative;
          width: 300px;
          max-width: 100%;
        }
        .cat-search-box svg {
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
          color: #64748b;
          pointer-events: none;
        }
        .cat-search-box input {
          padding-left: 36px;
          background: #fff;
        }
        .cat-card {
          background: #fff;
          border: 1px solid var(--border);
          border-radius: 18px;
          padding: 18px 20px;
          margin-bottom: 14px;
          box-shadow: var(--shadow-sm);
        }
        .cat-card-header {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          justify-content: space-between;
          gap: 14px;
        }
        .cat-identity {
          display: flex;
          align-items: center;
          gap: 12px;
          min-width: 0;
          flex: 1 1 280px;
        }
        .cat-reorder-col {
          display: flex;
          flex-direction: column;
          gap: 3px;
        }
        .cat-icon-btn {
          width: 26px;
          height: 22px;
          border-radius: 6px;
          border: 1px solid var(--border);
          background: #fff;
          color: #475569;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 0;
        }
        .cat-icon-btn:hover:not(:disabled) {
          border-color: var(--primary);
          color: var(--primary);
          background: var(--primary-50);
        }
        .cat-icon-btn:disabled {
          opacity: 0.35;
          cursor: not-allowed;
        }
        .cat-actions {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 8px;
        }
        .cat-slug-link {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 12px;
          font-weight: 600;
          color: #047857;
          background: #ecfdf5;
          padding: 2px 8px;
          border-radius: 999px;
          border: 1px solid #d1fae5;
        }
        .cat-slug-link:hover {
          background: #d1fae5;
        }
        .cat-count-link {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          font-size: 12px;
          font-weight: 700;
          color: #1e293b;
          background: #f1f5f9;
          padding: 6px 11px;
          border-radius: 999px;
          border: 1px solid #e2e8f0;
        }
        .cat-count-link:hover {
          border-color: var(--primary);
          color: var(--primary-dark);
          background: var(--primary-50);
        }
        .cat-edit-panel {
          margin-top: 16px;
          padding: 16px;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 14px;
        }
        .cat-edit-grid {
          display: grid;
          grid-template-columns: minmax(0, 1fr) 220px;
          gap: 18px;
          align-items: start;
        }
        .cat-scale-bar {
          margin-top: 12px;
          padding: 10px 14px;
          background: #fff;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
        }
        .cat-edit-footer {
          display: flex;
          justify-content: flex-end;
          gap: 8px;
          margin-top: 14px;
          padding-top: 12px;
          border-top: 1px solid #e2e8f0;
        }
        .cat-sub-add-bar {
          margin-top: 14px;
          padding: 14px;
          background: #f0fdf4;
          border: 1px solid #bbf7d0;
          border-radius: 14px;
        }
        .cat-sub-list {
          margin-top: 14px;
          border-top: 1px solid #f1f5f9;
          padding-top: 10px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .cat-sub-item {
          border: 1px solid #eef2f6;
          border-radius: 12px;
          padding: 10px 12px;
          background: #fcfefd;
        }
        .cat-sub-row {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
        }
        @media (max-width: 900px) {
          .cat-create-grid,
          .cat-edit-grid,
          .cat-form-row {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <div className="cat-topbar">
        <div>
          <h1 style={{ marginBottom: 4 }}>Category Studio</h1>
          <p className="muted" style={{ margin: 0 }}>
            Every category you create here updates the live Storefront & lets you launch products straight inside it.
          </p>
        </div>
        <div className="flex" style={{ gap: 8 }}>
          <a
            href={STOREFRONT_URL}
            target="_blank"
            rel="noreferrer"
            className="btn ghost sm"
          >
            <ExternalLink size={15} aria-hidden="true" />
            <span>View Live Storefront</span>
          </a>
          <Link to="/products/new" className="btn sm">
            <Plus size={15} aria-hidden="true" />
            <span>Add Product</span>
          </Link>
        </div>
      </div>

      <div className="cat-metrics">
        <div className="cat-metric-card">
          <span className="cat-metric-icon">
            <Sprout size={18} aria-hidden="true" />
          </span>
          <div>
            <div className="cat-metric-value">{stats.top}</div>
            <div className="cat-metric-label">Shop Categories</div>
          </div>
        </div>
        <div className="cat-metric-card">
          <span className="cat-metric-icon">
            <Layers size={18} aria-hidden="true" />
          </span>
          <div>
            <div className="cat-metric-value">{stats.sub}</div>
            <div className="cat-metric-label">Sub-categories</div>
          </div>
        </div>
        <div className="cat-metric-card">
          <span className="cat-metric-icon">
            <Package size={18} aria-hidden="true" />
          </span>
          <div>
            <div className="cat-metric-value">{stats.mapped}</div>
            <div className="cat-metric-label">Products Assigned</div>
          </div>
        </div>
      </div>

      {banner && (
        <div className={`cat-banner ${banner.tone}`}>
          <span>{banner.text}</span>
          <div className="flex" style={{ gap: 8 }}>
            {banner.createdCat && (
              <Link to={`/products/new?category_id=${banner.createdCat.id}`} className="btn sm">
                <Plus size={14} aria-hidden="true" />
                <span>Add Product under {banner.createdCat.name}</span>
              </Link>
            )}
            <button
              type="button"
              className="btn ghost sm"
              aria-label="Dismiss message"
              onClick={() => setBanner(null)}
            >
              <X size={14} aria-hidden="true" />
            </button>
          </div>
        </div>
      )}

      <form className="cat-studio-card" onSubmit={handleCreateTop}>
        <div className="between" style={{ marginBottom: 14 }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 17 }}>Create New Storefront Category</h3>
            <p className="muted" style={{ margin: "2px 0 0", fontSize: 13 }}>
              Automatically appears in Home &ldquo;Our Categories&rdquo;, Category Rail, and Product Editor.
            </p>
          </div>
          <button
            type="button"
            className="btn ghost sm"
            onClick={() => setShowCreateMedia((prev) => !prev)}
          >
            <ImageIcon size={14} aria-hidden="true" />
            <span>{showCreateMedia ? "Hide Media URLs" : "Custom URL / Banner"}</span>
          </button>
        </div>

        <div className="cat-create-grid">
          <div>
            <div className="cat-form-row">
              <div>
                <label>Category Name</label>
                <input
                  value={newName}
                  onChange={(e) => {
                    const v = e.target.value;
                    setNewName(v);
                    if (!slugEdited) setNewSlug(toSlug(v));
                  }}
                  placeholder="e.g. Aquatic Plants, Terrariums, Bonsais"
                />
              </div>
              <div>
                <label>URL Slug (/category/...)</label>
                <input
                  value={newSlug}
                  onChange={(e) => {
                    setSlugEdited(true);
                    setNewSlug(toSlug(e.target.value));
                  }}
                  placeholder="aquatic-plants"
                />
              </div>
            </div>

            <div style={{ marginTop: 12 }}>
              <label>Short Tagline / Blurb (optional)</label>
              <input
                value={newBlurb}
                onChange={(e) => setNewBlurb(e.target.value)}
                placeholder="Fresh aquatic plants & tank greens ready for your aquascape"
              />
            </div>

            {showCreateMedia && (
              <div className="cat-form-row" style={{ marginTop: 12 }}>
                <div>
                  <label>Tile Image URL (optional)</label>
                  <input
                    value={newImg}
                    onChange={(e) => setNewImg(e.target.value)}
                    placeholder="https://... or /images/..."
                  />
                </div>
                <div>
                  <label>Category Hero Banner URL / Upload (optional)</label>
                  <div className="cat-input-with-btn">
                    <input
                      value={newHero}
                      onChange={(e) => setNewHero(e.target.value)}
                      placeholder="Wide banner on /category/<slug>"
                    />
                    <label className="btn ghost sm" style={{ cursor: "pointer", whiteSpace: "nowrap" }}>
                      <Upload size={14} aria-hidden="true" />
                      <span>{uploadingKey === "create-hero" ? "..." : "Hero"}</span>
                      <input
                        type="file"
                        accept="image/*"
                        hidden
                        onChange={(e) => handleUpload("create-hero", e.target.files?.[0], setNewHero)}
                      />
                    </label>
                  </div>
                </div>
              </div>
            )}

            <div className="flex" style={{ marginTop: 16, gap: 10 }}>
              <label className="btn ghost" style={{ cursor: "pointer" }}>
                <Upload size={15} aria-hidden="true" />
                <span>{uploadingKey === "create-img" ? "Uploading Photo..." : newImg ? "Change Photo" : "Upload Tile Photo"}</span>
                <input
                  type="file"
                  accept="image/*"
                  hidden
                  disabled={uploadingKey === "create-img"}
                  onChange={(e) => handleUpload("create-img", e.target.files?.[0], setNewImg)}
                />
              </label>
              <button
                type="submit"
                className="btn"
                disabled={creating || Boolean(uploadingKey)}
              >
                <FolderPlus size={16} aria-hidden="true" />
                <span>{creating ? "Creating..." : "Create Live Category"}</span>
              </button>
            </div>
          </div>

          <StorefrontTilePreview name={newName} image={newImg} scalePct={100} />
        </div>
      </form>

      <div className="cat-toolbar">
        <div className="cat-search-box">
          <Search size={16} aria-hidden="true" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search categories or sub-categories..."
          />
        </div>
        <span className="muted" style={{ fontSize: 13 }}>
          Showing {filteredTree.length} of {tree.length} top-level groups
        </span>
      </div>

      {loading ? (
        <div className="card">Loading categories...</div>
      ) : (
        filteredTree.map((cat) => {
          const isRoom = isSpaceFilterTree(cat);
          const sameTierSiblings = isRoom ? spaceTrees : shopCategories;
          const tierIndex = sameTierSiblings.findIndex((item) => item.id === cat.id);
          const children = cat.children || [];
          const isEditingThis = draft?.id === cat.id;

          return (
            <div className="cat-card" key={cat.id}>
              <div className="cat-card-header">
                <div className="cat-identity">
                  <div className="cat-reorder-col" aria-label="Reorder category">
                    <button
                      type="button"
                      className="cat-icon-btn"
                      title="Move up"
                      disabled={tierIndex <= 0}
                      onClick={() => reorderSiblings(sameTierSiblings, tierIndex, -1)}
                    >
                      <ArrowUp size={12} aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      className="cat-icon-btn"
                      title="Move down"
                      disabled={tierIndex < 0 || tierIndex >= sameTierSiblings.length - 1}
                      onClick={() => reorderSiblings(sameTierSiblings, tierIndex, 1)}
                    >
                      <ArrowDown size={12} aria-hidden="true" />
                    </button>
                  </div>

                  <CategoryThumb src={cat.image} alt={cat.name} size={52} round />

                  <div style={{ minWidth: 0 }}>
                    <div className="flex" style={{ gap: 8, alignItems: "center" }}>
                      <h3 style={{ margin: 0, fontSize: 18 }}>{cat.name}</h3>
                      <a
                        href={storefrontCategoryUrl(cat.slug)}
                        target="_blank"
                        rel="noreferrer"
                        className="cat-slug-link"
                        title="Open live category page on storefront"
                      >
                        <span>/{cat.slug}</span>
                        <ExternalLink size={11} aria-hidden="true" />
                      </a>
                      {isRoom ? (
                        <span className="pill yellow">Space Filter</span>
                      ) : (
                        <span className="pill green">Live Storefront</span>
                      )}
                      {cat.hero_image && <span className="pill blue">Custom Hero</span>}
                    </div>
                    <p className="muted" style={{ margin: "4px 0 0", fontSize: 13 }}>
                      {cat.blurb || "No tagline set"}
                    </p>
                  </div>
                </div>

                <div className="cat-actions">
                  <Link
                    to={`/products?category_id=${cat.id}`}
                    className="cat-count-link"
                    title="View products mapped to this category"
                  >
                    <Package size={13} aria-hidden="true" />
                    <span>{cat.product_count ?? 0} products</span>
                  </Link>

                  <Link to={`/products/new?category_id=${cat.id}`} className="btn sm">
                    <Plus size={14} aria-hidden="true" />
                    <span>Add Product</span>
                  </Link>

                  <label className="btn ghost sm" style={{ cursor: "pointer" }} title="Quick update tile photo">
                    <Upload size={14} aria-hidden="true" />
                    <span>{uploadingKey === `row-${cat.id}` ? "Uploading..." : "Photo"}</span>
                    <input
                      type="file"
                      accept="image/*"
                      hidden
                      disabled={uploadingKey === `row-${cat.id}`}
                      onChange={(e) => quickUploadPhoto(cat.id, e.target.files?.[0])}
                    />
                  </label>

                  <button
                    type="button"
                    className="btn ghost sm"
                    onClick={() => openAddSub(cat.id)}
                  >
                    <FolderPlus size={14} aria-hidden="true" />
                    <span>Sub-category</span>
                  </button>

                  <button
                    type="button"
                    className="btn ghost sm"
                    onClick={() => (isEditingThis ? setDraft(null) : startEdit(cat, !isRoom))}
                  >
                    <Pencil size={14} aria-hidden="true" />
                    <span>{isEditingThis ? "Close" : "Edit"}</span>
                  </button>

                  <DeleteButton
                    confirm={`Delete "${cat.name}"${children.length ? ` and its ${children.length} sub-categories` : ""}?`}
                    onDelete={() => api.del(`/categories/${cat.id}`)}
                    onDone={load}
                  />
                </div>
              </div>

              {isEditingThis && draft && (
                <CategoryEditPanel
                  draft={draft}
                  uploadingKey={uploadingKey}
                  saving={savingEdit}
                  onChange={(patch) => setDraft((prev) => (prev ? { ...prev, ...patch } : prev))}
                  onUpload={handleUpload}
                  onCancel={() => setDraft(null)}
                  onSave={saveEdit}
                />
              )}

              {addingSubFor === cat.id && (
                <div className="cat-sub-add-bar">
                  <div className="between" style={{ marginBottom: 10 }}>
                    <strong style={{ fontSize: 13.5, color: "#14532d" }}>
                      New Sub-category inside {cat.name}
                    </strong>
                    <button
                      type="button"
                      className="btn ghost sm"
                      onClick={() => setAddingSubFor(null)}
                    >
                      <X size={14} aria-hidden="true" />
                    </button>
                  </div>
                  <div className="cat-form-row">
                    <div>
                      <label>Sub-category Name</label>
                      <input
                        value={subName}
                        onChange={(e) => {
                          const v = e.target.value;
                          setSubName(v);
                          if (!subSlugEdited) setSubSlug(toSlug(`${cat.slug}-${v}`));
                        }}
                        placeholder="e.g. Floating Plants, Ceramic Pots"
                      />
                    </div>
                    <div>
                      <label>Slug</label>
                      <input
                        value={subSlug}
                        onChange={(e) => {
                          setSubSlugEdited(true);
                          setSubSlug(toSlug(e.target.value));
                        }}
                        placeholder={`${cat.slug}-sub`}
                      />
                    </div>
                  </div>
                  <div className="flex" style={{ marginTop: 12, gap: 8 }}>
                    <label className="btn ghost sm" style={{ cursor: "pointer" }}>
                      <Upload size={14} aria-hidden="true" />
                      <span>{uploadingKey === `sub-new-${cat.id}` ? "Uploading..." : subImg ? "Photo Ready" : "Upload Photo"}</span>
                      <input
                        type="file"
                        accept="image/*"
                        hidden
                        onChange={(e) => handleUpload(`sub-new-${cat.id}`, e.target.files?.[0], setSubImg)}
                      />
                    </label>
                    <button
                      type="button"
                      className="btn sm"
                      disabled={savingSub || Boolean(uploadingKey)}
                      onClick={() => handleCreateSub(cat)}
                    >
                      <Check size={14} aria-hidden="true" />
                      <span>{savingSub ? "Saving..." : "Create Sub-category"}</span>
                    </button>
                  </div>
                </div>
              )}

              {children.length > 0 && (
                <div className="cat-sub-list">
                  {children.map((sub, subIdx) => {
                    const editingSub = draft?.id === sub.id;
                    return (
                      <div className="cat-sub-item" key={sub.id}>
                        <div className="cat-sub-row">
                          <div className="flex" style={{ gap: 10, alignItems: "center", minWidth: 0 }}>
                            <div className="cat-reorder-col" aria-label="Reorder sub-category">
                              <button
                                type="button"
                                className="cat-icon-btn"
                                disabled={subIdx <= 0}
                                title="Move up"
                                onClick={() => reorderSiblings(children, subIdx, -1)}
                              >
                                <ArrowUp size={11} aria-hidden="true" />
                              </button>
                              <button
                                type="button"
                                className="cat-icon-btn"
                                disabled={subIdx >= children.length - 1}
                                title="Move down"
                                onClick={() => reorderSiblings(children, subIdx, 1)}
                              >
                                <ArrowDown size={11} aria-hidden="true" />
                              </button>
                            </div>
                            <CategoryThumb src={sub.image} alt={sub.name} size={38} />
                            <div>
                              <div className="flex" style={{ gap: 8, alignItems: "center" }}>
                                <strong style={{ fontSize: 14, color: "#0f172a" }}>{sub.name}</strong>
                                <a
                                  href={storefrontCategoryUrl(sub.slug)}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="cat-slug-link"
                                >
                                  <span>/{sub.slug}</span>
                                  <ExternalLink size={10} aria-hidden="true" />
                                </a>
                              </div>
                              {sub.blurb && (
                                <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>
                                  {sub.blurb}
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="cat-actions">
                            <Link to={`/products?category_id=${sub.id}`} className="cat-count-link">
                              <Package size={12} aria-hidden="true" />
                              <span>{sub.product_count ?? 0}</span>
                            </Link>
                            <Link to={`/products/new?category_id=${sub.id}`} className="btn ghost sm">
                              <Plus size={13} aria-hidden="true" />
                              <span>Add Product</span>
                            </Link>
                            <label className="btn ghost sm" style={{ cursor: "pointer" }}>
                              <Upload size={13} aria-hidden="true" />
                              <span>{uploadingKey === `row-${sub.id}` ? "..." : "Photo"}</span>
                              <input
                                type="file"
                                accept="image/*"
                                hidden
                                onChange={(e) => quickUploadPhoto(sub.id, e.target.files?.[0])}
                              />
                            </label>
                            <button
                              type="button"
                              className="btn ghost sm"
                              onClick={() => (editingSub ? setDraft(null) : startEdit(sub, false))}
                            >
                              <Pencil size={13} aria-hidden="true" />
                              <span>{editingSub ? "Close" : "Edit"}</span>
                            </button>
                            <DeleteButton
                              confirm={`Delete "${sub.name}"?`}
                              onDelete={() => api.del(`/categories/${sub.id}`)}
                              onDone={load}
                            />
                          </div>
                        </div>

                        {editingSub && draft && (
                          <CategoryEditPanel
                            draft={draft}
                            uploadingKey={uploadingKey}
                            saving={savingEdit}
                            onChange={(patch) => setDraft((prev) => (prev ? { ...prev, ...patch } : prev))}
                            onUpload={handleUpload}
                            onCancel={() => setDraft(null)}
                            onSave={saveEdit}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })
      )}

      {!loading && filteredTree.length === 0 && (
        <div className="card" style={{ textAlign: "center", padding: "48px 20px" }}>
          <div style={{ display: "inline-flex", padding: 14, borderRadius: "50%", background: "var(--primary-50)", color: "var(--primary-dark)", marginBottom: 12 }}>
            <Sprout size={28} aria-hidden="true" />
          </div>
          <h3 style={{ margin: "0 0 6px" }}>{search ? "No matching categories" : "No categories yet"}</h3>
          <p className="muted" style={{ margin: 0 }}>
            {search
              ? "Try a different search keyword or clear the filter."
              : "Create your first top-level category above to make it live on your storefront."}
          </p>
        </div>
      )}
    </>
  );
}
