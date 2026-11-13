import { CloudOff, RotateCw } from 'lucide-react'
import { useApp } from '../contexts/app-context'
import { Button } from './Button'
import { EmptyState } from './EmptyState'

// Shown when the user's recipe notes could not be loaded, so a failure is not
// mistaken for having none (which would lead to the setup page).
export function GroupLoadError() {
  const { refreshGroup } = useApp()
  return (
    <div className="mx-auto w-full max-w-120 px-4 py-10">
      <div role="alert">
        <EmptyState
          icon={<CloudOff size={24} />}
          title={<><span className="inline-block">レシピノートを</span><span className="inline-block">読み込めませんでした</span></>}
          description="通信の状態を確かめて、もう一度読み込んでください。"
        >
          <Button variant="primary" onClick={() => void refreshGroup()}>
            <RotateCw size={16} />
            もう一度読み込む
          </Button>
        </EmptyState>
      </div>
    </div>
  )
}
