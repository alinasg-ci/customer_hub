import type { CSSProperties } from 'react';
import type { KpiTileData, TintColor } from './data';
import s from './portfolio.module.css';

const TINT_VAR: Record<TintColor, string> = {
  matcha: 'var(--color-matcha-500)',
  slushie: 'var(--color-slushie-500)',
  lemon: 'var(--color-lemon-500)',
  ube: 'var(--color-ube-500)',
  pomegranate: 'var(--color-pomegranate-400)',
};

function Sparkline({ values, tint }: { readonly values: readonly number[]; readonly tint: TintColor }) {
  const max = Math.max(...values);
  return (
    <div className={s.spark} aria-hidden="true">
      {values.map((v, i) => (
        <i
          key={i}
          className={s.sparkBar}
          style={{
            height: `${Math.round((v / max) * 28)}px`,
            background: TINT_VAR[tint],
          }}
        />
      ))}
    </div>
  );
}

export function KpiTile({ label, val, unit, delta, up, tint, spark }: KpiTileData) {
  const style = { '--tint': TINT_VAR[tint] } as CSSProperties;
  const deltaClass = up === true ? s.kpiDeltaUp : up === false ? s.kpiDeltaDn : '';
  return (
    <div className={s.kpi} style={style}>
      <div className={s.kpiHatch} />
      <div className={s.kpiTopStrip} />
      <div className={s.kpiLabel}>
        <span className={s.kpiSwatch} />
        <span>{label}</span>
      </div>
      <div className={s.kpiVal}>
        {val}
        {unit && <span className={s.kpiUnit}>{unit}</span>}
      </div>
      {delta && <div className={`${s.kpiDelta} ${deltaClass}`}>{delta}</div>}
      <Sparkline values={spark} tint={tint} />
    </div>
  );
}

export function KpiStrip({ tiles }: { readonly tiles: readonly KpiTileData[] }) {
  return (
    <section className={s.kpis}>
      {tiles.map((t) => (
        <KpiTile key={t.label} {...t} />
      ))}
    </section>
  );
}
