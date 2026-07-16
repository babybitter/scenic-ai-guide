import { LanguageEnum } from '@/enums/appEnum'

type TranslationTuple = readonly [zh: string, en: string, ko: string, zhTw: string, ja: string]

const languageOrder = [
  LanguageEnum.ZH,
  LanguageEnum.EN,
  LanguageEnum.KO,
  LanguageEnum.ZH_TW,
  LanguageEnum.JA
] as const

/**
 * Scenic AI Guide business copy. Keeping the five translations beside each
 * other makes missing global translations visible during review and avoids
 * business pages silently falling back to framework copy.
 */
const catalog = {
  navGuide: ['游客导览', 'Visitor Guide', '관람객 가이드', '遊客導覽', '来場者ガイド'],
  navGuideExperience: [
    'AI 数字人导览',
    'AI Digital Human Guide',
    'AI 디지털 휴먼 가이드',
    'AI 數位人導覽',
    'AI デジタルヒューマンガイド'
  ],
  navKnowledge: ['知识库管理', 'Knowledge Base', '지식 베이스', '知識庫管理', 'ナレッジベース'],
  navDocuments: ['知识文档', 'Documents', '지식 문서', '知識文件', 'ナレッジ文書'],
  navSpots: ['景点管理', 'Attractions', '관광지 관리', '景點管理', '観光スポット'],
  navFaq: ['常见问答', 'FAQ', '자주 묻는 질문', '常見問答', 'よくある質問'],
  navSearchTest: ['检索测试', 'Search Test', '검색 테스트', '檢索測試', '検索テスト'],
  navDigitalHuman: [
    '数字人配置',
    'Digital Humans',
    '디지털 휴먼 설정',
    '數位人設定',
    'デジタルヒューマン設定'
  ],
  navAppearanceVoice: [
    '形象与音色',
    'Avatar & Voice',
    '아바타 및 음색',
    '形象與音色',
    'アバターと音声'
  ],
  navAnalytics: ['运营分析', 'Analytics', '운영 분석', '營運分析', '運用分析'],
  navDashboard: ['数据大屏', 'Dashboard', '데이터 대시보드', '數據大屏', 'データダッシュボード'],
  navSystem: ['系统管理', 'System', '시스템 관리', '系統管理', 'システム管理'],
  navUsers: ['用户管理', 'Users', '사용자 관리', '使用者管理', 'ユーザー管理'],
  navOperation: [
    '会话与反馈',
    'Conversations & Feedback',
    '대화 및 피드백',
    '對話與回饋',
    '会話とフィードバック'
  ],
  navConversations: ['会话记录', 'Conversations', '대화 기록', '對話記錄', '会話履歴'],
  navFeedback: ['反馈分析', 'Feedback Analysis', '피드백 분석', '回饋分析', 'フィードバック分析'],
  navServiceQuality: [
    '服务质量报告',
    'Service Quality',
    '서비스 품질 보고서',
    '服務品質報告',
    'サービス品質レポート'
  ],

  refresh: ['刷新', 'Refresh', '새로고침', '重新整理', '更新'],
  cancel: ['取消', 'Cancel', '취소', '取消', 'キャンセル'],
  save: ['保存', 'Save', '저장', '儲存', '保存'],
  edit: ['编辑', 'Edit', '편집', '編輯', '編集'],
  enabled: ['启用', 'Enabled', '사용', '啟用', '有効'],
  actions: ['操作', 'Actions', '작업', '操作', '操作'],
  name: ['名称', 'Name', '이름', '名稱', '名称'],
  status: ['状态', 'Status', '상태', '狀態', 'ステータス'],
  noData: ['暂无数据', 'No data', '데이터 없음', '暫無資料', 'データがありません'],
  fileName: ['文件名', 'File name', '파일명', '檔案名稱', 'ファイル名'],
  type: ['类型', 'Type', '유형', '類型', '種類'],
  size: ['大小', 'Size', '크기', '大小', 'サイズ'],
  createdAt: ['创建时间', 'Created at', '생성 시간', '建立時間', '作成日時'],
  uploadTime: ['上传时间', 'Uploaded at', '업로드 시간', '上傳時間', 'アップロード日時'],

  docsCount: ['文档数', 'Documents', '문서 수', '文件數', '文書数'],
  docsSpotCount: ['景点数', 'Attractions', '관광지 수', '景點數', 'スポット数'],
  docsSections: ['讲解章节', 'Narration sections', '해설 섹션', '講解章節', '解説セクション'],
  docsChunks: ['知识切片', 'Knowledge chunks', '지식 청크', '知識切片', 'ナレッジチャンク'],
  docsScope: ['知识范围', 'Knowledge scope', '지식 범위', '知識範圍', 'ナレッジ範囲'],
  docsUpload: ['上传文档', 'Upload document', '문서 업로드', '上傳文件', '文書をアップロード'],
  docsSupported: [
    '支持 .docx / .xlsx / .txt / .md / .pdf',
    'Supports .docx / .xlsx / .txt / .md / .pdf',
    '.docx / .xlsx / .txt / .md / .pdf 지원',
    '支援 .docx / .xlsx / .txt / .md / .pdf',
    '.docx / .xlsx / .txt / .md / .pdf に対応'
  ],
  docsRebuild: [
    '重建知识库',
    'Rebuild knowledge base',
    '지식 베이스 재구축',
    '重建知識庫',
    'ナレッジベースを再構築'
  ],
  docsChunkCount: ['切片数', 'Chunks', '청크 수', '切片數', 'チャンク数'],
  docsEmpty: [
    '暂无上传文档',
    'No uploaded documents',
    '업로드된 문서 없음',
    '暫無上傳文件',
    'アップロード済み文書はありません'
  ],
  docsSummaryFailed: [
    '知识库概览加载失败',
    'Failed to load the knowledge summary.',
    '지식 베이스 요약을 불러오지 못했습니다.',
    '知識庫概覽載入失敗',
    'ナレッジ概要の読み込みに失敗しました。'
  ],
  docsListFailed: [
    '文档列表加载失败',
    'Failed to load the document list.',
    '문서 목록을 불러오지 못했습니다.',
    '文件列表載入失敗',
    '文書一覧の読み込みに失敗しました。'
  ],
  docsRebuildConfirm: [
    '确定要重建知识库吗？该操作会重新解析全部文档。',
    'Rebuild the knowledge base? All documents will be parsed again.',
    '지식 베이스를 재구축하시겠습니까? 모든 문서를 다시 분석합니다.',
    '確定要重建知識庫嗎？此操作會重新解析全部文件。',
    'ナレッジベースを再構築しますか？すべての文書を再解析します。'
  ],
  docsConfirmRebuild: ['确定重建', 'Rebuild', '재구축', '確定重建', '再構築'],
  docsRebuildDone: [
    '知识库重建已完成',
    'Knowledge base rebuilt.',
    '지식 베이스 재구축이 완료되었습니다.',
    '知識庫重建已完成',
    'ナレッジベースを再構築しました。'
  ],
  docsRebuildFailed: [
    '知识库重建失败',
    'Failed to rebuild the knowledge base.',
    '지식 베이스 재구축에 실패했습니다.',
    '知識庫重建失敗',
    'ナレッジベースの再構築に失敗しました。'
  ],
  docsUploadDone: [
    '文档上传成功',
    'Document uploaded.',
    '문서가 업로드되었습니다.',
    '文件上傳成功',
    '文書をアップロードしました。'
  ],
  docsUploadFailed: [
    '文档上传失败',
    'Document upload failed.',
    '문서 업로드에 실패했습니다.',
    '文件上傳失敗',
    '文書のアップロードに失敗しました。'
  ],

  spotsTitle: ['景点管理', 'Attractions', '관광지 관리', '景點管理', '観光スポット'],
  spotsAdd: ['新增景点', 'Add attraction', '관광지 추가', '新增景點', 'スポットを追加'],
  spotsArea: ['所属景区', 'Scenic area', '소속 관광지', '所屬景區', '所属エリア'],
  spotsAliases: ['别名', 'Aliases', '별칭', '別名', '別名'],
  spotsOpenInfo: ['开放信息', 'Opening information', '운영 정보', '開放資訊', '営業情報'],
  spotsDisableConfirm: [
    '确定停用该景点吗？',
    'Disable this attraction?',
    '이 관광지를 비활성화하시겠습니까?',
    '確定停用此景點嗎？',
    'このスポットを無効にしますか？'
  ],
  disable: ['停用', 'Disable', '비활성화', '停用', '無効化'],
  spotsEmpty: [
    '暂无景点数据',
    'No attraction data',
    '관광지 데이터 없음',
    '暫無景點資料',
    'スポットデータがありません'
  ],
  spotsEdit: ['编辑景点', 'Edit attraction', '관광지 편집', '編輯景點', 'スポットを編集'],
  spotsNamePlaceholder: [
    '请输入景点名称',
    'Enter the attraction name',
    '관광지 이름을 입력하세요',
    '請輸入景點名稱',
    'スポット名を入力してください'
  ],
  spotsAreaPlaceholder: [
    '请输入所属景区',
    'Enter the scenic area',
    '소속 관광지를 입력하세요',
    '請輸入所屬景區',
    '所属エリアを入力してください'
  ],
  spotsAliasesPlaceholder: [
    '多个别名以逗号分隔',
    'Separate aliases with commas',
    '여러 별칭은 쉼표로 구분하세요',
    '多個別名以逗號分隔',
    '複数の別名はカンマで区切ってください'
  ],
  spotsLocation: ['位置说明', 'Location', '위치 설명', '位置說明', '場所'],
  spotsLocationPlaceholder: [
    '请输入位置说明',
    'Enter the location description',
    '위치 설명을 입력하세요',
    '請輸入位置說明',
    '場所の説明を入力してください'
  ],
  spotsParameters: ['基本参数', 'Basic facts', '기본 정보', '基本參數', '基本情報'],
  spotsParametersPlaceholder: [
    '高度、面积等基本参数',
    'Height, area, and other facts',
    '높이, 면적 등 기본 정보',
    '高度、面積等基本參數',
    '高さ、面積などの基本情報'
  ],
  spotsCore: ['核心功能', 'Core function', '핵심 기능', '核心功能', '主な役割'],
  spotsCorePlaceholder: [
    '请输入核心功能',
    'Enter the core function',
    '핵심 기능을 입력하세요',
    '請輸入核心功能',
    '主な役割を入力してください'
  ],
  spotsCulture: ['文化背景', 'Cultural background', '문화적 배경', '文化背景', '文化的背景'],
  spotsCulturePlaceholder: [
    '请输入文化背景',
    'Enter the cultural background',
    '문화적 배경을 입력하세요',
    '請輸入文化背景',
    '文化的背景を入力してください'
  ],
  spotsDetail: ['详细介绍', 'Detailed introduction', '상세 소개', '詳細介紹', '詳細紹介'],
  spotsDetailPlaceholder: [
    '请输入详细介绍',
    'Enter a detailed introduction',
    '상세 소개를 입력하세요',
    '請輸入詳細介紹',
    '詳細紹介を入力してください'
  ],
  spotsHighlights: ['亮点看点', 'Highlights', '주요 볼거리', '亮點看點', '見どころ'],
  spotsHighlightsPlaceholder: [
    '请输入亮点看点',
    'Enter the highlights',
    '주요 볼거리를 입력하세요',
    '請輸入亮點看點',
    '見どころを入力してください'
  ],
  spotsOpenPlaceholder: [
    '开放时间、票价等',
    'Opening hours, ticket price, etc.',
    '운영 시간, 입장료 등',
    '開放時間、票價等',
    '営業時間、料金など'
  ],
  spotsNotes: ['备注', 'Notes', '비고', '備註', '備考'],
  spotsNotesPlaceholder: [
    '请输入备注',
    'Enter notes',
    '비고를 입력하세요',
    '請輸入備註',
    '備考を入力してください'
  ],
  spotsListFailed: [
    '景点列表加载失败',
    'Failed to load attractions.',
    '관광지 목록을 불러오지 못했습니다.',
    '景點列表載入失敗',
    'スポット一覧の読み込みに失敗しました。'
  ],
  spotsUpdated: [
    '景点更新成功',
    'Attraction updated.',
    '관광지가 업데이트되었습니다.',
    '景點更新成功',
    'スポットを更新しました。'
  ],
  spotsCreated: [
    '景点创建成功',
    'Attraction created.',
    '관광지가 생성되었습니다.',
    '景點建立成功',
    'スポットを作成しました。'
  ],
  spotsUpdateFailed: [
    '景点更新失败',
    'Failed to update the attraction.',
    '관광지 업데이트에 실패했습니다.',
    '景點更新失敗',
    'スポットの更新に失敗しました。'
  ],
  spotsCreateFailed: [
    '景点创建失败',
    'Failed to create the attraction.',
    '관광지 생성에 실패했습니다.',
    '景點建立失敗',
    'スポットの作成に失敗しました。'
  ],
  spotsDisabled: [
    '景点已停用',
    'Attraction disabled.',
    '관광지가 비활성화되었습니다.',
    '景點已停用',
    'スポットを無効にしました。'
  ],
  disableFailed: [
    '停用失败',
    'Disable failed.',
    '비활성화에 실패했습니다.',
    '停用失敗',
    '無効化に失敗しました。'
  ],

  faqTitle: ['FAQ 管理', 'FAQ Management', 'FAQ 관리', 'FAQ 管理', 'FAQ 管理'],
  add: ['新增', 'Add', '추가', '新增', '追加'],
  faqQuestion: ['问题', 'Question', '질문', '問題', '質問'],
  faqAnswer: ['答案', 'Answer', '답변', '答案', '回答'],
  faqKeywords: ['关键词', 'Keywords', '키워드', '關鍵詞', 'キーワード'],
  faqPriority: ['优先级', 'Priority', '우선순위', '優先級', '優先度'],
  faqEmpty: [
    '暂无 FAQ 数据',
    'No FAQ data',
    'FAQ 데이터 없음',
    '暫無 FAQ 資料',
    'FAQ データがありません'
  ],
  faqEdit: ['编辑 FAQ', 'Edit FAQ', 'FAQ 편집', '編輯 FAQ', 'FAQ を編集'],
  faqAdd: ['新增 FAQ', 'Add FAQ', 'FAQ 추가', '新增 FAQ', 'FAQ を追加'],
  faqQuestionPlaceholder: [
    '请输入问题',
    'Enter a question',
    '질문을 입력하세요',
    '請輸入問題',
    '質問を入力してください'
  ],
  faqAnswerPlaceholder: [
    '请输入答案',
    'Enter an answer',
    '답변을 입력하세요',
    '請輸入答案',
    '回答を入力してください'
  ],
  faqKeywordsPlaceholder: [
    '多个关键词以逗号分隔',
    'Separate keywords with commas',
    '여러 키워드는 쉼표로 구분하세요',
    '多個關鍵詞以逗號分隔',
    '複数のキーワードはカンマで区切ってください'
  ],
  faqListFailed: [
    'FAQ 列表加载失败',
    'Failed to load FAQs.',
    'FAQ 목록을 불러오지 못했습니다.',
    'FAQ 列表載入失敗',
    'FAQ 一覧の読み込みに失敗しました。'
  ],
  faqUpdated: [
    'FAQ 更新成功',
    'FAQ updated.',
    'FAQ가 업데이트되었습니다.',
    'FAQ 更新成功',
    'FAQ を更新しました。'
  ],
  faqCreated: [
    'FAQ 创建成功',
    'FAQ created.',
    'FAQ가 생성되었습니다.',
    'FAQ 建立成功',
    'FAQ を作成しました。'
  ],
  faqUpdateFailed: [
    'FAQ 更新失败',
    'Failed to update the FAQ.',
    'FAQ 업데이트에 실패했습니다.',
    'FAQ 更新失敗',
    'FAQ の更新に失敗しました。'
  ],
  faqCreateFailed: [
    'FAQ 创建失败',
    'Failed to create the FAQ.',
    'FAQ 생성에 실패했습니다.',
    'FAQ 建立失敗',
    'FAQ の作成に失敗しました。'
  ],
  statusEnabled: ['已启用', 'Enabled.', '활성화되었습니다.', '已啟用', '有効にしました。'],
  statusDisabled: ['已停用', 'Disabled.', '비활성화되었습니다.', '已停用', '無効にしました。'],
  statusUpdateFailed: [
    '状态更新失败',
    'Failed to update status.',
    '상태 업데이트에 실패했습니다.',
    '狀態更新失敗',
    'ステータスの更新に失敗しました。'
  ],

  searchPreview: [
    '知识检索预览',
    'Knowledge Search Preview',
    '지식 검색 미리보기',
    '知識檢索預覽',
    'ナレッジ検索プレビュー'
  ],
  searchPlaceholder: [
    '输入检索内容，回车检索',
    'Enter a query and press Enter',
    '검색어를 입력하고 Enter를 누르세요',
    '輸入檢索內容，按 Enter 搜尋',
    '検索内容を入力して Enter'
  ],
  searchHybrid: ['混合检索', 'Hybrid search', '하이브리드 검색', '混合檢索', 'ハイブリッド検索'],
  searchKeyword: ['关键词检索', 'Keyword search', '키워드 검색', '關鍵詞檢索', 'キーワード検索'],
  searchAction: ['检索', 'Search', '검색', '檢索', '検索'],
  searchEmpty: [
    '暂无检索结果',
    'No search results',
    '검색 결과 없음',
    '暫無檢索結果',
    '検索結果がありません'
  ],
  unnamedResult: ['未命名结果', 'Untitled result', '이름 없는 결과', '未命名結果', '無題の結果'],
  qaTest: ['问答测试', 'Q&A Test', '질의응답 테스트', '問答測試', '質問応答テスト'],
  qaPlaceholder: [
    '输入问题，回车提问',
    'Enter a question and press Enter',
    '질문을 입력하고 Enter를 누르세요',
    '輸入問題，按 Enter 提問',
    '質問を入力して Enter'
  ],
  ask: ['提问', 'Ask', '질문', '提問', '質問'],
  qaEmpty: ['暂无问答结果', 'No answer yet', '답변 없음', '暫無問答結果', '回答はまだありません'],
  responseMs: [
    '响应 {latency} ms',
    'Response {latency} ms',
    '응답 {latency} ms',
    '回應 {latency} ms',
    '応答 {latency} ms'
  ],
  sourcesLabel: ['来源：', 'Sources:', '출처:', '來源：', '出典：'],
  unknownSource: ['未知来源', 'Unknown source', '알 수 없는 출처', '未知來源', '不明な出典'],
  searchRequired: [
    '请输入检索内容',
    'Enter a search query.',
    '검색어를 입력해 주세요.',
    '請輸入檢索內容',
    '検索内容を入力してください。'
  ],
  searchNoMatch: [
    '未检索到相关内容',
    'No relevant content found.',
    '관련 콘텐츠를 찾지 못했습니다.',
    '未檢索到相關內容',
    '関連する内容が見つかりませんでした。'
  ],
  searchFailed: [
    '检索失败',
    'Search failed.',
    '검색에 실패했습니다.',
    '檢索失敗',
    '検索に失敗しました。'
  ],
  qaRequired: [
    '请输入问题',
    'Enter a question.',
    '질문을 입력해 주세요.',
    '請輸入問題',
    '質問を入力してください。'
  ],
  qaFailed: [
    '问答请求失败',
    'Q&A request failed.',
    '질의응답 요청에 실패했습니다.',
    '問答請求失敗',
    '質問応答リクエストに失敗しました。'
  ],

  usersAdd: ['新增账号', 'Add account', '계정 추가', '新增帳號', 'アカウントを追加'],
  usersLoginName: ['登录名', 'Username', '로그인 이름', '登入名稱', 'ログイン名'],
  usersDisplayName: ['显示名称', 'Display name', '표시 이름', '顯示名稱', '表示名'],
  usersRole: ['角色', 'Role', '역할', '角色', 'ロール'],
  usersAdmin: ['管理员', 'Administrator', '관리자', '管理員', '管理者'],
  usersOperator: ['运营', 'Operator', '운영자', '營運', '運用担当'],
  usersActive: ['正常', 'Active', '정상', '正常', '有効'],
  usersDelete: ['删除', 'Delete', '삭제', '刪除', '削除'],
  usersDeleteConfirm: [
    '确认删除该账号？',
    'Delete this account?',
    '이 계정을 삭제하시겠습니까?',
    '確認刪除此帳號？',
    'このアカウントを削除しますか？'
  ],
  usersEdit: ['编辑账号', 'Edit account', '계정 편집', '編輯帳號', 'アカウントを編集'],
  usersUsernamePlaceholder: [
    '用于登录的用户名',
    'Username used to sign in',
    '로그인에 사용할 사용자 이름',
    '用於登入的使用者名稱',
    'ログインに使用するユーザー名'
  ],
  usersResetPassword: [
    '重置密码',
    'Reset password',
    '비밀번호 재설정',
    '重設密碼',
    'パスワードをリセット'
  ],
  usersPassword: ['密码', 'Password', '비밀번호', '密碼', 'パスワード'],
  usersKeepPassword: [
    '留空则不修改',
    'Leave blank to keep unchanged',
    '변경하지 않으려면 비워 두세요',
    '留空則不修改',
    '変更しない場合は空欄'
  ],
  usersPasswordPlaceholder: [
    '设置登录密码',
    'Set a sign-in password',
    '로그인 비밀번호 설정',
    '設定登入密碼',
    'ログインパスワードを設定'
  ],
  usersListFailed: [
    '用户列表加载失败',
    'Failed to load users.',
    '사용자 목록을 불러오지 못했습니다.',
    '使用者列表載入失敗',
    'ユーザー一覧の読み込みに失敗しました。'
  ],
  usersRequired: [
    '请填写登录名和密码',
    'Enter a username and password.',
    '로그인 이름과 비밀번호를 입력해 주세요.',
    '請填寫登入名稱和密碼',
    'ログイン名とパスワードを入力してください。'
  ],
  usersActionFailed: [
    '操作失败',
    'Action failed.',
    '작업에 실패했습니다.',
    '操作失敗',
    '操作に失敗しました。'
  ],
  usersDeleted: ['已删除', 'Deleted.', '삭제되었습니다.', '已刪除', '削除しました。'],
  usersDeleteFailed: [
    '删除失败',
    'Delete failed.',
    '삭제에 실패했습니다.',
    '刪除失敗',
    '削除に失敗しました。'
  ],

  feedbackTitle: ['反馈分析', 'Feedback Analysis', '피드백 분석', '回饋分析', 'フィードバック分析'],
  feedbackClassCount: [
    '共 {count} 类',
    '{count} categories',
    '총 {count}개 유형',
    '共 {count} 類',
    '全 {count} 種類'
  ],
  feedbackEmpty: [
    '暂无反馈数据',
    'No feedback data',
    '피드백 데이터 없음',
    '暫無回饋資料',
    'フィードバックデータがありません'
  ],
  feedbackItemCount: ['{count} 条', '{count} items', '{count}건', '{count} 筆', '{count} 件'],
  feedbackSamples: [
    '样本反馈',
    'Sample feedback',
    '샘플 피드백',
    '樣本回饋',
    'サンプルフィードバック'
  ],
  feedbackNoSamples: ['暂无样本', 'No samples', '샘플 없음', '暫無樣本', 'サンプルがありません'],
  feedbackRating: [
    '评分 {rating}',
    'Rating {rating}',
    '평점 {rating}',
    '評分 {rating}',
    '評価 {rating}'
  ],
  feedbackNoComment: [
    '（无文字评论）',
    '(No written comment)',
    '(텍스트 의견 없음)',
    '（無文字評論）',
    '（コメントなし）'
  ],
  feedbackUp: ['点赞', 'Like', '좋아요', '按讚', '高評価'],
  feedbackDown: ['点踩', 'Dislike', '싫어요', '倒讚', '低評価'],
  feedbackLoadFailed: [
    '加载反馈聚类失败',
    'Failed to load feedback clusters.',
    '피드백 클러스터를 불러오지 못했습니다.',
    '載入回饋分群失敗',
    'フィードバック分類の読み込みに失敗しました。'
  ],

  qualityTitle: [
    '服务质量报告',
    'Service Quality Report',
    '서비스 품질 보고서',
    '服務品質報告',
    'サービス品質レポート'
  ],
  qualityGeneratedAt: [
    '生成于 {time}',
    'Generated {time}',
    '{time} 생성',
    '產生於 {time}',
    '{time} に生成'
  ],
  qualityRefresh: [
    '刷新报告',
    'Refresh report',
    '보고서 새로고침',
    '重新整理報告',
    'レポートを更新'
  ],
  qualityConversations: ['会话总数', 'Total conversations', '총 대화 수', '對話總數', '会話総数'],
  qualityLowSatisfaction: [
    '低满意度会话',
    'Low-satisfaction conversations',
    '낮은 만족도 대화',
    '低滿意度對話',
    '低満足度の会話'
  ],
  qualityAverage: ['平均满意度', 'Average satisfaction', '평균 만족도', '平均滿意度', '平均満足度'],
  qualityWrongAnswers: ['错误回答数', 'Wrong answers', '오답 수', '錯誤回答數', '誤回答数'],
  qualityIssues: ['常见问题', 'Common issues', '일반적인 문제', '常見問題', 'よくある問題'],
  qualityNoIssues: [
    '暂无常见问题',
    'No common issues',
    '일반적인 문제 없음',
    '暫無常見問題',
    'よくある問題はありません'
  ],
  qualityOccurrences: [
    '{count} 次',
    '{count} occurrences',
    '{count}회',
    '{count} 次',
    '{count} 回'
  ],
  qualitySuggestions: ['优化建议', 'Improvement suggestions', '개선 제안', '優化建議', '改善提案'],
  qualityNoSuggestions: [
    '暂无优化建议',
    'No suggestions',
    '개선 제안 없음',
    '暫無優化建議',
    '改善提案はありません'
  ],
  qualityEmpty: [
    '暂无服务质量报告',
    'No service quality report',
    '서비스 품질 보고서 없음',
    '暫無服務品質報告',
    'サービス品質レポートがありません'
  ],
  qualityLoadFailed: [
    '加载服务质量报告失败',
    'Failed to load the service quality report.',
    '서비스 품질 보고서를 불러오지 못했습니다.',
    '載入服務品質報告失敗',
    'サービス品質レポートの読み込みに失敗しました。'
  ],

  conversationsTitle: ['会话记录', 'Conversations', '대화 기록', '對話記錄', '会話履歴'],
  conversationsCount: [
    '共 {count} 条',
    '{count} conversations',
    '총 {count}건',
    '共 {count} 筆',
    '全 {count} 件'
  ],
  conversationsLowOnly: [
    '只看低满意度',
    'Low satisfaction only',
    '낮은 만족도만 보기',
    '只看低滿意度',
    '低満足度のみ'
  ],
  conversationsId: ['会话 ID', 'Conversation ID', '대화 ID', '對話 ID', '会話 ID'],
  conversationsStart: ['开始时间', 'Started at', '시작 시간', '開始時間', '開始日時'],
  conversationsMessages: ['消息数', 'Messages', '메시지 수', '訊息數', 'メッセージ数'],
  conversationsQuestions: ['提问数', 'Questions', '질문 수', '提問數', '質問数'],
  conversationsAverage: ['平均评分', 'Average rating', '평균 평점', '平均評分', '平均評価'],
  conversationsNone: ['暂无', 'None', '없음', '暫無', 'なし'],
  conversationsFocus: ['关注点', 'Main focus', '주요 관심사', '關注點', '主な関心'],
  conversationsSatisfaction: ['满意度', 'Satisfaction', '만족도', '滿意度', '満足度'],
  conversationsLow: ['低满意度', 'Low', '낮음', '低滿意度', '低い'],
  conversationsNormal: ['正常', 'Normal', '정상', '正常', '通常'],
  conversationsFeedbackCount: ['反馈数', 'Feedback', '피드백 수', '回饋數', 'フィードバック数'],
  conversationsDetail: ['详情', 'Details', '상세', '詳情', '詳細'],
  conversationsDetailTitle: [
    '会话详情',
    'Conversation details',
    '대화 상세',
    '對話詳情',
    '会話詳細'
  ],
  conversationsNoMessages: [
    '暂无消息',
    'No messages',
    '메시지 없음',
    '暫無訊息',
    'メッセージがありません'
  ],
  conversationsIntent: [
    '意图：{label}',
    'Intent: {label}',
    '의도: {label}',
    '意圖：{label}',
    '意図：{label}'
  ],
  conversationsEmotion: [
    '情绪：{label}',
    'Emotion: {label}',
    '감정: {label}',
    '情緒：{label}',
    '感情：{label}'
  ],
  conversationsResponse: [
    '响应 {latency}ms',
    'Response {latency}ms',
    '응답 {latency}ms',
    '回應 {latency}ms',
    '応答 {latency}ms'
  ],
  conversationsMarkCorrect: [
    '标记正确',
    'Mark correct',
    '정답으로 표시',
    '標記正確',
    '正解としてマーク'
  ],
  conversationsMarkWrong: [
    '标记错误',
    'Mark wrong',
    '오답으로 표시',
    '標記錯誤',
    '誤答としてマーク'
  ],
  conversationsNeedsKnowledge: [
    '需补充知识',
    'Needs knowledge',
    '지식 보완 필요',
    '需補充知識',
    'ナレッジ補足が必要'
  ],
  conversationsDraft: [
    '生成知识草稿',
    'Generate knowledge draft',
    '지식 초안 생성',
    '產生知識草稿',
    'ナレッジ下書きを作成'
  ],
  conversationsMarkedCorrect: [
    '已标记正确',
    'Marked correct',
    '정답으로 표시됨',
    '已標記正確',
    '正解としてマーク済み'
  ],
  conversationsMarkedWrong: [
    '已标记错误',
    'Marked wrong',
    '오답으로 표시됨',
    '已標記錯誤',
    '誤答としてマーク済み'
  ],
  conversationsListFailed: [
    '加载会话列表失败',
    'Failed to load conversations.',
    '대화 목록을 불러오지 못했습니다.',
    '載入對話列表失敗',
    '会話一覧の読み込みに失敗しました。'
  ],
  conversationsDetailFailed: [
    '加载会话详情失败',
    'Failed to load conversation details.',
    '대화 상세를 불러오지 못했습니다.',
    '載入對話詳情失敗',
    '会話詳細の読み込みに失敗しました。'
  ],
  conversationsMarked: [
    '标注成功',
    'Annotation saved.',
    '주석이 저장되었습니다.',
    '標註成功',
    '注釈を保存しました。'
  ],
  conversationsMarkFailed: [
    '标注失败',
    'Annotation failed.',
    '주석에 실패했습니다.',
    '標註失敗',
    '注釈に失敗しました。'
  ],
  conversationsDraftTitle: ['标题：', 'Title:', '제목:', '標題：', 'タイトル：'],
  conversationsDraftQuestion: ['问题：', 'Question:', '질문:', '問題：', '質問：'],
  conversationsDraftAnswer: [
    '建议答案：',
    'Suggested answer:',
    '제안 답변:',
    '建議答案：',
    '回答案：'
  ],
  conversationsDraftEmpty: [
    '未生成有效草稿内容',
    'No valid draft content was generated.',
    '유효한 초안이 생성되지 않았습니다.',
    '未產生有效草稿內容',
    '有効な下書き内容が生成されませんでした。'
  ],
  conversationsDraftDialog: [
    '知识草稿',
    'Knowledge draft',
    '지식 초안',
    '知識草稿',
    'ナレッジ下書き'
  ],
  understood: ['知道了', 'Got it', '확인', '知道了', '了解'],
  conversationsDraftFailed: [
    '生成知识草稿失败',
    'Failed to generate a knowledge draft.',
    '지식 초안 생성에 실패했습니다.',
    '產生知識草稿失敗',
    'ナレッジ下書きの作成に失敗しました。'
  ],

  analyticsGender: ['性别', 'Gender', '성별', '性別', '性別'],
  analyticsAll: ['全部', 'All', '전체', '全部', 'すべて'],
  analyticsMale: ['男', 'Male', '남성', '男', '男性'],
  analyticsFemale: ['女', 'Female', '여성', '女', '女性'],
  analyticsAge: ['年龄段', 'Age group', '연령대', '年齡層', '年齢層'],
  analyticsMinSatisfaction: [
    '最低满意度',
    'Minimum satisfaction',
    '최소 만족도',
    '最低滿意度',
    '最低満足度'
  ],
  analyticsThreePlus: ['3 分及以上', '3 or higher', '3점 이상', '3 分以上', '3 以上'],
  analyticsFourPlus: ['4 分及以上', '4 or higher', '4점 이상', '4 分以上', '4 以上'],
  analyticsFive: ['5 分', '5 only', '5점', '5 分', '5'],
  analyticsUpdated: [
    '更新于 {time}',
    'Updated {time}',
    '{time} 업데이트',
    '更新於 {time}',
    '{time} に更新'
  ],
  analyticsRefresh: ['刷新数据', 'Refresh data', '데이터 새로고침', '重新整理資料', 'データを更新'],
  analyticsImport: [
    '重新导入 Excel 数据',
    'Re-import Excel data',
    'Excel 데이터 다시 가져오기',
    '重新匯入 Excel 資料',
    'Excel データを再インポート'
  ],
  analyticsToday: [
    '今日服务人次',
    'Visitors served today',
    '오늘 서비스 이용자',
    '今日服務人次',
    '本日の案内人数'
  ],
  analyticsWeek: [
    '本周服务人次',
    'Visitors served this week',
    '이번 주 서비스 이용자',
    '本週服務人次',
    '今週の案内人数'
  ],
  analyticsQuestions: ['累计问答数', 'Total Q&A', '누적 질의응답', '累計問答數', '累計質問数'],
  analyticsAverageSatisfaction: [
    '平均满意度',
    'Average satisfaction',
    '평균 만족도',
    '平均滿意度',
    '平均満足度'
  ],
  analyticsLatency: [
    '平均响应时长',
    'Average response time',
    '평균 응답 시간',
    '平均回應時間',
    '平均応答時間'
  ],
  analyticsSamples: [
    '行为样本数',
    'Behavior samples',
    '행동 샘플 수',
    '行為樣本數',
    '行動サンプル数'
  ],
  analyticsHotQuestions: [
    '热门问答 Top',
    'Top Questions',
    '인기 질문 Top',
    '熱門問答 Top',
    '人気質問 Top'
  ],
  analyticsSpotFocus: [
    '景点关注热度',
    'Attraction interest',
    '관광지 관심도',
    '景點關注熱度',
    'スポット注目度'
  ],
  analyticsEmotion: ['情感分布', 'Emotion distribution', '감정 분포', '情感分布', '感情分布'],
  analyticsConsumption: [
    '消费结构占比',
    'Spending breakdown',
    '소비 구조 비율',
    '消費結構占比',
    '消費構成'
  ],
  analyticsAgeDistribution: [
    '人群年龄分布',
    'Age distribution',
    '연령 분포',
    '人群年齡分布',
    '年齢分布'
  ],
  analyticsGenderDistribution: [
    '性别分布',
    'Gender distribution',
    '성별 분포',
    '性別分布',
    '性別分布'
  ],
  analyticsSuggestions: [
    '运营建议',
    'Operational suggestions',
    '운영 제안',
    '營運建議',
    '運用提案'
  ],
  analyticsNoSuggestions: [
    '暂无运营建议',
    'No operational suggestions',
    '운영 제안 없음',
    '暫無營運建議',
    '運用提案はありません'
  ],
  analyticsTickets: ['门票', 'Tickets', '입장권', '門票', '入場料'],
  analyticsFood: ['餐饮', 'Food & beverage', '식음료', '餐飲', '飲食'],
  analyticsShopping: ['购物', 'Shopping', '쇼핑', '購物', '買い物'],
  analyticsTransport: ['交通', 'Transport', '교통', '交通', '交通'],
  analyticsEntertainment: ['娱乐', 'Entertainment', '엔터테인먼트', '娛樂', '娯楽'],
  analyticsLoadFailed: [
    '数据大屏加载失败',
    'Failed to load the dashboard.',
    '데이터 대시보드를 불러오지 못했습니다.',
    '數據大屏載入失敗',
    'ダッシュボードの読み込みに失敗しました。'
  ],
  analyticsImportDone: [
    'Excel 数据导入成功',
    'Excel data imported.',
    'Excel 데이터를 가져왔습니다.',
    'Excel 資料匯入成功',
    'Excel データをインポートしました。'
  ],
  analyticsImportFailed: [
    'Excel 数据导入失败',
    'Excel data import failed.',
    'Excel 데이터 가져오기에 실패했습니다.',
    'Excel 資料匯入失敗',
    'Excel データのインポートに失敗しました。'
  ],

  guideTabChat: ['智能问答', 'AI Q&A', 'AI 질의응답', '智慧問答', 'AI 質問応答'],
  guideTabSpots: ['景点讲解', 'Attraction Stories', '관광지 해설', '景點講解', 'スポット解説'],
  guideTabRoutes: ['路线推荐', 'Route Planner', '경로 추천', '路線推薦', 'ルート提案'],
  guideEmptyChat: [
    '向 AI 导游提问吧，例如“灵山大佛多高”',
    'Ask the AI guide, for example “How tall is the Lingshan Grand Buddha?”',
    'AI 가이드에게 질문해 보세요. 예: “링산대불의 높이는 얼마인가요?”',
    '向 AI 導遊提問吧，例如「靈山大佛多高」',
    'AI ガイドに質問してみましょう。例：「霊山大仏の高さは？」'
  ],
  guideResponse: [
    '响应 {latency}ms',
    'Response {latency}ms',
    '응답 {latency}ms',
    '回應 {latency}ms',
    '応答 {latency}ms'
  ],
  guideSources: [
    '来源：{sources}',
    'Sources: {sources}',
    '출처: {sources}',
    '來源：{sources}',
    '出典：{sources}'
  ],
  guideInputPlaceholder: [
    '输入问题，回车发送',
    'Type a question and press Enter',
    '질문을 입력하고 Enter를 누르세요',
    '輸入問題，按 Enter 傳送',
    '質問を入力して Enter で送信'
  ],
  guideSend: ['发送', 'Send', '보내기', '傳送', '送信'],
  guideFeedbackPrompt: [
    '本次讲解满意吗：',
    'Was this explanation helpful?',
    '이번 해설에 만족하시나요?',
    '對本次講解滿意嗎：',
    '今回の解説はいかがでしたか：'
  ],
  guideSatisfied: ['满意', 'Helpful', '만족', '滿意', '満足'],
  guideAverage: ['一般', 'Needs work', '보통', '一般', '普通'],
  guideNarrate: [
    '让数字人讲解 →',
    'Let the guide explain →',
    '디지털 휴먼 해설 듣기 →',
    '讓數位人講解 →',
    'デジタルヒューマンが解説 →'
  ],
  guideDuration: ['游玩时长', 'Visit duration', '관람 시간', '遊玩時長', '滞在時間'],
  guideInterest: ['兴趣', 'Interests', '관심사', '興趣', '興味'],
  guideGenerateRoute: ['生成路线', 'Generate route', '경로 생성', '產生路線', 'ルートを作成'],
  guideDuration30: [
    '30 分钟以内 · 核心打卡',
    'Under 30 min · Highlights',
    '30분 이내 · 핵심 명소',
    '30 分鐘內 · 核心打卡',
    '30分以内・主要スポット'
  ],
  guideDuration60: [
    '约 1 小时 · 速览',
    'About 1 hour · Quick tour',
    '약 1시간 · 빠른 관람',
    '約 1 小時 · 快速瀏覽',
    '約1時間・クイックツアー'
  ],
  guideDuration90: [
    '1-2 小时 · 精选',
    '1–2 hours · Curated',
    '1~2시간 · 엄선 코스',
    '1–2 小時 · 精選',
    '1〜2時間・厳選コース'
  ],
  guideDuration150: [
    '2-3 小时 · 经典',
    '2–3 hours · Classic',
    '2~3시간 · 클래식 코스',
    '2–3 小時 · 經典',
    '2〜3時間・定番コース'
  ],
  guideDuration240: [
    '3-4 小时 · 深度',
    '3–4 hours · In depth',
    '3~4시간 · 심층 관람',
    '3–4 小時 · 深度',
    '3〜4時間・じっくり'
  ],
  guideDuration360: [
    '半日及以上 · 文化深度',
    'Half day+ · Culture',
    '반나절 이상 · 문화 심층',
    '半日以上 · 文化深度',
    '半日以上・文化を深く'
  ],
  guideInterestHistory: ['历史文化', 'History & culture', '역사와 문화', '歷史文化', '歴史・文化'],
  guideInterestBuddhist: ['佛教朝圣', 'Buddhist pilgrimage', '불교 순례', '佛教朝聖', '仏教巡礼'],
  guideInterestFamily: ['亲子友好', 'Family friendly', '가족 친화', '親子友善', 'ファミリー向け'],
  guideInterestPhoto: ['拍照打卡', 'Photo spots', '사진 명소', '拍照打卡', '写真スポット'],
  guideInterestShow: ['演艺体验', 'Performances', '공연 체험', '表演體驗', '演芸体験'],
  guideRouteMinutes: [
    '约 {minutes} 分钟',
    'About {minutes} min',
    '약 {minutes}분',
    '約 {minutes} 分鐘',
    '約 {minutes} 分'
  ],
  guideNarration: ['讲解', 'Explain', '해설', '講解', '解説'],
  guideQuickHeight: [
    '灵山大佛有多高',
    'How tall is the Lingshan Grand Buddha?',
    '링산대불의 높이는 얼마인가요?',
    '靈山大佛有多高',
    '霊山大仏の高さは？'
  ],
  guideQuickBath: [
    '九龙灌浴几点开始',
    'When does the Nine Dragons Bathing show start?',
    '구룡관욕 공연은 몇 시에 시작하나요?',
    '九龍灌浴幾點開始',
    '九龍灌浴は何時に始まりますか？'
  ],
  guideQuickPalace: [
    '灵山梵宫的看点',
    'What are the highlights of the Brahma Palace?',
    '링산 범궁의 볼거리는 무엇인가요?',
    '靈山梵宮的看點',
    '霊山梵宮の見どころは？'
  ],
  guideQuickHours: [
    '景区开放时间',
    'What are the opening hours?',
    '관광지 운영 시간은 어떻게 되나요?',
    '景區開放時間',
    '営業時間は？'
  ],
  guideQuickRoute: [
    '推荐一条经典路线',
    'Recommend a classic route',
    '대표 관람 경로를 추천해 주세요',
    '推薦一條經典路線',
    '定番ルートを提案して'
  ],
  guideConnecting: [
    '数字人接入中…',
    'Connecting digital human…',
    '디지털 휴먼 연결 중…',
    '數位人連線中…',
    'デジタルヒューマンに接続中…'
  ],
  guideReady: [
    '数字人已就绪，请开始提问',
    'The digital human is ready. Ask a question.',
    '디지털 휴먼이 준비되었습니다. 질문해 주세요.',
    '數位人已就緒，請開始提問',
    '準備ができました。質問してください。'
  ],
  guideUnavailable: [
    '数字人不可用，已切换为文本模式',
    'Digital human unavailable; switched to text mode.',
    '디지털 휴먼을 사용할 수 없어 텍스트 모드로 전환했습니다.',
    '數位人無法使用，已切換為文字模式',
    '利用できないためテキストモードに切り替えました。'
  ],
  guideThinking: [
    '正在查询资料并生成讲解…',
    'Searching the knowledge base and preparing an answer…',
    '자료를 검색하고 해설을 생성하는 중…',
    '正在查詢資料並產生講解…',
    '資料を検索して解説を作成中…'
  ],
  guideSpeaking: [
    '数字人正在讲解…',
    'The digital human is speaking…',
    '디지털 휴먼이 해설 중…',
    '數位人正在講解…',
    'デジタルヒューマンが解説中…'
  ],
  guideServiceError: [
    '抱歉，服务暂时不可用，请稍后再试。',
    'Sorry, the service is temporarily unavailable. Please try again later.',
    '죄송합니다. 서비스를 일시적으로 사용할 수 없습니다. 잠시 후 다시 시도해 주세요.',
    '抱歉，服務暫時無法使用，請稍後再試。',
    '申し訳ありません。サービスは一時的に利用できません。しばらくしてからお試しください。'
  ],
  guideRequestFailed: [
    '请求失败，请重试',
    'Request failed. Please try again.',
    '요청에 실패했습니다. 다시 시도해 주세요.',
    '請求失敗，請重試',
    'リクエストに失敗しました。再試行してください。'
  ],
  guideSpotsLoadFailed: [
    '景点列表加载失败',
    'Failed to load attractions.',
    '관광지 목록을 불러오지 못했습니다.',
    '景點列表載入失敗',
    'スポット一覧の読み込みに失敗しました。'
  ],
  guideNarrationPreparing: [
    '正在生成讲解词…',
    'Preparing the narration…',
    '해설을 생성하는 중…',
    '正在產生講解詞…',
    '解説を作成中…'
  ],
  guideSpotNarration: [
    '景点讲解',
    'Attraction narration',
    '관광지 해설',
    '景點講解',
    'スポット解説'
  ],
  guideNarrationFailed: [
    '讲解生成失败',
    'Failed to generate narration.',
    '해설 생성에 실패했습니다.',
    '講解產生失敗',
    '解説の作成に失敗しました。'
  ],
  guideRouteFailed: [
    '路线生成失败',
    'Failed to generate route.',
    '경로 생성에 실패했습니다.',
    '路線產生失敗',
    'ルートの作成に失敗しました。'
  ],
  guideNodeSpeaking: [
    '正在讲解路线节点…',
    'Explaining this route stop…',
    '경로 지점을 해설하는 중…',
    '正在講解路線節點…',
    'ルート地点を解説中…'
  ],
  guideRouteNarration: ['路线讲解', 'Route narration', '경로 해설', '路線講解', 'ルート解説'],
  guideNodeFailed: [
    '节点讲解失败',
    'Failed to explain this stop.',
    '지점 해설에 실패했습니다.',
    '節點講解失敗',
    '地点の解説に失敗しました。'
  ],
  guideThanks: [
    '感谢您的反馈',
    'Thank you for your feedback.',
    '피드백 감사합니다.',
    '感謝您的回饋',
    'フィードバックありがとうございます。'
  ],
  guideThanksSpeech: [
    '感谢您的认可，祝您游览愉快！',
    'Thank you. Enjoy your visit!',
    '감사합니다. 즐거운 관람 되세요!',
    '感謝您的肯定，祝您遊覽愉快！',
    'ありがとうございます。どうぞお楽しみください！'
  ],
  guideSorrySpeech: [
    '抱歉没能帮到您，我会继续改进。',
    'Sorry I could not help. I will keep improving.',
    '도움을 드리지 못해 죄송합니다. 계속 개선하겠습니다.',
    '抱歉沒能幫到您，我會繼續改進。',
    'お役に立てず申し訳ありません。改善を続けます。'
  ],
  guideRatingSubmitted: [
    '评分已提交',
    'Rating submitted.',
    '평점이 제출되었습니다.',
    '評分已送出',
    '評価を送信しました。'
  ],
  guideVoiceFailed: [
    '语音识别失败，请改用文字输入',
    'Voice recognition failed. Please type your question.',
    '음성 인식에 실패했습니다. 텍스트로 입력해 주세요.',
    '語音辨識失敗，請改用文字輸入',
    '音声認識に失敗しました。文字で入力してください。'
  ],

  dhHint: [
    '管理数字人的引擎、形象、音色与服务状态。启用的配置会实时下发到游客导览端。讯飞形象 ID 与音色参数需与账号权限一致；Live2D 使用内置模型作为本地冗余。',
    'Manage digital-human engines, avatars, voices, and service status. The enabled configuration is delivered to the visitor guide immediately. iFlytek avatar and voice IDs must match your account entitlements; Live2D models provide local redundancy.',
    '디지털 휴먼 엔진, 아바타, 음색 및 서비스 상태를 관리합니다. 활성 설정은 관람객 가이드에 즉시 반영됩니다. iFlytek 아바타와 음색 ID는 계정 권한과 일치해야 하며, Live2D 모델은 로컬 예비 수단입니다.',
    '管理數位人的引擎、形象、音色與服務狀態。啟用的設定會即時下發至遊客導覽端。訊飛形象 ID 與音色參數須符合帳號權限；Live2D 內建模型可作為本機備援。',
    'デジタルヒューマンのエンジン、アバター、音声、サービス状態を管理します。有効な設定は来場者ガイドへ即時反映されます。iFlytek のアバター／音声 ID はアカウント権限と一致する必要があり、Live2D はローカル予備として利用できます。'
  ],
  dhCreate: [
    '新增数字人',
    'Add digital human',
    '디지털 휴먼 추가',
    '新增數位人',
    'デジタルヒューマンを追加'
  ],
  dhEdit: [
    '编辑数字人',
    'Edit digital human',
    '디지털 휴먼 편집',
    '編輯數位人',
    'デジタルヒューマンを編集'
  ],
  dhEngine: ['引擎', 'Engine', '엔진', '引擎', 'エンジン'],
  dhEngineLabel: [
    '渲染引擎',
    'Rendering engine',
    '렌더링 엔진',
    '渲染引擎',
    'レンダリングエンジン'
  ],
  dhXfyun: ['讯飞云端', 'iFlytek Cloud', 'iFlytek 클라우드', '訊飛雲端', 'iFlytek クラウド'],
  dhLive2d: ['Live2D 本地', 'Local Live2D', '로컬 Live2D', 'Live2D 本機', 'ローカル Live2D'],
  dhAppearanceModel: [
    '形象 / 模型',
    'Avatar / Model',
    '아바타 / 모델',
    '形象 / 模型',
    'アバター / モデル'
  ],
  dhVoice: ['音色 (vcn)', 'Voice (vcn)', '음색 (vcn)', '音色 (vcn)', '音声 (vcn)'],
  dhServiceStatus: ['服务状态', 'Service status', '서비스 상태', '服務狀態', 'サービス状態'],
  dhCurrent: ['当前启用', 'Active', '현재 활성', '目前啟用', '現在有効'],
  dhSetActive: ['设为启用', 'Set active', '활성화', '設為啟用', '有効にする'],
  dhPreview: ['试听', 'Preview', '미리 듣기', '試聽', '試聴'],
  dhNamePlaceholder: [
    '如：云觉·大佛文化使（女）',
    'e.g. Yunjue · Grand Buddha Storyteller (Female)',
    '예: 윈줴 · 대불 문화 해설사 (여)',
    '例如：雲覺·大佛文化使（女）',
    '例：雲覚・大仏文化ナビゲーター（女性）'
  ],
  dhLive2dHint: [
    '本地 Live2D 画布渲染，声音由后端 TTS 合成，无需云端形象凭证；与讯飞互为冗余。',
    'Local Live2D canvas with backend TTS; no cloud avatar credentials are required. It provides redundancy for iFlytek.',
    '로컬 Live2D 캔버스와 백엔드 TTS를 사용하며 클라우드 아바타 인증 정보가 필요하지 않습니다. iFlytek의 예비 수단입니다.',
    '本機 Live2D 畫布搭配後端 TTS，無需雲端形象憑證；可與訊飛互為備援。',
    'ローカル Live2D とバックエンド TTS を使用し、クラウドアバター認証は不要です。iFlytek の予備として利用できます。'
  ],
  dhXfyunHint: [
    '讯飞交互平台云端流式数字人，需填写形象 ID 与音色。',
    'iFlytek cloud-streamed digital human; an avatar ID and voice are required.',
    'iFlytek 클라우드 스트리밍 디지털 휴먼으로 아바타 ID와 음색이 필요합니다.',
    '訊飛互動平台雲端串流數位人，需填寫形象 ID 與音色。',
    'iFlytek のクラウド配信デジタルヒューマンです。アバター ID と音声が必要です。'
  ],
  dhAvatarId: ['形象 ID', 'Avatar ID', '아바타 ID', '形象 ID', 'アバター ID'],
  dhAvatarPlaceholder: [
    '讯飞交互平台形象 avatar_id',
    'iFlytek avatar_id',
    'iFlytek avatar_id',
    '訊飛互動平台形象 avatar_id',
    'iFlytek avatar_id'
  ],
  dhLive2dModel: ['Live2D 模型', 'Live2D model', 'Live2D 모델', 'Live2D 模型', 'Live2D モデル'],
  dhSelectModel: [
    '选择内置模型',
    'Select a bundled model',
    '내장 모델 선택',
    '選擇內建模型',
    '内蔵モデルを選択'
  ],
  dhVoicePlaceholder: [
    '如：x5_lingxiaoyue_flow',
    'e.g. x5_lingxiaoyue_flow',
    '예: x5_lingxiaoyue_flow',
    '例如：x5_lingxiaoyue_flow',
    '例：x5_lingxiaoyue_flow'
  ],
  dhWelcome: ['欢迎语', 'Welcome message', '환영 메시지', '歡迎詞', 'ウェルカムメッセージ'],
  dhSpeechRate: ['语速', 'Speech rate', '말하기 속도', '語速', '話速'],
  dhEmotion: ['情绪风格', 'Emotion style', '감정 스타일', '情緒風格', '感情スタイル'],
  dhEmotionWarm: ['亲切温柔', 'Warm & gentle', '친절하고 부드럽게', '親切溫柔', '親切で穏やか'],
  dhEmotionHappy: ['积极正向', 'Positive', '긍정적', '積極正向', '前向き'],
  dhEmotionNeutral: [
    '平静专业',
    'Calm & professional',
    '차분하고 전문적',
    '平靜專業',
    '落ち着いて専門的'
  ],
  dhOnline: ['在线', 'Online', '온라인', '線上', 'オンライン'],
  dhMaintenance: ['维护中', 'Maintenance', '점검 중', '維護中', 'メンテナンス中'],
  dhTextOnly: ['仅文本模式', 'Text only', '텍스트 전용', '僅文字模式', 'テキストのみ'],
  dhPickerTitle: [
    '快捷挑选形象与音色',
    'Quick avatar & voice picker',
    '아바타 및 음색 빠른 선택',
    '快速挑選形象與音色',
    'アバターと音声を簡単選択'
  ],
  dhPickerHint: [
    '选择卡片会自动识别并填写对应参数，仍可在下方表单中手动调整。',
    'Selecting a card identifies and fills its parameter automatically; you can still fine-tune the form below.',
    '카드를 선택하면 해당 매개변수가 자동으로 입력되며 아래 양식에서 직접 조정할 수 있습니다.',
    '選擇卡片會自動識別並填入對應參數，仍可在下方表單手動調整。',
    'カードを選ぶと対応するパラメータが自動入力され、下のフォームで微調整できます。'
  ],
  dhChooseAvatar: ['挑选形象', 'Choose avatar', '아바타 선택', '挑選形象', 'アバターを選択'],
  dhChooseVoice: ['挑选音色', 'Choose voice', '음색 선택', '挑選音色', '音声を選択'],
  dhCloudAvatar: [
    '讯飞云端形象',
    'iFlytek cloud avatar',
    'iFlytek 클라우드 아바타',
    '訊飛雲端形象',
    'iFlytek クラウドアバター'
  ],
  dhLocalAvatar: [
    '本地 Live2D 模型',
    'Local Live2D model',
    '로컬 Live2D 모델',
    '本機 Live2D 模型',
    'ローカル Live2D モデル'
  ],
  dhSelected: ['已选择', 'Selected', '선택됨', '已選擇', '選択済み'],
  dhVoiceLanguage: [
    '语种：{language}',
    'Language: {language}',
    '언어: {language}',
    '語種：{language}',
    '言語：{language}'
  ],
  dhVoiceParameter: [
    '参数：{parameter}',
    'Parameter: {parameter}',
    '매개변수: {parameter}',
    '參數：{parameter}',
    'パラメータ：{parameter}'
  ],
  dhWelcomeDefault: [
    '您好，我是灵山胜境 AI 导游，很高兴为您服务。',
    'Hello, I am your Lingshan AI guide. It is a pleasure to assist you.',
    '안녕하세요. 링산 AI 가이드입니다. 만나서 반갑습니다.',
    '您好，我是靈山勝境 AI 導遊，很高興為您服務。',
    'こんにちは。霊山の AI ガイドです。ご案内できてうれしいです。'
  ],
  dhNameRequired: [
    '请填写名称',
    'Please enter a name.',
    '이름을 입력해 주세요.',
    '請填寫名稱',
    '名前を入力してください。'
  ],
  dhLoadFailed: [
    '数字人配置加载失败',
    'Failed to load digital-human configurations.',
    '디지털 휴먼 설정을 불러오지 못했습니다.',
    '數位人設定載入失敗',
    '設定の読み込みに失敗しました。'
  ],
  dhSaved: ['已保存', 'Saved.', '저장되었습니다.', '已儲存', '保存しました。'],
  dhSaveFailed: [
    '保存失败',
    'Save failed.',
    '저장에 실패했습니다.',
    '儲存失敗',
    '保存に失敗しました。'
  ],
  dhActivated: [
    '已启用「{name}」',
    'Activated “{name}”.',
    '“{name}” 활성화됨',
    '已啟用「{name}」',
    '「{name}」を有効にしました。'
  ],
  dhActivateFailed: [
    '启用失败',
    'Activation failed.',
    '활성화에 실패했습니다.',
    '啟用失敗',
    '有効化に失敗しました。'
  ],
  dhPreviewUnsupported: [
    '当前浏览器不支持语音试听',
    'This browser does not support voice preview.',
    '현재 브라우저는 음성 미리 듣기를 지원하지 않습니다.',
    '目前瀏覽器不支援語音試聽',
    'このブラウザーは音声試聴に対応していません。'
  ],
  dhPreviewPlaying: [
    '正在试听欢迎语（真实音色以游客端数字人为准）',
    'Previewing the welcome message. The visitor guide uses the configured production voice.',
    '환영 메시지를 미리 듣는 중입니다. 실제 음색은 관람객 가이드의 설정을 따릅니다.',
    '正在試聽歡迎詞（實際音色以遊客端數位人為準）',
    'ウェルカムメッセージを試聴中です。実際の音声は来場者ガイドの設定に従います。'
  ],
  dhGenderFemale: ['女', 'Female', '여성', '女', '女性'],
  dhGenderMale: ['男', 'Male', '남성', '男', '男性'],
  dhLanguageAmericanEnglish: [
    '英文通用美式口音',
    'English · General American',
    '영어 · 일반 미국식',
    '英文通用美式口音',
    '英語・一般米国アクセント'
  ],
  dhLanguageTaiwan: ['台湾', 'Taiwan Mandarin', '대만 중국어', '臺灣', '台湾華語'],
  dhLanguageNortheast: ['东北话', 'Northeastern Mandarin', '중국 동북 방언', '東北話', '東北方言'],
  dhLanguageMandarin: ['普通话', 'Mandarin Chinese', '표준 중국어', '普通話', '標準中国語'],
  dhVoiceGrant: ['Grant', 'Grant', 'Grant', 'Grant', 'Grant'],
  dhVoiceTaiwanMale: [
    '台湾腔温柔男声',
    'Gentle Taiwan male voice',
    '부드러운 대만 남성 음성',
    '臺灣腔溫柔男聲',
    '穏やかな台湾男性音声'
  ],
  dhVoiceLila: ['Lila', 'Lila', 'Lila', 'Lila', 'Lila'],
  dhVoiceZiyang: ['子阳', 'Ziyang', '쯔양', '子陽', 'ズーヤン'],
  dhVoiceLingxiaoyue: ['聆小玥', 'Ling Xiaoyue', '링샤오웨', '聆小玥', 'リン・シャオユエ'],
  dhVoicePengfei: ['鹏飞', 'Pengfei', '펑페이', '鵬飛', 'ポンフェイ'],
  dhVoiceGuideFemale: [
    '导览女声',
    'Guide female',
    '가이드 여성 음성',
    '導覽女聲',
    'ガイド女性音声'
  ],
  dhVoiceGuideMale: ['导览男声', 'Guide male', '가이드 남성 음성', '導覽男聲', 'ガイド男性音声'],
  dhAvatarReceptionMale: [
    '景行·灵山迎宾使（男）',
    'Jingxing · Lingshan Host (Male)',
    '징싱 · 링산 환영 안내자 (남)',
    '景行·靈山迎賓使（男）',
    '景行・霊山おもてなし案内人（男性）'
  ],
  dhAvatarReceptionFemale: [
    '灵悦·莲心礼宾使（女）',
    'Lingyue · Lotus Host (Female)',
    '링웨 · 연꽃 의전 안내자 (여)',
    '靈悅·蓮心禮賓使（女）',
    '霊悦・蓮心コンシェルジュ（女性）'
  ],
  dhAvatarScenicA: [
    '云觉·大佛文化使（女）',
    'Yunjue · Grand Buddha Storyteller (Female)',
    '윈줴 · 대불 문화 해설사 (여)',
    '雲覺·大佛文化使（女）',
    '雲覚・大仏文化ナビゲーター（女性）'
  ],
  dhAvatarScenicB: [
    '梵音·梵宫导览使（女）',
    'Fanyin · Brahma Palace Guide (Female)',
    '판인 · 범궁 안내자 (여)',
    '梵音·梵宮導覽使（女）',
    '梵音・梵宮ガイド（女性）'
  ],
  dhModelHaru: [
    '春和·九龙灵使（女）',
    'Chunhe · Nine Dragons Guide (Female)',
    '춘허 · 구룡 관욕 안내자 (여)',
    '春和·九龍靈使（女）',
    '春和・九龍灌浴ガイド（女性）'
  ],
  dhModelHiyori: [
    '晴音·莲华旅伴（女）',
    'Qingyin · Lotus Journey Companion (Female)',
    '칭인 · 연화 여행 동반자 (여)',
    '晴音·蓮華旅伴（女）',
    '晴音・蓮華の旅パートナー（女性）'
  ],
  dhModelKei: [
    '知远·坛城研学使（男）',
    'Zhiyuan · Mandala Learning Guide (Male)',
    '즈위안 · 만다라 학습 안내자 (남)',
    '知遠·壇城研學使（男）',
    '知遠・曼荼羅学習ガイド（男性）'
  ],
  dhModelHibiki: [
    '清响·禅旅伙伴（男）',
    'Qingxiang · Zen Journey Companion (Male)',
    '칭샹 · 선 여행 동반자 (남)',
    '清響·禪旅夥伴（男）',
    '清響・禅の旅パートナー（男性）'
  ],

  avatarConnecting: ['连接中', 'Connecting', '연결 중', '連線中', '接続中'],
  avatarLoading: ['加载中', 'Loading', '로딩 중', '載入中', '読み込み中'],
  avatarOnline: ['在线', 'Online', '온라인', '線上', 'オンライン'],
  avatarSpeaking: ['讲解中', 'Speaking', '해설 중', '講解中', '解説中'],
  avatarTextMode: ['文本模式', 'Text mode', '텍스트 모드', '文字模式', 'テキストモード'],
  avatarIdle: ['待机', 'Idle', '대기', '待機', '待機'],
  avatarGuideName: [
    '云觉·大佛文化使（女）',
    'Yunjue · Grand Buddha Storyteller (Female)',
    '윈줴 · 대불 문화 해설사 (여)',
    '雲覺·大佛文化使（女）',
    '雲覚・大仏文化ナビゲーター（女性）'
  ],
  avatarEnableAudio: [
    '点击开启数字人声音',
    'Click to enable audio',
    '클릭하여 디지털 휴먼 음성 켜기',
    '點擊開啟數位人聲音',
    'クリックして音声を有効にする'
  ],
  avatarPreparing: [
    '数字人准备中…',
    'Preparing digital human…',
    '디지털 휴먼 준비 중…',
    '數位人準備中…',
    'デジタルヒューマンを準備中…'
  ],
  avatarModelLoading: [
    'Live2D 模型加载中…',
    'Loading Live2D model…',
    'Live2D 모델 로딩 중…',
    'Live2D 模型載入中…',
    'Live2D モデルを読み込み中…'
  ],
  avatarTextOnly: [
    '当前为纯文本讲解模式',
    'Text-only narration mode is active.',
    '현재 텍스트 전용 해설 모드입니다.',
    '目前為純文字講解模式',
    '現在はテキストのみの解説モードです。'
  ]
} satisfies Record<string, TranslationTuple>

export type AppMessageKey = keyof typeof catalog

export const appMessages = Object.fromEntries(
  languageOrder.map((language, languageIndex) => [
    language,
    Object.fromEntries(
      Object.entries(catalog).map(([key, translations]) => [key, translations[languageIndex]])
    )
  ])
) as Record<LanguageEnum, Record<AppMessageKey, string>>
