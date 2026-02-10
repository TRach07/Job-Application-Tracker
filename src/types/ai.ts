export interface AIResponse<T> {
  success: boolean;
  data: T | null;
  error?: string;
}
