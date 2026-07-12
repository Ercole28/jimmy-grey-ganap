import { Fragment } from "react";
import type { InsightSegment } from "../lib/types";

interface NoteBoxProps {
  title: string;
  body: InsightSegment[];
}

export function NoteBox({ title, body }: NoteBoxProps) {
  return (
    <div className="nb">
      <p className="nb-t">{title}</p>
      <p className="nb-b">
        {body.map((seg, i) => {
          if (seg.emphasis === "b") return <b key={i}>{seg.text}</b>;
          if (seg.emphasis === "i") return <i key={i}>{seg.text}</i>;
          return <Fragment key={i}>{seg.text}</Fragment>;
        })}
      </p>
    </div>
  );
}
