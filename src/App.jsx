import { useState, useEffect, useCallback } from 'react'
import { supabase } from './supabase'
import { CORE_RECIPES, RECIPE_CATEGORIES } from './recipes'
import { DEFAULT_PANTRY, ingredientInPantry } from './pantry'

// ── Category colors ───────────────────────────────────────────────────────────
const CAT_COLORS = {
  "Weeknight Dinners": "#B85C2A",
  "Mexican": "#C1503A",
  "Soups": "#3A7A6A",
  "Party Food": "#7A5C8A",
  "Sides": "#5C7A3A",
  "Other": "#5C6A7A"
}

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]

// ── Shared UI components ──────────────────────────────────────────────────────
function CatBadge({ category }) {
  const c = CAT_COLORS[category] || "#5C6A7A"
  return (
    <span style={{
      background: c + "20", color: c, fontSize: "10px", fontWeight: "700",
      padding: "2px 10px", borderRadius: "999px", letterSpacing: "0.06em",
      textTransform: "uppercase", whiteSpace: "nowrap"
    }}>{category}</span>
  )
}

function Tag({ label }) {
  return (
    <span style={{
      background: "var(--bg-subtle)", color: "var(--text-secondary)",
      fontSize: "11px", padding: "2px 8px", borderRadius: "999px"
    }}>{label}</span>
  )
}

function Btn({ children, variant = "primary", onClick, style = {}, disabled = false }) {
  const variants = {
    primary: { background: "var(--accent)", color: "white", border: "none" },
    dark: { background: "var(--header)", color: "white", border: "none" },
    outline: { background: "none", color: "var(--text-secondary)", border: "1px solid var(--border)" },
    ghost: { background: "none", color: "var(--accent)", border: "none" },
    danger: { background: "var(--red)", color: "white", border: "none" },
    green: { background: "var(--green)", color: "white", border: "none" },
  }
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        ...variants[variant],
        padding: "8px 18px", borderRadius: "var(--radius-sm)",
        fontSize: "13px", fontFamily: "inherit",
        opacity: disabled ? 0.5 : 1,
        transition: "all 0.15s",
        ...style
      }}>{children}</button>
  )
}

function Input({ value, onChange, placeholder, style = {}, type = "text", autoFocus }) {
  return (
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      autoFocus={autoFocus}
      style={{
        padding: "9px 12px", border: "1px solid var(--border)",
        borderRadius: "var(--radius-sm)", fontSize: "13px",
        color: "var(--text-primary)", background: "var(--bg-hover)",
        outline: "none", width: "100%", ...style
      }}
    />
  )
}

function Label({ children }) {
  return (
    <div style={{
      fontSize: "11px", color: "var(--accent)", textTransform: "uppercase",
      letterSpacing: "0.06em", marginBottom: "5px", fontWeight: "700",
      fontFamily: "'Lato', sans-serif"
    }}>{children}</div>
  )
}

function Card({ children, style = {}, onClick, hoverable = false }) {
  const [hov, setHov] = useState(false)
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => hoverable && setHov(true)}
      onMouseLeave={() => hoverable && setHov(false)}
      style={{
        background: hov ? "var(--bg-hover)" : "var(--bg-card)",
        border: "1px solid var(--border)", borderRadius: "var(--radius)",
        padding: "20px", cursor: onClick ? "pointer" : "default",
        transform: hov ? "translateY(-2px)" : "none",
        boxShadow: hov ? "var(--shadow-md)" : "var(--shadow-sm)",
        transition: "all 0.18s", ...style
      }}>{children}</div>
  )
}

function SectionTitle({ children }) {
  return (
    <h2 style={{
      fontFamily: "'Playfair Display', serif", fontSize: "22px",
      color: "var(--text-primary)", fontWeight: "400", margin: "0 0 4px"
    }}>{children}</h2>
  )
}

function Spinner() {
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "center",
      height: "200px", color: "var(--accent)", fontFamily: "'Playfair Display', serif",
      fontSize: "16px", gap: "12px"
    }}>
      <div style={{
        width: "20px", height: "20px", border: "2px solid var(--border)",
        borderTopColor: "var(--accent)", borderRadius: "50%",
        animation: "spin 0.8s linear infinite"
      }} />
      Loading...
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

// ── Recipe Card ───────────────────────────────────────────────────────────────
function RecipeCard({ recipe, onClick }) {
  return (
    <Card hoverable onClick={() => onClick(recipe)} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <CatBadge category={recipe.category} />
        <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>Serves {recipe.servings}</span>
      </div>
      <h3 style={{
        fontFamily: "'Playfair Display', serif", fontSize: "17px",
        color: "var(--text-primary)", fontWeight: "400", lineHeight: "1.3"
      }}>{recipe.title}</h3>
      <p style={{ fontSize: "12px", color: "var(--text-secondary)", lineHeight: "1.5", flex: 1 }}>
        {recipe.description}
      </p>
      <div style={{ display: "flex", gap: "14px" }}>
        <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>⏱ {recipe.preptime}</span>
        <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>🔥 {recipe.cooktime}</span>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "5px" }}>
        {(recipe.tags || []).slice(0, 3).map(t => <Tag key={t} label={t} />)}
      </div>
    </Card>
  )
}

