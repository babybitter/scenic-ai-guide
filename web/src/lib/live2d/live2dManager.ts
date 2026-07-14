// @ts-nocheck -- 移植自 awesome-digital-human-live2d 的第三方 Live2D(Cubism SDK)代码，不纳入本项目严格类型检查
import { LAppDelegate } from '@/lib/live2d/src/lappdelegate';
import { ResourceModel } from './resource';

export class Live2dManager {
    // 单例
    public static getInstance(): Live2dManager {
        if (! this._instance) {
            this._instance = new Live2dManager();
        }

        return this._instance;
    }

    public setReady(ready: boolean) {
      this._ready = ready;
    }

    public isReady(): boolean {
      return this._ready;
    }

    public changeCharacter(character: ResourceModel | null) {
      // _subdelegates中只有一个画布, 所以设置第一个即可
      this._ready = false;
      LAppDelegate.getInstance().changeCharacter(character)
    }

    public setLipFactor(weight: number): void {
      this._lipFactor = weight;
    }

    public getLipFactor(): number {
      return this._lipFactor;
    }

    public pushAudioQueue(audioData: ArrayBuffer): void {
      this._ttsQueue.push(audioData);
    }

    public popAudioQueue(): ArrayBuffer | null {
      if (this._ttsQueue.length > 0) {
        const audioData = this._ttsQueue.shift();
        return audioData;
      } else {
        return null;
      }
    }

    public clearAudioQueue(): void {
      this._ttsQueue = [];
    }

    public playAudio(): ArrayBuffer | null {
      if (this._audioIsPlaying) return null; // 如果正在播放则返回
      const audioData = this.popAudioQueue();
      if (audioData == null) return null; // 没有音频数据则返回
      this._audioIsPlaying = true;
      // 播放音频
      const playAudioBuffer = (buffer: AudioBuffer) => {
        const source = this._audioContext.createBufferSource();
        source.buffer = buffer;

        // 关键改动（相对原项目）：把音源接到 AnalyserNode 再到扬声器。
        // 原实现靠 WAV 文件解析取 RMS 驱动口型，但本项目后端 TTS 返回的是 MP3，
        // WAV 解析会失败、口型完全不动。改用 Web Audio 的 AnalyserNode 实时读取
        // 正在播放音频的波形能量（RMS）——与音频格式无关，且是真实振幅包络，
        // 不是简单的正弦浮动或生硬开合。
        source.connect(this._analyser);
        this._analyser.connect(this._audioContext.destination);
        // 监听音频播放完毕事件
        source.onended = () => {
          this._audioIsPlaying = false;
        };
        source.start();
        this._audioSource = source;
      };
      // 创建一个新的 ArrayBuffer 并复制数据, 防止原始数据被decodeAudioData释放
      const newAudioData = audioData.slice(0);
      this._audioContext.decodeAudioData(newAudioData).then(
        buffer => {
          playAudioBuffer(buffer);
        }
      ).catch(() => {
        // 解码失败（例如损坏的音频）不应卡住口型状态
        this._audioIsPlaying = false;
      });
      return audioData;
    }

    /**
     * 读取当前正在播放音频的实时口型开合值（0~1）。
     * 从 AnalyserNode 取时域波形算 RMS，再做 attack 快 / release 慢的平滑，
     * 让嘴型跟随真实音量起伏、收尾自然，避免抖动与生硬闭合。
     */
    public getCurrentRms(): number {
      if (!this._audioIsPlaying) {
        // 没有音频时缓慢回落到闭合，而不是瞬间闭嘴
        this._lipValue *= 0.6;
        if (this._lipValue < 0.01) this._lipValue = 0;
        return this._lipValue;
      }
      this._analyser.getFloatTimeDomainData(this._timeDomain);
      let sum = 0;
      for (let i = 0; i < this._timeDomain.length; i++) {
        const v = this._timeDomain[i];
        sum += v * v;
      }
      const rms = Math.sqrt(sum / this._timeDomain.length);
      // 人声 RMS 通常在 0.03~0.2，放大到接近满开合并限幅
      let target = Math.min(1, rms * 3.2);
      // attack 快、release 慢：张嘴迅速跟随，闭嘴平滑过渡
      if (target > this._lipValue) {
        this._lipValue = this._lipValue * 0.4 + target * 0.6;
      } else {
        this._lipValue = this._lipValue * 0.75 + target * 0.25;
      }
      return this._lipValue;
    }

    public stopAudio(): void {
      this.clearAudioQueue();
      if (this._audioSource) {
        try {
          this._audioSource.stop();
        } catch {
          /* 已停止则忽略 */
        }
        this._audioSource = null;
      }
      this._audioIsPlaying = false;
      this._lipValue = 0;
    }

    public isAudioPlaying(): boolean {
      return this._audioIsPlaying;
    }

    public hasQueuedAudio(): boolean {
      return this._ttsQueue.length > 0;
    }

    /** 在用户手势中恢复被浏览器自动播放策略挂起的 AudioContext */
    public resume(): Promise<void> {
      if (this._audioContext.state === 'suspended') {
        return this._audioContext.resume();
      }
      return Promise.resolve();
    }

    constructor() {
      this._audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      this._analyser = this._audioContext.createAnalyser();
      this._analyser.fftSize = 1024;
      this._timeDomain = new Float32Array(this._analyser.fftSize);
      this._audioIsPlaying = false;
      this._audioSource = null;
      this._lipFactor = 1.0;
      this._lipValue = 0;
      this._ready = false;
    }

    private static _instance: Live2dManager;
    private _ttsQueue: ArrayBuffer[] = [];
    private _audioContext: AudioContext;
    private _analyser: AnalyserNode;
    private _timeDomain: Float32Array;
    private _audioIsPlaying: boolean;
    private _audioSource: AudioBufferSourceNode | null;
    private _lipFactor: number;
    private _lipValue: number;
    private _ready: boolean;
  }
