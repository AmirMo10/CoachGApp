import { Controller, Get, Header } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { register as defaultRegister } from 'prom-client';
import { MetricsService } from './metrics.service';
import { Public } from '../auth/roles.decorator';

@ApiExcludeController()
@Controller('metrics')
export class MetricsController {
  constructor(private readonly metrics: MetricsService) {}

  @Public()
  @Get()
  @Header('Content-Type', 'text/plain; version=0.0.4')
  async scrape(): Promise<string> {
    // Our registry holds default + custom metrics; touch defaultRegister too in
    // case other libs registered there.
    const [ours, theirs] = await Promise.all([this.metrics.metrics(), defaultRegister.metrics()]);
    return `${ours}\n${theirs}`;
  }
}
