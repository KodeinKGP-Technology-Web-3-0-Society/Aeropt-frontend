/** Paper nav backdrop — light-first, no glass distortion. */
export default function NavLiquidGlass() {
  return (
    <div
      aria-hidden="true"
      className="app-nav-shell pointer-events-none absolute inset-0 rounded-full"
    />
  );
}
