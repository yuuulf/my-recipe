import { ArrowRight, Database } from 'lucide-react'
import { Link } from 'react-router-dom'
import { BrandLockup } from '../components/BrandLockup'
import { useApp } from '../contexts/app-context'

const stepClassName = 'flex gap-2.75 text-14 leading-[1.7] text-text-secondary'
const stepNumberClassName = 'mt-0.5 grid size-6 flex-none place-items-center rounded-full bg-primary-soft text-12 font-bold text-primary'
const codeClassName = 'rounded-sm bg-surface-muted px-1.5 py-0.5 font-mono text-13 text-text'

// Shown for every URL when the Supabase connection settings are missing and the
// demo is not active. Production always has the settings, so only developers see it.
export function SupabaseSetupPage() {
  const { enterDemo } = useApp()

  return (
    <div className="relative grid min-h-screen place-items-center overflow-hidden bg-primary-soft px-4 pt-24 pb-12.5 sm:px-5">
      <BrandLockup className="absolute top-5.5 left-5 sm:top-7.5 sm:left-9" />
      <main className="relative z-1 w-[min(520px,100%)] rounded-lg border border-border bg-white/96 px-5.5 py-7.5 shadow-md sm:p-10.5">
        <div className="mb-5.75 grid size-12.25 place-items-center rounded-md bg-primary-soft text-primary"><Database size={25} /></div>
        <h1 className="mb-2.5 text-24 font-bold tracking-[-.04em] text-text sm:text-28">接続設定がありません</h1>
        <p className="text-14 leading-[1.8] text-text-secondary">Supabaseの接続先が設定されていないため、ログインとレシピの画面は使えません。手元で確認するときは、次の手順でSupabase Localを用意してください。</p>

        <ol className="mt-6 grid gap-3.5">
          <li className={stepClassName}><span className={stepNumberClassName}>1</span><span><code className={codeClassName}>npm run db:start</code> でSupabase Localを起動する</span></li>
          <li className={stepClassName}><span className={stepNumberClassName}>2</span><span><code className={codeClassName}>npm run db:status</code> に表示される <code className={codeClassName}>API_URL</code> と <code className={codeClassName}>PUBLISHABLE_KEY</code> を、<code className={codeClassName}>.env.local</code> の <code className={codeClassName}>VITE_SUPABASE_URL</code> と <code className={codeClassName}>VITE_SUPABASE_PUBLISHABLE_KEY</code> に書く</span></li>
          <li className={stepClassName}><span className={stepNumberClassName}>3</span><span>開発サーバーを起動し直す</span></li>
        </ol>
        <p className="mt-4.5 text-13 leading-[1.7] text-text-muted">Googleログインの設定など、詳しい手順はREADMEを参照してください。</p>

        <div className="mt-7.5 border-t border-border pt-5.5 text-center">
          <Link
            to="/recipes?demo=1"
            className="inline-flex items-center justify-center gap-1.25 text-13 font-bold text-primary"
            onClick={() => enterDemo()}
          >
            デモのレシピを見る <ArrowRight size={15} />
          </Link>
        </div>
      </main>
    </div>
  )
}
