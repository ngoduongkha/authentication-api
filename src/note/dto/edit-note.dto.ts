import { IsOptional, IsString } from 'class-validator';

export class EditNoteDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;
}
