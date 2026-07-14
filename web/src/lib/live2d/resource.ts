/**
 * Live2D 角色资源描述。
 *
 * 从原 awesome-digital-human-live2d 项目（Next.js）移植而来，原先依赖
 * `@/lib/protocol` 里的一大堆后端协议类型。移植到本项目（Vue）时只保留
 * Live2D 渲染真正需要的最小字段，避免拖入无关依赖。
 *
 * changeCharacter() 会用 `link` 推导模型所在目录，用 `name` 拼出
 * `${name}.model3.json`，因此 `name` 必须与模型目录/文件名一致（如 "Haru"）。
 */
export interface ResourceModel {
  /** 资源 id，仅用于标识 */
  resource_id: string
  /** 模型名，需与 `${name}.model3.json` 一致（如 "Haru"） */
  name: string
  /** 模型入口文件的可访问 URL，如 /live2d/characters/Haru/Haru.model3.json */
  link: string
}
