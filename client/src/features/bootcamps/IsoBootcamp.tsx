import React, { useState } from 'react';
import './iso-bootcamp.css';
import { Bootcamp, AllocationUnit, Allotment } from '../../types';

/* ==========================================================================
   BLUEPRINTS — how each bootcamp category is built.
   Numbers are percentages of the room (x / w of its width, y / h of its depth).

   VIP    : 1 portion,  1 bed  -> 1 person
   SENIOR : 2 portions, 1 bed  -> 2 people
   JUNIOR : 2 portions, 3 beds -> 6 people
   ========================================================================== */
export const BLUEPRINTS = {
  VIP: {
    portions: [
      {
        key: 'A', x: 0, w: 100,
        beds: [{ bed: 1, x: 10, y: 14, w: 22, h: 56 }],
        furniture: [
          { x: 52, y: 12, w: 34, h: 16 }, // sofa
          { x: 62, y: 40, w: 16, h: 22 }, // table
          { x: 36, y: 14, w: 8,  h: 14 }, // side table
        ],
      },
    ],
  },
  SENIOR: {
    portions: [
      { key: 'A', x: 0,  w: 50, beds: [{ bed: 1, x: 14, y: 14, w: 18, h: 54 }], furniture: [{ x: 36, y: 14, w: 8, h: 14 }] },
      { key: 'B', x: 50, w: 50, beds: [{ bed: 1, x: 64, y: 14, w: 18, h: 54 }], furniture: [{ x: 86, y: 14, w: 8, h: 14 }] },
    ],
  },
  JUNIOR: {
    portions: [
      {
        key: 'A', x: 0, w: 50,
        beds: [
          { bed: 1, x: 5,  y: 14, w: 11, h: 50 },
          { bed: 2, x: 20, y: 14, w: 11, h: 50 },
          { bed: 3, x: 35, y: 14, w: 11, h: 50 },
        ],
      },
      {
        key: 'B', x: 50, w: 50,
        beds: [
          { bed: 1, x: 55, y: 14, w: 11, h: 50 },
          { bed: 2, x: 70, y: 14, w: 11, h: 50 },
          { bed: 3, x: 85, y: 14, w: 11, h: 50 },
        ],
      },
    ],
  },
} as const;

/* --------------------------------------------------------------------------
   Data shape this component reads from the real API.

   AllocationUnit fields:
     _id               — MongoDB ObjectId string
     portionIdentifier — "Portion A" | "Portion B" | null  (JUNIOR/SENIOR)
     bedIdentifier     — "Bed 1" | "Bed 2" | "Bed 3" | null (JUNIOR)
     isOccupied        — boolean
     unitType          — "WHOLE" | "PORTION" | "BED"

   We normalise these into the shape IsoUnit that BLUEPRINTS expects:
     portion  — blueprint key: "A" | "B"
     bed      — bed number: 1 | 2 | 3 (always 1 for VIP/SENIOR)
     status   — "available" | "occupied"
     occupant — { name, empId } | null  (resolved from allotments list)
   -------------------------------------------------------------------------- */

interface IsoOccupant {
  name: string;
  empId: string;
}

interface IsoUnit {
  id: string;        // AllocationUnit._id
  portion: string;   // "A" | "B"
  bed: number;       // 1 | 2 | 3
  status: 'available' | 'occupied';
  occupant: IsoOccupant | null;
  /** Original AllocationUnit — passed to onAllocate/onCheckout */
  raw: AllocationUnit;
  /** Active Allotment for this unit if occupied — passed to onCheckout */
  allotment: Allotment | null;
}

/** Extract portion letter ("A" or "B") from "Portion A" / "Portion B" */
function portionKey(identifier: string | null | undefined): string {
  if (!identifier) return 'A';
  const match = identifier.match(/Portion\s+([A-Z])/i);
  return match ? match[1].toUpperCase() : 'A';
}

/** Extract bed number (1/2/3) from "Bed 1" / "Bed 2" / "Bed 3" */
function bedNumber(identifier: string | null | undefined): number {
  if (!identifier) return 1;
  const match = identifier.match(/Bed\s+(\d+)/i);
  return match ? parseInt(match[1], 10) : 1;
}

/**
 * Build a normalised IsoUnit array from raw AllocationUnit[] + Allotment[].
 * Occupant info lives only in Allotment (the bootcamp API does not embed it),
 * so we cross-reference by allocationUnitId.
 */
function buildIsoUnits(
  units: AllocationUnit[],
  allotments: Allotment[],
  bootcampId: string,
): IsoUnit[] {
  // Index allotments by allocationUnitId._id string for O(1) lookup.
  // The Allotment type uses allocationUnitId as AllocationUnit (populated).
  const allotmentByUnit = new Map<string, Allotment>();
  allotments.forEach((a) => {
    const uid =
      typeof a.allocationUnitId === 'string'
        ? a.allocationUnitId
        : (a.allocationUnitId as any)?._id?.toString() ?? '';
    if (uid) allotmentByUnit.set(uid, a);
  });

  return units
    .filter((u) => {
      // Only include units belonging to this bootcamp
      const bid =
        typeof (u as any).bootcampId === 'string'
          ? (u as any).bootcampId
          : (u as any).bootcampId?.toString() ?? '';
      return !bid || bid === bootcampId;
    })
    .map((u): IsoUnit => {
      const allotment = allotmentByUnit.get(u._id.toString()) ?? null;
      const occupant: IsoOccupant | null = allotment
        ? {
            name: (allotment.employeeId as any)?.name ?? 'Unknown',
            empId: (allotment.employeeId as any)?.employeeId ?? '',
          }
        : null;

      return {
        id: u._id.toString(),
        portion: portionKey(u.portionIdentifier),
        bed: bedNumber(u.bedIdentifier),
        status: u.isOccupied ? 'occupied' : 'available',
        occupant,
        raw: u,
        allotment,
      };
    });
}

