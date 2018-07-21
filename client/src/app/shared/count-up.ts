export interface ICountUpOptions {
    // All options are optional
    useEasing?: boolean;      // Whether to use easing or not, default: true
    useGrouping?: boolean;    // 1,000,000 vs 1000000, default: true
    separator?: string;       // Character to use as separator, default: ',' (comma). Note: if this option is set
                              // to '' (empty string), useGrouping will be disabled
    decimal?: string;         // Character to use as decimal, default: '.' (dot)
    easingFn?: (...args: any[]) => any;      // Custom easing closure function, default: Robert Penner's easeOutExpo
    formattingFn?: (...args: any[]) => any;  // Custom formatting function, default: self.formatNumber below
    prefix?: string;          // Prefix to add, default: ''
    suffix?: string;          // Suffix to add, default: ''
}

export class CountUp {

    // Robert Penner's easeOutExpo
    private static easeOutExpo(currentTime: number, startVal: number, remainingVal: number, totalTime: number): number {
        return remainingVal * (-Math.pow(2, -10 * currentTime / totalTime) + 1) * 1024 / 1023 + startVal;
    }

    private options: ICountUpOptions = {
        decimal: '.',
        easingFn: undefined,
        formattingFn: undefined,
        prefix: '',
        separator: ',',
        suffix: '',
        useEasing: true,
        useGrouping: true,
    };

    private callback!: (...args: any[]) => any;
    private countDown: boolean;
    private duration: number;
    private endVal: number;
    private frameVal: number;
    private paused!: boolean;
    private rAF: any;
    private remaining!: number;
    private startTime!: number;
    private startVal: number;
    private targetElement: HTMLElement;

    private readonly dec: number;
    private readonly decimals: number;
    private readonly easingFn: (...args: any[]) => any;
    private readonly formattingFn: (...args: any[]) => any;

    /**
     * @param {string | HTMLElement} target - ID of a html element or variable of an HTML element
     * @param {number} startVal - the value you want to begin at
     * @param {number} endVal - the value you want to arrive at
     * @param {number} decimals - number of decimal places, default 0
     * @param {number} duration - duration of animation in seconds, default 1
     * @param {ICountUpOptions} options - optional object of options (see above for possible option attributes)
     */
    constructor(target: string | HTMLElement, startVal: number, endVal: number, decimals = 0, duration = 1,
                options?: ICountUpOptions) {

        this.startVal = startVal;
        this.endVal = endVal;
        this.decimals = decimals;
        this.duration = duration;

        // Overwrite default options with custom values.
        Object.assign(this.options, options);

        if (this.options.separator === '') {
            this.options.useGrouping = false;
        }

        const element = (typeof target === 'string') ? document.getElementById(target) : target;
        if (element) {
            this.targetElement = element;
        } else {
            throw new Error('No target element found.');
        }

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

    // Start the animation
    public start(callback?: (...args: any[]) => any): boolean {
        if (callback) {
            this.callback = callback;
        }
        this.rAF = requestAnimationFrame((_timestamp) => { this.count(_timestamp); });
        return false;
    }

    // Pause or resume the animation
    public pauseResume(): void {
        if (!this.paused) {
            this.paused = true;
            cancelAnimationFrame(this.rAF);
        } else {
            this.paused = false;
            delete this.startTime;
            this.duration = this.remaining;
            this.startVal = this.frameVal;
            requestAnimationFrame((_timestamp) => { this.count(_timestamp); });
        }
    }

    // Reset to startVal so animation can be run again
    public reset(): void {
        this.paused = false;
        delete this.startTime;
        cancelAnimationFrame(this.rAF);
        this.printValue(this.startVal);
    }

    // Pass a new endVal and start animation
    public update(newEndVal: number): void {
        cancelAnimationFrame(this.rAF);
        this.paused = false;
        this.startTime = 0;
        this.startVal = this.frameVal;
        this.endVal = Number(newEndVal);
        this.countDown = (this.startVal > this.endVal);
        this.rAF = requestAnimationFrame((_timestamp) => { this.count(_timestamp); });
    }

    private init(): void {
        let lastTime = 0;

        window.requestAnimationFrame = (callback: (...args: any[]) => void): number => {
            const currTime = new Date().getTime();
            const timeToCall = Math.max(0, 16 - (currTime - lastTime));
            const id = window.setTimeout((): void => { callback(currTime + timeToCall); },
                timeToCall);
            lastTime = currTime + timeToCall;
            return id;
        };

        window.cancelAnimationFrame = (id: number): void => {
            window.clearTimeout(id);
        };
    }

    private formatNumber(nStr: any): string {
        nStr = nStr.toFixed(this.decimals);
        nStr += '';
        let x;
        let x1;
        let x2;
        let rgx;
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

    private count(timestamp: number): void {
        if (!this.startTime) {
            this.startTime = timestamp;
        }
        const progress = timestamp - this.startTime;
        this.remaining = this.duration - progress;

        // To ease or not to ease
        if (this.options.useEasing) {
            this.frameVal = this.countDown ?
                this.startVal - this.easingFn(progress, 0, this.startVal - this.endVal, this.duration) :
                this.easingFn(progress, this.startVal, this.endVal - this.startVal, this.duration);

        } else {
            this.frameVal = this.countDown ?
                this.startVal - ((this.startVal - this.endVal) * (progress / this.duration)) :
                this.startVal + (this.endVal - this.startVal) * (progress / this.duration);
        }

        this.frameVal = this.countDown ?
            (this.frameVal < this.endVal) ? this.endVal : this.frameVal :
            (this.frameVal > this.endVal) ? this.endVal : this.frameVal;

        // Decimal
        this.frameVal = Math.round(this.frameVal * this.dec) / this.dec;

        // Format and print value
        this.printValue(this.frameVal);

        // Whether to continue
        if (progress < this.duration) {
            this.rAF = requestAnimationFrame((_timestamp) => { this.count(_timestamp); });
        } else {
            if (this.callback) {
                this.callback();
            }
        }
    }

    private printValue(value: number): void {
        const result: string = this.formattingFn(value);

        if (this.targetElement.tagName === 'INPUT') {
            (this.targetElement as HTMLInputElement).value = result;
        } else if (this.targetElement.tagName === 'text' || this.targetElement.tagName === 'tspan') {
            this.targetElement.textContent = result;
        } else {
            this.targetElement.innerHTML = result;
        }
    }
}
