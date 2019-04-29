/**
 * Several static helper functions for calculations.
 */
export class Calc {

    public static maxIntegerValue = 0x7FFFFFFF;

    public static partPercentage = (part: number, total: number) => (part / total) * 100;
    public static profitPercentage = (old: number, newAmount: number) => ((newAmount - old) / old) * 100;

    public static wholeSeconds = (duration: number) => Math.floor(duration / 1000);
    public static wholeMinutes = (duration: number) => Math.floor(duration / 60000);
    public static wholeHours = (duration: number) => Math.floor(duration / 3600000);
    public static wholeDays = (duration: number) => Math.floor(duration / 86400000);
    public static wholeWeeks = (duration: number) => Math.floor(duration / 604800000);
}
