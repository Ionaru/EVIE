/*

 countUp.js
 Created by @inorganik

 Modified for TypeScript by @Ionaru

 */

export interface CountUpOptions {
  // All options are optional
  useEasing?: boolean;      // Whether to use easing or not, default: true
  useGrouping?: boolean;    // 1,000,000 vs 1000000, default: true
  separator?: string;       // Character to use as seperator, default: ',' (comma). Note: if this option is set
                            // to '' (empty string), useGrouping will be disabled
  decimal?: string;         // Character to use as decimal, default: '.' (dot)
  easingFn?: Function;      // Custom easing closure function, default: Robert Penner's easeOutExpo
  formattingFn?: Function;  // Custom formatting function, default: self.formatNumber below
  prefix?: string;          // Prefix to add, default: ''
  suffix?: string;          // Suffix to add, default: ''
}

export class CountUp {

  private target: string;
  private startVal: number;
  private endVal: number;
  private options: CountUpOptions = {
    useEasing: true,
    useGrouping: true,
    separator: ',',
    decimal: '.',
    easingFn: null,
    formattingFn: null,
    prefix: '',
    suffix: '',
  };
  private paused: boolean;
  private countDown: boolean;
  private rAF: any;
  private duration: number;
  private frameVal: number;
  private targetElement: HTMLElement;
  private decimals: number;
  private callback: Function;
  private easingFn: Function;
  private remaining: number;
  private formattingFn: Function;
  private dec: number;
  private startTime: number;

  constructor(target: string, startVal: number, endVal: number, decimals: number = 0, duration: number = 1,
              options?: CountUpOptions) {

    // target = id of html element or var of previously selected html element where counting occurs
    // startVal = the value you want to begin at
    // endVal = the value you want to arrive at
    // decimals = number of decimal places, default 0
    // duration = duration of animation in seconds, default 2
    // options = optional object of options (see above for possible option attributes)

    this.target = target;
    this.startVal = startVal;
    this.endVal = endVal;
    this.decimals = decimals;
    this.duration = duration;

    for (let key in options) {
      if (options.hasOwnProperty(key)) {
        this.options[key] = options[key];
      }
    }
    if (this.options.separator === '') {
      this.options.useGrouping = false;
    }

    this.targetElement = (typeof target === 'string') ? document.getElementById(target) : target;
    this.startVal = Number(startVal);
    this.endVal = Number(endVal);
    this.countDown = (startVal > endVal);
    this.frameVal = startVal;
    this.decimals = Math.max(0, decimals || 0);
    this.dec = Math.pow(10, decimals);
    this.duration = Number(duration) * 1000 || 2000;
    this.easingFn = this.options.easingFn ? this.options.easingFn : CountUp.easeOutExpo;
    this.formattingFn = this.options.formattingFn ? this.options.formattingFn : this.formatNumber;

    this.init();

    // Format startVal on initialization
    this.printValue(startVal);
  }

  private init(): void {
    let lastTime = 0;
    let vendors = ['webkit', 'moz', 'ms', 'o'];
    for (let x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
      window.requestAnimationFrame = window[vendors[x] + 'RequestAnimationFrame'];
      window.cancelAnimationFrame =
        window[vendors[x] + 'CancelAnimationFrame'] || window[vendors[x] + 'CancelRequestAnimationFrame'];
    }
    if (!window.requestAnimationFrame) {
      window.requestAnimationFrame = function (callback: Function): number {
        let currTime = new Date().getTime();
        let timeToCall = Math.max(0, 16 - (currTime - lastTime));
        let id = window.setTimeout(function (): void { callback(currTime + timeToCall); },
          timeToCall);
        lastTime = currTime + timeToCall;
        return id;
      };
    }
    if (!window.cancelAnimationFrame) {
      window.cancelAnimationFrame = function (id: number): void {
        clearTimeout(id);
      };
    }
  }

