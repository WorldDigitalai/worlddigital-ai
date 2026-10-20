import type { ReactNode } from "react";

function htmlBold(text: string): string {
  return text.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>").replace(/\*((?!\*)[^*]+?)\*/g, "<em>$1</em>");
}

function isBulletLine(line: string): boolean {
  return line.trimStart().startsWith("- ");
}

function isNumberedLine(line: string): boolean {
  return /^\d+\.\s/.test(line.trimStart());
}

function renderSegments(lines: string[], baseKey: string): ReactNode[] {
  const elements: ReactNode[] = [];
  let i = 0;
  while (i < lines.length) {
    if (isBulletLine(lines[i])) {
      const group: string[] = [];
      while (i < lines.length && isBulletLine(lines[i])) {
        group.push(lines[i]);
        i++;
      }
      elements.push(
        <ul key={`${baseKey}-b${i}`} className="list-disc pl-6 space-y-1.5 text-base leading-relaxed" style={{ color: "#374151" }}>
          {group.map((line, j) => (
            <li key={j} dangerouslySetInnerHTML={{ __html: htmlBold(line.trimStart().replace(/^-\s+/, "")) }} />
          ))}
        </ul>
      );
    } else if (isNumberedLine(lines[i])) {
      const group: string[] = [];
      while (i < lines.length && isNumberedLine(lines[i])) {
        group.push(lines[i]);
        i++;
      }
      elements.push(
        <ol key={`${baseKey}-n${i}`} className="list-decimal pl-6 space-y-1.5 text-base leading-relaxed" style={{ color: "#374151" }}>
          {group.map((line, j) => (
            <li key={j} dangerouslySetInnerHTML={{ __html: htmlBold(line.trimStart().replace(/^\d+\.\s+/, "")) }} />
          ))}
        </ol>
      );
    } else {
      const textLine = lines[i];
      elements.push(
        <p key={`${baseKey}-p${i}`} className="text-base leading-relaxed" style={{ color: "#374151" }}
          dangerouslySetInnerHTML={{ __html: htmlBold(textLine) }}
        />
      );
      i++;
    }
  }
  return elements;
}

function renderParagraph(para: string, index: number): ReactNode | null {
  const lines = para.split("\n").filter((l) => l.trim().length > 0);
  if (lines.length === 0) return null;

  const allBullet = lines.every(isBulletLine);
  const allNumbered = lines.every(isNumberedLine);

  if (allBullet) {
    return (
      <ul key={index} className="list-disc pl-6 space-y-1.5 text-base leading-relaxed" style={{ color: "#374151" }}>
        {lines.map((line, j) => (
          <li key={j} dangerouslySetInnerHTML={{ __html: htmlBold(line.trimStart().replace(/^-\s+/, "")) }} />
        ))}
      </ul>
    );
  }

  if (allNumbered) {
    return (
      <ol key={index} className="list-decimal pl-6 space-y-1.5 text-base leading-relaxed" style={{ color: "#374151" }}>
        {lines.map((line, j) => (
          <li key={j} dangerouslySetInnerHTML={{ __html: htmlBold(line.trimStart().replace(/^\d+\.\s+/, "")) }} />
        ))}
      </ol>
    );
  }

  const hasMixedLists = lines.some((l) => isBulletLine(l) || isNumberedLine(l));
  if (hasMixedLists) {
    const segments = renderSegments(lines, `${index}`);
    return <div key={index} className="space-y-2">{segments}</div>;
  }

  return (
    <p key={index} className="text-base leading-relaxed" style={{ color: "#374151" }}
      dangerouslySetInnerHTML={{ __html: htmlBold(para) }}
    />
  );
}

export function renderBody(body: string): ReactNode[] {
  return body
    .split("\n\n")
    .map((para, i) => renderParagraph(para, i))
    .filter((el): el is ReactNode => el !== null);
}
