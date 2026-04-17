import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class CreateReportDto {
  @ApiProperty({
    description: 'Free-text narrative of the HSE incident or observation',
    minLength: 20,
    maxLength: 10000,
    example:
      'Worker observed gas detector alarm near compressor station C2 after valve inspection. No injury, area isolated, likely loose fitting.',
  })
  @IsString()
  @MinLength(20)
  @MaxLength(10000)
  reportText!: string;
}