// ── Recipe Detail ─────────────────────────────────────────────────────────────
function RecipeDetail({ recipe, onBack, onDelete, onEdit, isCore }) {
  const [confirmDel, setConfirmDel] = useState(false)
  return (
    <div style={{ maxWidth: "720px", margin: "0 auto" }}>
      <button onClick={onBack} style={{
        background: "none", border: "none", color: "var(--accent)",
        fontSize: "14px", padding: "0 0 20px", display: "flex", alignItems: "center", gap: "6px"
      }}>← Back to recipes</button>

      <Card style={{ padding: "36px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
          <CatBadge category={recipe.category} />
          {!isCore && (
            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              <Btn variant="outline" onClick={() => onEdit(recipe)} style={{ fontSize: "12px", padding: "4px 12px" }}>Edit</Btn>
              {!confirmDel
                ? <Btn variant="outline" onClick={() => setConfirmDel(true)} style={{ fontSize: "12px", padding: "4px 12px", color: "var(--red)" }}>Delete</Btn>
                : <div style={{ display: "flex", gap: "8px" }}>
                    <Btn variant="danger" onClick={() => onDelete(recipe.id)} style={{ fontSize: "12px", padding: "4px 12px" }}>Confirm</Btn>
                    <Btn variant="outline" onClick={() => setConfirmDel(false)} style={{ fontSize: "12px", padding: "4px 12px" }}>Cancel</Btn>
                  </div>
              }
            </div>
          )}
        </div>

        <h1 style={{
          fontFamily: "'Playfair Display', serif", fontSize: "28px",
          color: "var(--text-primary)", fontWeight: "400", margin: "12px 0 8px", lineHeight: "1.2"
        }}>{recipe.title}</h1>
        <p style={{ color: "var(--text-secondary)", fontSize: "14px", lineHeight: "1.6", marginBottom: "20px" }}>
          {recipe.description}
        </p>

        <div style={{
          display: "flex", gap: "28px", padding: "14px 0",
          borderTop: "1px solid var(--border-light)", borderBottom: "1px solid var(--border-light)", marginBottom: "28px"
        }}>
          {[["Serves", recipe.servings], ["Prep", recipe.preptime], ["Cook", recipe.cooktime]].map(([k, v]) => (
            <div key={k} style={{ textAlign: "center" }}>
              <div style={{ fontSize: "10px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>{k}</div>
              <div style={{ fontSize: "18px", fontFamily: "'Playfair Display', serif", color: "var(--text-primary)" }}>{v}</div>
            </div>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1.5fr", gap: "32px" }}>
          <div>
            <div style={{ fontSize: "11px", color: "var(--accent)", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "14px" }}>Ingredients</div>
            <ul>
              {(recipe.ingredients || []).map((ing, i) => (
                <li key={i} style={{
                  fontSize: "13px", color: "var(--text-primary)", padding: "6px 0",
                  borderBottom: "1px solid var(--border-light)", lineHeight: "1.4",
                  display: "flex", gap: "8px"
                }}>
                  <span style={{ color: "var(--accent)", flexShrink: 0 }}>—</span>{ing}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <div style={{ fontSize: "11px", color: "var(--accent)", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "14px" }}>Method</div>
            <ol>
              {(recipe.steps || []).map((step, i) => (
                <li key={i} style={{ display: "flex", gap: "12px", marginBottom: "14px" }}>
                  <span style={{
                    minWidth: "22px", height: "22px", background: "var(--bg-subtle)",
                    borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "11px", color: "var(--accent)", fontWeight: "700", flexShrink: 0
                  }}>{i + 1}</span>
                  <p style={{ fontSize: "13px", color: "var(--text-primary)", margin: 0, lineHeight: "1.6" }}>{step}</p>
                </li>
              ))}
            </ol>
          </div>
        </div>

        {recipe.notes && (
          <div style={{
            marginTop: "28px", background: "var(--bg-hover)",
            border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", padding: "18px"
          }}>
            <div style={{ fontSize: "11px", color: "var(--accent)", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "6px" }}>Notes</div>
            <p style={{ fontSize: "13px", color: "var(--text-secondary)", lineHeight: "1.6", margin: 0 }}>{recipe.notes}</p>
          </div>
        )}

        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "20px" }}>
          {(recipe.tags || []).map(t => <Tag key={t} label={t} />)}
        </div>
      </Card>
    </div>
  )
}

// ── Add Recipe Form ───────────────────────────────────────────────────────────
function AddRecipeForm({ onSave, onCancel, saving, initialData = null }) {
  const isEdit = !!initialData
  const [form, setForm] = useState({
    title: initialData?.title || "",
    category: initialData?.category || "Weeknight Dinners",
    servings: initialData?.servings?.toString() || "4",
    preptime: initialData?.preptime || "",
    cooktime: initialData?.cooktime || "",
    description: initialData?.description || "",
    ingredients: initialData?.ingredients?.join("\n") || "",
    steps: initialData?.steps?.join("\n") || "",
    notes: initialData?.notes || "",
    tags: initialData?.tags?.join(", ") || ""
  })
  const set = k => e => setForm({ ...form, [k]: e.target.value })

  const handleSave = () => {
    if (!form.title.trim()) return alert("Recipe needs a title.")
    onSave({
      ...(initialData || {}),
      title: form.title.trim(), category: form.category,
      servings: parseInt(form.servings) || 4,
      preptime: form.preptime || "—", cooktime: form.cooktime || "—",
      description: form.description.trim(),
      ingredients: form.ingredients.split("\n").map(s => s.trim()).filter(Boolean),
      steps: form.steps.split("\n").map(s => s.trim()).filter(Boolean),
      notes: form.notes.trim(),
      tags: form.tags.split(",").map(s => s.trim().toLowerCase()).filter(Boolean)
    })
  }

  return (
    <div style={{ maxWidth: "720px", margin: "0 auto" }}>
      <button onClick={onCancel} style={{ background: "none", border: "none", color: "var(--accent)", fontSize: "14px", padding: "0 0 20px" }}>← Cancel</button>
      <Card style={{ padding: "36px" }}>
        <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "24px", fontWeight: "400", marginBottom: "24px" }}>{isEdit ? "Edit Recipe" : "Add a Recipe"}</h2>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
          <div style={{ gridColumn: "1/-1" }}>
            <Label>Title</Label>
            <Input value={form.title} onChange={set("title")} placeholder="Recipe name" autoFocus />
          </div>
          <div>
            <Label>Category</Label>
            <select value={form.category} onChange={set("category")} style={{
              padding: "9px 12px", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)",
              fontSize: "13px", color: "var(--text-primary)", background: "var(--bg-hover)",
              outline: "none", width: "100%"
            }}>
              {RECIPE_CATEGORIES.filter(c => c !== "All").map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <Label>Servings</Label>
            <Input value={form.servings} onChange={set("servings")} placeholder="4" />
          </div>
          <div>
            <Label>Prep Time</Label>
            <Input value={form.preptime} onChange={set("preptime")} placeholder="10 min" />
          </div>
          <div>
            <Label>Cook Time</Label>
            <Input value={form.cooktime} onChange={set("cooktime")} placeholder="30 min" />
          </div>
          <div style={{ gridColumn: "1/-1" }}>
            <Label>Description</Label>
            <Input value={form.description} onChange={set("description")} placeholder="Brief description of the dish" />
          </div>
          <div style={{ gridColumn: "1/-1" }}>
            <Label>Ingredients (one per line)</Label>
            <textarea value={form.ingredients} onChange={set("ingredients")}
              placeholder={"1.5 lb ground beef\n1 onion, diced\n..."}
              style={{
                padding: "9px 12px", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)",
                fontSize: "13px", color: "var(--text-primary)", background: "var(--bg-hover)",
                outline: "none", width: "100%", height: "140px", resize: "vertical"
              }} />
          </div>
          <div style={{ gridColumn: "1/-1" }}>
            <Label>Steps (one per line)</Label>
            <textarea value={form.steps} onChange={set("steps")}
              placeholder={"Brown the beef...\nAdd aromatics...\n..."}
              style={{
                padding: "9px 12px", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)",
                fontSize: "13px", color: "var(--text-primary)", background: "var(--bg-hover)",
                outline: "none", width: "100%", height: "180px", resize: "vertical"
              }} />
          </div>
          <div style={{ gridColumn: "1/-1" }}>
            <Label>Notes (optional)</Label>
            <textarea value={form.notes} onChange={set("notes")}
              placeholder="Tips, make-ahead notes, variations..."
              style={{
                padding: "9px 12px", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)",
                fontSize: "13px", color: "var(--text-primary)", background: "var(--bg-hover)",
                outline: "none", width: "100%", height: "70px", resize: "vertical"
              }} />
          </div>
          <div style={{ gridColumn: "1/-1" }}>
            <Label>Tags (comma separated)</Label>
            <Input value={form.tags} onChange={set("tags")} placeholder="beef, pasta, weeknight" />
          </div>
        </div>
        <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "20px" }}>
          <Btn variant="outline" onClick={onCancel}>Cancel</Btn>
         <Btn variant="primary" onClick={handleSave} disabled={saving}>{saving ? "Saving..." : isEdit ? "Save Changes" : "Save Recipe"}</Btn>
        </div>
      </Card>
    </div>
  )
}

// ── Recipes Tab ───────────────────────────────────────────────────────────────
function RecipesTab({ userRecipes, onDelete, onAdd, onEdit, saving }) {
  const [view, setView] = useState("list")
  const [selected, setSelected] = useState(null)
  const [category, setCategory] = useState("All")
  const [search, setSearch] = useState("")

const allRecipes = [...CORE_RECIPES, ...userRecipes]
  const dynamicCategories = ["All", ...Array.from(new Set(allRecipes.map(r => r.category).filter(Boolean))).sort()]

  const filtered = allRecipes.filter(r => {
    const matchCat = category === "All" || r.category === category
    const matchSearch = !search ||
      r.title.toLowerCase().includes(search.toLowerCase()) ||
      (r.tags || []).some(t => t.toLowerCase().includes(search.toLowerCase())) ||
      (r.description || "").toLowerCase().includes(search.toLowerCase())
    return matchCat && matchSearch
  })

  const handleAdd = async (recipe) => {
    await onAdd(recipe)
    setView("list")
  }

  const handleEdit = async (recipe) => {
    await onEdit(recipe)
    setView("detail")
    setSelected(prev => ({ ...prev, ...recipe }))
  }

  if (view === "detail" && selected) {
    const isCore = CORE_RECIPES.some(r => r.id === selected.id)
    return <RecipeDetail recipe={selected} onBack={() => setView("list")} onDelete={async (id) => { await onDelete(id); setView("list") }} onEdit={() => setView("edit")} isCore={isCore} />
  }
  if (view === "add") {
    return <AddRecipeForm onSave={handleAdd} onCancel={() => setView("list")} saving={saving} />
  }
  if (view === "edit" && selected) {
    return <AddRecipeForm onSave={handleEdit} onCancel={() => setView("detail")} saving={saving} initialData={selected} />
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <SectionTitle>Recipes</SectionTitle>
          <p style={{ color: "var(--text-muted)", fontSize: "13px" }}>{filtered.length} {filtered.length === 1 ? "recipe" : "recipes"}</p>
        </div>
        <Btn variant="primary" onClick={() => setView("add")}>+ Add Recipe</Btn>
      </div>

      <div style={{ display: "flex", gap: "12px", marginBottom: "20px", flexWrap: "wrap" }}>
        <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search recipes, tags..." style={{ maxWidth: "260px" }} />
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
            {dynamicCategories.map(cat => (
            <button key={cat} onClick={() => setCategory(cat)} style={{
              background: category === cat ? "var(--header)" : "none",
              color: category === cat ? "white" : "var(--text-secondary)",
              border: "1px solid " + (category === cat ? "var(--header)" : "var(--border)"),
              padding: "6px 13px", borderRadius: "999px", fontSize: "12px",
              fontFamily: "inherit", cursor: "pointer", transition: "all 0.15s"
            }}>{cat}</button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 0", color: "var(--text-muted)" }}>
          <div style={{ fontSize: "36px", marginBottom: "12px" }}>🍳</div>
          <p style={{ fontFamily: "'Playfair Display', serif" }}>No recipes found. Add one!</p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "16px" }}>
          {filtered.map(r => (
            <RecipeCard key={r.id} recipe={r} onClick={r => { setSelected(r); setView("detail") }} />
          ))}
        </div>
      )}
    </div>
  )
}

