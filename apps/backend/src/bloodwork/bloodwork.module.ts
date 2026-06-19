import { Module } from '@nestjs/common';
import { BloodworkController } from './bloodwork.controller';
import { BloodworkService } from './bloodwork.service';
import { ClientsModule } from '../clients/clients.module';

@Module({
  imports: [ClientsModule],
  controllers: [BloodworkController],
  providers: [BloodworkService],
})
export class BloodworkModule {}
