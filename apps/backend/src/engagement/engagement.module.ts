import { Module } from '@nestjs/common';
import { EngagementController } from './engagement.controller';
import { EngagementService } from './engagement.service';
import { ClientsModule } from '../clients/clients.module';

/** Notes, messaging, and documents for a client (Module 1). */
@Module({
  imports: [ClientsModule],
  controllers: [EngagementController],
  providers: [EngagementService],
})
export class EngagementModule {}
