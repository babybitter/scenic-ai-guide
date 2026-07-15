import { LanguageEnum } from '@/enums/appEnum'

type OverrideTuple = readonly [
  ko: string | string[],
  zhTw: string | string[],
  ja: string | string[]
]

const catalog = {
  'topBar.search.title': ['검색', '搜尋', '検索'],
  'topBar.user.userCenter': ['개인 센터', '個人中心', '個人センター'],
  'topBar.user.docs': ['사용 문서', '使用文件', '利用ガイド'],
  'topBar.user.github': ['GitHub', 'GitHub', 'GitHub'],
  'topBar.user.lockScreen': ['화면 잠금', '鎖定螢幕', '画面をロック'],
  'topBar.user.logout': ['로그아웃', '登出', 'ログアウト'],
  'topBar.guide.title': ['여기에서', '點擊這裡查看', 'ここで'],
  'topBar.guide.theme': ['테마 스타일', '主題風格', 'テーマスタイル'],
  'topBar.guide.menu': ['상단 메뉴', '開啟頂欄選單', 'トップメニュー'],
  'topBar.guide.description': ['등의 설정을 확인하세요', '等更多設定', 'などを設定できます'],
  'common.tips': ['알림', '提示', 'お知らせ'],
  'common.cancel': ['취소', '取消', 'キャンセル'],
  'common.confirm': ['확인', '確定', '確認'],
  'common.logOutTips': ['로그아웃하시겠습니까?', '確定要登出嗎？', 'ログアウトしますか？'],
  'search.placeholder': ['페이지 검색', '搜尋頁面', 'ページを検索'],
  'search.historyTitle': ['검색 기록', '搜尋紀錄', '検索履歴'],
  'search.switchKeydown': ['전환', '切換', '切替'],
  'search.selectKeydown': ['선택', '選擇', '選択'],
  'search.exitKeydown': ['닫기', '關閉', '閉じる'],
  'setting.menuType.title': ['메뉴 레이아웃', '選單版面配置', 'メニューレイアウト'],
  'setting.menuType.list': [
    ['세로', '가로', '혼합', '이중 열'],
    ['垂直', '水平', '混合', '雙欄'],
    ['縦', '横', '混合', '2列']
  ],
  'setting.theme.title': ['테마 스타일', '主題風格', 'テーマスタイル'],
  'setting.theme.list': [
    ['라이트', '다크', '시스템'],
    ['淺色', '深色', '系統'],
    ['ライト', 'ダーク', 'システム']
  ],
  'setting.menu.title': ['메뉴 스타일', '選單風格', 'メニュースタイル'],
  'setting.color.title': ['시스템 테마 색상', '系統主題色', 'システムテーマ色'],
  'setting.box.title': ['박스 스타일', '盒子樣式', 'ボックススタイル'],
  'setting.box.list': [
    ['테두리', '그림자'],
    ['邊框', '陰影'],
    ['枠線', '影']
  ],
  'setting.container.title': ['컨테이너 너비', '容器寬度', 'コンテナ幅'],
  'setting.container.list': [
    ['전체 너비', '고정 너비'],
    ['鋪滿', '固定寬度'],
    ['全幅', '固定幅']
  ],
  'setting.basics.title': ['기본 설정', '基礎設定', '基本設定'],
  'setting.basics.list.multiTab': ['다중 탭 표시', '顯示多分頁標籤', 'マルチタブを表示'],
  'setting.basics.list.accordion': [
    '사이드바 아코디언',
    '側邊欄手風琴模式',
    'サイドバーをアコーディオン表示'
  ],
  'setting.basics.list.collapseSidebar': [
    '사이드바 접기 버튼',
    '顯示收合側邊欄按鈕',
    'サイドバー折りたたみボタン'
  ],
  'setting.basics.list.fastEnter': ['빠른 실행 표시', '顯示快速入口', 'クイックアクセスを表示'],
  'setting.basics.list.reloadPage': [
    '새로고침 버튼 표시',
    '顯示重新載入按鈕',
    '再読み込みボタンを表示'
  ],
  'setting.basics.list.breadcrumb': ['이동 경로 표시', '顯示全域麵包屑導覽', 'パンくずを表示'],
  'setting.basics.list.language': ['언어 선택 표시', '顯示多語言選擇', '言語選択を表示'],
  'setting.basics.list.progressBar': ['상단 진행 표시줄', '顯示頂部進度條', '上部プログレスバー'],
  'setting.basics.list.weakMode': ['색각 보정 모드', '色弱模式', '色覚補助モード'],
  'setting.basics.list.watermark': ['전역 워터마크', '全域浮水印', 'グローバル透かし'],
  'setting.basics.list.menuWidth': ['메뉴 너비', '選單寬度', 'メニュー幅'],
  'setting.basics.list.tabStyle': ['탭 스타일', '分頁標籤風格', 'タブスタイル'],
  'setting.basics.list.pageTransition': ['페이지 전환', '頁面切換動畫', 'ページ切替アニメーション'],
  'setting.basics.list.borderRadius': ['모서리 반경', '自訂圓角', '角丸'],
  'setting.tabStyle.default': ['기본', '預設', 'デフォルト'],
  'setting.tabStyle.card': ['카드', '卡片', 'カード'],
  'setting.tabStyle.google': ['Chrome', 'Chrome', 'Chrome'],
  'setting.transition.list.none': ['없음', '無動畫', 'なし'],
  'setting.transition.list.fade': ['페이드', '淡入淡出', 'フェード'],
  'setting.transition.list.slideLeft': ['왼쪽 슬라이드', '左側滑入', '左からスライド'],
  'setting.transition.list.slideBottom': ['아래 슬라이드', '下方滑入', '下からスライド'],
  'setting.transition.list.slideTop': ['위 슬라이드', '上方滑入', '上からスライド'],
  'setting.actions.resetConfig': ['설정 초기화', '重設設定', '設定をリセット'],
  'setting.actions.copyConfig': ['설정 복사', '複製設定', '設定をコピー'],
  'setting.actions.copySuccess': [
    '설정이 클립보드에 복사되었습니다.',
    '設定已複製到剪貼簿。',
    '設定をクリップボードにコピーしました。'
  ],
  'setting.actions.copyFailed': [
    '복사에 실패했습니다.',
    '複製失敗，請重試。',
    'コピーに失敗しました。'
  ],
  'setting.actions.resetFailed': [
    '초기화에 실패했습니다.',
    '重設失敗，請重試。',
    'リセットに失敗しました。'
  ],
  'notice.title': ['알림', '通知', '通知'],
  'notice.btnRead': ['읽음으로 표시', '標示為已讀', '既読にする'],
  'notice.bar': [
    ['알림', '메시지', '할 일'],
    ['通知', '訊息', '待辦'],
    ['通知', 'メッセージ', 'ToDo']
  ],
  'notice.text': [['없음'], ['暫無'], ['なし']],
  'notice.viewAll': ['모두 보기', '檢視全部', 'すべて表示'],
  'worktab.btn.refresh': ['새로고침', '重新整理', '更新'],
  'worktab.btn.fixed': ['고정', '固定', '固定'],
  'worktab.btn.unfixed': ['고정 해제', '取消固定', '固定解除'],
  'worktab.btn.closeLeft': ['왼쪽 닫기', '關閉左側', '左を閉じる'],
  'worktab.btn.closeRight': ['오른쪽 닫기', '關閉右側', '右を閉じる'],
  'worktab.btn.closeOther': ['나머지 닫기', '關閉其他', '他を閉じる'],
  'worktab.btn.closeAll': ['모두 닫기', '全部關閉', 'すべて閉じる'],
  'login.leftView.title': [
    '링산 AI 디지털 휴먼 가이드',
    '靈山勝境 AI 數位人導覽',
    '霊山 AI デジタルヒューマンガイド'
  ],
  'login.leftView.subTitle': [
    '명소 해설, 경로 계획, 즉시 답변을 제공하는 AI 동반자',
    'AI 數位人為您講解景點、規劃路線、即時答疑',
    'スポット解説、ルート計画、質問対応を行う AI パートナー'
  ],
  'login.title': ['다시 오신 것을 환영합니다', '歡迎回來', 'おかえりなさい'],
  'login.subTitle': [
    '계정과 비밀번호를 입력하세요',
    '請輸入帳號和密碼',
    'アカウントとパスワードを入力してください'
  ],
  'login.roles.super': ['최고 관리자', '超級管理員', 'スーパー管理者'],
  'login.roles.admin': ['관리자', '管理員', '管理者'],
  'login.roles.user': ['사용자', '一般使用者', 'ユーザー'],
  'login.placeholder.username': ['계정을 입력하세요', '請輸入帳號', 'アカウントを入力'],
  'login.placeholder.password': ['비밀번호를 입력하세요', '請輸入密碼', 'パスワードを入力'],
  'login.placeholder.slider': ['슬라이드하여 인증하세요', '請拖動滑桿完成驗證', 'スライドして認証'],
  'login.sliderText': ['슬라이더를 드래그하세요', '按住滑桿拖動', 'スライダーをドラッグ'],
  'login.sliderSuccessText': ['인증 성공', '驗證成功', '認証成功'],
  'login.rememberPwd': ['비밀번호 기억', '記住密碼', 'パスワードを保存'],
  'login.forgetPwd': ['비밀번호 찾기', '忘記密碼', 'パスワードを忘れた'],
  'login.btnText': ['로그인', '登入', 'ログイン'],
  'login.noAccount': ['계정이 없으신가요?', '還沒有帳號？', 'アカウントをお持ちでないですか？'],
  'login.register': ['회원가입', '註冊', '登録'],
  'login.success.title': ['로그인 성공', '登入成功', 'ログイン成功'],
  'login.success.message': ['환영합니다', '歡迎回來', 'おかえりなさい'],
  'greeting.dawn': ['좋은 새벽입니다!', '凌晨好！', 'おはようございます！'],
  'greeting.morning': ['좋은 아침입니다!', '早安！', 'おはようございます！'],
  'greeting.afternoon': ['좋은 오후입니다!', '午安！', 'こんにちは！'],
  'greeting.evening': ['좋은 저녁입니다!', '晚安！', 'こんばんは！'],
  'exceptionPage.gohome': ['홈으로', '返回首頁', 'ホームへ'],
  'exceptionPage.403': [
    '이 페이지에 접근할 권한이 없습니다.',
    '抱歉，您無權存取此頁面。',
    'このページにアクセスする権限がありません。'
  ],
  'exceptionPage.404': [
    '페이지를 찾을 수 없습니다.',
    '抱歉，找不到此頁面。',
    'ページが見つかりません。'
  ],
  'exceptionPage.500': [
    '서버 오류가 발생했습니다.',
    '抱歉，伺服器發生錯誤。',
    'サーバーエラーが発生しました。'
  ],
  'table.form.reset': ['초기화', '重設', 'リセット'],
  'table.form.submit': ['제출', '送出', '送信'],
  'table.searchBar.reset': ['초기화', '重設', 'リセット'],
  'table.searchBar.search': ['검색', '查詢', '検索'],
  'table.searchBar.expand': ['펼치기', '展開', '展開'],
  'table.searchBar.collapse': ['접기', '收合', '折りたたむ'],
  'table.searchBar.searchInputPlaceholder': ['입력하세요', '請輸入', '入力してください'],
  'table.searchBar.searchSelectPlaceholder': ['선택하세요', '請選擇', '選択してください']
} satisfies Record<string, OverrideTuple>

function setNested(target: Record<string, unknown>, path: string, value: unknown) {
  const parts = path.split('.')
  let cursor = target
  parts.forEach((part, index) => {
    if (index === parts.length - 1) {
      cursor[part] = value
      return
    }
    cursor[part] ||= {}
    cursor = cursor[part] as Record<string, unknown>
  })
}

const languages = [LanguageEnum.KO, LanguageEnum.ZH_TW, LanguageEnum.JA] as const

export const frameworkMessages = Object.fromEntries(
  languages.map((language, languageIndex) => {
    const messages: Record<string, unknown> = {}
    Object.entries(catalog).forEach(([path, translations]) => {
      setNested(messages, path, translations[languageIndex])
    })
    return [language, messages]
  })
) as Record<(typeof languages)[number], Record<string, unknown>>