// ── Pantry Tab ────────────────────────────────────────────────────────────────
function PantryGroup({ groupName, items, onToggle, onAdd, onRemove, onDeleteCategory }) {
  const [showInput, setShowInput] = useState(false)
  const [draft, setDraft] = useState("")
  const [confirmDelete, setConfirmDelete] = useState(false)

  const commitAdd = () => {
    if (!draft.trim()) return
    onAdd(groupName, draft.trim().toLowerCase())
    setDraft("")
    setShowInput(false)
  }

  return (
    <Card>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
        <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "14px", color: "var(--text-primary)" }}>{groupName}</div>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>{items.filter(i => i.have).length}/{items.length}</span>
          <button onClick={() => { setShowInput(!showInput); setDraft("") }} style={{
            background: "none", border: "1px solid var(--border)", borderRadius: "999px",
            color: "var(--accent)", fontSize: "11px", padding: "2px 10px", cursor: "pointer"
          }}>{showInput ? "Cancel" : "+ Add"}</button>
          {!confirmDelete ? (
            <button onClick={() => setConfirmDelete(true)} style={{
              background: "none", border: "1px solid var(--border)", borderRadius: "999px",
              color: "var(--text-muted)", fontSize: "11px", padding: "2px 8px", cursor: "pointer", lineHeight: 1
            }} title="Delete category">✕</button>
          ) : (
            <div style={{ display: "flex", gap: "4px" }}>
              <button onClick={() => { onDeleteCategory(groupName); setConfirmDelete(false) }} style={{
                background: "var(--red)", border: "none", borderRadius: "999px",
                color: "white", fontSize: "11px", padding: "2px 8px", cursor: "pointer"
              }}>Delete</button>
              <button onClick={() => setConfirmDelete(false)} style={{
                background: "none", border: "1px solid var(--border)", borderRadius: "999px",
                color: "var(--text-muted)", fontSize: "11px", padding: "2px 8px", cursor: "pointer"
              }}>Cancel</button>
            </div>
          )}
        </div>
      </div>

      {showInput && (
        <div style={{ display: "flex", gap: "6px", marginBottom: "10px" }}>
          <Input autoFocus value={draft} onChange={e => setDraft(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") commitAdd(); if (e.key === "Escape") { setShowInput(false); setDraft("") } }}
            placeholder="Item name..." style={{ fontSize: "12px", padding: "7px 10px" }} />
          <Btn variant="primary" onClick={commitAdd} style={{ padding: "7px 14px", fontSize: "12px", whiteSpace: "nowrap" }}>Add</Btn>
        </div>
      )}

      <ul>
        {items.map((item, idx) => (
          <li key={idx} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid var(--border-light)" }}>
            <div onClick={() => onToggle(groupName, item.name)} style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", flex: 1, userSelect: "none" }}>
              <div style={{
                width: "18px", height: "18px", borderRadius: "5px", flexShrink: 0,
                border: `1.5px solid ${item.have ? "var(--accent)" : "var(--border)"}`,
                background: item.have ? "var(--accent)" : "transparent",
                display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.15s"
              }}>
                {item.have && <span style={{ color: "white", fontSize: "11px", lineHeight: 1 }}>✓</span>}
              </div>
              <span style={{
                fontSize: "13px", color: item.have ? "var(--text-primary)" : "var(--text-muted)",
                textDecoration: item.have ? "none" : "line-through"
              }}>{item.name}</span>
            </div>
            <button onClick={e => { e.stopPropagation(); onRemove(groupName, item.name) }} style={{
              background: "none", border: "none", color: "var(--border)", cursor: "pointer",
              fontSize: "16px", padding: "0 4px", lineHeight: 1, flexShrink: 0
            }}>×</button>
          </li>
        ))}
      </ul>
    </Card>
  )
}

