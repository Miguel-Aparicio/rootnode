// ──────────────────────────────────────
//  SVG staff renderer + sticking HTML
// ──────────────────────────────────────

export function renderStaff(rud) {
  const staffY = 64, svgH = 112, noteW = 42, graceW = 20, dragW = 30, groupGap = 22, lPad = 38, rPad = 38;
  const colR  = '#fb7185';
  const colL  = '#60a5fa';
  const staffC = '#3d5267';  // staff lines / barlines / repeat dots
  const beamC  = '#4a6070';  // note beams
  const barC   = '#2e4157';  // group-separator barlines
  const nc     = '#b8c8d8';  // note head / stem — solid
  const ncG    = '#8fa8bf';  // grace / drag notes — slightly dimmer

  const slots = [];
  let x = lPad;
  rud.pattern.forEach((group, gi) => {
    group.forEach(note => {
      if (note.g) x += graceW;
      if (note.d) x += dragW;
      slots.push({ x, note, gi });
      x += noteW;
    });
    x += groupGap;
  });

  const totalW = x - groupGap + rPad + 20;
  let s = `<svg width="${totalW}" height="${svgH}" xmlns="http://www.w3.org/2000/svg">`;

  // Staff line
  s += `<line x1="${lPad - 14}" y1="${staffY}" x2="${totalW - rPad + 14}" y2="${staffY}" stroke="${staffC}" stroke-width="1.5"/>`;
  // Opening double barline
  s += `<line x1="${lPad - 14}" y1="${staffY - 24}" x2="${lPad - 14}" y2="${staffY + 7}" stroke="${staffC}" stroke-width="1.5" stroke-linecap="round"/>`;
  s += `<line x1="${lPad - 7}"  y1="${staffY - 24}" x2="${lPad - 7}"  y2="${staffY + 7}" stroke="${staffC}" stroke-width="5"   stroke-linecap="round"/>`;
  // Closing repeat barline + dots
  const ex = totalW - rPad + 14;
  s += `<line x1="${ex - 7}" y1="${staffY - 24}" x2="${ex - 7}" y2="${staffY + 7}" stroke="${staffC}" stroke-width="5"   stroke-linecap="round"/>`;
  s += `<line x1="${ex - 1}" y1="${staffY - 24}" x2="${ex - 1}" y2="${staffY + 7}" stroke="${staffC}" stroke-width="1.5" stroke-linecap="round"/>`;
  s += `<circle cx="${ex - 13}" cy="${staffY - 14}" r="3" fill="${staffC}"/>`;
  s += `<circle cx="${ex - 13}" cy="${staffY - 5}"  r="3" fill="${staffC}"/>`;

  // Beams per group
  rud.pattern.forEach((group, gi) => {
    if (group.length < 2) return;
    const gs  = slots.filter(sl => sl.gi === gi);
    const bx1 = gs[0].x + 6, bx2 = gs[gs.length - 1].x + 6, by = staffY - 36;
    s += `<rect x="${bx1}" y="${by}"    width="${bx2 - bx1}" height="5" rx="2.5" fill="${beamC}"/>`;
    if (group.length >= 4)
      s += `<rect x="${bx1}" y="${by + 9}" width="${bx2 - bx1}" height="5" rx="2.5" fill="${beamC}"/>`;
    if (group.length === 3)
      s += `<rect x="${bx1}" y="${by + 9}" width="${(bx2 - bx1) * 0.62}" height="5" rx="2.5" fill="${beamC}"/>`;
    if (group.length === 3 || group.length === 6) {
      const mid = (bx1 + bx2) / 2, ty = by - 10, num = group.length, bw = Math.min((bx2 - bx1) * 0.28, 14);
      s += `<line x1="${mid - bw}" y1="${ty + 5}" x2="${mid - bw}" y2="${ty - 1}" stroke="${beamC}" stroke-width="1.2" stroke-linecap="round"/>`;
      s += `<line x1="${mid - bw}" y1="${ty - 1}" x2="${mid - 6}"  y2="${ty - 1}" stroke="${beamC}" stroke-width="1.2" stroke-linecap="round"/>`;
      s += `<line x1="${mid + bw}" y1="${ty + 5}" x2="${mid + bw}" y2="${ty - 1}" stroke="${beamC}" stroke-width="1.2" stroke-linecap="round"/>`;
      s += `<line x1="${mid + bw}" y1="${ty - 1}" x2="${mid + 6}"  y2="${ty - 1}" stroke="${beamC}" stroke-width="1.2" stroke-linecap="round"/>`;
      s += `<text x="${mid}" y="${ty + 2}" text-anchor="middle" dominant-baseline="middle" fill="${beamC}" font-size="11" font-weight="700" font-family="Inter,sans-serif">${num}</text>`;
    }
  });

  // Group-separator barlines
  rud.pattern.forEach((group, gi) => {
    if (gi === 0) return;
    const prev = slots.filter(sl => sl.gi === gi - 1).pop();
    const cur  = slots.find(sl => sl.gi === gi);
    if (!prev || !cur) return;
    const bx = (prev.x + cur.x) / 2;
    s += `<line x1="${bx}" y1="${staffY - 22}" x2="${bx}" y2="${staffY + 5}" stroke="${barC}" stroke-width="1" stroke-linecap="round"/>`;
  });

  // Notes
  slots.forEach(({ x, note }) => {
    const col = note.h === 'R' ? colR : colL;
    // Drag (double grace)
    if (note.d) {
      [-dragW + 5, -dragW + 16].forEach((dx, di) => {
        const gx = x + dx;
        s += `<ellipse cx="${gx}" cy="${staffY}" rx="4" ry="3" fill="${ncG}" transform="rotate(-15 ${gx} ${staffY})"/>`;
        s += `<line x1="${gx + 3}" y1="${staffY - 2}" x2="${gx + 3.5}" y2="${staffY - 19}" stroke="${ncG}" stroke-width="1.3"/>`;
        if (di === 1) s += `<line x1="${gx - 3}" y1="${staffY - 17}" x2="${gx + 9}" y2="${staffY - 10}" stroke="${ncG}" stroke-width="1.3"/>`;
      });
    }
    // Single grace (flam)
    if (note.g) {
      const gx = x - graceW + 4;
      s += `<ellipse cx="${gx}" cy="${staffY}" rx="4" ry="3" fill="${ncG}" transform="rotate(-15 ${gx} ${staffY})"/>`;
      s += `<line x1="${gx + 3}" y1="${staffY - 2}" x2="${gx + 3.5}" y2="${staffY - 19}" stroke="${ncG}" stroke-width="1.3"/>`;
      s += `<line x1="${gx - 2}" y1="${staffY - 17}" x2="${gx + 8}"  y2="${staffY - 10}" stroke="${ncG}" stroke-width="1.5"/>`;
      s += `<line x1="${gx - 1}" y1="${staffY - 21}" x2="${gx + 8}"  y2="${staffY - 10}" stroke="${ncG}" stroke-width="1.1"/>`;
    }
    // Stem
    s += `<line x1="${x + 6}" y1="${staffY - 5}" x2="${x + 6}" y2="${staffY - 36}" stroke="${nc}" stroke-width="2" stroke-linecap="round"/>`;
    // Buzz z
    if (note.b) s += `<text x="${x + 11}" y="${staffY - 22}" fill="${nc}" font-size="13" font-style="italic" font-family="Georgia,serif">z</text>`;
    // Note head
    s += `<ellipse cx="${x}" cy="${staffY}" rx="8" ry="5.8" fill="${nc}" transform="rotate(-15 ${x} ${staffY})"/>`;
    // Accent caret
    if (note.a) s += `<path d="M${x - 7} ${staffY - 50} L${x} ${staffY - 43} L${x + 7} ${staffY - 50}" stroke="${nc}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`;
    // R / L label
    s += `<text x="${x}" y="${staffY + 23}" text-anchor="middle" fill="${col}" font-size="11.5" font-weight="700" font-family="Inter,sans-serif">${note.h}</text>`;
  });

  return s + '</svg>';
}

export function renderSticking(rud) {
  return rud.pattern.map((group, gi) => {
    const part = group.map(note => {
      let t = '';
      if (note.d) {
        const gc = note.d === 'l' ? 'sL' : 'sR';
        t += `<span class="${gc} sg">${note.d}${note.d}</span>`;
      }
      if (note.g) {
        const gc = note.g === 'l' ? 'sL' : 'sR';
        t += `<span class="${gc} sg">${note.g}</span>`;
      }
      const cl  = note.h === 'R' ? 'sR' : 'sL';
      const acc = note.a ? `<span style="font-size:.65rem;vertical-align:super">›</span>` : '';
      return t + `<span class="${cl}">${acc}${note.h}</span>`;
    }).join(' ');
    return (gi > 0 ? `<span class="ssep">|</span>` : '') + part;
  }).join('');
}
