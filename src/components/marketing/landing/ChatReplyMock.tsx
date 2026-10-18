/* eslint-disable @next/next/no-img-element */
import katex from "katex";

function TeX({ children, display = false }: { children: string; display?: boolean }) {
  const html = katex.renderToString(children, { throwOnError: false, displayMode: display });
  return <span dangerouslySetInnerHTML={{ __html: html }} />;
}

/** A doubt answered in the study room: question, the tutor's visible steps, then the reply. */
export default function ChatReplyMock() {
  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-surface shadow-[0_24px_60px_-28px_oklch(22%_0.03_250/0.28)]">
      <div className="flex items-center justify-between border-b border-line px-5 py-3">
        <p className="text-sm font-semibold text-ink">Ask a doubt</p>
        <p className="text-xs text-muted">Physics · Kinematics</p>
      </div>

      <div className="space-y-4 p-5">
        <div data-chat="ask" className="flex justify-end">
          <p className="max-w-[85%] rounded-2xl rounded-br-md bg-ink px-4 py-2.5 text-sm leading-relaxed text-ink-on">
            Why does the horizontal speed of a projectile stay the same the whole way?
          </p>
        </div>

        <ul data-chat="steps" className="space-y-1.5 text-[13px] text-ink-2">
          <li className="flex items-center gap-2">
            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-success/15 text-[10px] font-bold text-success">✓</span>
            Read your NCERT chapter on motion in a plane
          </li>
          <li className="flex items-center gap-2">
            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-success/15 text-[10px] font-bold text-success">✓</span>
            Checked the answer before showing it
          </li>
        </ul>

        <div data-chat="reply" className="space-y-3 text-sm leading-relaxed text-ink-2">
          <p>
            Once the ball leaves your hand, the only force on it is gravity, and gravity points straight down.
            Nothing acts sideways, so nothing changes the sideways speed.
          </p>
          <div className="rounded-xl border border-line bg-canvas px-4 py-3 text-ink">
            <TeX display>{"v_x = u\\cos\\theta \\qquad v_y = u\\sin\\theta - g t"}</TeX>
          </div>
          <img
            src="/landing/projectile.svg"
            alt="Projectile path launched at an angle, with its horizontal and vertical velocity components drawn."
            className="landing-art mx-auto h-36 w-auto"
          />
          <p>
            <TeX>{"v_x"}</TeX> has no <TeX>{"t"}</TeX> in it, so it stays fixed. Only <TeX>{"v_y"}</TeX> changes, which is why the path curves.
          </p>
        </div>
      </div>
    </div>
  );
}
