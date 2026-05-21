/**
 * Web Speech API 文本转语音工具
 * 支持中文语音朗读，带有音量和速度控制
 */

class TextToSpeaker {
  private synth: SpeechSynthesis;
  private volume: number = 0.8;
  private rate: number = 1.0;
  private pitch: number = 1.0;
  private isEnabled: boolean = true;

  constructor() {
    this.synth = window.speechSynthesis;
  }

  public setVolume(v: number): void {
    this.volume = Math.max(0, Math.min(1, v));
  }

  public setRate(r: number): void {
    this.rate = Math.max(0.5, Math.min(2, r));
  }

  public setPitch(p: number): void {
    this.pitch = Math.max(0.5, Math.min(2, p));
  }

  public setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
    if (!enabled) {
      this.stop();
    }
  }

  public isActive(): boolean {
    return this.synth.speaking;
  }

  public speak(text: string, lang: string = 'zh-CN'): void {
    if (!this.isEnabled || !text.trim()) return;

    // Cancel any ongoing speech
    this.stop();

    // Create utterance
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.volume = this.volume;
    utterance.rate = this.rate;
    utterance.pitch = this.pitch;

    // Speak
    this.synth.speak(utterance);
  }

  public stop(): void {
    if (this.synth.speaking) {
      this.synth.cancel();
    }
  }

  /**
   * 朗读关卡标题和描述
   */
  public speakLevel(title: string, description: string): void {
    // 合并标题和描述，但不包括非常长的文本
    const combinedText = `${title}。${description}`;
    this.speak(combinedText);
  }

  /**
   * 朗读选项
   */
  public speakOption(optionText: string): void {
    this.speak(optionText);
  }

  /**
   * 朗读结果反馈
   */
  public speakResult(title: string, body: string, philosopher: string): void {
    const resultText = `${title}。${body}。相关哲学家是${philosopher}。`;
    this.speak(resultText);
  }

  /**
   * 朗读胜利信息
   */
  public speakVictory(): void {
    const victoryText = `恭喜！你已完成理想号的所有考验，成为启蒙文明的领航者！`;
    this.speak(victoryText);
  }
}

export const speaker = new TextToSpeaker();