/**
 * Find the IsoUnit for a given portion key + bed number.
 * Falls back to a synthetic available unit so the room always renders.
 */
function findBed(
  isoUnits: IsoUnit[],
  bootcamp: Bootcamp,
  portionKey: string,
  bedNo: number,
): IsoUnit {
  return (
    isoUnits.find((b) => b.portion === portionKey && b.bed === bedNo) ?? {
      id: `${bootcamp.bootcampCode}-P${portionKey}-Bed${bedNo}`,
      portion: portionKey,
      bed: bedNo,
      status: 'available',
      occupant: null,
      raw: {} as AllocationUnit,
      allotment: null,
    }
  );
}

const onKey =
  (fn: () => void) =>
  (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      fn();
    }
  };

/* --------------------------------------------------------------------------
   Props
   -------------------------------------------------------------------------- */
interface IsoBootcampProps {
  bootcamp: Bootcamp;
  /** All active allotments for the whole module — we filter to this bootcamp */
  allotments: Allotment[];
  /** Called with the raw AllocationUnit + Bootcamp when "Allocate" is clicked */
  onAllocate: (unit: AllocationUnit, bootcamp: Bootcamp) => void;
  /** Called with the Allotment + Bootcamp when "Check out" is clicked */
  onCheckout: (allotment: Allotment, bootcamp: Bootcamp) => void;
}

/**
 * Isometric 3D room for one bootcamp + a one-line detail strip.
 * Clicking a bed selects it:
 *   - occupied  -> shows the employee's name and ID, with a "Check out" button
 *   - available -> shows "Available", with an "Allocate" button
 * onAllocate / onCheckout delegate to the module's existing flows.
 */
const IsoBootcamp: React.FC<IsoBootcampProps> = ({
  bootcamp,
  allotments,
  onAllocate,
  onCheckout,
}) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const category = bootcamp.category as keyof typeof BLUEPRINTS;
  const plan = BLUEPRINTS[category] ?? BLUEPRINTS.JUNIOR;

  const isoUnits = buildIsoUnits(bootcamp.units ?? [], allotments, bootcamp._id);
  const selected = isoUnits.find((b) => b.id === selectedId) ?? null;

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
            <div
              key={p.key}
              className="iso-portion"
              style={{ left: `${p.x}%`, width: `${p.w}%` }}
            >
              <span className="iso-portion-label">PORTION {p.key}</span>
            </div>
          ))}

          {plan.portions.flatMap((p) =>
            ((p as any).furniture ?? []).map((f: any, i: number) => (
              <div
                key={`${p.key}-f${i}`}
                className="iso-box iso-furniture"
                style={{ left: `${f.x}%`, top: `${f.y}%`, width: `${f.w}%`, height: `${f.h}%` }}
              >
                <div className="side-f" />
                <div className="side-r" />
                <div className="top" />
              </div>
            ))
          )}

          {plan.portions.flatMap((p) =>
            p.beds.map((slot) => {
              const bed = findBed(isoUnits, bootcamp, p.key, slot.bed);
              const occupied = bed.status === 'occupied';
              const isSelected = bed.id === selectedId;
              const select = () => setSelectedId(isSelected ? null : bed.id);
              return (
                <div
                  key={bed.id}
                  role="button"
                  tabIndex={0}
                  aria-pressed={isSelected}
                  aria-label={`Portion ${p.key}, Bed ${slot.bed}: ${
                    occupied ? `occupied by ${bed.occupant?.name ?? 'employee'}` : 'available'
                  }`}
                  className={`iso-box iso-bed ${bed.status} ${isSelected ? 'selected' : ''}`}
                  style={{
                    left: `${slot.x}%`,
                    top: `${slot.y}%`,
                    width: `${slot.w}%`,
                    height: `${slot.h}%`,
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    select();
                  }}
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
      <div
        className={`iso-detail ${selected ? selected.status : ''}`}
        aria-live="polite"
      >
        {!selected && <span className="hint">Click a bed to see details</span>}

        {selected && selected.status === 'occupied' && (
          <>
            <span className="dot" />
            <span className="text">
              <span className="name">{selected.occupant?.name ?? 'Occupant'}</span>
              <span className="meta">
                {selected.occupant?.empId} · Portion {selected.portion} · Bed {selected.bed}
              </span>
            </span>
            <button
              type="button"
              onClick={() => selected.allotment && onCheckout(selected.allotment, bootcamp)}
              disabled={!selected.allotment}
            >
              Check out
            </button>
          </>
        )}

        {selected && selected.status !== 'occupied' && (
          <>
            <span className="dot" />
            <span className="text">
              <span className="name">Available</span>
              <span className="meta">
                Portion {selected.portion} · Bed {selected.bed}
              </span>
            </span>
            <button
              type="button"
              onClick={() => selected.raw._id && onAllocate(selected.raw, bootcamp)}
            >
              Allocate
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default IsoBootcamp;
