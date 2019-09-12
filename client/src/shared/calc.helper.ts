/**
 * Several static helper functions for calculations.
 */
export class Calc {

    public static readonly maxIntegerValue = 0x7FFFFFFF;

    public static readonly second = 1000;
    public static readonly minute = 60000;
    public static readonly hour = 3600000;
    public static readonly day = 86400000;
    public static readonly week = 604800000;

    public static readonly partPercentage = (part: number, total: number) => (part / total) * 100;
    public static readonly profitPercentage = (old: number, newAmount: number) => ((newAmount - old) / old) * 100;

    public static readonly wholeSeconds = (duration: number) => Math.floor(duration / Calc.second);
    public static readonly wholeMinutes = (duration: number) => Math.floor(duration / Calc.minute);
    public static readonly wholeHours = (duration: number) => Math.floor(duration / Calc.hour);
    public static readonly wholeDays = (duration: number) => Math.floor(duration / Calc.day);
    public static readonly wholeWeeks = (duration: number) => Math.floor(duration / Calc.week);

    public static readonly secondsToMilliseconds = (seconds: number) => seconds * 1000;
    public static readonly millisecondsToSeconds = (milliseconds: number) => Math.floor(milliseconds / 1000);
}
