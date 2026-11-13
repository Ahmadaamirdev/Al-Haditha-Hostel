import React, { useState } from "react";
import "./iso-bootcamp.css";

/* ==========================================================================
   BLUEPRINTS — how each bootcamp category is built.
   Numbers are percentages of the room (x / w of its width, y / h of its depth).

   VIP    : 1 portion,  1 bed   -> 1 person
   SENIOR : 2 portions, 1 bed   -> 2 people
   JUNIOR : 2 portions, 3 beds  -> 6 people
   ========================================================================== */
export const BLUEPRINTS = {
  VIP: {
    portions: [
      {
        key: "A", x: 0, w: 100,
        beds: [{ bed: 1, x: 10, y: 14, w: 22, h: 56 }],
        furniture: [
          { x: 52, y: 12, w: 34, h: 16 }, // sofa
          { x: 62, y: 40, w: 16, h: 22 }, // table
          { x: 36, y: 14, w: 8, h: 14 },  // side table
        ],
      },
    ],
  },
  SENIOR: {
    portions: [
      { key: "A", x: 0, w: 50, beds: [{ bed: 1, x: 14, y: 14, w: 18, h: 54 }], furniture: [{ x: 36, y: 14, w: 8, h: 14 }] },
      { key: "B", x: 50, w: 50, beds: [{ bed: 1, x: 64, y: 14, w: 18, h: 54 }], furniture: [{ x: 86, y: 14, w: 8, h: 14 }] },
    ],
  },
  JUNIOR: {
    portions: [
      {
        key: "A", x: 0, w: 50,
        beds: [
          { bed: 1, x: 5, y: 14, w: 11, h: 50 },
          { bed: 2, x: 20, y: 14, w: 11, h: 50 },
          { bed: 3, x: 35, y: 14, w: 11, h: 50 },
        ],
      },
      {
        key: "B", x: 50, w: 50,
        beds: [
          { bed: 1, x: 55, y: 14, w: 11, h: 50 },
          { bed: 2, x: 70, y: 14, w: 11, h: 50 },
          { bed: 3, x: 85, y: 14, w: 11, h: 50 },
        ],
      },
    ],
  },
};

/* --------------------------------------------------------------------------
   Data shape this component reads. Adapt `findBed` to the real API fields.

   bootcamp = {
     code: "BC-JR-01", category: "VIP" | "SENIOR" | "JUNIOR",
     beds: [{ id: "BC-JR-01-PA-Bed1", portion: "A", bed: 1,
              status: "available" | "occupied",
              occupant: { name: "Ali Raza", empId: "EMP-1042" } | null }]
   }
   -------------------------------------------------------------------------- */
const findBed = (bootcamp, portionKey, bedNo) =>
  bootcamp.beds.find((b) => b.portion === portionKey && b.bed === bedNo) || {
    id: `${bootcamp.code}-P${portionKey}-Bed${bedNo}`,
    portion: portionKey, bed: bedNo, status: "available", occupant: null,
  };

const onKey = (fn) => (e) => {
  if (e.key === "Enter" || e.key === " ") { e.preventDefault(); fn(); }
};

/**
 * Isometric 3D room for one bootcamp + a one-line detail strip.
 * Clicking a bed selects it:
 *   - occupied  -> shows the employee's name and ID, with a "Check out" button
 *   - available -> shows "Available", with an "Allocate" button
 * onAllocate(bed, bootcamp) and onCheckout(bed, bootcamp) should call the
 * module's EXISTING allocate / check-out flows.
 */
export default function IsoBootcamp({ bootcamp, onAllocate, onCheckout }) {
  const [selectedId, setSelectedId] = useState(null);
  const plan = BLUEPRINTS[bootcamp.category];
  const selected = bootcamp.beds.find((b) => b.id === selectedId) || null;

  return (
    <div className="isoBc">
      <div className="iso-scene" onClick={() => setSelectedId(null)}>
        <div className="iso-room">
          <div className="iso-wall back" />
          <div className="iso-wall left" />
          {plan.portions.slice(1).map((p) => (
            <div key={p.key} className="iso-wall partition" style={{ left: `${p.x}%` }} />
          ))}

          {plan.portions.map((p) => (
            <div key={p.key} className="iso-portion" style={{ left: `${p.x}%`, width: `${p.w}%` }}>
              <span className="iso-portion-label">PORTION {p.key}</span>
            </div>
          ))}

          {plan.portions.flatMap((p) =>
            (p.furniture || []).map((f, i) => (
              <div key={`${p.key}-f${i}`} className="iso-box iso-furniture"
                style={{ left: `${f.x}%`, top: `${f.y}%`, width: `${f.w}%`, height: `${f.h}%` }}>
                <div className="side-f" /><div className="side-r" /><div className="top" />
              </div>
            ))
          )}

          {plan.portions.flatMap((p) =>
            p.beds.map((slot) => {
              const bed = findBed(bootcamp, p.key, slot.bed);
              const occupied = bed.status === "occupied";
              const select = () => setSelectedId(bed.id === selectedId ? null : bed.id);
              return (
                <div
                  key={bed.id}
                  role="button"
                  tabIndex={0}
                  aria-pressed={bed.id === selectedId}
                  aria-label={`Portion ${p.key}, Bed ${slot.bed}: ${occupied ? `occupied by ${bed.occupant?.name}` : "available"}`}
                  className={`iso-box iso-bed ${bed.status} ${bed.id === selectedId ? "selected" : ""}`}
                  style={{ left: `${slot.x}%`, top: `${slot.y}%`, width: `${slot.w}%`, height: `${slot.h}%` }}
                  onClick={(e) => { e.stopPropagation(); select(); }}
                  onKeyDown={onKey(select)}
                >
                  <div className="side-f" />
                  <div className="side-r" />
                  <div className="top">
                    <div className="pillow" />
                    {occupied && <div className="blanket" />}
                    {occupied && <div className="head" />}
                    <div className="num">{slot.bed}</div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Detail strip: always rendered at a fixed height so cards never jump */}
      <div className={`iso-detail ${selected ? selected.status : ""}`} aria-live="polite">
        {!selected && <span className="hint">Click a bed to see details</span>}

        {selected && selected.status === "occupied" && (
          <>
            <span className="dot" />
            <span className="text">
              <span className="name">{selected.occupant?.name}</span>
              <span className="meta">{selected.occupant?.empId} · Portion {selected.portion} · Bed {selected.bed}</span>
            </span>
            <button type="button" onClick={() => onCheckout?.(selected, bootcamp)}>Check out</button>
          </>
        )}

        {selected && selected.status !== "occupied" && (
          <>
            <span className="dot" />
            <span className="text">
              <span className="name">Available</span>
              <span className="meta">Portion {selected.portion} · Bed {selected.bed}</span>
            </span>
            <button type="button" onClick={() => onAllocate?.(selected, bootcamp)}>Allocate</button>
          </>
        )}
      </div>
    </div>
  );
}
