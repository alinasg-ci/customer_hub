import type { Phase, Task } from '../types';

/**
 * Export customer planning as a styled PNG document.
 * Creates an offscreen HTML element, renders it with html2canvas, triggers download.
 */
export async function exportCustomerPlanningPng(
  projectName: string,
  phases: readonly Phase[],
  tasksByPhase: ReadonlyMap<string, readonly Task[]>
): Promise<void> {
  const { default: html2canvas } = await import('html2canvas');

  const container = document.createElement('div');
  container.style.cssText = 'position:absolute;left:-9999px;top:0;width:800px;padding:40px;background:#fff;font-family:Inter,system-ui,-apple-system,sans-serif;color:#1e293b;';

  const dateStr = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

  let html = `
    <div style="margin-bottom:32px">
      <h1 style="font-size:22px;font-weight:600;margin:0 0 4px 0">${escapeHtml(projectName)}</h1>
      <p style="font-size:12px;color:#94a3b8;margin:0">Customer Planning · Generated ${dateStr}</p>
    </div>
  `;

  let grandTotal = 0;

  for (const phase of phases) {
    const tasks = tasksByPhase.get(phase.id) ?? [];
    const phaseTotal = tasks.reduce((s, t) => s + t.planned_hours, 0);
    grandTotal += phaseTotal;

    html += `
      <div style="margin-bottom:24px">
        <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 16px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px 8px 0 0">
          <span style="font-size:14px;font-weight:600">${escapeHtml(phase.name)}</span>
          <span style="font-size:12px;color:#64748b">${phaseTotal}h</span>
        </div>
        <table style="width:100%;border-collapse:collapse;font-size:13px">
          <thead>
            <tr style="border-bottom:1px solid #e2e8f0">
              <th style="text-align:left;padding:8px 16px;font-size:11px;text-transform:uppercase;letter-spacing:0.05em;color:#94a3b8;font-weight:600">Task</th>
              <th style="text-align:right;padding:8px 16px;font-size:11px;text-transform:uppercase;letter-spacing:0.05em;color:#94a3b8;font-weight:600;width:100px">Hours</th>
            </tr>
          </thead>
          <tbody>
    `;

    for (const task of tasks) {
      html += `
            <tr style="border-bottom:1px solid #f1f5f9">
              <td style="padding:8px 16px;color:#334155">${escapeHtml(task.name || 'Untitled')}</td>
              <td style="padding:8px 16px;text-align:right;color:#475569">${task.planned_hours}h</td>
            </tr>
      `;
    }

    if (tasks.length === 0) {
      html += `
            <tr><td colspan="2" style="padding:8px 16px;color:#94a3b8;font-style:italic">No tasks</td></tr>
      `;
    }

    html += `
          </tbody>
        </table>
      </div>
    `;
  }

  html += `
    <div style="display:flex;justify-content:flex-end;padding:12px 16px;border-top:2px solid #e2e8f0;font-size:14px;font-weight:600">
      <span>Total: ${grandTotal}h</span>
    </div>
  `;

  container.innerHTML = html;
  document.body.appendChild(container);

  try {
    const canvas = await html2canvas(container, { scale: 2, backgroundColor: '#ffffff' });
    const blob = await new Promise<Blob>((resolve) => {
      canvas.toBlob((b) => resolve(b!), 'image/png');
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${projectName.replace(/[^a-zA-Z0-9-_ ]/g, '').trim() || 'customer-planning'}.png`;
    link.click();
    URL.revokeObjectURL(url);
  } finally {
    document.body.removeChild(container);
  }
}

function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
