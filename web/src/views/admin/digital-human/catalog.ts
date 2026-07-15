import type { DigitalHumanEngine } from '@/api/digital-human'

export interface AvatarOption {
  id: string
  engine: DigitalHumanEngine
  avatarId: string
  modelId: string
  labelKey: string
  preview?: string
}

export interface VoiceOption {
  parameter: string
  labelKey: string
  languageKey: string
}

/** Ready-to-use avatar identifiers already provisioned for this project. */
export const avatarOptions: AvatarOption[] = [
  {
    id: 'xf-reception-male',
    engine: 'xfyun',
    avatarId: 'cnr5dg8n2000000003',
    modelId: '',
    labelKey: 'app.dhAvatarReceptionMale'
  },
  {
    id: 'xf-reception-female',
    engine: 'xfyun',
    avatarId: 'cnrfb86h2000000004',
    modelId: '',
    labelKey: 'app.dhAvatarReceptionFemale'
  },
  {
    id: 'xf-scenic-a',
    engine: 'xfyun',
    avatarId: 'cnrmkf0e2000000006',
    modelId: '',
    labelKey: 'app.dhAvatarScenicA'
  },
  {
    id: 'xf-scenic-b',
    engine: 'xfyun',
    avatarId: 'cnrn9jgi2000000005',
    modelId: '',
    labelKey: 'app.dhAvatarScenicB'
  },
  ...[
    ['Haru', 'app.dhModelHaru'],
    ['Hiyori', 'app.dhModelHiyori'],
    ['Kei', 'app.dhModelKei'],
    ['Hibiki', 'app.dhModelHibiki']
  ].map(([modelId, labelKey]) => ({
    id: `live2d-${modelId.toLowerCase()}`,
    engine: 'live2d' as const,
    avatarId: '',
    modelId,
    labelKey,
    preview: `/live2d/characters/${modelId}/${modelId}.png`
  }))
]

/**
 * Voice identifiers accepted by iFlytek. The first four entries are transcribed
 * from 发言人管理.png; the remaining entries preserve voices already used by the
 * project so existing configurations remain easy to select.
 */
export const voiceOptions: VoiceOption[] = [
  {
    parameter: 'x5_EnUs_Grant_flow',
    labelKey: 'app.dhVoiceGrant',
    languageKey: 'app.dhLanguageAmericanEnglish'
  },
  {
    parameter: 'x6_taiqiangnuannan_pro',
    labelKey: 'app.dhVoiceTaiwanMale',
    languageKey: 'app.dhLanguageTaiwan'
  },
  {
    parameter: 'x5_EnUs_Lila_flow',
    labelKey: 'app.dhVoiceLila',
    languageKey: 'app.dhLanguageAmericanEnglish'
  },
  {
    parameter: 'x4_ziyang_oral',
    labelKey: 'app.dhVoiceZiyang',
    languageKey: 'app.dhLanguageNortheast'
  },
  {
    parameter: 'x5_lingxiaoyue_flow',
    labelKey: 'app.dhVoiceLingxiaoyue',
    languageKey: 'app.dhLanguageMandarin'
  },
  {
    parameter: 'x4_pengfei',
    labelKey: 'app.dhVoicePengfei',
    languageKey: 'app.dhLanguageMandarin'
  },
  {
    parameter: 'x6_jingqudaolannvsheng_mini',
    labelKey: 'app.dhVoiceGuideFemale',
    languageKey: 'app.dhLanguageMandarin'
  },
  {
    parameter: 'x6_zhantingnanjiedai_pro',
    labelKey: 'app.dhVoiceGuideMale',
    languageKey: 'app.dhLanguageMandarin'
  }
]
