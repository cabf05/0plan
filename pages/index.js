import { createClient } from “@supabase/supabase-js”;
import { useState, useEffect, useCallback } from “react”;

const supabase = createClient(
process.env.NEXT_PUBLIC_SUPABASE_URL,
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const TABLES = [
“companies”, “company_users”, “calculation_batches”,
“clients”, “status_obra”, “units”, “cities”, “suppliers”, “supplier_cities”,
“item_types”, “group_maps”, “information_sources”,
“items”, “item_suppliers”,
“service_groups”, “service_activities”, “service_group_activities”, “service_planning_rules”,
“works”, “work_service_groups”, “work_service_activities”,
“activity_composition_versions”, “activity_composition_items”,
“item_price_records”, “current_item_costs”,
“work_activity_planning”, “work_activity_planning_history”,
“work_activity_dates”, “work_activity_dates_history”,
“work_costs”, “work_prices_bdi”, “purchase_dates”,
“work_maps”, “work_map_items”, “activity_lists”,
“map_quotes”, “map_supplier_selection”,
];

// Columns that should never be edited manually
const READ_ONLY_COLS = new Set([“id”, “created_at”, “updated_at”, “item_quantity_per_activity_unit”]);

export default function Home() {
const [table, setTable] = useState(””);
const [rows, setRows] = useState([]);
const [cols, setCols] = useState([]);
const [loading, setLoading] = useState(false);
const [error, setError] = useState(””);
const [editingId, setEditingId] = useState(null);
const [editData, setEditData] = useState({});
const [newRow, setNewRow] = useState(null);
const [search, setSearch] = useState(””);
const [toast, setToast] = useState(null);

const showToast = (msg, type = “ok”) => {
setToast({ msg, type });
setTimeout(() => setToast(null), 3000);
};

const load = useCallback(async (t) => {
if (!t) return;
setLoading(true);
setError(””);
setEditingId(null);
setNewRow(null);
const { data, error: err } = await supabase.from(t).select(”*”).limit(500);
setLoading(false);
if (err) { setError(err.message); return; }
setRows(data || []);
if (data && data.length > 0) setCols(Object.keys(data[0]));
else {
// Try to get columns from an empty table via a dummy request
setCols([]);
}
}, []);

useEffect(() => { load(table); }, [table, load]);

// ── SAVE EDIT ──
const saveEdit = async (id) => {
const { error: err } = await supabase.from(table).update(editData).eq(“id”, id);
if (err) { showToast(err.message, “err”); return; }
showToast(“Linha atualizada!”);
setEditingId(null);
load(table);
};

// ── DELETE ──
const deleteRow = async (id) => {
if (!confirm(“Apagar esta linha?”)) return;
const { error: err } = await supabase.from(table).delete().eq(“id”, id);
if (err) { showToast(err.message, “err”); return; }
showToast(“Linha apagada!”);
load(table);
};

// ── INSERT ──
const insertRow = async () => {
const payload = { …newRow };
// Remove empty strings → null
Object.keys(payload).forEach((k) => {
if (payload[k] === “”) payload[k] = null;
});
const { error: err } = await supabase.from(table).insert(payload);
if (err) { showToast(err.message, “err”); return; }
showToast(“Linha inserida!”);
setNewRow(null);
load(table);
};

const startNew = () => {
if (!cols.length) return;
const blank = {};
cols.forEach((c) => { if (!READ_ONLY_COLS.has(c)) blank[c] = “”; });
setNewRow(blank);
setEditingId(null);
};

const filtered = rows.filter((r) =>
!search || Object.values(r).some((v) =>
String(v ?? “”).toLowerCase().includes(search.toLowerCase())
)
);

const visibleCols = cols.filter((c) => c !== “item_quantity_per_activity_unit”);

return (
<div style={S.page}>
{/* HEADER */}
<header style={S.header}>
<div style={S.headerInner}>
<span style={S.logo}>⬡ obras<b>db</b></span>
<span style={S.subtitle}>Admin · Supabase</span>
</div>
</header>

```
  {/* SIDEBAR + MAIN */}
  <div style={S.layout}>
    {/* SIDEBAR */}
    <aside style={S.sidebar}>
      <p style={S.sideLabel}>TABELAS</p>
      {TABLES.map((t) => (
        <button
          key={t}
          style={{ ...S.sideItem, ...(table === t ? S.sideItemActive : {}) }}
          onClick={() => { setTable(t); setSearch(""); }}
        >
          {t}
        </button>
      ))}
    </aside>

    {/* MAIN */}
    <main style={S.main}>
      {!table && (
        <div style={S.empty}>
          <span style={S.emptyIcon}>◈</span>
          <p>Selecione uma tabela na barra lateral</p>
        </div>
      )}

      {table && (
        <>
          {/* TOOLBAR */}
          <div style={S.toolbar}>
            <span style={S.tableName}>{table}</span>
            <input
              style={S.search}
              placeholder="Buscar…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <span style={S.count}>{filtered.length} linhas</span>
            <button style={S.btnAdd} onClick={startNew}>+ Nova linha</button>
            <button style={S.btnRefresh} onClick={() => load(table)}>↺</button>
          </div>

          {error && <div style={S.errorBox}>{error}</div>}
          {loading && <div style={S.loadingBar} />}

          {/* TABLE */}
          {!loading && cols.length > 0 && (
            <div style={S.tableWrap}>
              <table style={S.table}>
                <thead>
                  <tr>
                    {visibleCols.map((c) => (
                      <th key={c} style={S.th}>{c}</th>
                    ))}
                    <th style={{ ...S.th, width: 100 }}>ações</th>
                  </tr>
                </thead>
                <tbody>
                  {/* NEW ROW FORM */}
                  {newRow && (
                    <tr style={S.newRowTr}>
                      {visibleCols.map((c) => (
                        <td key={c} style={S.td}>
                          {READ_ONLY_COLS.has(c) ? (
                            <span style={S.autoVal}>auto</span>
                          ) : (
                            <input
                              style={S.cellInput}
                              value={newRow[c] ?? ""}
                              placeholder={c}
                              onChange={(e) =>
                                setNewRow((p) => ({ ...p, [c]: e.target.value }))
                              }
                            />
                          )}
                        </td>
                      ))}
                      <td style={S.td}>
                        <button style={S.btnSave} onClick={insertRow}>✓</button>
                        <button style={S.btnCancel} onClick={() => setNewRow(null)}>✕</button>
                      </td>
                    </tr>
                  )}

                  {/* DATA ROWS */}
                  {filtered.map((row) => (
                    <tr
                      key={row.id}
                      style={editingId === row.id ? S.editingTr : S.tr}
                      onMouseEnter={(e) => {
                        if (editingId !== row.id) e.currentTarget.style.background = "#f5f5f4";
                      }}
                      onMouseLeave={(e) => {
                        if (editingId !== row.id) e.currentTarget.style.background = "";
                      }}
                    >
                      {visibleCols.map((c) => (
                        <td key={c} style={S.td}>
                          {editingId === row.id && !READ_ONLY_COLS.has(c) ? (
                            <input
                              style={S.cellInput}
                              value={editData[c] ?? ""}
                              onChange={(e) =>
                                setEditData((p) => ({ ...p, [c]: e.target.value }))
                              }
                            />
                          ) : (
                            <span style={S.cellVal} title={String(row[c] ?? "")}>
                              {formatVal(row[c])}
                            </span>
                          )}
                        </td>
                      ))}
                      <td style={S.td}>
                        {editingId === row.id ? (
                          <>
                            <button style={S.btnSave} onClick={() => saveEdit(row.id)}>✓</button>
                            <button style={S.btnCancel} onClick={() => setEditingId(null)}>✕</button>
                          </>
                        ) : (
                          <>
                            <button
                              style={S.btnEdit}
                              onClick={() => {
                                setEditingId(row.id);
                                const editable = {};
                                visibleCols.forEach((c) => {
                                  if (!READ_ONLY_COLS.has(c)) editable[c] = row[c] ?? "";
                                });
                                setEditData(editable);
                                setNewRow(null);
                              }}
                            >✎</button>
                            <button style={S.btnDel} onClick={() => deleteRow(row.id)}>✕</button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {filtered.length === 0 && !loading && (
                <div style={S.noRows}>Nenhuma linha encontrada.</div>
              )}
            </div>
          )}
        </>
      )}
    </main>
  </div>

  {/* TOAST */}
  {toast && (
    <div style={{ ...S.toast, ...(toast.type === "err" ? S.toastErr : {}) }}>
      {toast.msg}
    </div>
  )}
</div>
```

);
}

function formatVal(v) {
if (v === null || v === undefined) return <span style={{ color: “#bbb” }}>—</span>;
if (typeof v === “boolean”) return v ? “✓” : “✗”;
const s = String(v);
if (s.length > 60) return s.slice(0, 58) + “…”;
return s;
}

// ── STYLES ──────────────────────────────────────────────────────────────────
const S = {
page: {
fontFamily: “‘DM Mono’, ‘Fira Mono’, ‘Consolas’, monospace”,
background: “#fafaf9”,
minHeight: “100vh”,
color: “#1c1917”,
fontSize: 13,
},
header: {
background: “#1c1917”,
padding: “0 24px”,
height: 52,
display: “flex”,
alignItems: “center”,
position: “sticky”,
top: 0,
zIndex: 100,
},
headerInner: { display: “flex”, alignItems: “baseline”, gap: 12 },
logo: { color: “#fff”, fontSize: 18, letterSpacing: “-0.5px” },
subtitle: { color: “#78716c”, fontSize: 11, letterSpacing: “0.1em”, textTransform: “uppercase” },
layout: { display: “flex”, height: “calc(100vh - 52px)” },
sidebar: {
width: 220,
minWidth: 220,
background: “#fff”,
borderRight: “1px solid #e7e5e4”,
overflowY: “auto”,
padding: “12px 0”,
flexShrink: 0,
},
sideLabel: {
fontSize: 10,
color: “#a8a29e”,
letterSpacing: “0.12em”,
padding: “4px 16px 8px”,
margin: 0,
fontWeight: 600,
},
sideItem: {
display: “block”,
width: “100%”,
textAlign: “left”,
background: “none”,
border: “none”,
padding: “6px 16px”,
cursor: “pointer”,
color: “#57534e”,
fontSize: 12,
fontFamily: “inherit”,
borderRadius: 0,
transition: “background 0.1s”,
},
sideItemActive: {
background: “#1c1917”,
color: “#fff”,
},
main: {
flex: 1,
overflowY: “auto”,
padding: “20px 24px”,
display: “flex”,
flexDirection: “column”,
gap: 16,
},
empty: {
margin: “auto”,
textAlign: “center”,
color: “#a8a29e”,
},
emptyIcon: { fontSize: 48, display: “block”, marginBottom: 12 },
toolbar: {
display: “flex”,
alignItems: “center”,
gap: 10,
flexWrap: “wrap”,
},
tableName: {
fontWeight: 700,
fontSize: 15,
letterSpacing: “-0.3px”,
marginRight: 4,
},
search: {
flex: 1,
maxWidth: 260,
padding: “6px 10px”,
border: “1px solid #e7e5e4”,
borderRadius: 6,
fontFamily: “inherit”,
fontSize: 12,
background: “#fff”,
outline: “none”,
},
count: { color: “#a8a29e”, fontSize: 11, marginLeft: 4 },
btnAdd: {
background: “#1c1917”,
color: “#fff”,
border: “none”,
borderRadius: 6,
padding: “6px 14px”,
cursor: “pointer”,
fontFamily: “inherit”,
fontSize: 12,
fontWeight: 600,
},
btnRefresh: {
background: “none”,
border: “1px solid #e7e5e4”,
borderRadius: 6,
padding: “6px 10px”,
cursor: “pointer”,
fontSize: 14,
color: “#78716c”,
fontFamily: “inherit”,
},
errorBox: {
background: “#fff1f2”,
border: “1px solid #fecdd3”,
color: “#e11d48”,
borderRadius: 6,
padding: “10px 14px”,
fontSize: 12,
},
loadingBar: {
height: 2,
background: “linear-gradient(90deg, #1c1917 0%, #a8a29e 100%)”,
borderRadius: 2,
animation: “none”,
opacity: 0.6,
},
tableWrap: {
overflowX: “auto”,
border: “1px solid #e7e5e4”,
borderRadius: 8,
background: “#fff”,
},
table: {
borderCollapse: “collapse”,
width: “100%”,
tableLayout: “auto”,
},
th: {
background: “#f5f5f4”,
padding: “8px 10px”,
textAlign: “left”,
fontSize: 11,
fontWeight: 700,
color: “#78716c”,
letterSpacing: “0.06em”,
textTransform: “uppercase”,
borderBottom: “1px solid #e7e5e4”,
whiteSpace: “nowrap”,
},
td: {
padding: “6px 10px”,
borderBottom: “1px solid #f5f5f4”,
verticalAlign: “middle”,
maxWidth: 240,
},
tr: { transition: “background 0.1s” },
editingTr: { background: “#fffbeb” },
newRowTr: { background: “#f0fdf4” },
cellVal: {
display: “block”,
overflow: “hidden”,
textOverflow: “ellipsis”,
whiteSpace: “nowrap”,
maxWidth: 220,
color: “#44403c”,
},
cellInput: {
width: “100%”,
minWidth: 80,
padding: “4px 6px”,
border: “1px solid #d6d3d1”,
borderRadius: 4,
fontFamily: “inherit”,
fontSize: 12,
background: “#fff”,
outline: “none”,
boxSizing: “border-box”,
},
autoVal: {
color: “#d6d3d1”,
fontStyle: “italic”,
fontSize: 11,
},
btnEdit: {
background: “none”,
border: “1px solid #e7e5e4”,
borderRadius: 4,
padding: “2px 7px”,
cursor: “pointer”,
fontSize: 13,
color: “#57534e”,
marginRight: 4,
fontFamily: “inherit”,
},
btnDel: {
background: “none”,
border: “1px solid #fecdd3”,
borderRadius: 4,
padding: “2px 7px”,
cursor: “pointer”,
fontSize: 12,
color: “#e11d48”,
fontFamily: “inherit”,
},
btnSave: {
background: “#1c1917”,
color: “#fff”,
border: “none”,
borderRadius: 4,
padding: “3px 9px”,
cursor: “pointer”,
fontSize: 13,
marginRight: 4,
fontFamily: “inherit”,
},
btnCancel: {
background: “none”,
border: “1px solid #e7e5e4”,
borderRadius: 4,
padding: “3px 9px”,
cursor: “pointer”,
fontSize: 12,
color: “#78716c”,
fontFamily: “inherit”,
},
noRows: {
textAlign: “center”,
color: “#a8a29e”,
padding: “32px 0”,
fontSize: 13,
},
toast: {
position: “fixed”,
bottom: 24,
right: 24,
background: “#1c1917”,
color: “#fff”,
padding: “10px 18px”,
borderRadius: 8,
fontSize: 13,
zIndex: 9999,
boxShadow: “0 4px 20px rgba(0,0,0,0.2)”,
},
toastErr: {
background: “#e11d48”,
},
};
