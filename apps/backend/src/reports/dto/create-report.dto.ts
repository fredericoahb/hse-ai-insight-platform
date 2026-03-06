import { IsString, MaxLength, MinLength } from 'class-validator';

export class CreateReportDto {
  @IsString()
  @MinLength(20)
  @MaxLength(10000)
  reportText!: string;
}
