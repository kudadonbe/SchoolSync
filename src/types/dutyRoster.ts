export interface DutyRoster {
  dutyTimes: {
    EarlyDuty: string;
    AcademicDuty: string;
    DefaultSchedule: string;
  };
  dailyOverrides: {
    [date: string]: {
      EarlyDuty: string[];
    };
  };
}