import { IsString, IsEnum, IsNotEmpty, IsDateString } from 'class-validator';

export enum PaymentStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
}

export class PaymentDto {
  @IsString()
  @IsNotEmpty()
  id: string;

  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsEnum(PaymentStatus)
  status: PaymentStatus;

  @IsDateString()
  createdAt: Date;
}