function PantryTab({ pantry, onPantryChange }) {
  const [search, setSearch] = useState("")
  const [showAddCategory, setShowAddCategory] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState("")

  const haveCount = Object.values(pantry).flat().filter(i => i.have).length
  const totalCount = Object.values(pantry).flat().length

  const handleToggle = (group, name) => {
    onPantryChange({ ...pantry, [group]: pantry[group].map(item => item.name === name ? { ...item, have: !item.have } : item) })
  }
  const handleAdd = (group, name) => {
    if (pantry[group].some(i => i.name === name)) return
    onPantryChange({ ...pantry, [group]: [...pantry[group], { name, have: true }] })
  }
  const handleRemove = (group, name) => {
    onPantryChange({ ...pantry, [group]: pantry[group].filter(item => item.name !== name) })
  }
  const handleAddCategory = () => {
    const name = newCategoryName.trim()
    if (!name) return
    if (pantry[name]) return alert("A category with that name already exists.")
    onPantryChange({ ...pantry, [name]: [] })
    setNewCategoryName("")
    setShowAddCategory(false)
  }
  const handleDeleteCategory = (group) => {
    const updated = { ...pantry }
    delete updated[group]
    onPantryChange(updated)
  }

  const filteredPantry = search
    ? Object.fromEntries(
        Object.entries(pantry)
          .map(([g, items]) => [g, items.filter(i => i.name.includes(search.toLowerCase()))])
          .filter(([, items]) => items.length > 0)
      )
    : pantry

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <SectionTitle>My Pantry</SectionTitle>
          <p style={{ color: "var(--text-muted)", fontSize: "13px" }}>
            {haveCount} of {totalCount} items stocked · Toggle items you have · "+ Add" to add items · "✕" to delete a category
          </p>
        </div>
        <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search pantry..." style={{ maxWidth: "220px" }} />
          {!showAddCategory ? (
            <button onClick={() => setShowAddCategory(true)} style={{
              background: "none", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)",
              color: "var(--accent)", fontSize: "12px", padding: "6px 14px", cursor: "pointer", whiteSpace: "nowrap"
            }}>+ Add Category</button>
          ) : (
            <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
              <input
                autoFocus
                value={newCategoryName}
                onChange={e => setNewCategoryName(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") handleAddCategory(); if (e.key === "Escape") { setShowAddCategory(false); setNewCategoryName("") } }}
                placeholder="Category name..."
                style={{
                  padding: "7px 10px", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)",
                  fontSize: "12px", color: "var(--text-primary)", background: "var(--bg-hover)",
                  outline: "none", width: "160px"
                }}
              />
              <button onClick={handleAddCategory} style={{
                background: "var(--accent)", border: "none", borderRadius: "var(--radius-sm)",
                color: "white", fontSize: "12px", padding: "7px 14px", cursor: "pointer", whiteSpace: "nowrap"
              }}>Add</button>
              <button onClick={() => { setShowAddCategory(false); setNewCategoryName("") }} style={{
                background: "none", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)",
                color: "var(--text-muted)", fontSize: "12px", padding: "7px 14px", cursor: "pointer"
              }}>Cancel</button>
            </div>
          )}
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "16px" }}>
        {Object.entries(filteredPantry).map(([group, items]) => (
          <PantryGroup key={group} groupName={group} items={items} onToggle={handleToggle} onAdd={handleAdd} onRemove={handleRemove} onDeleteCategory={handleDeleteCategory} />
        ))}
      </div>
    </div>
  )
}

