import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ExerciseFilter, ExercisesService } from './exercises.service';

@ApiTags('exercises')
@ApiBearerAuth()
@Controller('exercises')
export class ExercisesController {
  constructor(private readonly exercises: ExercisesService) {}

  @Get()
  find(@Query() filter: ExerciseFilter) {
    return this.exercises.find(filter);
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.exercises.get(id);
  }
}
