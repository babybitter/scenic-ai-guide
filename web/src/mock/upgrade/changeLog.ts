import { ref } from 'vue'

/** 系统升级日志。留空表示不弹出升级公告。 */
export interface UpgradeLog {
  version: string
  title: string
  date?: string
  lowestVersion?: string
  detail?: string[]
  requireReLogin?: boolean
  remark?: string[]
}

export const upgradeLogList = ref<UpgradeLog[]>([])
