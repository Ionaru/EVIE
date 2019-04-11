/**
 * Several static helper functions for calculations.
 */
export class Calc {

    public static maxIntegerValue = 0x7FFFFFFF;

    public static partPercentage = (part: number, total: number) => (part / total) * 100;
    public static profitPercentage = (old: number, newAmount: number) => ((newAmount - old) / old) * 100;

    public static wholeHoursLeft = (duration: number) => Math.floor(duration / (3600000));
    public static wholeDaysLeft = (duration: number) => Math.floor(duration / (86400000));
}
