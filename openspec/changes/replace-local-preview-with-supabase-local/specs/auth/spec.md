## REMOVED Requirements

### Requirement: ローカルプレビューでのログイン
**Reason**: ローカルプレビューモードを削除するため。手元で確かめるときも Supabase Local につないで Supabase接続モードで動かし、本番と同じ Google ログインを使う。
**Migration**: 手元では Supabase Local の Google ログインを設定し、Google アカウントでログインする。メールアドレスの入力だけでログインする方法はなくなる。
