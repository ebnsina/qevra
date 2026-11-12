// A small PDF writer for the study sheets the seed creates: a title, a note and a table, over as
// many A4 pages as the rows need. Plain ASCII text in Helvetica; no dependency.
const PAGE = { width: 595, height: 842, margin: 56 };
const ROW = 18;

const escape = (text: string) => text.replace(/[\\()]/g, (c) => `\\${c}`);

export function tablePdf(sheet: { title: string; note: string; footer: string; headers: string[]; rows: string[][] }) {
	const column = (PAGE.width - 2 * PAGE.margin) / sheet.headers.length;
	const text = (font: 'F1' | 'F2', size: number, x: number, y: number, value: string) =>
		`BT /${font} ${size} Tf ${x.toFixed(1)} ${y} Td (${escape(value)}) Tj ET`;
	const line = (font: 'F1' | 'F2', y: number, cells: string[]) =>
		cells.map((cell, i) => text(font, 11, PAGE.margin + i * column, y, cell)).join('\n');

	// Lay the rows out page by page; the first page gives up room for the title and note.
	const pages: string[] = [];
	let rest = sheet.rows;
	while (rest.length || !pages.length) {
		const first = pages.length === 0;
		let y = PAGE.height - PAGE.margin;
		const parts: string[] = [];
		if (first) {
			parts.push(text('F2', 20, PAGE.margin, y - 6, sheet.title), text('F1', 10, PAGE.margin, y - 26, sheet.note));
			y -= 60;
		}
		parts.push(line('F2', y, sheet.headers), `${PAGE.margin} ${y - 6} m ${PAGE.width - PAGE.margin} ${y - 6} l 0.5 w S`);
		y -= ROW + 6;
		const fit = Math.floor((y - PAGE.margin - 20) / ROW) + 1;
		for (const row of rest.slice(0, fit)) {
			parts.push(line('F1', y, row));
			y -= ROW;
		}
		rest = rest.slice(fit);
		parts.push(text('F1', 9, PAGE.margin, 36, `${sheet.footer}  -  page ${pages.length + 1}`));
		pages.push(parts.join('\n'));
	}

	// Objects: 1 catalog, 2 page list, 3 and 4 fonts, then a page and its content for each page.
	const pageId = (i: number) => 5 + i * 2;
	const objects = [
		'<< /Type /Catalog /Pages 2 0 R >>',
		`<< /Type /Pages /Kids [${pages.map((_, i) => `${pageId(i)} 0 R`).join(' ')}] /Count ${pages.length} >>`,
		'<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
		'<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>',
		...pages.flatMap((stream, i) => [
			`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE.width} ${PAGE.height}] /Contents ${pageId(i) + 1} 0 R /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> >>`,
			`<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`
		])
	];
	let body = '%PDF-1.4\n';
	const offsets = objects.map((object, i) => {
		const at = body.length;
		body += `${i + 1} 0 obj\n${object}\nendobj\n`;
		return at;
	});
	const xref = body.length;
	body += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
	for (const at of offsets) body += `${String(at).padStart(10, '0')} 00000 n \n`;
	return `${body}trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
}
