import Calculator from "../components/calculator/Calculator";

export default function Home() {
  return (
    <>
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <a className="flex min-h-11 items-center gap-2 text-xl font-bold tracking-tight" href="#utama">
            <span aria-hidden="true" className="grid size-9 place-items-center rounded-lg bg-primary-hover text-white">C</span>CuanTepat
          </a><span className="hint">Ruang usaha / Kalkulator</span>
        </div>
      </header>
      <main id="utama" className="mx-auto max-w-6xl px-4 pb-24 sm:px-6 md:pb-12">
        <div className="py-6 sm:py-8"><p className="eyebrow">Alat usaha kuliner</p>
          <h1 className="my-1 text-3xl font-bold tracking-tight sm:text-4xl">Kalkulator HPP</h1>
          <p className="text-muted">Masukkan biaya resep untuk melihat modal, harga jual, dan laba tiap porsi.</p>
        </div><Calculator />
      </main>
    </>
  );
}
