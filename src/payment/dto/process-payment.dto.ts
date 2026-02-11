import { IsNumber, IsString } from 'class-validator';

export class ProcessPaymentDto {
  @IsNumber()
  amount: number;

  @IsString()
  currency: string;
}
