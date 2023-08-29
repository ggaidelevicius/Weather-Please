export interface TileProps {
  day: number;
  max: number;
  min: number;
  description: string;
  icon: string;
  wind: number;
  rain: number;
  uv: number;
  useMetric: boolean;
  index: number;
  identifier: 'day' | 'date';
}

export type Days =
  | 'Sunday'
  | 'Monday'
  | 'Tuesday'
  | 'Wednesday'
  | 'Thursday'
  | 'Friday'
  | 'Saturday';

export type Months =
  | 'January'
  | 'February'
  | 'March'
  | 'April'
  | 'May'
  | 'June'
  | 'July'
  | 'August'
  | 'September'
  | 'October'
  | 'November'
  | 'December';
