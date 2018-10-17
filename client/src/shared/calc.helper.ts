/**
 * Several static helper functions for calculations.
 */
export class Calc {

    public static maxIntegerValue = Math.pow(2, 31);

    public static partPercentage = (part: number, total: number) => (part / total) * 100;

    public static wholeHoursLeft = (duration: number) => Math.floor(duration / (3600000));
    public static wholeDaysLeft = (duration: number) => Math.floor(duration / (86400000));
}