  private formatNumber(nStr: any): string {
    nStr = nStr.toFixed(this.decimals);
    nStr += '';
    let x, x1, x2, rgx;
    x = nStr.split('.');
    x1 = x[0];
    x2 = x.length > 1 ? this.options.decimal + x[1] : '';
    rgx = /(\d+)(\d{3})/;
    if (this.options.useGrouping) {
      while (rgx.test(x1)) {
        x1 = x1.replace(rgx, '$1' + this.options.separator + '$2');
      }
    }
    return this.options.prefix + x1 + x2 + this.options.suffix;
  }

  // Robert Penner's easeOutExpo
  private static easeOutExpo(currentTime: number, startVal: number, remainingVal: number, totalTime: number): number {
    return remainingVal * (-Math.pow(2, -10 * currentTime / totalTime) + 1) * 1024 / 1023 + startVal;
  }

  private count(timestamp: number): void {
    if (!this.startTime) {
      this.startTime = timestamp;
    }
    let progress = timestamp - this.startTime;
    this.remaining = this.duration - progress;

    // To ease or not to ease
    if (this.options.useEasing) {
      if (this.countDown) {
        this.frameVal = this.startVal - this.easingFn(progress, 0, this.startVal - this.endVal, this.duration);
      } else {
        this.frameVal = this.easingFn(progress, this.startVal, this.endVal - this.startVal, this.duration);
      }
    } else {
      if (this.countDown) {
        this.frameVal = this.startVal - ((this.startVal - this.endVal) * (progress / this.duration));
      } else {
        this.frameVal = this.startVal + (this.endVal - this.startVal) * (progress / this.duration);
      }
    }

    // Don't go past endVal since progress can exceed duration in the last frame
    if (this.countDown) {
      this.frameVal = (this.frameVal < this.endVal) ? this.endVal : this.frameVal;
    } else {
      this.frameVal = (this.frameVal > this.endVal) ? this.endVal : this.frameVal;
    }

    // Decimal
    this.frameVal = Math.round(this.frameVal * this.dec) / this.dec;

    // Format and print value
    this.printValue(this.frameVal);

    // Whether to continue
    if (progress < this.duration) {
      this.rAF = requestAnimationFrame(_timestamp => { this.count(_timestamp); });
    } else {
      if (this.callback) {
        this.callback();
      }
    }
  }

  private printValue(value: number): void {
    let result: string = this.formattingFn(value);

    if (this.targetElement.tagName === 'INPUT') {
      (<HTMLInputElement>this.targetElement).value = result;
    } else if (this.targetElement.tagName === 'text' || this.targetElement.tagName === 'tspan') {
      this.targetElement.textContent = result;
    } else {
      this.targetElement.innerHTML = result;
    }
  }

  // Start the animation
  start(callback?: Function): boolean {
    this.callback = callback;
    this.rAF = requestAnimationFrame(_timestamp => { this.count(_timestamp); });
    return false;
  }

  // Pause or resume the animation
  pauseResume(): void {
    if (!this.paused) {
      this.paused = true;
      cancelAnimationFrame(this.rAF);
    } else {
      this.paused = false;
      delete this.startTime;
      this.duration = this.remaining;
      this.startVal = this.frameVal;
      requestAnimationFrame(_timestamp => { this.count(_timestamp); });
    }
  }

  // Reset to startVal so animation can be run again
  reset(): void {
    this.paused = false;
    delete this.startTime;
    cancelAnimationFrame(this.rAF);
    this.printValue(this.startVal);
  }

  // Pass a new endVal and start animation
  update(newEndVal: number): void {
    cancelAnimationFrame(this.rAF);
    this.paused = false;
    this.startTime = 0;
    this.startVal = this.frameVal;
    this.endVal = Number(newEndVal);
    this.countDown = (this.startVal > this.endVal);
    this.rAF = requestAnimationFrame(_timestamp => { this.count(_timestamp); });
  }
}
