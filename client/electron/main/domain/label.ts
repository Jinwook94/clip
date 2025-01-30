/**
 * Label: 도메인 모델
 */
export interface Label {
  id: string;
  name: string;
  color: string; // ex. "#FF0000"
  createdAt?: string;
  updatedAt?: string;
}