// ── Meal Planner Tab ──────────────────────────────────────────────────────────
function MealPlannerTab({ plan, onPlanChange, allRecipes }) {
  const [picking, setPicking] = useState(null)
  const [search, setSearch] = useState("")

  const assign = (day, recipe) => { onPlanChange({ ...plan, [day]: recipe }); setPicking(null); setSearch("") }
  const clear = (day) => { const u = { ...plan }; delete u[day]; onPlanChange(u) }

  const filtered = allRecipes.filter(r =>
    !search || r.title.toLowerCase().includes(search.toLowerCase()) || (r.tags || []).some(t => t.includes(search.toLowerCase()))
  )

  return (
    <div>
      <div style={{ marginBottom: "22px" }}>
        <SectionTitle>This Week</SectionTitle>
        <p style={{ color: "var(--text-muted)", fontSize: "13px" }}>Click any day to assign a recipe</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "8px", marginBottom: "28px" }}>
        {DAYS.map(day => {
          const assigned = plan[day]
          const active = picking === day
          return (
            <div key={day} style={{
              border: `1px solid ${active ? "var(--accent)" : "var(--border)"}`,
              borderRadius: "var(--radius)", overflow: "hidden",
              background: assigned ? "var(--bg-hover)" : "var(--bg-card)", transition: "all 0.15s"
            }}>
              <div style={{ background: active ? "var(--accent)" : "var(--header)", padding: "7px 10px" }}>
                <div style={{ fontSize: "10px", color: active ? "white" : "var(--accent-light)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                  {day.slice(0, 3)}
                </div>
              </div>
              <div style={{ padding: "10px", minHeight: "86px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                {assigned ? (
                  <>
                    <div>
                      <CatBadge category={assigned.category} />
                      <p style={{ fontFamily: "'Playfair Display', serif", fontSize: "12px", color: "var(--text-primary)", margin: "5px 0 3px", lineHeight: "1.3" }}>{assigned.title}</p>
                      <p style={{ fontSize: "10px", color: "var(--text-muted)" }}>Serves {assigned.servings}</p>
                    </div>
                    <div style={{ display: "flex", gap: "4px", marginTop: "8px" }}>
                      <button onClick={() => setPicking(active ? null : day)} style={{ flex: 1, background: "none", border: "1px solid var(--border)", borderRadius: "4px", fontSize: "10px", padding: "3px 6px", cursor: "pointer", color: "var(--text-secondary)" }}>Change</button>
                      <button onClick={() => clear(day)} style={{ background: "none", border: "1px solid var(--border)", borderRadius: "4px", fontSize: "10px", padding: "3px 6px", cursor: "pointer", color: "var(--red)" }}>✕</button>
                    </div>
                  </>
                ) : (
                  <button onClick={() => setPicking(active ? null : day)} style={{
                    width: "100%", height: "100%", background: "none", border: "1px dashed var(--border)",
                    borderRadius: "8px", color: "var(--text-muted)", fontSize: "12px", cursor: "pointer",
                    padding: "16px 6px", minHeight: "68px"
                  }}>+ Add meal</button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {picking && (
        <Card style={{ marginBottom: "24px", border: "1px solid var(--accent)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
            <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: "15px", fontWeight: "400" }}>
              Pick a recipe for <strong>{picking}</strong>
            </h3>
            <Btn variant="outline" onClick={() => { setPicking(null); setSearch("") }} style={{ fontSize: "12px", padding: "4px 12px" }}>Cancel</Btn>
          </div>
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..." style={{ maxWidth: "280px", marginBottom: "12px" }} autoFocus />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "8px", maxHeight: "300px", overflowY: "auto" }}>
            {filtered.map(r => (
              <div key={r.id} onClick={() => assign(picking, r)} style={{
                background: "var(--bg-hover)", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)",
                padding: "12px", cursor: "pointer", transition: "background 0.12s"
              }}
                onMouseEnter={e => e.currentTarget.style.background = "var(--bg-subtle)"}
                onMouseLeave={e => e.currentTarget.style.background = "var(--bg-hover)"}>
                <CatBadge category={r.category} />
                <p style={{ fontFamily: "'Playfair Display', serif", fontSize: "13px", color: "var(--text-primary)", margin: "5px 0 2px" }}>{r.title}</p>
                <p style={{ fontSize: "11px", color: "var(--text-muted)" }}>Serves {r.servings} · {r.cooktime}</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {Object.keys(plan).length > 0 && (
        <div style={{ background: "var(--bg-subtle)", borderRadius: "var(--radius-sm)", padding: "14px 18px" }}>
          <p style={{ fontSize: "13px", color: "var(--text-secondary)" }}>
            <strong>{Object.keys(plan).length}</strong> of 7 days planned
          </p>
        </div>
      )}
    </div>
  )
}

// ── Shopping List Tab ─────────────────────────────────────────────────────────
function ShoppingListTab({ plan, pantry, onAddToPantry }) {
  const [checked, setChecked] = useState({})
  const [showPantryItems, setShowPantryItems] = useState(false)

  const toggleCheck = key => setChecked(prev => ({ ...prev, [key]: !prev[key] }))
  const clearChecked = () => setChecked({})

  const plannedRecipes = Object.values(plan)

  if (plannedRecipes.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "60px 0", color: "var(--text-muted)" }}>
        <div style={{ fontSize: "40px", marginBottom: "12px" }}>🛒</div>
        <p style={{ fontFamily: "'Playfair Display', serif", fontSize: "16px", marginBottom: "8px" }}>No meals planned yet</p>
        <p style={{ fontSize: "13px" }}>Add meals in the Meal Planner and your shopping list builds automatically.</p>
      </div>
    )
  }

  const allIngredients = []
  const seen = new Set()
  plannedRecipes.forEach(recipe => {
    ;(recipe.ingredients || []).forEach(ing => {
      if (!ing.startsWith("—")) {
        const key = `${recipe.id}::${ing}`
        if (!seen.has(key)) {
          seen.add(key)
          allIngredients.push({ text: ing, recipe: recipe.title, key, inPantry: ingredientInPantry(ing, pantry) })
        }
      }
    })
  })

  const needToBuy = allIngredients.filter(i => !i.inPantry)
  const coveredByPantry = allIngredients.filter(i => i.inPantry)

  const classify = ing => {
    const t = ing.toLowerCase()
    if (/(beef|chicken|pork|shrimp|fish|bacon|sausage|turkey|thigh|breast|scallop|halibut|salmon|tuna|lamb)/.test(t)) return "🥩 Proteins"
    if (/(onion|garlic|spinach|tomato|lemon|lime|corn|mushroom|zucchini|asparagus|basil|parsley|cilantro|chive|scallion|celery|carrot|avocado|date|broccolini|broccoli|pepper|cucumber|cabbage|lettuce|arugula|kale)/.test(t)) return "🥬 Produce"
    if (/(cheese|cream|milk|butter|sour cream|parmesan|cheddar|mozzarella|goat|yogurt|egg|grits|half and half)/.test(t)) return "🥛 Dairy & Eggs"
    if (/(broth|stock|can|tomato sauce|beans|orzo|noodle|oil|vinegar|worcestershire|dijon|mustard|flour|honey|sun-dried|rice|pasta|cornstarch|gravy|coconut milk|marsala|velveeta)/.test(t)) return "🥫 Pantry & Canned"
    if (/(tsp|tbsp|cumin|paprika|chili|oregano|thyme|salt|pepper|spice|powder|flakes|seasoning|ginger|cinnamon|cayenne)/.test(t)) return "🌿 Herbs & Spices"
    return "📦 Other"
  }

  const groups = { "🥩 Proteins": [], "🥬 Produce": [], "🥛 Dairy & Eggs": [], "🥫 Pantry & Canned": [], "🌿 Herbs & Spices": [], "📦 Other": [] }
  needToBuy.forEach(item => groups[classify(item.text)].push(item))

  const checkedCount = Object.values(checked).filter(Boolean).length
  const checkedItems = needToBuy.filter(i => checked[i.key])

  const handleAddCheckedToPantry = () => {
    if (checkedItems.length === 0) return
    checkedItems.forEach(item => {
      const simplified = item.text.replace(/^[\d½⅓⅔¼¾\s.,]+/, "").split(",")[0].trim().toLowerCase()
      onAddToPantry(simplified)
    })
    clearChecked()
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "10px" }}>
        <div>
          <SectionTitle>Shopping List</SectionTitle>
          <p style={{ color: "var(--text-muted)", fontSize: "13px" }}>
            {needToBuy.length} items to buy · {coveredByPantry.length} covered by pantry · {checkedCount} checked
          </p>
        </div>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          {checkedCount > 0 && (
            <Btn variant="green" onClick={handleAddCheckedToPantry} style={{ fontSize: "12px", padding: "6px 14px" }}>
              ✓ Add {checkedCount} to pantry
            </Btn>
          )}
          <Btn variant="outline" onClick={() => setShowPantryItems(!showPantryItems)} style={{ fontSize: "12px", padding: "6px 14px" }}>
            {showPantryItems ? "Hide" : "Show"} pantry items ({coveredByPantry.length})
          </Btn>
          {checkedCount > 0 && <Btn variant="outline" onClick={clearChecked} style={{ fontSize: "12px", padding: "6px 14px" }}>Clear checked</Btn>}
        </div>
      </div>

      {coveredByPantry.length > 0 && (
        <div style={{ background: "var(--green-bg)", border: "1px solid #C8E0C8", borderRadius: "var(--radius-sm)", padding: "12px 16px", marginBottom: "20px" }}>
          <p style={{ fontSize: "13px", color: "var(--green)" }}>
            ✓ <strong>{coveredByPantry.length} ingredients</strong> already in your pantry — not shown below
          </p>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
        {Object.entries(groups).map(([group, items]) => {
          if (items.length === 0) return null
          return (
            <Card key={group}>
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "14px", marginBottom: "12px" }}>{group}</div>
              <ul>
                {items.map(item => (
                  <li key={item.key} onClick={() => toggleCheck(item.key)} style={{
                    display: "flex", alignItems: "flex-start", gap: "10px",
                    padding: "7px 0", borderBottom: "1px solid var(--border-light)", cursor: "pointer"
                  }}>
                    <div style={{
                      width: "16px", height: "16px", borderRadius: "4px", flexShrink: 0, marginTop: "1px",
                      border: `1px solid ${checked[item.key] ? "var(--accent)" : "var(--border)"}`,
                      background: checked[item.key] ? "var(--accent)" : "transparent",
                      display: "flex", alignItems: "center", justifyContent: "center"
                    }}>
                      {checked[item.key] && <span style={{ color: "white", fontSize: "10px", lineHeight: 1 }}>✓</span>}
                    </div>
                    <div>
                      <span style={{
                        fontSize: "13px", color: checked[item.key] ? "var(--text-muted)" : "var(--text-primary)",
                        textDecoration: checked[item.key] ? "line-through" : "none"
                      }}>{item.text}</span>
                      <span style={{ display: "block", fontSize: "10px", color: "var(--text-muted)", marginTop: "1px" }}>{item.recipe}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </Card>
          )
        })}
      </div>

      {showPantryItems && coveredByPantry.length > 0 && (
        <div style={{ marginTop: "20px", background: "#F8FAF8", border: "1px solid #E0E8DC", borderRadius: "var(--radius)", padding: "18px" }}>
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "14px", color: "var(--green)", marginBottom: "12px" }}>✓ Already in your pantry</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
            {coveredByPantry.map(item => (
              <span key={item.key} style={{ fontSize: "12px", color: "var(--green)", background: "var(--green-bg)", padding: "4px 10px", borderRadius: "999px" }}>{item.text}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ── App Root ──────────────────────────────────────────────────────────────────
export default function App() {
  const [tab, setTab] = useState("recipes")
  const [userRecipes, setUserRecipes] = useState([])
  const [plan, setPlan] = useState({})
  const [pantry, setPantry] = useState(DEFAULT_PANTRY)
  const [loaded, setLoaded] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  // Load all data from Supabase on mount
  useEffect(() => {
    (async () => {
      try {
        const [recipesRes, planRes, pantryRes] = await Promise.all([
          supabase.from("user_recipes").select("*").order("created_at", { ascending: false }),
          supabase.from("meal_plan").select("*").limit(7),
          supabase.from("pantry").select("*").limit(1)
        ])

        if (recipesRes.data) setUserRecipes(recipesRes.data)

        if (planRes.data && planRes.data.length > 0) {
          const planObj = {}
          planRes.data.forEach(row => { planObj[row.day] = row.recipe })
          setPlan(planObj)
        }

        if (pantryRes.data && pantryRes.data.length > 0) {
          setPantry(pantryRes.data[0].data)
        }
      } catch (e) {
        console.error("Load error:", e)
        setError("Could not connect to database. Check your Supabase configuration.")
      }
      setLoaded(true)
    })()
  }, [])

  // Save pantry to Supabase
  const savePantry = useCallback(async (updated) => {
    setPantry(updated)
    try {
      await supabase.from("pantry").upsert({ id: 1, data: updated }, { onConflict: "id" })
    } catch (e) { console.error("Pantry save error:", e) }
  }, [])

  // Save meal plan to Supabase
  const savePlan = useCallback(async (updated) => {
    setPlan(updated)
    try {
      await supabase.from("meal_plan").delete().neq("day", "")
      const rows = Object.entries(updated).map(([day, recipe]) => ({ day, recipe }))
      if (rows.length > 0) await supabase.from("meal_plan").insert(rows)
    } catch (e) { console.error("Plan save error:", e) }
  }, [])

  // Add user recipe to Supabase
const addRecipe = useCallback(async (recipe) => {
  setSaving(true)
  try {
    const { data, error } = await supabase.from("user_recipes").insert([recipe]).select()
    if (error) {
      console.error("Add recipe error:", error)
      alert("Save failed: " + error.message)
    } else if (data) {
      setUserRecipes(prev => [data[0], ...prev])
    }
  } catch (e) {
    console.error("Add recipe error:", e)
    alert("Save failed: " + e.message)
  }
  setSaving(false)
}, [])

  // Delete user recipe from Supabase
const deleteRecipe = useCallback(async (id) => {
    try {
      await supabase.from("user_recipes").delete().eq("id", id)
      setUserRecipes(prev => prev.filter(r => r.id !== id))
    } catch (e) { console.error("Delete recipe error:", e) }
  }, [])

  const updateRecipe = useCallback(async (recipe) => {
    setSaving(true)
    try {
      const { id, created_at, ...fields } = recipe
      const { data, error } = await supabase.from("user_recipes").update(fields).eq("id", id).select()
      if (error) {
        console.error("Update recipe error:", error)
        alert("Update failed: " + error.message)
      } else if (data) {
        setUserRecipes(prev => prev.map(r => r.id === id ? data[0] : r))
      }
    } catch (e) {
      console.error("Update recipe error:", e)
      alert("Update failed: " + e.message)
    }
    setSaving(false)
  }, [])

  // Add a single item to pantry (from shopping list check-off)
  const addToPantry = useCallback((itemName) => {
    const updated = { ...pantry }
    for (const group of Object.keys(updated)) {
      if (updated[group].some(i => i.name === itemName)) {
        updated[group] = updated[group].map(i => i.name === itemName ? { ...i, have: true } : i)
        savePantry(updated)
        return
      }
    }
    // Not found — add to Pantry & Canned as a catch-all
    updated["Pantry & Canned"] = [...(updated["Pantry & Canned"] || []), { name: itemName, have: true }]
    savePantry(updated)
  }, [pantry, savePantry])

  const allRecipes = [...CORE_RECIPES, ...userRecipes]

  if (!loaded) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: "var(--bg)" }}>
      <Spinner />
    </div>
  )

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      {/* Header */}
      <div style={{ background: "var(--header)", padding: "18px 32px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 100, boxShadow: "0 2px 12px rgba(0,0,0,0.3)" }}>
        <div>
          <div style={{ fontSize: "10px", color: "var(--accent-light)", letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: "2px" }}>My</div>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "24px", color: "#FDF8F2", fontWeight: "400", letterSpacing: "0.02em" }}>RecipeBox</h1>
        </div>
        <div style={{ display: "flex", gap: "4px" }}>
          {[["recipes", "📋"], ["pantry", "🥫"], ["planner", "📅"], ["shopping", "🛒"]].map(([key, icon]) => (
            <button key={key} onClick={() => setTab(key)} style={{
              background: tab === key ? "rgba(255,255,255,0.15)" : "none",
              border: "none", color: tab === key ? "white" : "rgba(255,255,255,0.5)",
              padding: "8px 14px", borderRadius: "var(--radius-sm)", fontSize: "12px",
              fontFamily: "inherit", cursor: "pointer", textTransform: "capitalize",
              letterSpacing: "0.03em", transition: "all 0.15s"
            }}>
              <span style={{ marginRight: "5px" }}>{icon}</span>
              {key.charAt(0).toUpperCase() + key.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div style={{ background: "var(--red-bg)", borderBottom: "1px solid var(--red)", padding: "12px 32px" }}>
          <p style={{ fontSize: "13px", color: "var(--red)" }}>⚠ {error}</p>
        </div>
      )}

      {/* Content */}
      <div style={{ padding: "28px 32px", maxWidth: "1200px", margin: "0 auto" }}>
        {tab === "recipes" && <RecipesTab userRecipes={userRecipes} onDelete={deleteRecipe} onAdd={addRecipe} onEdit={updateRecipe} saving={saving} />}
        {tab === "pantry" && <PantryTab pantry={pantry} onPantryChange={savePantry} />}
        {tab === "planner" && <MealPlannerTab plan={plan} onPlanChange={savePlan} allRecipes={allRecipes} />}
        {tab === "shopping" && <ShoppingListTab plan={plan} pantry={pantry} onAddToPantry={addToPantry} />}
      </div>
    </div>
  )
}
